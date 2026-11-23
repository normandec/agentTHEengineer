# BUILDER PROMPT — "AI CLASSROOM" (prototype, English)

You are a senior full-stack engineer with GitHub access. Build and ship a working prototype of **AI CLASSROOM**: a web app where a human talks to a *council of ten AI agents* that research, debate, verify and agree on an answer before replying, then explain it — in text and **live on a shared sheet of paper (whiteboard)** that both the human and the agents can draw on.

Work autonomously end to end. Do not stop to ask questions unless something is truly blocking; make sensible decisions, document them in `docs/DECISIONS.md`, and keep going. When finished, give me the live URL, the agent prompt, and a short handover.

---

## 0. Proven pattern you must follow

This platform is the successor of three working projects (an ant colony, a war front and an aquarium) that already proved the pattern:

* a **static viewer** (single HTML+JS page),
* a **Supabase Edge Function** as the only backend (HTTP, JSON, no auth for players, an `?admin=KEY` for admin),
* Supabase **Postgres tables + Storage** for state,
* **AI agents on Arena.ai** that connect purely by **polling HTTP** every few seconds (they cannot receive pushes, cannot keep websockets, each tool call costs them time; ~1–3 s latency per request is normal).

Design everything around *polling agents*. Nothing may require a persistent connection from an agent.

---

## 1. Hosting & constraints

* **Frontend:** GitHub repository `ai-classroom` (public), deployed with **GitHub Pages** from `/docs` (or `gh-pages` branch). Pure static files: `index.html`, `app.js`, `board.js`, `style.css`. No build step required; no framework needed (vanilla JS is preferred; small CDN libs allowed, e.g. `marked` for Markdown, `KaTeX` for math).
* **Backend:** one Supabase Edge Function named **`classroom`**, plus tables prefixed **`cr_`** and a Storage bucket **`classroom`** (public read).
  * If you have a Supabase connector: create everything yourself.
  * If you don't: put the full SQL in `supabase/schema.sql`, the function in `supabase/functions/classroom/index.ts`, write exact deploy steps in `docs/DEPLOY.md`, and tell me what to run. Design the function so it can be deployed with `verify_jwt = false`.
* **Config:** the frontend reads the API base URL from `config.js` (`window.CR_API = "https://<project>.supabase.co/functions/v1/classroom"`), overridable by `?api=` query param.
* **Secrets:** no secrets in the frontend. Admin key is a long random string checked server-side (`?admin=`). Agents authenticate with a per-seat token returned at claim time.
* Everything in **English** (UI, docs, agent prompt). Code comments in English.

---

## 2. What the user experiences

1. Opens the page. Left: **chat**. Right: **the sheet** (a large white canvas). Top bar: session name, **New sheet**, **Sheets ▾** (history), **Upload image**, **Council status** (10 small dots: idle / thinking / voting / offline).
2. Types a question or task (e.g. "Explain how a buck converter works", "Help me plan a 3-week Arduino project", "Check this circuit" + uploads a photo). May also draw on the sheet freehand before or during the conversation.
3. Sees the council work in a collapsible **"Deliberation"** panel: research notes, objections, votes — streamed live (polling). Final answer appears in the chat as Markdown with sources, only after the council agrees.
4. While/after the answer is produced, the **Illustrator** agent draws on the sheet: diagrams, arrows, labels, equations, timelines, circuit sketches. Drawing appears stroke by stroke.
5. User can draw over it, erase, add text, upload images (photos, schematics) placed onto the sheet, and ask "what did I draw wrong here?" — agents can *look at the sheet* (vector ops + rasterized PNG).
6. **Sheets** are persistent and browsable: every session keeps a list of sheets with thumbnails; user and agents can open any previous sheet and talk about it.
7. User can ask anything at any time; follow-ups keep context (session transcript).

---

## 3. Architecture

```
GitHub Pages (static)  <--HTTPS JSON-->  Supabase Edge Function `classroom`  <-->  Postgres (cr_*) + Storage (classroom)
        ^                                              ^
     human (browser, polls every 1.5 s)         10 Arena agents (poll every 2–5 s)
```

### 3.1 Tables (`supabase/schema.sql`)

* `cr_sessions(id uuid pk, title text, created_at, status text, settings jsonb)`
* `cr_messages(id bigserial pk, session_id, seq int, role text, author text, kind text, body text, meta jsonb, created_at)`
  * `role`: `user | agent | council | system`
  * `kind`: `question | note | objection | draft | vote | final | status | board_event`
* `cr_seats(seat int pk 1..10, role text, token text, agent_name text, claimed_at, last_seen, status text)`
* `cr_tasks(id uuid pk, session_id, question_msg_id, phase text, round int, deadline timestamptz, state jsonb, created_at, updated_at)`
  * `phase`: `research | critique | draft | verify | vote | final | done | failed`
* `cr_sheets(id uuid pk, session_id, idx int, title text, created_at, png_path text, thumb_path text)`
* `cr_ops(id bigserial pk, sheet_id, seq int, author text, op jsonb, created_at)` — append-only drawing operations
* Enable RLS on all tables with **no policies** (only the edge function with the service role key touches them).

### 3.2 Drawing model (vector ops, append-only)

Every drawing is a list of small JSON ops with a monotonically increasing `seq` per sheet. Both human and agents append ops; the browser renders them in order. Coordinates are in a fixed virtual space **1600 × 1000** (origin top-left), the canvas scales to fit.

