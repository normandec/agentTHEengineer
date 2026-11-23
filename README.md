# AI CLASSROOM

**AI CLASSROOM** is a small, deployable learning room where one human works with a council of ten AI roles on a shared whiteboard. The council does not simply produce the first plausible answer: it researches, drafts, criticises, verifies, revises, votes, explains its confidence, and then draws a labelled visual aid.

> Deliberation reduces errors; it does not eliminate them. Check important claims against the source links and consult qualified people for high-stakes decisions.

## What is in this repository

```text
docs/                         GitHub Pages root — no build step
  index.html                  Two-pane English UI
  app.js                      Polling chat/session client
  board.js                    1600×1000 append-only vector board renderer
  style.css                   Responsive UI
  config.js                   Public Edge Function base URL only
  AGENT_PROMPT.md             One ≤9000-character prompt for all ten agents
  RULES.md                    Learner-facing council rules
  DEPLOY.md                   Exact deployment and redeployment steps
  DECISIONS.md                Consequential implementation choices
supabase/schema.sql           cr_ PostgreSQL tables, RLS, seats, bucket
supabase/functions/classroom/index.ts
                              The sole HTTP JSON backend
tools/fakecouncil.js          Deterministic ten-agent protocol test
tools/smoke.sh                Public API smoke test
```

## Architecture

```text
GitHub Pages (static viewer)  ──polls──>  Supabase Edge Function: classroom
       ↑                                               │
       └──── append-only board ops / PNG snapshots ────┤
                                                       ↓
                                            Postgres cr_* + public classroom bucket

Ten Arena.ai agents ──poll /inbox every ~3 s──> classroom
```

- The viewer has **no build command** and no player login.
- The Edge Function is the only writer to the RLS-protected database and storage.
- Agents receive an opaque per-seat token from `POST /claim`, then repeatedly call the compact `GET /inbox` route.
- The browser only sees the public function URL. It never sees an admin key, database password, or service-role key.

## Council workflow

| Seat | Role | Duty |
|---:|---|---|
| 1 | moderator | decomposes questions, publishes the final answer |
| 2–4 | researchers A–C | independent evidence and counter-evidence |
| 5 | explainer | learner-level draft and revisions |
| 6 | critic | concrete, fixable objections |
| 7 | verifier | sourced claim table |
| 8 | calculator | recomputes numbers, units, and formulas |
| 9 | illustrator | turns the approved answer into shared drawing ops |
| 10 | scribe | captures context and open questions |

The normal server-owned state machine is:

```text
research → draft → critique → revise → vote → final → draw → done
```

All currently online agents vote. Any reject returns the task to a new revision round; after the configured maximum, the moderator decides but must show unresolved disagreement in **Council notes**. Silent seats become offline after 90 seconds and no longer block the online voting set.

## Try the deployed prototype

- **Pages:** `https://normandec.github.io/agentTHEengineer/`
- **API:** `https://bbeeodsvaxykyhxrbnvz.supabase.co/functions/v1/classroom`

The Pages URL works once GitHub Pages is configured to serve this branch's `/docs` directory (see [DEPLOY.md](docs/DEPLOY.md)). You can temporarily point a Pages load at another deployment with `?api=https://PROJECT.supabase.co/functions/v1/classroom`.

## Local static preview

Any static server works; for example:

```bash
python3 -m http.server 8080 --directory docs
# visit http://localhost:8080
```

The browser will use the public API URL in `docs/config.js`.

## Deploy and test

See **[docs/DEPLOY.md](docs/DEPLOY.md)** for the canonical procedure. The short version:

```bash
# apply supabase/schema.sql and store CLASSROOM_ADMIN_KEY as a server secret
supabase functions deploy classroom --no-verify-jwt

export CR_API='https://YOUR_PROJECT_REF.supabase.co/functions/v1/classroom'
./tools/smoke.sh
node tools/fakecouncil.js "$CR_API" 120
```

The fake council must end with `0 errors`, a final answer, and labelled drawing operations. It uses canned prose solely to exercise the protocol; it is not an evidence-quality test.

## Admin endpoints

Admin controls are intentionally separate from the UI. They require `?admin=$CLASSROOM_ADMIN_KEY` (or the `x-admin-key` header):

- `POST /reset` — clear tasks and agent claims; `?hard=1` also removes messages.
- `POST /kick` — release a seat.
- `GET /log` — inspect recent tasks, seats, and message headers.
- `POST /settings` — adjust `quorum`, `phase_timeout_s`, and `max_rounds`.

Keep the key only in the Supabase secret store. Do not add it to this repository.

## License / prototype note

This is a working prototype intended for review and iteration. Before a broad public launch, add abuse controls, rate limits, observability, accessibility testing with users, and a production data-retention policy.
