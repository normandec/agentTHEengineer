-- AI CLASSROOM — complete idempotent schema
-- RLS is deliberately enabled with no policies. The classroom Edge Function uses
-- the Supabase service role; browsers and agents only use its HTTP API.

create extension if not exists pgcrypto;

create table if not exists cr_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists cr_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled session',
  created_at timestamptz not null default now(),
  status text not null default 'active',
  settings jsonb not null default '{}'::jsonb
);

create table if not exists cr_messages (
  id bigserial primary key,
  session_id uuid not null references cr_sessions(id) on delete cascade,
  seq int not null,
  role text not null, -- user | agent | council | system
  author text not null default 'unknown',
  kind text not null, -- question | note | objection | draft | vote | verify | final | status | board_event | media | speak | feedback | todo | question_to_user
  body text not null default '',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (session_id, seq)
);
alter table cr_messages add column if not exists search_vector tsvector generated always as (to_tsvector('english', coalesce(body, ''))) stored;
create index if not exists cr_messages_session_seq_idx on cr_messages (session_id, seq);
create index if not exists cr_messages_task_idx on cr_messages ((meta->>'task_id')) where meta ? 'task_id';
create index if not exists cr_messages_search_idx on cr_messages using gin(search_vector);

create table if not exists cr_seats (
  seat int primary key check (seat between 1 and 10),
  role text not null,
  token text,
  agent_name text,
  claimed_at timestamptz,
  last_seen timestamptz,
  status text not null default 'offline', -- idle | working | voting | offline
  profile jsonb not null default '{"calibrated":false,"calibration":{},"track":{},"strengths":[],"weaknesses":[]}'::jsonb
);
alter table cr_seats add column if not exists profile jsonb not null default '{"calibrated":false,"calibration":{},"track":{},"strengths":[],"weaknesses":[]}'::jsonb;

insert into cr_seats (seat, role) values
  (1,'moderator'),(2,'researcher-A'),(3,'researcher-B'),(4,'researcher-C'),
  (5,'explainer'),(6,'critic'),(7,'verifier'),(8,'calculator'),(9,'illustrator'),(10,'scribe')
on conflict (seat) do nothing;

create table if not exists cr_tasks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references cr_sessions(id) on delete cascade,
  question_msg_id bigint references cr_messages(id) on delete set null,
  phase text not null default 'research', -- research | draft | critique | revise | vote | final | draw | done | failed
  round int not null default 1,
  deadline timestamptz not null default (now() + interval '75 seconds'),
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cr_tasks_session_idx on cr_tasks (session_id, created_at desc);
create index if not exists cr_tasks_phase_idx on cr_tasks (phase) where phase not in ('done','failed');

create table if not exists cr_sheets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references cr_sessions(id) on delete cascade,
  idx int not null default 1,
  title text not null default 'Sheet 1',
  created_at timestamptz not null default now(),
  png_path text,
  thumb_path text,
  state jsonb not null default '{}'::jsonb
);
alter table cr_sheets add column if not exists state jsonb not null default '{}'::jsonb;
create index if not exists cr_sheets_session_idx on cr_sheets (session_id, idx);

create table if not exists cr_ops (
  id bigserial primary key,
  sheet_id uuid not null references cr_sheets(id) on delete cascade,
  seq int not null,
  author text not null default 'user', -- user | illustrator | agent | admin
  op jsonb not null,
  created_at timestamptz not null default now(),
  unique (sheet_id, seq)
);
create index if not exists cr_ops_sheet_seq_idx on cr_ops (sheet_id, seq);

-- Partial human strokes are intentionally ephemeral. The final compact path goes to cr_ops.
create table if not exists cr_live_strokes (
  sheet_id uuid not null references cr_sheets(id) on delete cascade,
  stroke_id text not null,
  author text not null default 'user',
  op jsonb not null,
  bbox jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (sheet_id, stroke_id)
);

create table if not exists cr_memory (
  session_id uuid primary key references cr_sessions(id) on delete cascade,
  body text not null default '',
  updated_at timestamptz not null default now(),
  updated_by text not null default 'system'
);

create table if not exists cr_media (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references cr_sessions(id) on delete cascade,
  sheet_id uuid references cr_sheets(id) on delete set null,
  author text not null default 'user',
  kind text not null, -- video | image | model3d | file | audio | blend
  filename text not null,
  mime text not null default 'application/octet-stream',
  bytes bigint not null default 0 check (bytes >= 0 and bytes <= 104857600),
  path text not null,
  url text,
  poster_url text,
  caption text not null default '',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists cr_media_session_idx on cr_media(session_id, created_at desc);

create table if not exists cr_files (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references cr_sessions(id) on delete cascade,
  author text not null default 'user',
  name text not null,
  mime text not null default 'application/octet-stream',
  bytes bigint not null default 0 check (bytes >= 0 and bytes <= 104857600),
  path text not null,
  url text,
  text_path text,
  text_url text,
  pages int not null default 0,
  sha256 text,
  tags jsonb not null default '[]'::jsonb,
  learned boolean not null default false,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists cr_files_session_path_idx on cr_files(session_id, path, created_at desc);

create table if not exists cr_knowledge (
  id bigserial primary key,
  session_id uuid references cr_sessions(id) on delete cascade,
  file_id uuid not null references cr_files(id) on delete cascade,
  chunk_no int not null,
  page int,
  text text not null,
  tsv tsvector generated always as (to_tsvector('english', coalesce(text, ''))) stored,
  embedding jsonb,
  created_at timestamptz not null default now(),
  unique(file_id, chunk_no)
);
create index if not exists cr_knowledge_tsv_idx on cr_knowledge using gin(tsv);
create index if not exists cr_knowledge_session_idx on cr_knowledge(session_id, file_id, chunk_no);

create table if not exists cr_folders (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references cr_sessions(id) on delete cascade,
  path text not null,
  author text not null default 'user',
  created_at timestamptz not null default now(),
  unique(session_id, path)
);

create table if not exists cr_watches (
  seat int primary key references cr_seats(seat) on delete cascade,
  sheet_id uuid not null references cr_sheets(id) on delete cascade,
  on_watch boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists cr_calibration_attempts (
  id uuid primary key default gen_random_uuid(),
  seat int not null references cr_seats(seat) on delete cascade,
  test_id text not null,
  answers jsonb not null default '[]'::jsonb,
  scores jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public)
values ('classroom', 'classroom', true)
on conflict (id) do update set public = excluded.public;

alter table cr_settings enable row level security;
alter table cr_sessions enable row level security;
alter table cr_messages enable row level security;
alter table cr_seats enable row level security;
alter table cr_tasks enable row level security;
alter table cr_sheets enable row level security;
alter table cr_ops enable row level security;
alter table cr_live_strokes enable row level security;
alter table cr_memory enable row level security;
alter table cr_media enable row level security;
alter table cr_files enable row level security;
alter table cr_knowledge enable row level security;
alter table cr_folders enable row level security;
alter table cr_watches enable row level security;
alter table cr_calibration_attempts enable row level security;