Op types (keep this exact set; it is the "language" the Illustrator agent speaks):

```json
{"t":"line","x1":0,"y1":0,"x2":100,"y2":50,"w":2,"c":"#111"}
{"t":"arrow","x1":0,"y1":0,"x2":100,"y2":50,"w":2,"c":"#111"}
{"t":"rect","x":0,"y":0,"w":200,"h":100,"c":"#111","fill":"#fff0","r":6}
{"t":"ellipse","cx":0,"cy":0,"rx":50,"ry":30,"c":"#111","fill":"#fff0"}
{"t":"path","pts":[[x,y],[x,y],...],"w":3,"c":"#1a73e8","close":false}
{"t":"text","x":0,"y":0,"s":"label","size":22,"c":"#111","align":"left"}
{"t":"math","x":0,"y":0,"tex":"V_{out}=D\\cdot V_{in}","size":26}
{"t":"image","x":0,"y":0,"w":400,"h":300,"url":"https://.../classroom/uploads/..."}
{"t":"erase","pts":[[x,y],...],"w":30}
{"t":"clear"}
{"t":"group","name":"buck-converter","ops":[ ...nested ops... ]}
```

* Human freehand strokes become `path` ops (coalesced per stroke).
* The browser **rasterizes** the sheet to PNG every 5 s when it changed and uploads it via `POST /sheet/:id/png` (base64) → Storage `classroom/sheets/<id>.png` and a 320 px thumbnail. Agents fetch the PNG URL to "see" the sheet (including human scribbles and uploaded photos).
* Agents also get the structured op list (`GET /sheet/:id/ops?since=seq`) so even text-only models can understand what is drawn.

### 3.3 Edge Function API (`classroom`)

All responses JSON; CORS `*`. Public endpoints (human):

* `GET  /health`
* `POST /session {title}` → `{session_id}`; `GET /sessions`; `GET /session/:id` (messages since `?since=seq`, current task phase, sheets list, council status)
* `POST /ask {session_id, text, sheet_id?}` → creates `question` message and a `cr_tasks` row in phase `research`, returns `{task_id}`
* `POST /sheet {session_id, title?}` → new sheet; `GET /sheets?session_id=`; `GET /sheet/:id` (meta + ops); `GET /sheet/:id/ops?since=`
* `POST /sheet/:id/ops {author:"user", ops:[...]}`
* `POST /sheet/:id/png {data_url}`; `POST /upload {session_id, sheet_id, filename, data_url}` → stores file, appends an `image` op, returns public URL
* `GET  /prompt` → plain-text agent prompt (section 5), `GET /rules` → plain-text protocol reference

Agent endpoints (token in header `x-seat-token` or `?token=`):

* `POST /claim {name}` → assigns the lowest free seat (or re-attaches to a seat whose `last_seen` > 90 s old) → `{seat, role, token, poll_hint:3}`
* `GET  /inbox` → **the one call agents loop on**: returns `{seat, role, task: {id, phase, round, deadline, question, context[], your_turn:bool, needed:"note|objection|draft|verify|vote|draw|none"}, sheet: {id, ops_seq, png_url}, since_last: [new messages]}` — compact (≤ 6 kB) and `your_turn` tells the agent exactly whether it must act. Also updates `last_seen`.
* `POST /say {task_id, kind, body, meta?}` — `kind` ∈ `note | objection | draft | verify | vote`; `vote.meta = {approve:bool, reason}`; `verify.meta = {claims:[{claim, verdict:"ok|wrong|unsure", source}]}`
* `POST /draw {sheet_id, ops:[...]}` — only seat with role `illustrator` (and admin) may draw; max 200 ops per call; the server stamps `author:"illustrator"`
* `GET  /sheet/:id/ops`, `GET /sheet/:id/png` (redirect to storage URL) — any seat may look
* `GET  /transcript?session_id=&limit=` — for context

Admin (`?admin=KEY`): `POST /reset` (clears tasks/seats, keeps sheets), `POST /kick {seat}`, `GET /log`, `POST /settings {quorum, phase_timeout_s, max_rounds}`.

**Task state machine is driven server-side** on every request ("tick on request", same as the previous projects — no cron needed): the function checks the current task's phase deadline and advances phases when all required inputs are in **or** the deadline passed with quorum. Never stall forever: default `phase_timeout_s = 75`, `quorum = 7` of 10, `max_rounds = 3`. If an agent seat is silent for > 90 s it is marked `offline` and excluded from quorum.

### 3.4 Deliberation protocol (the core idea — implement exactly)

Ten seats with fixed roles:

| seat | role | job |
|---|---|---|
| 1 | **moderator** | restates the question, splits it into sub-questions, writes the final answer from the approved draft, breaks ties |
| 2 | **researcher-A** | searches the web, primary sources, standards, datasheets, papers |
| 3 | **researcher-B** | searches independently with different queries/angles; must not copy A |
| 4 | **researcher-C** | searches for counter-evidence, common misconceptions, edge cases |
| 5 | **explainer** | writes the draft answer for the user's level: structured, with examples, analogies, steps |
| 6 | **critic** | adversarial: finds errors, gaps, ambiguity, unsafe advice; must raise ≥ 1 concrete objection or explicitly state "no objection found after checking X, Y, Z" |
| 7 | **verifier** | checks every factual claim in the draft against sources; outputs a claim table (ok / wrong / unsure) |
| 8 | **calculator** | redoes all numbers, units, formulas, code snippets; runs code in a sandbox when available |
| 9 | **illustrator** | converts the approved answer into drawing ops on the sheet (diagrams, labelled sketches, equations, timelines); also answers "what's on the sheet?" by reading ops/PNG |
| 10 | **scribe** | keeps a running summary of the session, tracks open questions and what the user already knows; provides context to others; archives the final answer |

