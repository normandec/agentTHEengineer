-- AI CLASSROOM — database schema
-- All tables prefixed `cr_`. RLS enabled with NO policies:
-- only the edge function (service role) can read/write.
-- Apply with: supabase db push, or paste into the SQL editor,
-- or via the create_migration connector tool.

create extension if not exists pgcrypto;

-- Global server settings. The admin API updates the `global` JSON record.
create table if not exists cr_settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- Sessions: one row per classroom session (a conversation thread).
create table if not exists cr_sessions (
  id          uuid primary key default gen_random_uuid(),
  title       text not null default 'Untitled session',
  created_at  timestamptz not null default now(),
  status      text not null default 'active',        -- active | archived
  settings    jsonb not null default '{}'::jsonb     -- {quorum, phase_timeout_s, max_rounds}
);

-- Messages: chat + deliberation stream. `seq` is per-session, monotonically increasing.
create table if not exists cr_messages (
  id          bigserial primary key,
  session_id  uuid not null references cr_sessions(id) on delete cascade,
  seq         int  not null,
  role        text not null,   -- user | agent | council | system
  author      text not null default 'unknown',
  kind        text not null,   -- question | note | objection | draft | vote | verify | final | status | board_event
  body        text not null default '',
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  unique (session_id, seq)
);
create index if not exists cr_messages_session_seq_idx on cr_messages (session_id, seq);
create index if not exists cr_messages_task_idx on cr_messages ((meta->>'task_id')) where meta ? 'task_id';

-- Seats: the ten council seats. Claimed on demand by agents.
create table if not exists cr_seats (
  seat        int primary key check (seat between 1 and 10),
  role        text not null,
  token       text,
  agent_name  text,
  claimed_at  timestamptz,
  last_seen   timestamptz,
  status      text not null default 'offline'   -- idle | working | voting | offline
);

-- Seed the ten seats with their fixed roles.
insert into cr_seats (seat, role) values
  (1,  'moderator'),
  (2,  'researcher-A'),
  (3,  'researcher-B'),
  (4,  'researcher-C'),
  (5,  'explainer'),
  (6,  'critic'),
  (7,  'verifier'),
  (8,  'calculator'),
  (9,  'illustrator'),
  (10, 'scribe')
on conflict (seat) do nothing;

-- Tasks: one per user question; drives the deliberation pipeline.
create table if not exists cr_tasks (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references cr_sessions(id) on delete cascade,
  question_msg_id bigint references cr_messages(id) on delete set null,
  phase           text not null default 'research',
   -- research | draft | critique | revise | vote | final | draw | done | failed
  round           int not null default 1,
  deadline        timestamptz not null default (now() + interval '75 seconds'),
  state           jsonb not null default '{}'::jsonb,  -- votes, needs_research, drawn, etc.
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists cr_tasks_session_idx on cr_tasks (session_id, created_at desc);
create index if not exists cr_tasks_phase_idx on cr_tasks (phase) where phase not in ('done','failed');

-- Sheets: shared whiteboards. One session can hold many.
create table if not exists cr_sheets (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references cr_sessions(id) on delete cascade,
  idx         int not null default 1,                 -- per-session sheet number
  title       text not null default 'Sheet 1',
  created_at  timestamptz not null default now(),
  png_path    text,
  thumb_path  text
);
create index if not exists cr_sheets_session_idx on cr_sheets (session_id, idx);

-- Ops: append-only drawing operations. `seq` is per-sheet, monotonically increasing.
create table if not exists cr_ops (
  id          bigserial primary key,
  sheet_id    uuid not null references cr_sheets(id) on delete cascade,
  seq         int not null,
  author      text not null default 'user',           -- user | illustrator | admin
  op          jsonb not null,
  created_at  timestamptz not null default now(),
  unique (sheet_id, seq)
);
create index if not exists cr_ops_sheet_seq_idx on cr_ops (sheet_id, seq);

-- Storage bucket (public read). Runs as postgres superuser via SQL editor;
-- safe to re-run.
insert into storage.buckets (id, name, public)
values ('classroom', 'classroom', true)
on conflict (id) do nothing;

-- RLS: enabled, NO policies => anon/authenticated keys get nothing.
-- The edge function uses the service role key, which bypasses RLS.
alter table cr_settings enable row level security;
alter table cr_sessions enable row level security;
alter table cr_messages enable row level security;
alter table cr_seats    enable row level security;
alter table cr_tasks    enable row level security;
alter table cr_sheets   enable row level security;
alter table cr_ops      enable row level security;
