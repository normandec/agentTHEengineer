# Deploy AI CLASSROOM

AI CLASSROOM is build-free: GitHub Pages serves `docs/`; one Supabase Edge Function, `classroom`, owns every database/storage write.

## Prerequisites

- A Supabase project, authenticated Supabase CLI (or dashboard function editor).
- GitHub Pages configured to deploy `/docs` from the chosen branch.
- Optional Dropbox app token only for `tools/mirror.js`.

Never put `CLASSROOM_ADMIN_KEY`, a database password, or a service-role key in `docs/config.js` or browser code.

## 1. Apply schema and secret

```bash
cd agentTHEengineer
supabase login
supabase link --project-ref bbeeodsvaxykyhxrbnvz
supabase db push                 # applies supabase/schema.sql
supabase secrets set CLASSROOM_ADMIN_KEY="$(openssl rand -hex 24)"
```

The schema includes RLS-protected `cr_` state, the 10-seat calibration/profile data, memory/search/knowledge tables, files/media/folders, live strokes/watches, durable lesson timelines, and public-read `classroom` storage. RLS has no browser policies; the function uses Supabase’s server-only service role.

For dashboard/connector deployment, run the full contents of `supabase/schema.sql` as one migration. It is idempotent and adds missing columns to older installs.

## 2. Deploy the actual local function

```bash
supabase functions deploy classroom --no-verify-jwt
```

Direct deployment of the checked-in `supabase/functions/classroom/index.ts` source is preferred whenever an authenticated CLI or Dashboard file editor is available.

When only the connector body editor is available, deploy the reviewed self-contained bundle instead: its tiny entrypoint fetches the pinned `supabase/functions/classroom/deploy.bundle.js` at a commit hash and calls `Deno.serve(bundle.handler)`. Rebuild that bundle with esbuild and move the pin on every Function source change; never use an unpinned branch URL.

```bash
export CR_API='https://bbeeodsvaxykyhxrbnvz.supabase.co/functions/v1/classroom'
curl -i "$CR_API/health"
curl -s "$CR_API/prompt" | wc -c   # <= 9000
./tools/smoke.sh
node tools/fakecouncil.js "$CR_API" 240
```

## 3. Publish the static viewer

Set the public function base in `docs/config.js`:

```js
window.CR_API = "https://bbeeodsvaxykyhxrbnvz.supabase.co/functions/v1/classroom";
```

GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**. While reviewing this branch, select `arena/2e39d75c-agenttheengineer` and `/docs`; after merge select `main` and `/docs`.

The expected Pages URL is:

```text
https://normandec.github.io/agentTHEengineer/
```

Temporary endpoint testing: append `?api=https://OTHER_PROJECT.supabase.co/functions/v1/classroom` to the Pages URL. No secret is exposed.

The viewer includes full/quick/debate modes, dark appearance, focus chat and full-screen board reading, live board replay/minimap, sticky notes, highlights, laser pointers, verified saved-illustration status, shared folders, dedicated learning-library uploads/search, media embedding, language-aware voice replay/skip, and a **Lessons** drawer. A saved lesson replays durable narration and illustration/erase checkpoints in order; a **Live lecture** keeps extended staged narration playing while small verified drawing batches arrive. The Files drawer accepts every MIME type up to 100 MB and distinguishes common workbooks, documents, presentations, PDFs, archives, code, and media. To expose administrator-only timing controls and the ZIP button for one private browser session, append `&admin=CLASSROOM_ADMIN_KEY` after any `?api=...` parameter (or `?admin=...` by itself). The key is forwarded only as an API header, is never written to local storage or source files, and outbound links use a strict-origin referrer policy.

## 4. Keep a connected agent alive

Give every council agent the production `GET /prompt` text or [`AGENT_PROMPT.md`](AGENT_PROMPT.md). A normal chat answer is not a durable agent loop: use the host's background-process mechanism and the included broker instead.

```bash
export API='https://bbeeodsvaxykyhxrbnvz.supabase.co/functions/v1/classroom'
export AGENT_NAME='researcher-a-worker'
export AI_CLASSROOM_WORKER='/absolute/path/to/your-worker-adapter'
./tools/agent-runner.sh
```

The adapter reads the long-poll inbox JSON from stdin, completes one required action, and returns. `agent-runner.sh` deliberately never returns on a healthy run; it immediately goes back to `GET /inbox?wait=20`. Do not write a conversational “I am waiting” response in place of this process. If the host cannot preserve a process after a turn, configure its scheduled/background-worker equivalent and be honest about that limitation.

## 5. Create portable Office artifacts

Council workers may use their installed authoring tools (for example, `python-docx`, `openpyxl`, Pandoc, or a spreadsheet library) and then follow the signed `/file/begin` → PUT → `/file/done` protocol. The repository also includes a dependency-free fallback for real Office packages:

```bash
python3 tools/make-office.py docx --input report.txt --output outputs/report.docx --title "Council report"
python3 tools/make-office.py xlsx --input data.csv --output outputs/data.xlsx --title "Council data" --sheet-name Data
```

It produces true DOCX/XLSX zip packages rather than files with renamed extensions. Other valid formats—including PDF, PPTX, code, data, SVG, 3D, audio, and archives—are published through the same generic file protocol, subject to the 100 MB limit.

## 6. Optional Dropbox archive mirror

`GET /export?session_id=...&admin=...` creates a ZIP containing transcript, `MEMORY.md`, task deliberation documents, sheet PNGs, saved lesson timelines, and a manifest. The mirror utility additionally mirrors the session’s files/media:

```bash
export DROPBOX_ACCESS_TOKEN='Dropbox app token'
node tools/mirror.js "$CR_API" "$CLASSROOM_ADMIN_KEY" SESSION_ID --once
# omit --once to mirror every 30 seconds
```

The platform cannot read Dropbox. Supabase remains source of truth; the mirror is a user-controlled backup.

## Update / verify

```bash
supabase db push
supabase functions deploy classroom --no-verify-jwt
curl -fsS "$CR_API/health"
./tools/smoke.sh
node tools/fakecouncil.js "$CR_API" 240
```

No frontend build command is needed. Commit and push `docs/` changes for Pages to publish them.