Phases per question:

1. **research** (seats 2,3,4,10 post `note`s with sources; 1 posts the decomposition) — 75 s
2. **draft** (seat 5 posts `draft` using the notes; others idle) — 75 s
3. **critique + verify** (6 posts `objection`s, 7 posts `verify` table, 8 posts `note` with checked numbers) — 75 s
4. **revise** (5 posts a new `draft` addressing every objection/wrong claim) — 60 s
5. **vote** (all online seats post `vote` approve/reject with reason). **Unanimous approve of online seats → final.** Any reject → back to step 4 (round+1) until `max_rounds`, then moderator decides and the final answer must list the unresolved disagreement openly under "Council notes".
6. **final** (seat 1 posts `final`: the answer in Markdown with a Sources list and a one-line "Confidence: high/medium/low – why") → shown to user
7. **draw** (seat 9 draws; up to 90 s; can continue in background while the user reads)

Short-circuit rules: for trivial messages ("thanks", "ok", "yes continue") the moderator can answer directly with `final` and skip the pipeline; for follow-up questions the pipeline runs but research may be skipped if the moderator marks `needs_research:false`. The user can also force a fast answer with `/quick` prefix.

The frontend shows the phase, the countdown, and the votes (10 dots turning green/red).

---

## 4. Frontend details

* Responsive two-pane layout (chat 40 % / sheet 60 %; stack on mobile).
* Chat: Markdown rendering, code blocks with copy, KaTeX math, source links, "Deliberation" accordion per answer with the raw notes/objections/votes, agent avatars by role.
* Sheet: HTML canvas, pointer events (mouse, touch, pen), tools: pen (3 widths, 6 colours), eraser, text, select-and-move for images, undo (own ops only → sends `erase`-free undo by appending `{"t":"undo","seq":n}` — implement as a tombstone op), zoom/pan, **"Ask about this sheet"** button (sends the question with `sheet_id`), download PNG.
* Live rendering of incoming agent ops with a subtle "drawing…" animation (draw paths progressively over ~300 ms).
* Sheets drawer: thumbnails, title, created date; click to open; "New sheet" starts a blank one in the same session.
* Council status strip: seat number, role, name, state; red when offline; tooltip with last activity.
* Polling: `GET /session/:id?since=` every 1.5 s while the tab is visible; back off to 5 s when hidden.
* Everything must also work when the API is slow (2–3 s) — optimistic UI for own strokes/messages.

---

## 5. The agent prompt (serve at `GET /prompt`, also save as `docs/AGENT_PROMPT.md`)

Write one prompt that I will paste into **each of 10 separate Arena.ai agent sessions**. The same text for all; the role comes from `/claim`. It must:

* Explain the mission (council of ten; answer only after agreement; honesty over speed; cite sources; say "unsure" rather than guess).
* Give the exact loop: `POST /claim {name}` once → then forever: `GET /inbox` → if `your_turn` do the role's job (web search for researchers, drawing ops for illustrator, etc.) → `POST /say` or `POST /draw` → wait `poll_hint` seconds → repeat. Tell them to use their HTTP/bash tool with `curl`, keep each request small, never stop the loop, re-claim with the same name if they get 401.
* **Mandatory "wait in bash" pattern** (this is what lets an Arena agent run for an hour or more without filling its context): the agent must NOT poll `/inbox` by hand every few seconds. Instead it runs ONE blocking shell command that loops server-side-cheaply and returns only when it is the agent's turn (or when something new arrived), e.g.

  ```bash
  # wait up to 25 min; prints the inbox JSON the moment it is my turn
  for i in $(seq 1 500); do
    R=$(curl -s -H "x-seat-token: $TOKEN" "$API/inbox?since=$SEQ")
    echo "$R" | grep -q '"your_turn":true' && { echo "$R"; break; }
    sleep 3
  done
  ```

  Idle time therefore costs the agent zero reasoning and zero context. Also implement `GET /inbox?wait=20` as a server-side long-poll (hold the request up to 20 s until `your_turn` becomes true) so the loop above can use `sleep 1` with far fewer round trips. Ship this snippet verbatim in the agent prompt and in `docs/RULES.md`, and keep `/inbox` responses small (delta since `?since=`, ≤ 6 kB).
* Contain **role cards**: for each of the 10 roles, what to produce, format, length limits (notes ≤ 1200 chars, drafts ≤ 6000 chars, votes ≤ 300 chars), quality bar.
* Contain the **drawing cheat-sheet** for the illustrator: coordinate space 1600×1000, the op list from §3.2, composition advice (title at top, left-to-right flow, ≤ 60 ops per batch, labels ≥ 20 px, leave the bottom-right 400×250 free for the human), how to read the PNG/ops of an existing sheet before adding to it, never `clear` unless the user asked.
* Contain the **voting rule**: approve only if you would stake your reputation on the answer; reject with a specific, fixable reason.
* Include a worked example of one complete cycle (short).
* Be ≤ 9000 characters so it fits an agent's context comfortably.

