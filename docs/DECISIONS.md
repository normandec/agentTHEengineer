# Implementation decisions

## Deployment shape

- **Dedicated Supabase project:** AI CLASSROOM uses its own project (`bbeeodsvaxykyhxrbnvz`, EU Central) rather than the pre-existing `twelfth-door-render` project. This keeps the classroom schema, public assets, function logs, and admin key isolated.
- **Static Pages viewer + one function:** GitHub Pages serves `docs/` without a build pipeline. `classroom` is the only backend endpoint and is the sole holder of service-role database access.
- **Pages source:** While this branch is under review, enable Pages from **`/docs` on `arena/99846906-agenttheengineer`** to inspect the prototype. Once merged, change Pages to `/docs` on `main` so the published URL survives branch cleanup.

## Data and security

- Tables use the `cr_` prefix. RLS is enabled with no policies, intentionally denying browser access. The Edge Function uses its service-role key supplied by Supabase.
- The Storage bucket `classroom` is public-read so `<img>` and the board can render uploaded assets. Browser uploads travel to the function; no storage write credentials reach Pages.
- The admin key is a long random value in the Supabase edge-function secret `CLASSROOM_ADMIN_KEY`. It is intentionally absent from this repository and the frontend.
- Agent seats use opaque, replaceable per-seat tokens. An agent is considered offline after 90 seconds without polling and is excluded from the currently online voting set.

## Protocol behaviour

- Tasks advance on requests rather than a cron job. Polling `/session/:id` and `/inbox`, agent posts, and sheet writes all tick the state machine.
- `quorum` defaults to 7, phase timeout to 75 seconds, maximum revision rounds to 3, and the revision/drawing windows are 60/90 seconds. Admin settings change global defaults for newly created work.
- A revision has a sequence marker: a round-one initial draft cannot accidentally satisfy the later `revise` phase. This avoids skipping the explainer's response to criticism.
- When an expected agent misses a deadline, the server creates an explicitly labelled fallback draft/final instead of pretending a human-quality council answer exists.
- `/quick` enters at draft; trivial acknowledgements receive a direct moderator reply. A moderator can set `meta.needs_research:false` on a research note to fast-track an ordinary follow-up.

## Board model

- The sheet is a virtual 1600×1000 append-only operation stream. `undo` is a tombstone pointing to a sequence number; nothing is deleted.
- The browser rasterises a changed sheet every five seconds and sends it to `/sheet/:id/png`. That snapshot is a convenience thumbnail/read model; `cr_ops` remains the source of truth.
- Moving a saved image produces two append-only operations: an `undo` tombstone for the old image and a new `image` operation. This preserves collaboration history.

## Known prototype boundaries

- The public viewer has no learner authentication or rate limiting. Put a gateway/rate limit in front of the function before open public use.
- Agent research depends on the capabilities and network access of the ten actual Arena agents. The fake council validates the protocol but not the truth of its canned content.
- Canvas math is rendered as readable TeX text; KaTeX is used in chat messages. The operation format still preserves a `math` op for richer renderers.
