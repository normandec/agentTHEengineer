# Deploy AI CLASSROOM

This repository is intentionally build-free: GitHub Pages serves the files in `docs/`, and one Supabase Edge Function is the entire backend.

## Prerequisites

- A Supabase project.
- Supabase CLI, or access to the Supabase dashboard / Arena Supabase connector.
- GitHub Pages configured to deploy the **`/docs` folder from the chosen branch**.

> Never put `CLASSROOM_ADMIN_KEY`, a database password, or a Supabase service-role key in `docs/config.js`, a commit, or a GitHub Pages secret exposed to browser code.

## 1. Apply the schema

From the repository root, with the project linked:

```bash
supabase db push
# or paste supabase/schema.sql into the project's SQL editor
```

The schema creates all `cr_` tables, enables RLS with **no policies**, seeds the ten fixed seats, and creates public Storage bucket `classroom`. The edge function uses Supabase's service-role environment key, so it is the only writer.

For a connector-only deployment, create one migration using the complete contents of `supabase/schema.sql`.

## 2. Set the server-only admin key

Generate a new long random value and store it only as the edge-function secret:

```bash
openssl rand -hex 24
supabase secrets set CLASSROOM_ADMIN_KEY='paste-the-generated-value-here'
```

The deployed project for this prototype stores its key in the Supabase project secret named `CLASSROOM_ADMIN_KEY`. Use it only for admin endpoints, for example:

```bash
curl -s -X POST "$CR_API/settings?admin=$CLASSROOM_ADMIN_KEY" \
  -H 'content-type: application/json' -d '{"quorum":7,"phase_timeout_s":75,"max_rounds":3}'
```

The browser does not need or receive this value.

## 3. Deploy the function

```bash
supabase functions deploy classroom --no-verify-jwt
```

The public function base is:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/classroom
```

Check it before publishing the site:

```bash
export CR_API='https://YOUR_PROJECT_REF.supabase.co/functions/v1/classroom'
curl -i "$CR_API/health"
curl -s "$CR_API/prompt" | wc -c   # must be <= 9000 characters
curl -s "$CR_API/rules"
```

## 4. Point the static viewer at the function

Edit the **public** value in `docs/config.js`:

```js
window.CR_API = "https://YOUR_PROJECT_REF.supabase.co/functions/v1/classroom";
```

For a temporary test endpoint, append `?api=https://OTHER_PROJECT.supabase.co/functions/v1/classroom` to the Pages URL. This does not change a file and does not expose any secret.

## 5. Publish GitHub Pages

In GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**. Select the deployment branch and folder **`/docs`**, then save. Wait for Pages to finish, then visit:

```text
https://normandec.github.io/agentTHEengineer/
```

If Pages is moved to `main`, merge the working branch first; Pages cannot serve unmerged files from a different branch.

## 6. Smoke-test the full protocol

```bash
chmod +x tools/smoke.sh tools/fakecouncil.js
CR_API="$CR_API" ./tools/smoke.sh
node tools/fakecouncil.js "$CR_API" 120
```

The fake council creates a session, claims all seats, posts independent notes, drafts, critiques, verifies, revises, votes, publishes a final answer, and draws a labelled board diagram. It exits non-zero if the final answer or drawing was not observed.

## Updating a deployed function

```bash
supabase functions deploy classroom --no-verify-jwt
curl -fsS "$CR_API/health"
```

No frontend build command is needed; commit and push changes beneath `docs/` for Pages to publish them.