Also write `tools/fakecouncil.js` (Node): simulates 10 agents against the API with canned behaviour (researchers post lorem notes with a real URL, explainer drafts, critic objects once, everybody votes approve, illustrator draws a labelled box diagram). I will use it to test the full pipeline without ten real agents. `node tools/fakecouncil.js <API_URL> [seconds]` must run clean with 0 errors.

---

## 6. Deliverables & acceptance

Repository layout:

```
docs/              -> GitHub Pages root: index.html app.js board.js style.css config.js
supabase/schema.sql
supabase/functions/classroom/index.ts
tools/fakecouncil.js  tools/smoke.sh (curl checks of every endpoint)
docs/AGENT_PROMPT.md  docs/RULES.md  docs/DEPLOY.md  docs/DECISIONS.md  README.md
```

Acceptance tests you must run and report:

1. `GET /health` → 200 from the deployed function; GitHub Pages URL loads and shows "Council: 0/10 online".
2. `tools/fakecouncil.js` for 120 s → a question asked via the UI goes through research → draft → critique → revise → vote → final → draw, the answer appears in the chat with sources, and a drawing appears on the sheet. 0 errors.
3. Human freehand stroke + uploaded image appear on the sheet, the PNG is uploaded to storage, and `GET /sheet/:id/png` returns it.
4. Reload the page → session, messages and sheets persist; sheets drawer shows thumbnails.
5. Kill 3 fake agents mid-task → pipeline still finishes via quorum within the timeouts.
6. Lighthouse-level sanity: no console errors, works in Chrome + Firefox + a phone.

Report back with: Pages URL, API URL, admin key location, the agent prompt, what you tested, known limitations, and the exact commands to redeploy.

---

## 7. Quality bar & honesty

* Keep it simple and robust; prefer boring, dependable code. No frameworks that need builds unless you also commit the built output.
* Do not fake success. If something cannot be verified from your side, say so explicitly.
* Multi-agent deliberation **reduces** errors (independent research, adversarial critique, claim-by-claim verification, unanimous vote) but does not make answers infallible; the UI and prompt must therefore always show sources and a confidence line, and never hide disagreements.

---

## 8. Specialisation without revealing models (implement)

Agents must **never** state or hint at which underlying model they are. Instead, specialisation is *measured*.

**Why not self-identification?** The original idea was: each agent privately knows which model it is, looks up public leaderboards, and appoints itself lead for its strongest domain (e.g. "I rank best in math, so I lead math questions") — without ever telling the user. That idea is clever and does not break any rule (the model says nothing, the user learns nothing), but as an engineering mechanism it has three holes, so do **not** implement it:

1. **Models do not reliably know who they are.** They are often wrong about their own version (knowledge cutoff, fine-tunes, system prompts steering them). A self-assessment "I am X, therefore best at math" would stand on an unreliable foundation.
2. **Everyone would elect themselves.** Leaderboards (LMArena, benchmarks) are coarse and disagree with each other; every model can find one where it is #1. You would get ten "leads for math".
3. **Indirect disclosure.** If a seat says "I am #1 for code on leaderboard X" and the user knows that leaderboard, the model is effectively revealed. Not a violation, but the same grey zone the rule exists to avoid.

Therefore standing in the council comes only from evidence gathered *inside* the platform:

* **Calibration at claim time.** After `/claim`, `GET /inbox` first returns `needed:"calibrate"` with a blind mini-test: 5 domains (math, code, physics/electronics, humanities/history, language/writing) × 3 short tasks with server-known answers (keep a pool of ≥ 60 in `supabase/calibration.json`, rotate randomly). The agent answers once; the server scores it and stores a per-domain score in `cr_seats.profile`.
* **Self-declared profile (optional, no model names).** The agent may add `{"strengths":["explaining","physics"],"weaknesses":["long arithmetic"]}` — treated as a weak prior only.
* **Running scorecard** in `cr_seats.profile.track`: per domain, update after every task — claims marked `ok` vs `wrong` by the verifier, objections that led to an accepted revision, votes that agreed with the final outcome, numbers confirmed by the calculator. Simple exponentially weighted averages are enough.
* **Use it.** On each question the moderator phase tags the domain(s) (`meta.domains`), and the server exposes `lead_seat` (highest score for that domain) and `vote_weights` in `/inbox`. The lead's draft/verification is requested first; the vote is still unanimous-of-online by default, but when `max_rounds` is exhausted the weighted vote decides. Show the leaderboard per domain in the UI as role + seat number only (never a model name).
* **Guardrail in the agent prompt:** "Do not name, guess or hint at your model or vendor, and do not consult public model leaderboards about yourself; your standing in the council comes only from the calibration and your track record here."

---

## 9. Unlimited memory: store everything, read only what is needed

Agents have small working memory; the platform must be their long-term memory. Context is spent on *reading*, not on storing — so the design is "store all, retrieve little":

