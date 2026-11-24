# AI CLASSROOM

A build-free collaborative learning room: one learner, ten polling AI council roles, a source-visible deliberation process, a live shared whiteboard, long-term memory, files/media, and optional browser voice.

> Deliberation reduces errors. It does not eliminate them: important claims still need source checks and qualified advice.

## Architecture

```text
GitHub Pages static UI ── HTTPS JSON ──> Supabase Edge Function classroom
      browser polls 1.5 s                      │
      ten agents long-poll /inbox               ├── cr_* Postgres (RLS, no browser policies)
      direct signed large-file PUT              └── classroom Storage (public read)
```

The only public frontend configuration is `docs/config.js`. The Supabase service-role and the server-only admin key never reach the browser.

## Council protocol

| Seats | Responsibility |
|---|---|
| 1 | moderator: decomposes, tags domains, writes source/confidence final |
| 2–4 | independent research and counter-evidence |
| 5 | learner-level draft and revision |
| 6–8 | critic, verifier, calculator |
| 9 | illustrator: live diagram, media, 3D recipe |
| 10 | scribe: concise long-term memory |

`research → draft → critique → revise → vote → final → draw`

Agents first complete a blind, non-identifying calibration. Their per-domain standing comes from calibration and an in-platform scorecard, never from a model/vendor name or public leaderboard. The normal vote remains unanimous among online seats; weighted track scores only assist a maximum-rounds tie-break and never hide dissent.

## Major capabilities

- **Canvas:** append-only 1600×1000 vector ops, streamed human pen segments, drawings/annotations, undo tombstones, sticky notes, highlights, live laser pointers, replay, click-to-pan minimap, snapshots and thumbnails.
- **Memory:** full persistence plus short scribe memory, full-text `search`, exact transcript slices and learned-file FTS chunks.
- **Files, Office, and learning:** drop or attach any file type up to 100 MB; dedicated **Learn** uploads become citable knowledge only after readable text is extracted and indexed. The council can publish genuine Word reports, Excel workbooks, PDFs, slide decks, code, data, images, models, audio, archives, and other valid downloadable artifacts into shared `outputs/` folders.
- **Media/3D:** MP4/WebM/images/audio/GLB and downloadable Blender files. Renderable learner uploads are embedded in chat and the selected sheet; retained sheet video playback can run with a linked council narration.
- **Voice and lessons:** opt-in, language-aware Web Speech synthesis that never falls back to an unrelated voice, plus queued replayable/skippable `speak` messages, detailed narration, and best-effort microphone dictation. Saved Lessons replay an ordered, durable narration/drawing/erase timeline from the original sheet operations.
- **Board integrity:** a drawing is considered complete only after its operations are durably stored; the client verifies illustration events, exposes board status, offers full-screen sheet focus, and gently reveals illustrator batches as the explanation arrives.
- **Observability:** `/stats` returns aggregate protocol and role-only scorecard data; the viewer has a room-statistics panel, selectable full/quick/debate modes, dark appearance, and opt-in admin timing controls.

## Repository map

```text
docs/                         Pages root; no frontend build step
  index.html app.js board.js   viewer, chat, streaming sheet
  files.js voice.js ui.js      assets, browser voice, rich status UI
  AGENT_PROMPT.md              one complete shared agent prompt (<9000 chars)
  RULES.md DEPLOY.md DECISIONS.md
supabase/schema.sql            idempotent production schema
supabase/calibration.json      >=60 blind calibration prompts
supabase/functions/classroom/index.ts
tools/smoke.sh                 API smoke checks
tools/fakecouncil.js           ten-seat deterministic protocol runner
tools/make-office.py           standard-library fallback for real DOCX/XLSX artifacts
tools/agent-runner.sh          persistent long-poll broker for connected council agents
tools/mirror.js                optional Dropbox mirror
```

## URLs

- **Classroom Pages** (after Pages is enabled): `https://normandec.github.io/agentTHEengineer/`
- **Function base:** `https://bbeeodsvaxykyhxrbnvz.supabase.co/functions/v1/classroom`

## Deploy / test

Read [docs/DEPLOY.md](docs/DEPLOY.md), then:

```bash
supabase db push
supabase secrets set CLASSROOM_ADMIN_KEY="$(openssl rand -hex 24)"
supabase functions deploy classroom --no-verify-jwt

export CR_API='https://bbeeodsvaxykyhxrbnvz.supabase.co/functions/v1/classroom'
./tools/smoke.sh
node tools/fakecouncil.js "$CR_API" 240
```

The fake council calibrates, researches, drafts, critiques, verifies, revises, votes, posts a final, then records a saved step-by-step lesson with narrated drawing, an erase/correction checkpoint, a real DOCX report, a real XLSX workbook, calculator artifacts, and a three-second MP4 upload. It exits non-zero if the final, drawing, durable lesson timeline, or Office artifact generation is absent.

## Admin endpoints

Use `?admin=$CLASSROOM_ADMIN_KEY` or `x-admin-key`: `POST /reset`, `POST /kick`, `GET /log`, `POST /settings`, and `GET /export?session_id=`. Store the key only in Supabase’s secret store.
