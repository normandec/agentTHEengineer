# Implementation decisions

## Deployment shape

- AI CLASSROOM uses dedicated Supabase project `bbeeodsvaxykyhxrbnvz` in EU Central; it is isolated from unrelated projects.
- GitHub Pages serves the static `docs/` directory. The browser has only a public Function URL; `classroom` is the one backend and holds service-role access.
- The deployed Edge Function is a tiny connector entrypoint that fetches a pinned, self-contained `deploy.bundle.js` from this repository and registers its exported handler. This keeps the deployed bytes pinned to a reviewed commit when a direct authenticated Supabase CLI deployment is unavailable; every backend update must rebuild the bundle and move the pinned commit deliberately.
- While this branch is being reviewed, Pages should serve `/docs` from `arena/20629a9d-agenttheengineer`; after merge it should serve `/docs` from `main`. The repository is currently still configured to the legacy `arena/99846906-agenttheengineer:/docs` source, so a repository administrator must change that Pages setting before the public Pages URL reflects this work.

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
- Generic file publication is intentionally MIME-agnostic up to 100 MB so council workers can publish real Office documents and any other valid artifact. `tools/make-office.py` is a standard-library fallback that produces actual DOCX/XLSX packages rather than misleading renamed text files.
- Knowledge chunks are Postgres full-text indexed with a future embedding JSON hook; pgvector is not required for this prototype.
- `tools/mirror.js` uses a user-supplied Dropbox app token outside the platform. The Function cannot access Dropbox. `GET /export` supplies a portable ZIP for the same purpose.

## Live collaboration

- Browser pen paths are streamed about every 250 ms but only the compact final path is persisted in `cr_ops`. A drawing-finished board event is emitted after a two-second debounce on the next poll/tick.
- `?fresh=1` sets a snapshot request visible to the next browser poll. The browser rasterizes immediately and agents retry the PNG URL; this bridge is necessary because a server cannot command an arbitrary static browser to capture synchronously.
- Canvas renders base vector ops. Video and GLB model ops use positioned DOM media overlays; `model-viewer` is loaded from a small CDN module.
- UI preferences (appearance, selected council mode, follow-new-message behavior, and voice detail) stay in browser local storage only. An admin key is read only from the current page query string, forwarded as an `x-admin-key` header to the configured Function, and never persisted. The page explicitly uses a strict-origin referrer policy to avoid passing that query value to external links.
- Chat polling uses keyed turn nodes instead of clearing the complete log. A reader is followed only when already at the newest message or after sending a question; otherwise a visible Jump to latest control preserves their reading position. Focus view is local to the current tab and exits with Escape.
- Browser speech detects each council response from Unicode script and language markers, with an agent-provided BCP-47 tag as a short-text fallback. The Web Speech API is used only with an installed voice that matches that detected language; it deliberately keeps a response as text rather than falling back to an unrelated English voice.
- A learning upload is marked learned only after browser extraction successfully writes readable text and the Function indexes it. Unsupported or failed extraction remains an ordinary shared file instead of misleading the learner with a false learning-library status.
- Board draw completion is durable, not conversational: the Function will not advance a draw task or emit a saved illustration event unless every requested operation is inserted. The viewer reloads a board when it receives that event and visibly reports an absent saved illustration.
- Sheet video operations retain their DOM media element across canvas renders. A `speak` message that carries `meta.lesson.{sheet_id,media_id}` starts the matching sheet animation alongside its narration; the learner can also start the latest lesson manually.
- A saved lesson references an ordered, durable timeline of narration messages and board-operation checkpoints rather than duplicate audio or drawing bytes. This makes incremental drawing and erasing replayable from the same append-only sheet history.

## Known boundaries

- Public unauthenticated learner endpoints need gateway rate limits/abuse controls before a broad launch.
- Long polling in a serverless Edge Function is capped at 20 seconds. `tools/agent-runner.sh` is the reliability broker: it has no successful terminal state, dispatches each inbox wake to a short-lived worker adapter, then waits again. A connected agent must not substitute a chat message claiming it is in a loop; whether the host can preserve the broker remains a host capability that must be reported honestly.
- Blender is an agent-side recipe, not a promise that every sandbox contains Blender/FFmpeg. The fake council uses FFmpeg when available and reports upload errors honestly.