* **Everything persists immediately** in Supabase (messages, notes, votes, ops, PNGs). Nothing is ever truncated or deleted by the system.
* **Retrieval endpoints** (agents and UI):
  * `GET /search?session_id=&q=` — Postgres full-text search (`tsvector` on `cr_messages.body`, GIN index) returning ≤ 8 snippets with `seq`, `kind`, `author`, `created_at`.
  * `GET /transcript?session_id=&from=&to=` — exact slice by `seq` (max 40 messages per call).
  * `GET /memory?session_id=` — the scribe's `MEMORY.md`: ≤ 2500 chars with a running summary, what the user already knows / asked, list of sheets with one-line descriptions and open questions. `/inbox` includes only this memory plus the delta — never the whole transcript.
  * `GET /sheets?session_id=` with thumbnails; `GET /sheet/:id/ops`, `/png` for any past sheet.
* **Scribe duty (seat 10):** after every `final`, rewrite `MEMORY.md` via `POST /memory {session_id, body}`; keep it short, factual, indexed by `seq` and `sheet_id`.
* **Dropbox mirror (archive + backup, human-readable):** every session is mirrored to `/AI-CLASSROOM/<session-title>-<id>/` as `transcript.md` (full, appended), `MEMORY.md`, `deliberation/<task-id>.md` (notes, objections, votes), `sheets/<idx>-<title>.png`. Implement as `tools/mirror.js` (Node, uses a Dropbox app token from env, runs in a loop or on demand) **and** add an admin endpoint `GET /export?session_id=` that returns the same files as a zip, so the mirror can also be done by any agent that has a Dropbox connector (the user does). The mirror is write-only from the platform's point of view; Supabase stays the source of truth.
* **Prompt rule for agents:** "Never ask for or read the whole transcript. Start from `/memory`, use `/search` to find what you need, then fetch an exact slice. Quote `seq` numbers when referring to earlier content."

---

## 10. Media & 3D: Blender animations made by the agents during the work

Agents run in sandboxes with a shell, so they can **install Blender headless, build a scene, render an animation and upload it to the platform while the deliberation is running**. The user must be able to request this in chat ("show me this as a 3D animation", "animate how the piston moves") and to upload `.blend` / `.glb` / `.stl` files that the agents then open, modify, render and return.

### 10.1 Platform side

* **Storage:** bucket `classroom`, prefix `media/<session_id>/`. Accept `mp4, webm, gif, png, jpg, svg, glb, gltf, stl, obj, blend, zip, py` up to **100 MB**.
* **Upload protocol (large files must not go through the Edge Function body):**
  1. `POST /media/begin {session_id, filename, mime, bytes, sheet_id?, caption?}` → `{media_id, upload_url, headers}` — a Supabase Storage **signed upload URL**.
  2. Client/agent does `curl -X PUT -H ... --data-binary @file "<upload_url>"` directly to storage.
  3. `POST /media/done {media_id}` → server verifies the object exists, writes `cr_media`, posts a chat message of kind `media`, and if `sheet_id` was given appends an op `{"t":"video"|"image"|"model3d","x":..,"y":..,"w":..,"h":..,"url":..,"poster":..}` to the sheet.
  * Also keep the small-file path `POST /upload` (data URL ≤ 4 MB) from §3.3 for quick images.
* **Table:** `cr_media(id uuid pk, session_id, sheet_id, author, kind text, filename, mime, bytes, url, poster_url, caption, meta jsonb, created_at)`; `GET /media?session_id=` lists it.
* **Progress while working:** agents post `POST /say {kind:"status", body:"Rendering frame 48/120 …"}`; the UI shows the latest status of each seat in the council strip and as a small live line under the pending answer, so the user sees the work happening.
* **Sheet op `video`:** renders an inline `<video controls loop muted>` positioned on the sheet; `model3d` renders a `<model-viewer>` (CDN) for `.glb`; `.blend` files show as a download tile with a thumbnail if a poster PNG was provided.
* **Chat:** messages of kind `media` render as an inline player / image / download card with caption and author; a **Media** tab in the drawer lists all media of the session with thumbnails.
* **User upload:** the "Upload" button accepts the same formats; a `.blend` uploaded by the user appears in chat and its URL is included in the next task's `context[]` so agents can `curl -O` it.

### 10.2 Agent side (put this in the agent prompt as a "Blender recipe" card; duty belongs to the **illustrator**, the **calculator** is backup since both have sandboxes)

* Install once per session (prefer the portable build, no root needed):
  ```bash
  curl -L -o blender.tar.xz https://download.blender.org/release/Blender4.2/blender-4.2.3-linux-x64.tar.xz
  tar xf blender.tar.xz && export PATH=$PWD/blender-4.2.3-linux-x64:$PATH
  blender -b --version          # headless check
  ```
  (If the link 404s, list `https://download.blender.org/release/` and pick the newest 4.x LTS linux-x64 tarball. `apt-get install -y blender ffmpeg` is the fallback where root is available.)
* Build scenes with a Python script, never interactively: `blender -b -P scene.py -- args`. The script creates objects (`bpy.ops.mesh.primitive_*`), materials, keyframes (`obj.keyframe_insert`), camera + light, sets `scene.render.engine = 'BLENDER_EEVEE_NEXT'` (or `'CYCLES'` with low samples for quality), `resolution 1280×720`, `fps 24`, `frame_end ≤ 240`, and renders with `scene.render.image_settings.file_format='FFMPEG'`, `ffmpeg.format='MPEG4'`, `ffmpeg.codec='H264'` → `bpy.ops.render.render(animation=True)`. If FFMPEG output fails, render PNG frames and `ffmpeg -framerate 24 -i f_%04d.png -c:v libx264 -pix_fmt yuv420p out.mp4`.
* Keep renders short and cheap (≤ 10 s of video, ≤ 2 min of render time on CPU; EEVEE on CPU may be slow — Workbench engine is the fast fallback for schematic animations). Post a `status` every ~30 s.
* Also save a poster frame (`frame 1` as PNG) and upload it as `poster` so the sheet and chat show a thumbnail.
* Upload with the 3-step protocol above, then mention the media in the draft/final answer with a one-line description of what the animation shows and which parameters were used.
* When the user uploads a `.blend`, download it, inspect it with a script (`bpy.data.objects`, animations, materials), report what you found, then do the requested edit/render and upload the result; never claim to have "seen" a render you did not produce.

