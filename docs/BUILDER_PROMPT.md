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
