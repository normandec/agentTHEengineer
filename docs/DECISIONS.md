# Implementation decisions

## Deployment shape

- AI CLASSROOM uses dedicated Supabase project `bbeeodsvaxykyhxrbnvz` in EU Central; it is isolated from unrelated projects.
- GitHub Pages serves the static `docs/` directory. The browser has only a public Function URL; `classroom` is the one backend and holds service-role access.
- While this branch is being reviewed, Pages should serve `/docs` from `arena/20629a9d-agenttheengineer`; after merge it should serve `/docs` from `main`.

## Security and persistence

- All tables are `cr_` prefixed and RLS-enabled without policies. The Edge Function, not the browser, writes Postgres and Storage.
- Public Storage read is intentional so boards/media can render. Large files use one-time signed upload URLs and are confirmed by the Edge Function before publication.
- The admin key belongs only in Supabase secret `CLASSROOM_ADMIN_KEY`, never in frontend source.
- Every durable message, op, memory update, file and media record is kept. `cr_live_strokes` is the sole ephemeral buffer: it compacts partial pen updates into a final append-only `path` op.

## Calibration and specialisation

- Standing does not use model self-identification or public leaderboards. A 60-item local pool in `supabase/calibration.json` supplies a rotating blind 15-question test at claim time.
- `cr_seats.profile` stores calibration, optional non-identifying strengths/weaknesses and exponentially smoothed track scores. The user sees only seat/role scorecards.
- Questions receive heuristic domain tags until the moderator explicitly supplies `meta.domains`. Inbox exposes a lead seat and vote weights. Online-seat unanimity remains default; weights only inform a max-rounds tie decision.

## Memory, assets and exports

- The scribe owns a concise `cr_memory` record (max 2,500 characters). Agents retrieve memory, FTS search results, and exact transcript slices rather than unbounded history.
- Browser-side extraction is deliberately best-effort. Plain text is dependable; PDF/DOCX/XLSX/archive extraction uses optional CDN parser libraries. Audio/video transcription remains an agent capability.
- Knowledge chunks are Postgres full-text indexed with a future embedding JSON hook; pgvector is not required for this prototype.
- `tools/mirror.js` uses a user-supplied Dropbox app token outside the platform. The Function cannot access Dropbox. `GET /export` supplies a portable ZIP for the same purpose.

## Live collaboration

- Browser pen paths are streamed about every 250 ms but only the compact final path is persisted in `cr_ops`. A drawing-finished board event is emitted after a two-second debounce on the next poll/tick.
- `?fresh=1` sets a snapshot request visible to the next browser poll. The browser rasterizes immediately and agents retry the PNG URL; this bridge is necessary because a server cannot command an arbitrary static browser to capture synchronously.
- Canvas renders base vector ops. Video and GLB model ops use positioned DOM media overlays; `model-viewer` is loaded from a small CDN module.

## Known boundaries

- Public unauthenticated learner endpoints need gateway rate limits/abuse controls before a broad launch.
- Long polling in a serverless Edge Function is capped at 20 seconds. The shell loop remains the reliability fallback.
- Blender is an agent-side recipe, not a promise that every sandbox contains Blender/FFmpeg. The fake council uses FFmpeg when available and reports upload errors honestly.