### 10.3 Acceptance additions

7. From the fake council, the illustrator stub uploads a 3-second `mp4` through `media/begin → PUT → media/done`; it appears inline in the chat and as a `video` op on the sheet; `GET /media` lists it.
8. A user-uploaded 2 MB `.blend` appears in chat as a download card and its URL is present in the next `/inbox` `context[]`.
9. Document in `docs/RULES.md` the file types, size limits and the exact curl sequence for the upload protocol.

---

## 11. Files: anything in, anything readable, "learn from this"

Generalise §10's media pipeline into a **Files** system. The user drops *any* file on the page; it lands in Supabase Storage (and the Dropbox mirror of §9) and becomes readable by every agent.

* **UI:** a big **"+ Files"** button and a drag-and-drop zone over the whole chat. Accept **any type** (text, code, pdf, docx/xlsx/pptx, images, audio, video, zip, csv, json, .blend, .ino, .kicad_*, …), ≤ 100 MB each, multiple at once, with a progress bar per file. Two actions per upload: **"Attach to question"** (default) and **"📚 Learn from this"**.
* **Storage & table:** `files/<session_id>/<file_id>-<name>` in bucket `classroom`; table `cr_files(id, session_id, author, name, mime, bytes, url, text_url, pages, sha256, tags, learned bool, created_at)`. Same 3-step signed-upload protocol as §10.1; `GET /files?session_id=`, `GET /file/:id` (meta), `GET /file/:id/text?from=&to=` (extracted text slice, ≤ 12 kB per call).
* **Text extraction in the browser at upload time** (no server CPU needed): `pdf.js` for PDF, `mammoth` for docx, `SheetJS` for xlsx/csv, plain read for text/code/json/md, `JSZip` to list archive contents. The extracted text is uploaded next to the file as `<file_id>.txt` (`text_url`) with page markers `=== page N ===`. For images: OCR with `tesseract.js` in the browser (optional, toggle). Audio/video: no transcription in the prototype — agents may download and transcribe themselves if they have a tool.
* **Agents read files** with `curl -L -o` of `url` (binary, for their own tools) or `GET /file/:id/text?from=` (text slices). `/inbox` `context[]` lists the files attached to the current question: `{file_id, name, mime, bytes, pages, text_url}` — never the content itself.
* **Agents upload too:** any seat may use the same protocol to publish anything it produced (code, CSV results, plots, PDFs, zips, renders). Uploads by agents are stamped with role + seat and appear in chat as file cards. Prompt rule: "If you made something, upload it and link it in your note — do not paste large content into messages."
* **📚 "Learn from this" = knowledge base.** Files marked `learned` are chunked (≈ 1 200 chars with 150 overlap, page-aware) into `cr_knowledge(id, session_id, file_id, chunk_no, page, text, tsv tsvector, embedding vector(384) nullable)`. Search: `GET /kb/search?session_id=&q=&k=8` (Postgres FTS; add `pgvector` + an embedding endpoint later if quality is insufficient — leave a hook). The pipeline uses it:
  * research phase: `/inbox` for researchers and the scribe includes `kb_hits` (top 8 chunks for the question, with file name + page) and the rule "knowledge-base sources outrank the web; cite as `[file.pdf p.12]`";
  * verifier: must check claims against KB chunks first;
  * UI: a **Knowledge** tab listing learned files, chunk counts, and a search box so the user can see what the council "knows". Un-learn = delete chunks.
* **Per-user library (cross-session):** a toggle "available in all sessions" sets `session_id = NULL` on the file/chunks so a learned textbook stays available tomorrow.

## 12. Voice: agents can speak whenever they want

* **Message kind `speak`:** `POST /say {kind:"speak", body:"<text ≤ 1 200 chars>", meta:{voice:"calm|teacher|energetic", lang:"BCP-47 tag matching body", autoplay:true}}`. The browser identifies the response language from its content (using the tag only when content has no language evidence) and selects an installed matching **Web Speech API** (`speechSynthesis`) voice. It must keep text visible rather than fall back to an unrelated language voice; zero cost, works offline. Each spoken message is also shown as a chat bubble with a 🔊 icon and a replay button.
* **Pre-rendered audio:** agents that have a TTS tool may instead upload an `mp3/ogg` through the files protocol with `meta:{speak:true}`; the UI plays it with an `<audio>` element and a waveform/progress line.
* **Autoplay policy:** browsers block audio until the user interacts, so show a **"🔈 Sound on"** toggle in the top bar (remembered in `localStorage`); queue `speak` messages and play them in order; never overlap two voices; a "⏭ skip" button.
* **When agents should speak** (put in the agent prompt): the moderator reads the final answer's 3-sentence summary aloud; the explainer may narrate while the illustrator draws ("look at the left side of the sheet…"); the critic should *not* speak objections (text only) to keep the audio calm; any seat may speak short status lines if the user enabled "verbose voice". The user can type `/mute` and `/unmute`.
* **Voice in:** a 🎤 button using `webkitSpeechRecognition` (where available) that dictates into the chat input.

## 13. Colour indicators, interactivity and extras

Make the page feel alive and legible at a glance:

* **Colour language (consistent everywhere — strip, chat avatars, deliberation panel, sheet author colours):** moderator gold `#f5b301`, researchers blues `#1a73e8 / #4a90e2 / #7fb3f0`, explainer green `#2ea44f`, critic red `#d7263d`, verifier purple `#7b2cbf`, calculator orange `#f26419`, illustrator teal `#17a2b8`, scribe grey `#6c757d`. The illustrator's strokes carry its colour by default; the human draws in black unless changed.
* **Seat states:** idle (dim), thinking (pulsing ring), writing (typing dots), voted-yes (green check), voted-no (red cross), offline (hollow). Hovering shows last activity + last message excerpt; clicking filters the deliberation panel to that seat.
* **Phase bar:** horizontal stepper research → draft → critique → revise → vote → final → draw with a countdown ring per phase and a round counter; turns amber at < 15 s, red if a deadline passed and quorum was used.
* **Live ticker** under the input: one-line stream of what is happening ("researcher-B found 3 sources", "critic raised 2 objections", "vote 7/9 approve").
* **Vote reveal:** when all votes are in, flip the 10 dots simultaneously; unanimous → short confetti burst on the answer (toggleable in settings); split → show the dissent reasons inline.
* **Answer card:** confidence chip (green/amber/red), sources chips, "Deliberation" accordion, buttons: 👍/👎 feedback (stored, visible to the council as `kind:"feedback"`), **Explain simpler**, **Go deeper**, **Draw it**, **Animate it (Blender)**, **Quiz me on this**, **Speak it**. Each button just sends a prefilled follow-up question.
* **Sheet extras:** mini-map, grid toggle, laser pointer (temporary red dot both human and agents can move via `{"t":"pointer","x":..,"y":..}`, auto-expires in 3 s), sticky notes op `{"t":"note",...}`, highlight tool, snapshot button that saves the current sheet as a new one, replay slider that re-draws the sheet op by op (nice for seeing how the illustrator built the diagram).
* **Modes:** `/quick` (skip deliberation), `/debate` (show the full argument in chat, not folded), `/quiz` (council generates 5 questions and grades answers), `/project` (scribe maintains a visible checklist with status chips, agents update it with `kind:"todo"`), `/lesson <topic>` (structured 15-minute lesson: outline → sections with sheets → quiz).
* **Dark mode, keyboard shortcuts** (Ctrl+Enter send, N new sheet, P pen, E eraser, Space pointer), responsive layout, no console errors.
* **Settings drawer:** API URL, sound, confetti, voice verbosity, timeouts/quorum (admin key required for server settings), export session (zip/markdown via §9).
* **Observability:** `GET /stats` → questions answered, mean deliberation time, rounds per question, agreement rate, per-seat scorecards (role + seat only); shown on an **About/Stats** page with simple SVG charts.

Keep all of this in vanilla JS; organise as `app.js` (chat, polling, state), `board.js` (sheet), `files.js` (uploads + extraction), `voice.js` (speak/listen), `ui.js` (indicators, phase bar, settings). Acceptance additions: (10) drag a PDF in, click "Learn from this", ask a question whose answer is only in the PDF → the final answer cites `[name.pdf p.N]`; (11) a `speak` message is spoken aloud after "Sound on" and listed with a replay button; (12) all ten seat colours/states render correctly with the fake council, phase bar advances, ticker and vote reveal work.

---

## 14. Live drawing both ways: the human draws, the agents watch in real time

§3.2 already makes human strokes ops and uploads a PNG every 5 s. Strengthen it so an agent can **follow the human's pen as it moves** and react while the drawing is still happening — not only after.

* **Stream strokes, not just finished drawings.** While the pointer is down, the browser sends partial `path` ops every ~250 ms as `{"t":"path","pts":[...],"w":3,"c":"#111","stroke_id":"s17","part":3,"done":false}`; the last chunk has `"done":true`. Renderers merge chunks by `stroke_id`. Pointer position (even without drawing) is sent as `{"t":"pointer","x":..,"y":..,"who":"user"}` at most 4×/s and auto-expires.
* **Human-activity signal in `/inbox`:** `sheet.human = {drawing:true|false, last_stroke_at, new_ops_since_you_looked: n, bbox_of_recent:[x,y,w,h], pointer:[x,y]}`. The server also emits a `board_event` message "user finished a drawing on sheet N (12 strokes, region top-left)" **2 s after the pen stops** (debounced), so agents that are not watching still learn about it.
* **Wake-up on drawing:** the blocking wait loop from §5 must also exit when `sheet.human.new_ops_since_you_looked > 0 && drawing == false` (i.e. the human just finished something) — add the pattern to the agent prompt (`grep -q '"wake":true'`; the server sets `wake:true` whenever `your_turn` is true **or** a human drawing just finished **or** a new user message arrived).
* **Watch mode:** the illustrator (and any seat the user asks, e.g. "critic, watch my circuit") can enter `POST /watch {sheet_id, on:true}`; while watching, its `/inbox` includes the **recent ops themselves** (≤ 3 kB, downsampled points) plus the current PNG URL, so it can say "you just drew a loop between R1 and C1 — did you mean a feedback path?" within a few seconds. The UI shows an 👁 badge on seats that are watching.
* **Snapshot on demand:** `GET /sheet/:id/png?fresh=1` asks the browser (via a flag in the session poll) to rasterize and upload immediately, then returns the new URL — so an agent can get an up-to-date picture in ~2 s instead of waiting for the 5 s cycle. Also `GET /sheet/:id/png?region=x,y,w,h` returns a cropped PNG of just the recent area (crop done in browser, cached in storage).
* **Agent replies on the sheet:** agents may annotate the human's drawing in place — e.g. a red `ellipse` around a mistake with a `text` label and a `pointer` that follows the explanation — and may speak (§12) while doing it: "look here…". Their ops render live stroke by stroke on the human's screen, so both sides see each other draw.
* **Interactive exercises:** the council can ask the human to draw ("sketch the current path", "draw the force vectors") and then grade the drawing: the moderator posts a `question_to_user` message; the next finished drawing is attached to that question automatically and goes through a short critique → final cycle.
* **Privacy/perf:** streaming only while the tab is visible; coalesce points (drop points closer than 2 px); keep per-sheet ops under control by compacting finished strokes server-side (merge chunks into one op).

Acceptance additions: (13) while a human draws continuously for 10 s, a watching fake agent receives ≥ 3 inbox updates containing new ops and its `board_event` arrives within 3 s after the pen stops; (14) `?fresh=1` returns a PNG containing a stroke drawn 2 s earlier; (15) an agent's red ellipse annotation appears on the human's screen within one poll interval.

---

## 15. Agents produce files of any kind into a shared folder

Agents are not limited to text and drawings: they must be able to **create any kind of file** (code, scripts, CSV/XLSX, PDF/DOCX reports, images, SVG schematics, STL/GLB models, Blender scenes, audio, zips, Jupyter notebooks, KiCad files, …) and drop them into a **folder** that the user can browse and download at any time.

* **Folder model:** every session has a folder tree in bucket `classroom` under `files/<session_id>/`, with virtual subfolders decided by the agents (e.g. `outputs/`, `code/`, `renders/`, `drafts/`, `data/`). `POST /media/begin` from §10.1 accepts an optional `path:"outputs/report.pdf"`; `cr_files.path` stores it. `GET /files?session_id=&path=` lists a folder; `POST /files/mkdir`, `POST /files/move`, `POST /files/delete` (author or admin only).
* **Dropbox mirror:** the whole folder tree is mirrored 1:1 into `/AI-CLASSROOM/<session>/files/…` by `tools/mirror.js` / `GET /export` (§9), so the user also sees everything in Dropbox.
* **UI:** a **📁 Files** panel (tree view with folder icons, type icons, size, author colour chip, created time, download button, "open on sheet" for images/videos, "preview" for text/code/markdown/pdf/csv). New files pop in live with a short highlight; a counter badge on the panel tab. The user can create folders, upload into them, rename and delete.
* **Agent recipe (put in the agent prompt):** "Create the file in your sandbox with whatever tool you have (python-docx, openpyxl, reportlab/pandoc for PDF, matplotlib for plots, blender, ffmpeg, zip …), then upload it with the 3-step protocol into a sensible subfolder and mention it in your note with its name and path. Prefer open formats (.md, .csv, .svg, .pdf, .glb). Never paste file contents into chat when a file is the better answer." Every role may do this; the scribe keeps `outputs/README.md` up to date with a one-line description of each produced file.
* **Project mode (§13 `/project`)** uses this folder as the project workspace: the checklist links to files, and the council can be asked "package everything as a zip" → `outputs/project.zip`.

Acceptance addition: (16) the fake council's calculator stub creates a `.csv` and a `.png` plot, uploads them into `outputs/`, they appear in the Files panel within one poll and in the Dropbox mirror after `tools/mirror.js` runs.

---

## 16. What you must hand back to me when you are done (final message format)

Your last message to me must contain, in this order, nothing else first:

1. **Classroom URL** — the GitHub Pages link, opening directly into a working session (`https://<user>.github.io/ai-classroom/`).
2. **API URL** and where the admin key is stored (not the key itself in plain chat if avoidable; put it in `docs/DEPLOY.md` or tell me the env var).
3. **The agent prompt, complete and ready to paste**, as one code block. It must be fully self-contained: the API URL baked in, the claim command, the blocking wait loop, all 10 role cards, the drawing cheat-sheet, the file-upload recipe, the Blender recipe, voice rules, voting rule, memory rules and the no-model-disclosure guardrail. An agent that receives only this text must be able to: `claim` → learn its seat and role from the response → start working with no further instructions from me. Also host the same text at `GET /prompt` and in `docs/AGENT_PROMPT.md`.
4. **One-line startup instruction per seat** I can paste after the prompt if I want to force a role (e.g. `Claim seat 9 (illustrator) with name "Pixel"`), plus what to say to restart a stalled agent ("continue the loop").
5. **Test report** — which of the acceptance tests 1–16 passed, how, and which did not (and why).
6. **Known limitations and next steps**, and the exact commands to redeploy frontend, function and schema.

If anything is not finished, say so plainly; a shorter honest report beats a longer embellished one.
