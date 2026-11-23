// supabase/functions/classroom/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
var SUPA_URL = Deno.env.get("SUPABASE_URL") ?? "";
var SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
var ADMIN_KEY = Deno.env.get("CLASSROOM_ADMIN_KEY") ?? "";
var sb = createClient(SUPA_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});
var VERSION = "1.0.0";
var DEFAULTS = { quorum: 7, phase_timeout_s: 75, max_rounds: 3, draw_timeout_s: 90, revise_timeout_s: 60 };
var ONLINE_WINDOW_MS = 9e4;
var AGENT_PROMPT = '# AI CLASSROOM agent operating prompt\n\nYou are one of ten AI CLASSROOM council members. Your mission is to help a learner with honest, sourced, understandable work. Research independently, challenge weak claims, show uncertainty, and do not invent sources. **Never name, guess, hint at, or consult public leaderboards about your model or vendor.** Standing comes only from the classroom calibration and track record.\n\nAPI: `https://bbeeodsvaxykyhxrbnvz.supabase.co/functions/v1/classroom`\n\n## Start once\n\n```bash\nexport API=\'https://bbeeodsvaxykyhxrbnvz.supabase.co/functions/v1/classroom\'\nR=$(curl -s -X POST "$API/claim" -H \'content-type: application/json\' -d \'{"name":"YOUR-UNIQUE-NAME"}\')\necho "$R"; TOKEN=$(echo "$R" | sed -n \'s/.*"token":"\\([^"]*\\)".*/\\1/p\')\n```\n\nYour first inbox normally says `needed:"calibrate"`. Answer its 15 blind mini-questions exactly once:\n`POST /calibrate` with `{"answers":[{"id":"...","answer":"..."}],"strengths":["..."],"weaknesses":["..."]}` and header `x-seat-token: $TOKEN`. Strengths are optional weak priors; do not use names of models/vendors. Then work forever. If any call returns 401, claim again with the same name.\n\n## Blocking wait loop \u2014 use this, do not hand-poll\n\n```bash\n# wait up to 25 min; prints the inbox JSON the moment it is my turn\nfor i in $(seq 1 500); do\n  R=$(curl -s -H "x-seat-token: $TOKEN" "$API/inbox?since=$SEQ")\n  echo "$R" | grep -q \'"your_turn":true\' && { echo "$R"; break; }\n  sleep 3\n done\n```\n\nPrefer the server long poll: `R=$(curl -s -H "x-seat-token: $TOKEN" "$API/inbox?wait=20&since=$SEQ&sheet_seq=$SSEQ")`; loop it with `sleep 1`. Also wake when `"wake":true`. It means your turn, a user message, or a completed human drawing arrived. Each inbox is a small delta; update `SEQ` from `since_last`. If idle, let the shell wait; do not spend reasoning/context watching it.\n\nRead `memory` first. Never request the full transcript: use `GET /search?session_id=...&q=...`, then `GET /transcript?session_id=...&from=&to=` (max 40). Quote `seq` when relying on past work. Read attached files from `context.files`, text with `/file/ID/text?from=`, or binary URLs. Knowledge-base excerpts outrank web sources and are cited `[file.pdf p.12]`.\n\n## Post formats\n\nUse `POST /say` with the seat-token header and `{task_id,kind,body,meta}`. Include `round`. Limits: note 1200, objection 1500, verify 3000, vote 300, draft 6000, final 9000, speak 1200 characters. Votes have `meta:{approve:boolean,reason}`; verifier has `meta:{claims:[{claim,verdict:"ok|wrong|unsure",source}]}`. Status is concise (`kind:"status"`) while rendering. If you made a sizable artifact, upload it \u2014 do not paste it into chat.\n\n## Roles\n\n1. **Moderator:** decompose into 2\u20134 subquestions and `meta.domains` (math, code, physics, humanities, language); coordinate the lead seat shown in inbox. Final is Markdown with Sources, Confidence, and visible Council notes for disagreement. Read a three-sentence summary with `kind:"speak"` when sound is useful.\n2. **Researcher A:** primary sources and exact facts, one sourced note.\n3. **Researcher B:** independent angle and sources; never copy A.\n4. **Researcher C:** counter-evidence, edge cases, misconceptions.\n5. **Explainer:** clear draft/revision at learner level. Address every objection and wrong/unsure verification.\n6. **Critic:** at least one concrete fixable objection or explicitly say what you checked and found no objection. Do not speak objections.\n7. **Verifier:** claim-by-claim source table; inspect KB first.\n8. **Calculator:** recompute every number/unit/formula. Backup illustrator for sandbox media work.\n9. **Illustrator:** read PNG/ops first, preserve user marks, then diagram/annotate; may watch a requested sheet with `POST /watch {sheet_id,on:true}`.\n10. **Scribe:** concise context notes; after every final, `POST /memory {session_id,body}` (\u22642500 chars: known user level, settled facts, open questions, sheet ids/descriptions). Keep output README files current.\n\n## Board card\n\nVirtual sheet is 1600\xD71000. Exact base ops are `line, arrow, rect, ellipse, path, text, math, image, erase, clear, group`, plus tombstone `undo:{seq}`. Use `POST /draw {sheet_id,ops}` (\u226460/batch, \u2264200 hard limit). Give a title \u226528px, labels \u226520px, left-to-right flow, and keep bottom-right 400\xD7250 clear for the human. Use #17a2b8 by default as illustrator. Never clear unless asked. Read `GET /sheet/ID/ops?since=0` and PNG first. Human drawing wakes watchers; respond usefully, and annotate errors with a red ellipse/text only where warranted.\n\n## Files and media card\n\nAny seat can publish a file up to 100 MB: `POST /file/begin {session_id,name,mime,bytes,path:"outputs/name.ext",learned?}`; PUT bytes to returned `upload_url` with returned headers; then `POST /file/done {file_id}`. Media is identical at `/media/begin` and `/media/done`; include `sheet_id`, caption, optional poster, and it becomes video/image/model3d on the sheet. Prefer .md/.csv/.svg/.pdf/.glb. For Blender: make scenes by script, render \u226410s / \u22642 CPU minutes, post status every ~30s, save a poster PNG, upload MP4 + poster, and state parameters. For a user .blend, download, inspect via bpy, render before claiming you saw it.\n\n## Voice and vote\n\nUse `speak` only for short helpful narration/status when sound is enabled; moderator summarizes final, explainer may narrate a drawing. Respect `/mute`. Approve only what you would stake your reputation on. Reject only with a concrete fix. All online seats normally must approve. At max rounds, weighted track-record voting breaks the tie but disagreement remains visible.\n\n## Worked cycle\n\nResearcher A sees research/needed note, retrieves memory + KB, posts a \u22641200-character source note. Explainer drafts. Critic names a missing condition; verifier marks that claim unsure; calculator checks units. Explainer revises. Every online seat casts a specific vote. Moderator posts final with sources/confidence, then illustrator draws. Scribe updates memory.\n\nOn errors: retry after 5\u20138s; 409 means wait 30s before claiming. Continue the loop forever.';
var RULES_TEXT = "# AI CLASSROOM rules\n\n1. **Honesty comes before fluency.** The council cites what it used, labels uncertainty, and never invents a source.\n2. **A substantive answer earns its way out.** The normal path is research \u2192 draft \u2192 critique and verification \u2192 revision \u2192 vote \u2192 final \u2192 drawing.\n3. **Disagreement stays visible.** A vote can reject an answer only for a specific, fixable reason. After the maximum revision rounds, remaining disagreement is shown under **Council notes**, not silently removed.\n4. **Confidence is mandatory.** Every council answer ends with `Confidence: high`, `medium`, or `low` and explains why.\n5. **The board belongs to both sides.** Preserve human marks, read existing marks before adding agent art, label diagrams, and never clear the sheet unless the human explicitly asks.\n6. **Evidence is not a guarantee.** Deliberation reduces mistakes; it cannot eliminate them. Check important decisions against the linked primary sources and consult qualified professionals for medical, legal, financial, or safety-critical matters.\n7. **No hidden player account.** This prototype does not ask learners to sign in. The edge function is the only service allowed to write the protected database and storage bucket.";
var CALIBRATION_POOL = [{ "id": "math-01", "domain": "math", "q": "What is 7 \xD7 8?", "answer": "56" }, { "id": "math-02", "domain": "math", "q": "What is 15% of 200?", "answer": "30" }, { "id": "math-03", "domain": "math", "q": "Solve 3x + 2 = 14. What is x?", "answer": "4" }, { "id": "math-04", "domain": "math", "q": "What is the derivative of x squared?", "answer": "2x" }, { "id": "math-05", "domain": "math", "q": "What is the area of a circle of radius 3, in terms of pi?", "answer": "9pi" }, { "id": "math-06", "domain": "math", "q": "What is 2 to the power of 10?", "answer": "1024" }, { "id": "math-07", "domain": "math", "q": "What is the median of 1, 3, 5, 9, 11?", "answer": "5" }, { "id": "math-08", "domain": "math", "q": "What is the square root of 144?", "answer": "12" }, { "id": "math-09", "domain": "math", "q": "Simplify 6/8.", "answer": "3/4" }, { "id": "math-10", "domain": "math", "q": "What is 0.25 as a fraction in simplest form?", "answer": "1/4" }, { "id": "math-11", "domain": "math", "q": "If a = 5 and b = 2, what is a squared minus b squared?", "answer": "21" }, { "id": "math-12", "domain": "math", "q": "How many degrees are in the interior angles of a triangle?", "answer": "180" }, { "id": "code-01", "domain": "code", "q": "In JavaScript, what does === compare in addition to value?", "answer": "type" }, { "id": "code-02", "domain": "code", "q": "What is the time complexity of binary search on a sorted array?", "answer": "log n" }, { "id": "code-03", "domain": "code", "q": "What keyword declares an immutable binding in JavaScript?", "answer": "const" }, { "id": "code-04", "domain": "code", "q": "Which HTTP status means Not Found?", "answer": "404" }, { "id": "code-05", "domain": "code", "q": "What Git command shows the working tree status?", "answer": "git status" }, { "id": "code-06", "domain": "code", "q": "What data structure uses FIFO order?", "answer": "queue" }, { "id": "code-07", "domain": "code", "q": "What is JSON short for?", "answer": "javascript object notation" }, { "id": "code-08", "domain": "code", "q": "What does SQL SELECT do?", "answer": "retrieve data" }, { "id": "code-09", "domain": "code", "q": "What JavaScript method converts a JSON string to an object?", "answer": "json.parse" }, { "id": "code-10", "domain": "code", "q": "What is a base case used for in recursion?", "answer": "stop recursion" }, { "id": "code-11", "domain": "code", "q": "Which symbol begins a single-line comment in Python?", "answer": "#" }, { "id": "code-12", "domain": "code", "q": "What does API stand for?", "answer": "application programming interface" }, { "id": "physics-01", "domain": "physics", "q": "What SI unit measures force?", "answer": "newton" }, { "id": "physics-02", "domain": "physics", "q": "What is voltage equal to in Ohm's law?", "answer": "current times resistance" }, { "id": "physics-03", "domain": "physics", "q": "What is the SI unit of electrical resistance?", "answer": "ohm" }, { "id": "physics-04", "domain": "physics", "q": "What does a capacitor store?", "answer": "electric charge" }, { "id": "physics-05", "domain": "physics", "q": "What is the speed of light in vacuum approximately in m/s?", "answer": "3e8" }, { "id": "physics-06", "domain": "physics", "q": "What law says energy cannot be created or destroyed?", "answer": "conservation of energy" }, { "id": "physics-07", "domain": "physics", "q": "What is frequency measured in?", "answer": "hertz" }, { "id": "physics-08", "domain": "physics", "q": "What direction does conventional current flow outside a source?", "answer": "positive to negative" }, { "id": "physics-09", "domain": "physics", "q": "What device changes AC voltage using magnetic induction?", "answer": "transformer" }, { "id": "physics-10", "domain": "physics", "q": "What is power in watts equal to for a DC circuit?", "answer": "voltage times current" }, { "id": "physics-11", "domain": "physics", "q": "What is the approximate acceleration due to gravity on Earth in m/s squared?", "answer": "9.8" }, { "id": "physics-12", "domain": "physics", "q": "What is the SI unit of energy?", "answer": "joule" }, { "id": "humanities-01", "domain": "humanities", "q": "In which century did the French Revolution begin?", "answer": "18th" }, { "id": "humanities-02", "domain": "humanities", "q": "Who wrote Romeo and Juliet?", "answer": "shakespeare" }, { "id": "humanities-03", "domain": "humanities", "q": "What document begins with 'We the People' in the United States?", "answer": "constitution" }, { "id": "humanities-04", "domain": "humanities", "q": "What is the study of past human events called?", "answer": "history" }, { "id": "humanities-05", "domain": "humanities", "q": "Which civilization built Machu Picchu?", "answer": "inca" }, { "id": "humanities-06", "domain": "humanities", "q": "What movement emphasized reason in eighteenth-century Europe?", "answer": "enlightenment" }, { "id": "humanities-07", "domain": "humanities", "q": "What is a primary source in history?", "answer": "firsthand evidence" }, { "id": "humanities-08", "domain": "humanities", "q": "Who painted the Mona Lisa?", "answer": "leonardo da vinci" }, { "id": "humanities-09", "domain": "humanities", "q": "What is democracy?", "answer": "government by the people" }, { "id": "humanities-10", "domain": "humanities", "q": "What ancient writing system used wedge-shaped marks?", "answer": "cuneiform" }, { "id": "humanities-11", "domain": "humanities", "q": "What is a constitution?", "answer": "fundamental law" }, { "id": "humanities-12", "domain": "humanities", "q": "What term means a system of beliefs about knowledge and reality?", "answer": "philosophy" }, { "id": "language-01", "domain": "language", "q": "What is the past tense of 'go'?", "answer": "went" }, { "id": "language-02", "domain": "language", "q": "What punctuation ends a direct question?", "answer": "question mark" }, { "id": "language-03", "domain": "language", "q": "What is a synonym for concise?", "answer": "brief" }, { "id": "language-04", "domain": "language", "q": "What is the subject in 'The council checks sources'?", "answer": "the council" }, { "id": "language-05", "domain": "language", "q": "What part of speech is 'carefully' in 'read carefully'?", "answer": "adverb" }, { "id": "language-06", "domain": "language", "q": "What does an em dash often indicate in prose?", "answer": "a break" }, { "id": "language-07", "domain": "language", "q": "What is the plural of analysis?", "answer": "analyses" }, { "id": "language-08", "domain": "language", "q": "Which is standard English: 'fewer errors' or 'less errors'?", "answer": "fewer errors" }, { "id": "language-09", "domain": "language", "q": "What does 'cite' mean in academic writing?", "answer": "give a source" }, { "id": "language-10", "domain": "language", "q": "What is an active-voice subject doing?", "answer": "performing the action" }, { "id": "language-11", "domain": "language", "q": "What is a paragraph's topic sentence for?", "answer": "state the main idea" }, { "id": "language-12", "domain": "language", "q": "What is the antonym of ambiguous?", "answer": "clear" }];
var DOMAINS = ["math", "code", "physics", "humanities", "language"];
var MAX_FILE_BYTES = 100 * 1024 * 1024;
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "content-type,x-seat-token,x-admin-key,authorization"
};
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "content-type": "application/json; charset=utf-8" }
  });
}
var text = (body, status = 200) => new Response(body, { status, headers: { ...CORS, "content-type": "text/plain; charset=utf-8" } });
var err = (msg, status = 400) => json({ error: msg }, status);
function routePath(url) {
  const segs = url.pathname.split("/").filter(Boolean);
  while (segs.length && ["functions", "v1", "classroom"].includes(segs[0])) segs.shift();
  return segs;
}
function nowISO() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function isoIn(seconds) {
  return new Date(Date.now() + seconds * 1e3).toISOString();
}
function onlineSince() {
  return new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();
}
var trim = (s, n) => String(s ?? "").slice(0, n);
async function getSettings() {
  try {
    const { data } = await sb.from("cr_settings").select("value").eq("key", "global").maybeSingle();
    return { ...DEFAULTS, ...data?.value ?? {} };
  } catch {
    return { ...DEFAULTS };
  }
}
async function putSettings(patch) {
  const cur = await getSettings();
  const next = { ...cur, ...patch };
  await sb.from("cr_settings").upsert({ key: "global", value: next });
  return next;
}
async function insertMessage(row) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data: maxRow } = await sb.from("cr_messages").select("seq").eq("session_id", row.session_id).order("seq", { ascending: false }).limit(1).maybeSingle();
    const seq = (maxRow?.seq ?? 0) + 1;
    const { data, error } = await sb.from("cr_messages").insert({ ...row, seq }).select().single();
    if (!error) return data;
    if (error.code !== "23505") {
      console.error("insertMessage", error);
      return null;
    }
  }
  return null;
}
async function insertOps(sheetId, author, ops) {
  const inserted = [];
  for (const op of ops) {
    for (let attempt = 0; attempt < 4; attempt++) {
      const { data: maxRow } = await sb.from("cr_ops").select("seq").eq("sheet_id", sheetId).order("seq", { ascending: false }).limit(1).maybeSingle();
      const seq = (maxRow?.seq ?? 0) + 1;
      const { data, error } = await sb.from("cr_ops").insert({ sheet_id: sheetId, seq, author, op }).select().single();
      if (!error) {
        inserted.push(data);
        break;
      }
      if (error.code !== "23505") {
        console.error("insertOps", error);
        return inserted;
      }
    }
  }
  return inserted;
}
var OP_TYPES = /* @__PURE__ */ new Set(["line", "arrow", "rect", "ellipse", "path", "text", "math", "image", "erase", "clear", "group", "undo", "video", "model3d", "pointer", "note", "highlight"]);
var num = (v, d = 0) => typeof v === "number" && isFinite(v) ? v : d;
var col = (v, d = "#111") => typeof v === "string" && /^#[0-9a-fA-F]{3,8}$|^rgba?\(|^[a-z]+$/.test(v) ? v : d;
var str = (v, d = "") => typeof v === "string" ? v : d;
function sanitizeOp(raw) {
  if (!raw || typeof raw !== "object") return null;
  const t = str(raw.t);
  if (!OP_TYPES.has(t)) return null;
  switch (t) {
    case "line":
    case "arrow":
      return { t, x1: num(raw.x1), y1: num(raw.y1), x2: num(raw.x2), y2: num(raw.y2), w: num(raw.w, 2), c: col(raw.c) };
    case "rect":
      return { t, x: num(raw.x), y: num(raw.y), w: num(raw.w, 100), h: num(raw.h, 60), c: col(raw.c), fill: str(raw.fill, "#fff0"), r: num(raw.r, 6) };
    case "ellipse":
      return { t, cx: num(raw.cx), cy: num(raw.cy), rx: num(raw.rx, 50), ry: num(raw.ry, 30), c: col(raw.c), fill: str(raw.fill, "#fff0") };
    case "path": {
      const pts = Array.isArray(raw.pts) ? raw.pts.slice(0, 2e3).map((p) => Array.isArray(p) ? [num(p[0]), num(p[1])] : null).filter(Boolean) : [];
      if (pts.length < 2) return null;
      return {
        t,
        pts,
        w: num(raw.w, 3),
        c: col(raw.c),
        close: !!raw.close,
        ...str(raw.stroke_id) ? { stroke_id: str(raw.stroke_id).slice(0, 80), part: Math.max(0, Math.floor(num(raw.part, 0))), done: !!raw.done } : {}
      };
    }
    case "text":
      return { t, x: num(raw.x), y: num(raw.y), s: str(raw.s).slice(0, 500), size: num(raw.size, 22), c: col(raw.c), align: ["left", "center", "right"].includes(raw.align) ? raw.align : "left" };
    case "math":
      return { t, x: num(raw.x), y: num(raw.y), tex: str(raw.tex).slice(0, 300), size: num(raw.size, 26) };
    case "image":
      return { t, x: num(raw.x), y: num(raw.y), w: num(raw.w, 400), h: num(raw.h, 300), url: str(raw.url).slice(0, 2e3), poster: str(raw.poster).slice(0, 2e3) || void 0 };
    case "video":
      return { t, x: num(raw.x), y: num(raw.y), w: num(raw.w, 480), h: num(raw.h, 270), url: str(raw.url).slice(0, 2e3), poster: str(raw.poster).slice(0, 2e3) || void 0 };
    case "model3d":
      return { t, x: num(raw.x), y: num(raw.y), w: num(raw.w, 480), h: num(raw.h, 320), url: str(raw.url).slice(0, 2e3), poster: str(raw.poster).slice(0, 2e3) || void 0 };
    case "pointer":
      return { t, x: num(raw.x), y: num(raw.y), who: str(raw.who, "agent").slice(0, 40), c: col(raw.c, "#d7263d"), expires_at: str(raw.expires_at) || isoIn(3) };
    case "note":
      return { t, x: num(raw.x), y: num(raw.y), w: num(raw.w, 220), h: num(raw.h, 140), s: str(raw.s).slice(0, 600), c: col(raw.c, "#f5b301"), fill: str(raw.fill, "#fff5bd") };
    case "highlight":
      return { t, x: num(raw.x), y: num(raw.y), w: num(raw.w, 180), h: num(raw.h, 80), c: col(raw.c, "#f5b301"), alpha: Math.max(0.05, Math.min(0.8, num(raw.alpha, 0.25))) };
    case "erase": {
      const pts = Array.isArray(raw.pts) ? raw.pts.slice(0, 2e3).map((p) => Array.isArray(p) ? [num(p[0]), num(p[1])] : null).filter(Boolean) : [];
      if (pts.length < 1) return null;
      return { t, pts, w: num(raw.w, 30) };
    }
    case "clear":
      return { t: "clear" };
    case "undo":
      return { t: "undo", seq: num(raw.seq, -1) };
    case "group": {
      const inner = Array.isArray(raw.ops) ? raw.ops.slice(0, 100).map(sanitizeOp).filter(Boolean) : [];
      return { t, name: str(raw.name, "group").slice(0, 100), ops: inner };
    }
  }
  return null;
}
async function markStaleSeatsOffline() {
  await sb.from("cr_seats").update({ status: "offline" }).not("token", "is", null).lt("last_seen", onlineSince()).neq("status", "offline");
}
async function getSeats() {
  const { data } = await sb.from("cr_seats").select("*").order("seat");
  return data ?? [];
}
var onlineSeats = (seats) => seats.filter((s) => s.token && s.last_seen && new Date(s.last_seen).getTime() > Date.now() - ONLINE_WINDOW_MS);
async function seatFromToken(req, url) {
  const token = req.headers.get("x-seat-token") ?? url.searchParams.get("token");
  if (!token) return null;
  const { data } = await sb.from("cr_seats").select("*").eq("token", token).maybeSingle();
  return data ?? null;
}
var isAdmin = (url, req) => {
  const key = url.searchParams.get("admin") ?? req.headers.get("x-admin-key") ?? "";
  return !!ADMIN_KEY && key === ADMIN_KEY;
};
async function optionalActor(req, url) {
  const seat = await seatFromToken(req, url);
  return seat ? { seat, author: `Seat ${seat.seat} \xB7 ${seat.role}` } : { seat: null, author: "You" };
}
async function messagesForTask(sessionId, taskId, kind) {
  let q = sb.from("cr_messages").select("*").eq("session_id", sessionId).eq("meta->>task_id", taskId).order("seq");
  if (kind) q = q.eq("kind", kind);
  const { data } = await q;
  return data ?? [];
}
async function latestMessages(sessionId, limit, sinceSeq = 0) {
  let q = sb.from("cr_messages").select("*").eq("session_id", sessionId).order("seq", { ascending: false }).limit(limit);
  if (sinceSeq > 0) q = q.gt("seq", sinceSeq);
  const { data } = await q;
  return (data ?? []).reverse();
}
var URLs_RE = /https?:\/\/[^\s)\]"'<>]+/g;
function extractSources(msgs) {
  const found = /* @__PURE__ */ new Set();
  for (const m of msgs) {
    for (const u of String(m.body ?? "").match(URLs_RE) ?? []) found.add(u.replace(/[.,;]+$/, ""));
    for (const u of Array.isArray(m.meta?.sources) ? m.meta.sources : []) found.add(String(u));
  }
  return [...found].slice(0, 12);
}
var normal = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
function calibrationForSeat(seat) {
  return DOMAINS.flatMap((domain, domainIndex) => {
    const choices = CALIBRATION_POOL.filter((q) => q.domain === domain);
    return [0, 1, 2].map((offset) => choices[(seat * 3 + domainIndex * 2 + offset) % choices.length]);
  });
}
function profileOf(seat) {
  const p = seat?.profile && typeof seat.profile === "object" ? seat.profile : {};
  return { calibrated: !!p.calibrated, calibration: p.calibration || {}, track: p.track || {}, strengths: p.strengths || [], weaknesses: p.weaknesses || [] };
}
function scoreForDomain(seat, domain) {
  const p = profileOf(seat), calibration = Number(p.calibration?.[domain] ?? 0.5), track = Number(p.track?.[domain] ?? 0.5);
  return Math.max(0, Math.min(1, calibration * 0.6 + track * 0.4));
}
function domainsForQuestion(question) {
  const q = normal(question);
  const hit = /* @__PURE__ */ new Set();
  if (/code|program|javascript|python|api|database|algorithm|git|debug/.test(q)) hit.add("code");
  if (/volt|circuit|physics|force|electron|heat|motor|capacitor|inductor/.test(q)) hit.add("physics");
  if (/math|equation|calculate|percent|probability|algebra|geometry|derivative/.test(q)) hit.add("math");
  if (/history|literature|essay|society|philosophy|politic/.test(q)) hit.add("humanities");
  if (/write|grammar|language|translate|word|explain/.test(q)) hit.add("language");
  return [...hit].length ? [...hit].slice(0, 2) : ["language"];
}
function leadership(seats, domains) {
  const domain = domains?.[0] || "language";
  const ranked = [...seats].filter((s) => s.token).sort((a, b) => scoreForDomain(b, domain) - scoreForDomain(a, domain));
  const weights = {};
  for (const seat of seats) weights[String(seat.seat)] = Number(scoreForDomain(seat, domain).toFixed(3));
  return { domain, lead_seat: ranked[0]?.seat ?? 1, vote_weights: weights };
}
function mutateTrack(profile, domains, delta) {
  const next = profileOf({ profile });
  const track = { ...next.track };
  for (const d of domains?.length ? domains : DOMAINS) {
    const old = Number(track[d] ?? 0.5);
    track[d] = Number(Math.max(0, Math.min(1, old * 0.88 + delta * 0.12)).toFixed(3));
  }
  return { ...next, track };
}
async function sessionMemory(sessionId) {
  const { data } = await sb.from("cr_memory").select("body,updated_at,updated_by").eq("session_id", sessionId).maybeSingle();
  return data ? { ...data, body: trim(data.body, 2500) } : { body: "", updated_at: null, updated_by: null };
}
async function taskFiles(sessionId, taskId) {
  let q = sb.from("cr_files").select("id,name,mime,bytes,pages,text_url,url,path,learned,meta").or(`session_id.eq.${sessionId},session_id.is.null`).is("deleted_at", null).order("created_at", { ascending: false }).limit(12);
  const { data } = await q;
  const attached = data ?? [];
  return attached.map((f) => ({ file_id: f.id, name: f.name, mime: f.mime, bytes: f.bytes, pages: f.pages, text_url: f.text_url, url: f.url, path: f.path, learned: f.learned }));
}
function filePath(sessionId, id, path, name) {
  const clean = (path || "").replace(/^\/+|\.\.(\/|$)/g, "").replace(/[^a-zA-Z0-9._/ -]/g, "_").slice(0, 180);
  const leaf = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "file";
  return `files/${sessionId}/${clean ? clean.replace(/\/$/, "") + "/" : ""}${id}-${leaf}`;
}
function mediaKind(mime, filename) {
  const ext = filename.toLowerCase().split(".").pop() || "";
  if (mime.startsWith("video/") || ["mp4", "webm", "gif"].includes(ext)) return "video";
  if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "svg", "webp"].includes(ext)) return "image";
  if (["glb", "gltf", "stl", "obj"].includes(ext)) return "model3d";
  if (["mp3", "ogg", "wav", "m4a"].includes(ext)) return "audio";
  if (ext === "blend") return "blend";
  return "file";
}
async function createUpload(path) {
  const { data, error } = await sb.storage.from("classroom").createSignedUploadUrl(path);
  if (error || !data?.signedUrl) throw new Error(error?.message || "could not create upload URL");
  return { upload_url: data.signedUrl, headers: { "x-upsert": "false" }, token: data.token };
}
async function objectExists(path) {
  const folder = path.split("/").slice(0, -1).join("/");
  const leaf = path.split("/").pop();
  const { data, error } = await sb.storage.from("classroom").list(folder, { search: leaf, limit: 10 });
  return !error && !!data?.some((x) => x.name === leaf);
}
function chunkText(textIn) {
  const chunks = [];
  let page = 1;
  const pages = String(textIn || "").split(/===\s*page\s+\d+\s*===/i);
  for (const source of pages) {
    const text2 = source.trim();
    for (let at = 0; at < text2.length; at += 1050) {
      const part = text2.slice(at, at + 1200).trim();
      if (part) chunks.push({ text: part, page });
    }
    page++;
  }
  return chunks.slice(0, 400);
}
async function indexKnowledge(file, extracted) {
  await sb.from("cr_knowledge").delete().eq("file_id", file.id);
  const chunks = chunkText(extracted).map((c, index) => ({ session_id: file.session_id, file_id: file.id, chunk_no: index, page: c.page, text: c.text }));
  if (chunks.length) await sb.from("cr_knowledge").insert(chunks);
  return chunks.length;
}
function bboxOf(op) {
  const pts = op?.pts || [];
  const xs = pts.map((p) => Number(p[0]) || 0), ys = pts.map((p) => Number(p[1]) || 0);
  if (!xs.length) return [0, 0, 0, 0];
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
}
async function humanSheetState(sheetId, seenSeq = 0) {
  const [{ data: sheet }, { data: live }, { count }] = await Promise.all([
    sb.from("cr_sheets").select("state").eq("id", sheetId).maybeSingle(),
    sb.from("cr_live_strokes").select("op,bbox,updated_at").eq("sheet_id", sheetId).order("updated_at", { ascending: false }).limit(4),
    sb.from("cr_ops").select("*", { count: "exact", head: true }).eq("sheet_id", sheetId).gt("seq", seenSeq)
  ]);
  const state = sheet?.state || {};
  const latest = live?.[0];
  return { drawing: !!latest && Date.now() - new Date(latest.updated_at).getTime() < 1400, last_stroke_at: state.last_stroke_at || latest?.updated_at || null, new_ops_since_you_looked: count || 0, bbox_of_recent: state.bbox_of_recent || latest?.bbox || null, pointer: state.pointer || null, recent: (live || []).map((x) => x.op) };
}
function crc32(bytes) {
  let c = ~0;
  for (const b of bytes) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = c >>> 1 ^ 3988292384 & -(c & 1);
  }
  return ~c >>> 0;
}
function le(n, size) {
  const out = new Uint8Array(size);
  for (let i = 0; i < size; i++) out[i] = n >>> 8 * i & 255;
  return out;
}
function zipStore(entries) {
  const encoder = new TextEncoder();
  const chunks = [];
  const records = [];
  let offset = 0;
  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const crc = crc32(entry.bytes);
    const header = new Uint8Array([80, 75, 3, 4, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...le(crc, 4), ...le(entry.bytes.length, 4), ...le(entry.bytes.length, 4), ...le(name.length, 2), 0, 0]);
    chunks.push(header, name, entry.bytes);
    records.push({ name, crc, size: entry.bytes.length, offset });
    offset += header.length + name.length + entry.bytes.length;
  }
  const start = offset;
  for (const r of records) {
    const h = new Uint8Array([80, 75, 1, 2, 20, 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...le(r.crc, 4), ...le(r.size, 4), ...le(r.size, 4), ...le(r.name.length, 2), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...le(r.offset, 4)]);
    chunks.push(h, r.name);
    offset += h.length + r.name.length;
  }
  chunks.push(new Uint8Array([80, 75, 5, 6, 0, 0, 0, 0, ...le(records.length, 2), ...le(records.length, 2), ...le(offset - start, 4), ...le(start, 4), 0, 0]));
  const result = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let at = 0;
  for (const c of chunks) {
    result.set(c, at);
    at += c.length;
  }
  return result;
}
async function emitFinishedDrawingEvents(sessionId) {
  const { data: sheets } = await sb.from("cr_sheets").select("*").eq("session_id", sessionId);
  for (const sheet of sheets || []) {
    const s = sheet.state || {};
    const finished = s.finished_at ? new Date(s.finished_at).getTime() : 0;
    if (finished && !s.event_emitted && Date.now() - finished >= 2e3) {
      await insertMessage({ session_id: sessionId, role: "system", author: "Board", kind: "board_event", body: `User finished a drawing on sheet ${sheet.idx} (${s.stroke_count || 1} stroke${Number(s.stroke_count) === 1 ? "" : "s"}, region ${s.region || "sheet"}).`, meta: { sheet_id: sheet.id, human_finished: true, bbox: s.bbox_of_recent || null } });
      await sb.from("cr_sheets").update({ state: { ...s, event_emitted: true } }).eq("id", sheet.id);
    }
  }
}
async function advanceTask(task) {
  const settings = await getSettings();
  await markStaleSeatsOffline();
  let current = task;
  for (let hops = 0; hops < 6; hops++) {
    if (["done", "failed"].includes(current.phase)) return current;
    const seats = await getSeats();
    const online = onlineSeats(seats);
    const onlineSeatNos = new Set(online.map((s) => s.seat));
    const quorum = Math.max(1, Math.min(settings.quorum, Math.max(1, online.length)));
    const msgs = await messagesForTask(current.session_id, current.id);
    const bySeatKind = (seatNo, kinds, round) => msgs.filter((m) => m.meta?.seat === seatNo && kinds.includes(m.kind) && (round === void 0 || m.meta?.round === round));
    const deadlinePassed = new Date(current.deadline).getTime() <= Date.now();
    let nextPhase = null;
    let nextRound = current.round;
    switch (current.phase) {
      case "research": {
        const needResearchers = [2, 3, 4].filter((s) => onlineSeatNos.has(s));
        const need = [1, ...needResearchers, ...onlineSeatNos.has(10) ? [10] : []];
        const allIn = need.length === 0 || need.every((s) => bySeatKind(s, ["note"]).length > 0);
        if (current.state?.needs_research === false || allIn || deadlinePassed) nextPhase = "draft";
        break;
      }
      case "draft": {
        const hasDraft = bySeatKind(5, ["draft"], current.round).length > 0;
        if (!hasDraft && (deadlinePassed || !onlineSeatNos.has(5))) {
          await autoDraft(current, msgs);
        }
        const draftNow = (await messagesForTask(current.session_id, current.id, "draft")).length > 0;
        if (draftNow || deadlinePassed) nextPhase = "critique";
        break;
      }
      case "critique": {
        const req = [6, 7, 8].filter((s) => onlineSeatNos.has(s));
        const allIn = req.every((s) => s === 6 ? bySeatKind(6, ["objection"], current.round).length > 0 : s === 7 ? bySeatKind(7, ["verify"], current.round).length > 0 : bySeatKind(8, ["note"], current.round).length > 0);
        if (allIn || deadlinePassed) nextPhase = "revise";
        break;
      }
      case "revise": {
        const afterSeq = Number(current.state?.revise_after_seq ?? 0);
        const hasRevision = bySeatKind(5, ["draft"], current.round).some((m) => Number(m.seq) > afterSeq);
        if (!hasRevision && deadlinePassed) await autoDraft(current, msgs);
        const reviseIn = (await bySeatKindSafe(current, 5, ["draft"], current.round)).some((m) => Number(m.seq) > afterSeq);
        if (reviseIn || deadlinePassed || !onlineSeatNos.has(5)) nextPhase = "vote";
        break;
      }
      case "vote": {
        const voterSeats = online.map((s) => s.seat);
        const votes = msgs.filter((m) => m.kind === "vote" && m.meta?.round === current.round);
        const voted = new Set(votes.map((m) => m.meta?.seat));
        const allVoted = voterSeats.length > 0 && voterSeats.every((s) => voted.has(s));
        const rejects = votes.filter((m) => m.meta?.approve === false);
        const approves = votes.filter((m) => m.meta?.approve === true);
        const decide = (approveCount) => {
          if (rejects.length > 0) {
            if (current.round < settings.max_rounds) {
              nextPhase = "revise";
              nextRound = current.round + 1;
            } else nextPhase = "final";
          } else if (approveCount > 0 || deadlinePassed) {
            nextPhase = "final";
          } else {
            nextPhase = "final";
          }
        };
        if (allVoted || deadlinePassed) {
          decide(approves.length);
          if (nextPhase === "final") {
            const weights = leadership(seats, current.state?.domains || ["language"]).vote_weights;
            const weighted = votes.reduce((sum, vote) => sum + (vote.meta?.approve ? 1 : -1) * Number(weights[String(vote.meta?.seat)] ?? 0.5), 0);
            current = await patchTask(current, { state: { ...current.state, last_votes: { approves: approves.length, rejects: rejects.length, weighted_decision: weighted >= 0 ? "approve" : "reject", weighted_score: Number(weighted.toFixed(3)) } } });
          }
        }
        break;
      }
      case "final": {
        const hasFinal = msgs.some((m) => m.kind === "final");
        if (!hasFinal && (deadlinePassed || !onlineSeatNos.has(1))) {
          await autoFinal(current, msgs, settings);
        }
        const finalNow = (await messagesForTask(current.session_id, current.id, "final")).length > 0;
        if (finalNow || deadlinePassed) nextPhase = "draw";
        break;
      }
      case "draw": {
        const drawn = current.state?.drawn === true;
        if (drawn || deadlinePassed) nextPhase = "done";
        break;
      }
    }
    if (!nextPhase) return current;
    const patch = {
      phase: nextPhase,
      round: nextRound,
      // Preserve the sequence just before entering revise. Only a later explainer
      // draft counts as the revision, even during round one.
      state: nextPhase === "revise" ? { ...current.state, revise_after_seq: Math.max(0, ...msgs.map((m) => Number(m.seq) || 0)) } : current.state,
      updated_at: nowISO(),
      deadline: nextPhase === "draw" ? isoIn(settings.draw_timeout_s) : nextPhase === "revise" ? isoIn(settings.revise_timeout_s) : nextPhase === "done" ? current.deadline : isoIn(settings.phase_timeout_s)
    };
    const { data } = await sb.from("cr_tasks").update(patch).eq("id", current.id).select().single();
    current = data ?? { ...current, ...patch };
  }
  return current;
}
async function bySeatKindSafe(task, seat, kinds, round) {
  const msgs = await messagesForTask(task.session_id, task.id);
  return msgs.filter((m) => m.meta?.seat === seat && kinds.includes(m.kind) && (round === void 0 || m.meta?.round === round));
}
async function patchTask(task, patch) {
  const { data } = await sb.from("cr_tasks").update({ ...patch, updated_at: nowISO() }).eq("id", task.id).select().single();
  return data ?? { ...task, ...patch };
}
async function autoDraft(task, msgs) {
  const all = msgs ?? await messagesForTask(task.session_id, task.id);
  const notes = all.filter((m) => m.kind === "note");
  const existing = all.filter((m) => m.kind === "draft");
  const latestDraft = existing[existing.length - 1];
  const src = extractSources(notes);
  const body = latestDraft ? latestDraft.body : [
    "*(Council fallback draft \u2014 the explainer did not deliver in time.)*",
    "",
    "Based on the council's notes, here is a provisional answer to the question:",
    "",
    ...notes.slice(0, 8).map((n) => `- **${n.author}:** ${trim(n.body, 400)}`),
    src.length ? `
Sources: ${src.map((u) => `<${u}>`).join(", ")}` : ""
  ].filter(Boolean).join("\n");
  await insertMessage({
    session_id: task.session_id,
    role: "agent",
    author: "Seat 5 \xB7 explainer (auto)",
    kind: "draft",
    body: trim(body, 6e3),
    meta: { seat: 5, role: "explainer", task_id: task.id, round: task.round, auto: true, sources: src }
  });
}
async function autoFinal(task, msgs, settings) {
  const all = msgs ?? await messagesForTask(task.session_id, task.id);
  const drafts = all.filter((m) => m.kind === "draft");
  const draft = drafts[drafts.length - 1];
  const notes = all.filter((m) => m.kind === "note");
  const objections = all.filter((m) => m.kind === "objection");
  const verifies = all.filter((m) => m.kind === "verify");
  const votes = all.filter((m) => m.kind === "vote");
  const approves = votes.filter((m) => m.meta?.approve === true).length;
  const rejects = votes.filter((m) => m.meta?.approve === false).length;
  const sources = extractSources([...notes, ...drafts]);
  const unresolved = objections.filter((o) => !drafts.some((d) => d.seq > o.seq));
  const body = [
    draft ? draft.body : "*The council could not produce a verified answer in time.*",
    "",
    "### Council notes",
    `- Fallback final generated by the server (moderator did not deliver within the deadline).`,
    `- Votes cast: ${approves} approve / ${rejects} reject. Rounds used: ${task.round} of ${settings.max_rounds}.`,
    ...task.state?.last_votes?.weighted_decision ? [`- Weighted tie-break signal: ${task.state.last_votes.weighted_decision} (${task.state.last_votes.weighted_score}). Unanimity was not reached.`] : [],
    ...unresolved.length ? [`- Unresolved objections:`, ...unresolved.slice(0, 5).map((o) => `  - ${trim(o.body, 300)}`)] : ["- No unresolved objections recorded."],
    verifies.length ? `- Verifier tables: ${verifies.length} on file.` : "- No verifier table on file.",
    "",
    "### Sources",
    ...sources.length ? sources.map((u) => `- ${u}`) : ["- No sources were attached to the notes."],
    "",
    `Confidence: ${approves > rejects && sources.length ? "medium" : "low"} \u2013 ${approves} approve / ${rejects} reject, fallback generation.`
  ].join("\n");
  await insertMessage({
    session_id: task.session_id,
    role: "council",
    author: "Seat 1 \xB7 moderator (auto)",
    kind: "final",
    body: trim(body, 8e3),
    meta: { seat: 1, role: "moderator", task_id: task.id, round: task.round, auto: true, approvals: approves, rejects, sources }
  });
}
async function tick(sessionId) {
  const { data: task } = await sb.from("cr_tasks").select("*").eq("session_id", sessionId).not("phase", "in", "(done,failed)").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (task) await advanceTask(task);
  await emitFinishedDrawingEvents(sessionId);
}
async function currentSheet(sessionId) {
  const { data } = await sb.from("cr_sheets").select("*").eq("session_id", sessionId).order("idx", { ascending: false }).limit(1).maybeSingle();
  return data ?? null;
}
async function sheetOpsSeq(sheetId) {
  const { data } = await sb.from("cr_ops").select("seq").eq("sheet_id", sheetId).order("seq", { ascending: false }).limit(1).maybeSingle();
  return data?.seq ?? 0;
}
var publicUrl = (path) => path ? `${SUPA_URL}/storage/v1/object/public/classroom/${path}` : null;
async function kbHits(sessionId, question) {
  const terms = normal(question).split(" ").filter((x) => x.length > 2).slice(0, 10).join(" & ");
  if (!terms) return [];
  const { data } = await sb.from("cr_knowledge").select("text,page,file_id,cr_files(name)").or(`session_id.eq.${sessionId},session_id.is.null`).textSearch("tsv", terms).limit(8);
  return (data ?? []).map((x) => ({ file_id: x.file_id, file: x.cr_files?.name || "library file", page: x.page, text: trim(x.text, 500) }));
}
async function buildInbox(seat, lastSeq, seenSheetSeq) {
  await markStaleSeatsOffline();
  const { data: active } = await sb.from("cr_tasks").select("*").not("phase", "in", "(done,failed)").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (active) {
    await advanceTask(active);
    await emitFinishedDrawingEvents(active.session_id);
  }
  const { data: t } = active ? await sb.from("cr_tasks").select("*").eq("id", active.id).maybeSingle() : { data: null };
  const task = t ?? active;
  let needed = "none", yourTurn = false, question = "", sheet = null, memory = { body: "" }, sinceLast = [], files = [], hits = [], lead = { lead_seat: 1, vote_weights: {} }, watching = false;
  let sessionId = task?.session_id ?? null;
  if (task) {
    const { data: qm } = await sb.from("cr_messages").select("body").eq("id", task.question_msg_id).maybeSingle();
    question = qm?.body ?? "";
    const { data: delta } = await sb.from("cr_messages").select("seq,role,author,kind,body,meta,created_at").eq("session_id", task.session_id).gt("seq", lastSeq).order("seq").limit(12);
    sinceLast = (delta ?? []).map((m) => ({ seq: m.seq, role: m.role, author: m.author, kind: m.kind, body: trim(m.body, 360), meta: m.meta, created_at: m.created_at }));
    memory = await sessionMemory(task.session_id);
    files = await taskFiles(task.session_id, task.id);
    hits = await kbHits(task.session_id, question);
    const seats = await getSeats();
    lead = leadership(seats, task.state?.domains || domainsForQuestion(question));
    const sh = await currentSheet(task.session_id);
    if (sh) {
      const human = await humanSheetState(sh.id, seenSheetSeq);
      const { data: watch } = await sb.from("cr_watches").select("on_watch").eq("seat", seat.seat).eq("sheet_id", sh.id).maybeSingle();
      watching = !!watch?.on_watch;
      sheet = { id: sh.id, title: sh.title, ops_seq: await sheetOpsSeq(sh.id), png_url: publicUrl(sh.png_path), human, recent_ops: watching ? human.recent : [] };
    }
    const msgs = await messagesForTask(task.session_id, task.id);
    const has = (kinds, round) => msgs.some((m) => m.meta?.seat === seat.seat && kinds.includes(m.kind) && (round === void 0 || m.meta?.round === round));
    if (!profileOf(seat).calibrated) {
      yourTurn = true;
      needed = "calibrate";
    } else switch (task.phase) {
      case "research":
        if ([1, 2, 3, 4, 10].includes(seat.seat) && !has(["note"])) {
          yourTurn = true;
          needed = "note";
        }
        break;
      case "draft":
        if (seat.seat === 5 && !has(["draft"], task.round)) {
          yourTurn = true;
          needed = "draft";
        }
        break;
      case "critique":
        if (seat.seat === 6 && !has(["objection"], task.round)) {
          yourTurn = true;
          needed = "objection";
        } else if (seat.seat === 7 && !has(["verify"], task.round)) {
          yourTurn = true;
          needed = "verify";
        } else if (seat.seat === 8 && !has(["note"], task.round)) {
          yourTurn = true;
          needed = "note";
        }
        break;
      case "revise": {
        const marker = Number(task.state?.revise_after_seq ?? 0);
        const revised = msgs.some((m) => m.meta?.seat === 5 && m.kind === "draft" && m.meta?.round === task.round && Number(m.seq) > marker);
        if (seat.seat === 5 && !revised) {
          yourTurn = true;
          needed = "draft";
        }
        break;
      }
      case "vote":
        if (!has(["vote"], task.round)) {
          yourTurn = true;
          needed = "vote";
        }
        break;
      case "final":
        if (seat.seat === 1 && !msgs.some((m) => m.kind === "final")) {
          yourTurn = true;
          needed = "final";
        }
        break;
      case "draw":
        if (seat.seat === 9 && !task.state?.drawn) {
          yourTurn = true;
          needed = "draw";
        }
        break;
    }
  } else if (!profileOf(seat).calibrated) {
    yourTurn = true;
    needed = "calibrate";
  }
  const humanWake = !!sheet?.human?.new_ops_since_you_looked && !sheet.human.drawing;
  const messageWake = sinceLast.some((m) => m.role === "user" || m.kind === "board_event");
  const wake = yourTurn || humanWake || messageWake;
  await sb.from("cr_seats").update({ last_seen: nowISO(), status: yourTurn ? task?.phase === "vote" ? "voting" : "working" : "idle" }).eq("seat", seat.seat);
  return {
    seat: seat.seat,
    role: seat.role,
    poll_hint: 3,
    now: nowISO(),
    wake,
    watching,
    calibration: !profileOf(seat).calibrated ? { test_id: `seat-${seat.seat}-v1`, questions: calibrationForSeat(seat.seat).map(({ id, domain, q }) => ({ id, domain, q })) } : null,
    task: task ? { id: task.id, session_id: task.session_id, phase: task.phase, round: task.round, deadline: task.deadline, question: trim(question, 1200), your_turn: yourTurn, needed, needs_research: task.state?.needs_research ?? true, domains: task.state?.domains || domainsForQuestion(question), lead_seat: lead.lead_seat, vote_weights: lead.vote_weights, context: [{ kind: "memory", body: memory.body, updated_at: memory.updated_at }], files, kb_hits: hits } : null,
    sheet,
    memory,
    since_last: sinceLast,
    latest_seq: sinceLast.length ? sinceLast[sinceLast.length - 1].seq : lastSeq
  };
}
async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  const url = new URL(req.url);
  const segs = routePath(url);
  const route = segs.join("/");
  const method = req.method;
  try {
    if (route === "health") {
      return json({ ok: true, service: "classroom", version: VERSION, time: nowISO() });
    }
    if (route === "prompt") return text(AGENT_PROMPT);
    if (route === "rules") return text(RULES_TEXT);
    if (route === "session" && method === "POST") {
      const b = await req.json().catch(() => ({}));
      const settings = await getSettings();
      const { data: s, error } = await sb.from("cr_sessions").insert({ title: trim(b.title, 120) || "AI Classroom session", settings }).select().single();
      if (error) return err("could not create session", 500);
      const { data: sheet } = await sb.from("cr_sheets").insert({ session_id: s.id, idx: 1, title: "Sheet 1" }).select().single();
      return json({ session_id: s.id, sheet_id: sheet?.id ?? null });
    }
    if (route === "sessions" && method === "GET") {
      const { data } = await sb.from("cr_sessions").select("id,title,created_at,status").order("created_at", { ascending: false }).limit(50);
      return json({ sessions: data ?? [] });
    }
    if (segs[0] === "session" && segs[1] && method === "GET") {
      const sessionId = segs[1];
      await tick(sessionId);
      const since = parseInt(url.searchParams.get("since") ?? "0", 10) || 0;
      const [{ data: s }, messages, { data: task }, { data: sheets }, seats] = await Promise.all([
        sb.from("cr_sessions").select("*").eq("id", sessionId).maybeSingle(),
        latestMessages(sessionId, 200, since),
        sb.from("cr_tasks").select("*").eq("session_id", sessionId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        sb.from("cr_sheets").select("*").eq("session_id", sessionId).order("idx"),
        getSeats()
      ]);
      if (!s) return err("session not found", 404);
      const settings = await getSettings();
      const leader = leadership(seats, task?.state?.domains || ["language"]);
      const { data: watches } = await sb.from("cr_watches").select("seat,sheet_id,on_watch").eq("on_watch", true);
      return json({
        session: s,
        messages,
        task: task ? { id: task.id, phase: task.phase, round: task.round, deadline: task.deadline, question_msg_id: task.question_msg_id, state: task.state, domains: task.state?.domains || [], lead_seat: leader.lead_seat, vote_weights: leader.vote_weights, created_at: task.created_at } : null,
        sheets: (sheets ?? []).map((sh) => ({ ...sh, png_url: publicUrl(sh.png_path), thumb_url: publicUrl(sh.thumb_path) })),
        council: seats.map((x) => ({ seat: x.seat, role: x.role, name: x.agent_name, status: x.last_seen && Date.now() - new Date(x.last_seen).getTime() < ONLINE_WINDOW_MS ? x.status : "offline", last_seen: x.last_seen, profile: { calibration: profileOf(x).calibration, track: profileOf(x).track }, watching: (watches || []).some((w) => w.seat === x.seat && w.on_watch) })),
        settings,
        latest_seq: messages.length ? messages[messages.length - 1].seq : since
      });
    }
    if (route === "ask" && method === "POST") {
      const b = await req.json().catch(() => ({}));
      const sessionId = str(b.session_id);
      const textIn = str(b.text).trim();
      if (!sessionId || !textIn) return err("session_id and text are required");
      if (textIn.length > 4e3) return err("question too long (max 4000 chars)");
      const sheetId = b.sheet_id ? str(b.sheet_id) : null;
      const qMsg = await insertMessage({
        session_id: sessionId,
        role: "user",
        author: "You",
        kind: "question",
        body: textIn,
        meta: sheetId ? { sheet_id: sheetId } : {}
      });
      if (!qMsg) return err("could not store question", 500);
      const lower = textIn.toLowerCase().replace(/^\//, "").trim();
      const TRIVIAL = /* @__PURE__ */ new Set(["thanks", "thank you", "ok", "okay", "yes", "yes continue", "sure", "great", "cool", "got it", "nice", "continue"]);
      const isTrivial = TRIVIAL.has(lower) || lower.length <= 2;
      const quick = /^\/?quick\b/i.test(textIn);
      if (isTrivial) {
        const reply = await insertMessage({
          session_id: sessionId,
          role: "council",
          author: "Seat 1 \xB7 moderator",
          kind: "final",
          body: "You're welcome! Keep the questions coming \u2014 the council is here for them.",
          meta: { seat: 1, role: "moderator", trivial: true }
        });
        const { data: task2 } = await sb.from("cr_tasks").insert({
          session_id: sessionId,
          question_msg_id: qMsg.id,
          phase: "done",
          round: 1,
          deadline: nowISO(),
          state: { trivial: true }
        }).select().single();
        if (reply) await sb.from("cr_tasks").update({ state: { trivial: true, final_msg_id: reply.id } }).eq("id", task2.id);
        return json({ task_id: task2.id, trivial: true });
      }
      const settings = await getSettings();
      const needsResearch = !quick;
      const domains = domainsForQuestion(textIn);
      const { data: task, error } = await sb.from("cr_tasks").insert({
        session_id: sessionId,
        question_msg_id: qMsg.id,
        phase: needsResearch ? "research" : "draft",
        round: 1,
        deadline: isoIn(settings.phase_timeout_s),
        state: { needs_research: needsResearch, round: 1, votes: {}, domains, mode: lower.split(/\s+/)[0] }
      }).select().single();
      if (error) return err("could not create task", 500);
      return json({ task_id: task.id, phase: task.phase });
    }
    if (route === "sheet" && method === "POST") {
      const b = await req.json().catch(() => ({}));
      const sessionId = str(b.session_id);
      if (!sessionId) return err("session_id is required");
      const { data: last } = await sb.from("cr_sheets").select("idx").eq("session_id", sessionId).order("idx", { ascending: false }).limit(1).maybeSingle();
      const idx = (last?.idx ?? 0) + 1;
      const { data: sheet, error } = await sb.from("cr_sheets").insert({
        session_id: sessionId,
        idx,
        title: trim(b.title, 120) || `Sheet ${idx}`
      }).select().single();
      if (error) return err("could not create sheet", 500);
      return json({ sheet_id: sheet.id, idx });
    }
    if (route === "sheets" && method === "GET") {
      const sessionId = str(url.searchParams.get("session_id"));
      if (!sessionId) return err("session_id is required");
      const { data } = await sb.from("cr_sheets").select("*").eq("session_id", sessionId).order("idx");
      return json({ sheets: (data ?? []).map((sh) => ({ ...sh, png_url: publicUrl(sh.png_path), thumb_url: publicUrl(sh.thumb_path) })) });
    }
    if (segs[0] === "sheet" && segs[1]) {
      const sheetId = segs[1];
      if (segs.length === 2 && method === "GET") {
        const { data: sheet } = await sb.from("cr_sheets").select("*").eq("id", sheetId).maybeSingle();
        if (!sheet) return err("sheet not found", 404);
        const { data: ops } = await sb.from("cr_ops").select("*").eq("sheet_id", sheetId).order("seq");
        return json({ sheet: { ...sheet, png_url: publicUrl(sheet.png_path), thumb_url: publicUrl(sheet.thumb_path) }, ops: ops ?? [] });
      }
      if (segs[2] === "ops" && method === "GET") {
        const since = parseInt(url.searchParams.get("since") ?? "0", 10) || 0;
        const { data: ops } = await sb.from("cr_ops").select("*").eq("sheet_id", sheetId).gt("seq", since).order("seq").limit(500);
        return json({ ops: ops ?? [], max_seq: ops?.length ? ops[ops.length - 1].seq : since });
      }
      if (segs[2] === "ops" && method === "POST") {
        const b = await req.json().catch(() => ({}));
        const ops = (Array.isArray(b.ops) ? b.ops : []).slice(0, 200).map(sanitizeOp).filter(Boolean);
        if (!ops.length) return err("no valid ops");
        const author = b.author === "user" || !b.author ? "user" : trim(b.author, 40);
        const { data: sheet } = await sb.from("cr_sheets").select("session_id,idx,state").eq("id", sheetId).maybeSingle();
        if (!sheet) return err("sheet not found", 404);
        const streamOps = ops.filter((o) => o.t === "path" && o.stroke_id);
        const pointers = ops.filter((o) => o.t === "pointer");
        const normalOps = ops.filter((o) => !(o.t === "path" && o.stroke_id) && o.t !== "pointer");
        const inserted = normalOps.length ? await insertOps(sheetId, author, normalOps) : [];
        let state = sheet.state || {};
        let completed = 0;
        for (const op of streamOps) {
          const bbox = bboxOf(op);
          if (op.done) {
            const finalOp = { t: "path", pts: op.pts, w: op.w, c: op.c, close: !!op.close };
            if (finalOp.pts.length >= 2) inserted.push(...await insertOps(sheetId, author, [finalOp]));
            await sb.from("cr_live_strokes").delete().eq("sheet_id", sheetId).eq("stroke_id", op.stroke_id);
            completed++;
            state = { ...state, drawing: false, finished_at: nowISO(), event_emitted: false, last_stroke_at: nowISO(), bbox_of_recent: bbox, stroke_count: Number(state.stroke_count || 0) + 1, region: bbox[0] < 800 ? "left" : "right" };
          } else {
            await sb.from("cr_live_strokes").upsert({ sheet_id: sheetId, stroke_id: op.stroke_id, author, op, bbox, updated_at: nowISO() });
            state = { ...state, drawing: true, last_stroke_at: nowISO(), bbox_of_recent: bbox, event_emitted: false };
          }
        }
        if (pointers.length) state = { ...state, pointer: { x: pointers[pointers.length - 1].x, y: pointers[pointers.length - 1].y, at: nowISO() } };
        if (streamOps.length || pointers.length) await sb.from("cr_sheets").update({ state }).eq("id", sheetId);
        await tick(sheet.session_id);
        return json({ inserted: inserted.length, streamed: streamOps.length, completed, ops: inserted });
      }
      if (segs[2] === "png" && method === "GET") {
        const { data: sheet } = await sb.from("cr_sheets").select("png_path,state").eq("id", sheetId).maybeSingle();
        if (!sheet?.png_path) return err("sheet PNG not found", 404);
        if (url.searchParams.get("fresh") === "1" || url.searchParams.get("region")) {
          const state = { ...sheet.state || {}, fresh_requested_at: nowISO(), crop_request: url.searchParams.get("region") || null };
          await sb.from("cr_sheets").update({ state }).eq("id", sheetId);
        }
        return new Response(null, { status: 302, headers: { ...CORS, location: publicUrl(sheet.png_path) } });
      }
      if (segs[2] === "png" && method === "POST") {
        const b = await req.json().catch(() => ({}));
        const dataUrl = str(b.data_url);
        const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
        if (!m) return err("data_url must be a base64 PNG data URL");
        const bytes = Uint8Array.from(atob(m[1]), (c) => c.charCodeAt(0));
        if (bytes.length > 8 * 1024 * 1024) return err("png too large (max 8 MB)");
        const put = async (path, buf) => {
          const { error } = await sb.storage.from("classroom").upload(path, buf, { contentType: "image/png", upsert: true });
          if (error) throw new Error("storage: " + error.message);
        };
        await put(`sheets/${sheetId}.png`, bytes);
        let thumbPath = `sheets/${sheetId}.png`;
        const tm = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(str(b.thumb_data_url));
        if (tm) {
          const tbytes = Uint8Array.from(atob(tm[1]), (c) => c.charCodeAt(0));
          await put(`thumbs/${sheetId}.png`, tbytes);
          thumbPath = `thumbs/${sheetId}.png`;
        }
        const { data: previousSheet } = await sb.from("cr_sheets").select("state").eq("id", sheetId).maybeSingle();
        await sb.from("cr_sheets").update({ png_path: `sheets/${sheetId}.png`, thumb_path: thumbPath, state: { ...previousSheet?.state || {}, fresh_requested_at: null, crop_request: null, png_updated_at: nowISO() } }).eq("id", sheetId);
        return json({ ok: true, png_url: publicUrl(`sheets/${sheetId}.png`), thumb_url: publicUrl(thumbPath) });
      }
      return err("unknown sheet route", 404);
    }
    if (route === "upload" && method === "POST") {
      const b = await req.json().catch(() => ({}));
      const sessionId = str(b.session_id);
      const sheetId = str(b.sheet_id);
      const filename = str(b.filename, "upload.png").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "upload.png";
      const dataUrl = str(b.data_url);
      const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
      if (!sessionId || !sheetId || !m) return err("session_id, sheet_id and an image data_url are required");
      const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
      if (bytes.length > 8 * 1024 * 1024) return err("file too large (max 8 MB)");
      const path = `uploads/${sessionId}/${Date.now()}-${filename}`;
      const { error } = await sb.storage.from("classroom").upload(path, bytes, { contentType: m[1], upsert: false });
      if (error) return err("storage: " + error.message, 500);
      const url2 = publicUrl(path);
      const w = num(b.w, 500), h = num(b.h, 380);
      const inserted = await insertOps(sheetId, "user", [{ t: "image", x: 120, y: 120, w: Math.min(w, 900), h: Math.min(h, 700), url: url2 }]);
      await insertMessage({ session_id: sessionId, role: "user", author: "You", kind: "board_event", body: `Uploaded image "${filename}" to the sheet.`, meta: { sheet_id: sheetId, url: url2 } });
      await tick(sessionId);
      return json({ ok: true, url: url2, ops: inserted });
    }
    if ((route === "media/begin" || route === "file/begin" || route === "files/begin") && method === "POST") {
      const b = await req.json().catch(() => ({}));
      const sessionId = str(b.session_id);
      const name = trim(b.filename ?? b.name, 180) || "untitled";
      const mime = trim(b.mime, 120) || "application/octet-stream";
      const bytes = Math.floor(num(b.bytes, -1));
      if (!sessionId || bytes < 0 || bytes > MAX_FILE_BYTES) return err("session_id and bytes (0..100 MB) are required");
      const { seat, author } = await optionalActor(req, url);
      const id = crypto.randomUUID();
      const isMedia = route.startsWith("media/");
      const requestedPath = trim(b.path, 180);
      const path = isMedia ? `media/${sessionId}/${id}-${name.replace(/[^a-zA-Z0-9._-]/g, "_")}` : filePath(sessionId, id, requestedPath, name);
      try {
        const signed = await createUpload(path);
        if (isMedia) {
          const kind = mediaKind(mime, name);
          await sb.from("cr_media").insert({ id, session_id: sessionId, sheet_id: b.sheet_id ? str(b.sheet_id) : null, author, kind, filename: name, mime, bytes, path, caption: trim(b.caption, 500), meta: { task_id: b.task_id || null, poster_url: b.poster_url || null, pending: true, ...b.meta || {} } });
        } else {
          const sessionScope = b.available_all === true ? null : sessionId;
          await sb.from("cr_files").insert({ id, session_id: sessionScope, author, name, mime, bytes, path, pages: Math.max(0, Math.floor(num(b.pages, 0))), learned: !!b.learned, tags: Array.isArray(b.tags) ? b.tags.slice(0, 12) : [], meta: { origin_session_id: sessionId, task_id: b.task_id || null, available_all: b.available_all === true, pending: true, ...b.meta || {} } });
        }
        return json({ media_id: isMedia ? id : void 0, file_id: isMedia ? void 0 : id, path, ...signed });
      } catch (e) {
        return err(e?.message || "could not begin upload", 500);
      }
    }
    if ((route === "media/done" || route === "file/done" || route === "files/done") && method === "POST") {
      const b = await req.json().catch(() => ({}));
      const isMedia = route.startsWith("media/");
      const id = str(isMedia ? b.media_id : b.file_id);
      if (!id) return err(isMedia ? "media_id is required" : "file_id is required");
      const table = isMedia ? "cr_media" : "cr_files";
      const { data: row } = await sb.from(table).select("*").eq("id", id).maybeSingle();
      if (!row) return err("upload record not found", 404);
      if (!await objectExists(row.path)) return err("storage object not found; PUT it to upload_url first", 409);
      const urlOut = publicUrl(row.path);
      if (isMedia) {
        const poster = str(b.poster_url || row.meta?.poster_url) || null;
        await sb.from("cr_media").update({ url: urlOut, poster_url: poster, meta: { ...row.meta || {}, pending: false } }).eq("id", id);
        const media = { ...row, url: urlOut, poster_url: poster };
        const message2 = await insertMessage({ session_id: row.session_id, role: row.author === "You" ? "user" : "agent", author: row.author, kind: "media", body: row.caption || `Shared ${row.filename}`, meta: { media_id: id, kind: row.kind, filename: row.filename, mime: row.mime, url: urlOut, poster_url: poster, sheet_id: row.sheet_id } });
        let ops = [];
        if (row.sheet_id) {
          const type = row.kind === "video" ? "video" : row.kind === "model3d" ? "model3d" : row.kind === "image" ? "image" : null;
          if (type) ops = await insertOps(row.sheet_id, row.author === "You" ? "user" : "agent", [{ t: type, x: 120, y: 120, w: type === "video" ? 520 : 460, h: type === "video" ? 292 : 320, url: urlOut, poster }]);
        }
        await tick(row.session_id);
        return json({ ok: true, media: { ...media, ops }, message_id: message2?.id || null });
      }
      const origin = row.meta?.origin_session_id || row.session_id;
      await sb.from("cr_files").update({ url: urlOut, meta: { ...row.meta || {}, pending: false } }).eq("id", id);
      const message = origin ? await insertMessage({ session_id: origin, role: row.author === "You" ? "user" : "agent", author: row.author, kind: "media", body: `Shared file: ${row.name}`, meta: { file_id: id, filename: row.name, mime: row.mime, bytes: row.bytes, url: urlOut, path: row.path, task_id: row.meta?.task_id || null } }) : null;
      if (origin) await tick(origin);
      return json({ ok: true, file: { ...row, url: urlOut }, message_id: message?.id || null });
    }
    if (segs[0] === "file" && segs[1] && segs[2] === "text" && method === "POST") {
      const b = await req.json().catch(() => ({}));
      const fileId = segs[1];
      const extracted = trim(b.text, 3e6);
      const { data: file } = await sb.from("cr_files").select("*").eq("id", fileId).maybeSingle();
      if (!file) return err("file not found", 404);
      const textPath = `files/${file.meta?.origin_session_id || file.session_id || "library"}/${fileId}.txt`;
      const { error } = await sb.storage.from("classroom").upload(textPath, new TextEncoder().encode(extracted), { contentType: "text/plain; charset=utf-8", upsert: true });
      if (error) return err(`storage: ${error.message}`, 500);
      const pages = Math.max(file.pages || 0, (extracted.match(/===\s*page\s+\d+\s*===/gi) || []).length);
      const patched = { ...file, text_path: textPath, text_url: publicUrl(textPath), pages };
      await sb.from("cr_files").update({ text_path: textPath, text_url: publicUrl(textPath), pages }).eq("id", fileId);
      const chunks = file.learned ? await indexKnowledge(patched, extracted) : 0;
      return json({ ok: true, text_url: publicUrl(textPath), pages, chunks });
    }
    if (segs[0] === "file" && segs[1] && segs[2] === "text" && method === "GET") {
      const { data: file } = await sb.from("cr_files").select("*").eq("id", segs[1]).maybeSingle();
      if (!file?.text_path) return err("no extracted text for this file", 404);
      const { data, error } = await sb.storage.from("classroom").download(file.text_path);
      if (error || !data) return err("could not read extracted text", 500);
      const from = Math.max(0, Number(url.searchParams.get("from") ?? "0") || 0);
      const all = await data.text();
      const slice = all.slice(from, from + 12e3);
      return json({ file_id: file.id, name: file.name, from, to: from + slice.length, text: slice, more: from + slice.length < all.length });
    }
    if (segs[0] === "file" && segs[1] && segs.length === 2 && method === "GET") {
      const { data } = await sb.from("cr_files").select("*").eq("id", segs[1]).maybeSingle();
      if (!data) return err("file not found", 404);
      return json({ file: data });
    }
    if ((route === "files" || route === "media") && method === "GET") {
      const sessionId = str(url.searchParams.get("session_id"));
      if (!sessionId) return err("session_id is required");
      if (route === "media") {
        const { data: data2 } = await sb.from("cr_media").select("*").eq("session_id", sessionId).order("created_at", { ascending: false });
        return json({ media: data2 ?? [] });
      }
      const path = url.searchParams.get("path");
      let q = sb.from("cr_files").select("*").or(`session_id.eq.${sessionId},session_id.is.null`).is("deleted_at", null).order("created_at", { ascending: false });
      if (path !== null) q = q.eq("path", path);
      const { data } = await q;
      return json({ files: data ?? [] });
    }
    if (route === "kb/search" && method === "GET") {
      const sessionId = str(url.searchParams.get("session_id")), q = str(url.searchParams.get("q"));
      const k = Math.max(1, Math.min(8, Number(url.searchParams.get("k") ?? "8") || 8));
      if (!sessionId || !q) return err("session_id and q are required");
      const terms = normal(q).split(" ").filter((x) => x.length > 2).slice(0, 10).join(" & ");
      const { data } = await sb.from("cr_knowledge").select("id,file_id,page,text,cr_files(name)").or(`session_id.eq.${sessionId},session_id.is.null`).textSearch("tsv", terms).limit(k);
      return json({ hits: (data ?? []).map((x) => ({ id: x.id, file_id: x.file_id, file: x.cr_files?.name || "library file", page: x.page, text: trim(x.text, 800) })) });
    }
    if (route === "file/learn" && method === "POST") {
      const b = await req.json().catch(() => ({}));
      const fileId = str(b.file_id);
      const learned = b.learned !== false;
      const { data: file } = await sb.from("cr_files").select("*").eq("id", fileId).maybeSingle();
      if (!file) return err("file not found", 404);
      await sb.from("cr_files").update({ learned }).eq("id", fileId);
      if (!learned) {
        await sb.from("cr_knowledge").delete().eq("file_id", fileId);
        return json({ ok: true, learned: false, chunks: 0 });
      }
      if (!file.text_path) return err("extract text before learning from this file", 409);
      const { data: blob, error } = await sb.storage.from("classroom").download(file.text_path);
      if (error || !blob) return err("could not read text", 500);
      const chunks = await indexKnowledge({ ...file, learned: true }, await blob.text());
      return json({ ok: true, learned: true, chunks });
    }
    if (["files/mkdir", "files/move", "files/delete"].includes(route) && method === "POST") {
      const b = await req.json().catch(() => ({}));
      const sessionId = str(b.session_id);
      const { seat, author } = await optionalActor(req, url);
      if (!sessionId) return err("session_id is required");
      if (route === "files/mkdir") {
        const folder = trim(b.path, 180).replace(/^\/+|\.\.(\/|$)/g, "");
        if (!folder) return err("path is required");
        await sb.from("cr_folders").upsert({ session_id: sessionId, path: folder, author });
        return json({ ok: true, path: folder });
      }
      const fileId = str(b.file_id);
      const { data: file } = await sb.from("cr_files").select("*").eq("id", fileId).maybeSingle();
      if (!file) return err("file not found", 404);
      if (!isAdmin(url, req) && seat && file.author !== author) return err("only the author or admin may change this file", 403);
      if (route === "files/delete") {
        await sb.from("cr_files").update({ deleted_at: nowISO() }).eq("id", fileId);
        return json({ ok: true });
      }
      const next = trim(b.path, 180);
      await sb.from("cr_files").update({ path: next }).eq("id", fileId);
      return json({ ok: true, path: next });
    }
    if (route === "feedback" && method === "POST") {
      const b = await req.json().catch(() => ({}));
      const sessionId = str(b.session_id);
      if (!sessionId) return err("session_id is required");
      const msg = await insertMessage({ session_id: sessionId, role: "user", author: "You", kind: "feedback", body: trim(b.body, 600), meta: { rating: b.rating === -1 ? -1 : 1, task_id: b.task_id || null } });
      return json({ ok: !!msg, message_id: msg?.id || null });
    }
    if (route === "claim" && method === "POST") {
      const b = await req.json().catch(() => ({}));
      const name = trim(b.name, 60) || `agent-${Math.floor(Math.random() * 1e4)}`;
      for (let attempt = 0; attempt < 12; attempt++) {
        const seats = await getSeats();
        const free = seats.find((s) => !s.token);
        const stale = seats.find((s) => s.token && (!s.last_seen || Date.now() - new Date(s.last_seen).getTime() > ONLINE_WINDOW_MS));
        const mine = seats.find((s) => s.agent_name === name);
        const target = free ?? stale ?? mine;
        if (!target) return err("all 10 seats are claimed and online \u2014 try again later", 409);
        const token = crypto.randomUUID();
        const baseProfile = profileOf(target);
        const declared = {
          ...baseProfile,
          ...Array.isArray(b.strengths) ? { strengths: b.strengths.map((x) => trim(x, 40)).slice(0, 8) } : {},
          ...Array.isArray(b.weaknesses) ? { weaknesses: b.weaknesses.map((x) => trim(x, 40)).slice(0, 8) } : {}
        };
        let update = sb.from("cr_seats").update({
          token,
          agent_name: name,
          claimed_at: nowISO(),
          last_seen: nowISO(),
          status: "idle",
          profile: declared
        }).eq("seat", target.seat);
        if (free) update = update.is("token", null);
        else if (stale && target.seat === stale.seat) update = update.eq("token", stale.token);
        else update = update.eq("agent_name", name);
        const { data, error } = await update.select().maybeSingle();
        if (data) return json({ seat: data.seat, role: data.role, token, poll_hint: 3 });
        if (error && error.code !== "PGRST116") console.warn("claim retry", error);
      }
      return err("seat claim raced with another agent; retry", 409);
    }
    if (route === "calibrate" && method === "POST") {
      const seat = await seatFromToken(req, url);
      if (!seat) return err("invalid seat token", 401);
      const b = await req.json().catch(() => ({}));
      const expected = calibrationForSeat(seat.seat);
      const supplied = new Map((Array.isArray(b.answers) ? b.answers : []).map((x) => [String(x.id), normal(x.answer)]));
      const scores = {};
      for (const domain of DOMAINS) {
        const set = expected.filter((q) => q.domain === domain);
        const right = set.filter((q) => {
          const answer = supplied.get(q.id) || "";
          const target = normal(q.answer);
          return answer === target || answer.length > 2 && (answer.includes(target) || target.includes(answer));
        }).length;
        scores[domain] = Number((right / set.length).toFixed(3));
      }
      const old = profileOf(seat);
      const strengths = Array.isArray(b.strengths) ? b.strengths.map((x) => trim(x, 40)).slice(0, 8) : old.strengths;
      const weaknesses = Array.isArray(b.weaknesses) ? b.weaknesses.map((x) => trim(x, 40)).slice(0, 8) : old.weaknesses;
      const profile = { ...old, calibrated: true, calibration: scores, strengths, weaknesses, calibrated_at: nowISO() };
      await sb.from("cr_calibration_attempts").insert({ seat: seat.seat, test_id: `seat-${seat.seat}-v1`, answers: Array.isArray(b.answers) ? b.answers.slice(0, 15) : [], scores });
      await sb.from("cr_seats").update({ profile, last_seen: nowISO(), status: "idle" }).eq("seat", seat.seat);
      return json({ ok: true, seat: seat.seat, scores, message: "Calibration saved. Your profile is private; only seat/role scorecards are shown." });
    }
    if (route === "watch" && method === "POST") {
      const seat = await seatFromToken(req, url);
      if (!seat) return err("invalid seat token", 401);
      const b = await req.json().catch(() => ({}));
      const sheetId = str(b.sheet_id);
      if (!sheetId) return err("sheet_id is required");
      if (b.on === false) {
        await sb.from("cr_watches").delete().eq("seat", seat.seat);
        return json({ ok: true, watching: false });
      }
      await sb.from("cr_watches").upsert({ seat: seat.seat, sheet_id: sheetId, on_watch: true, updated_at: nowISO() });
      return json({ ok: true, watching: true, sheet_id: sheetId });
    }
    if (route === "inbox" && method === "GET") {
      const seat = await seatFromToken(req, url);
      if (!seat) return err("invalid seat token (re-claim with POST /claim)", 401);
      const lastSeq = Number(url.searchParams.get("since") ?? url.searchParams.get("last_seq") ?? "0") || 0;
      const sheetSeq = Number(url.searchParams.get("sheet_seq") ?? "0") || 0;
      const wait = Math.max(0, Math.min(20, Number(url.searchParams.get("wait") ?? "0") || 0));
      let payload = await buildInbox(seat, lastSeq, sheetSeq);
      const until = Date.now() + wait * 1e3;
      while (wait && !payload.wake && Date.now() < until) {
        await new Promise((resolve) => setTimeout(resolve, 1e3));
        payload = await buildInbox(seat, lastSeq, sheetSeq);
      }
      if (JSON.stringify(payload).length > 6144) payload.since_last = payload.since_last.slice(-4).map((m) => ({ ...m, body: trim(m.body, 160) }));
      return json(payload);
    }
    if (route === "say" && method === "POST") {
      const seat = await seatFromToken(req, url);
      if (!seat) return err("invalid seat token", 401);
      const b = await req.json().catch(() => ({}));
      const taskId = str(b.task_id);
      const kind = str(b.kind);
      let body = str(b.body);
      const LIMITS = { note: 1200, objection: 1500, draft: 6e3, vote: 300, verify: 3e3, final: 9e3, status: 500, speak: 1200, feedback: 600, todo: 1200, question_to_user: 1200 };
      if (!taskId || !(kind in LIMITS) || !body.trim()) return err("task_id, valid kind and body are required");
      let truncated = false;
      if (body.length > LIMITS[kind]) {
        body = body.slice(0, LIMITS[kind]);
        truncated = true;
      }
      const { data: task } = await sb.from("cr_tasks").select("*").eq("id", taskId).maybeSingle();
      if (!task) return err("task not found", 404);
      const metaIn = b.meta && typeof b.meta === "object" ? b.meta : {};
      if (kind === "vote" && typeof metaIn.approve !== "boolean") return err("vote requires meta.approve (true|false) and meta.reason");
      if (kind === "speak" && body.length > 1200) return err("speak is limited to 1200 characters");
      let taskForTick = task;
      if (seat.seat === 1 && kind === "note" && task.phase === "research" && (metaIn.needs_research === false || Array.isArray(metaIn.domains))) {
        const domains2 = Array.isArray(metaIn.domains) ? metaIn.domains.filter((d) => DOMAINS.includes(String(d))).slice(0, 2) : task.state?.domains;
        taskForTick = await patchTask(task, { state: { ...task.state, ...metaIn.needs_research === false ? { needs_research: false } : {}, ...domains2?.length ? { domains: domains2 } : {} } });
      }
      const role = kind === "final" ? "council" : "agent";
      const author = `Seat ${seat.seat} \xB7 ${seat.role}`;
      const msg = await insertMessage({
        session_id: task.session_id,
        role,
        author,
        kind,
        body,
        meta: {
          ...metaIn,
          seat: seat.seat,
          role: seat.role,
          task_id: task.id,
          round: task.round,
          truncated,
          agent_name: seat.agent_name,
          ...kind === "vote" ? { reason: trim(metaIn.reason, 300) } : {}
        }
      });
      if (!msg) return err("could not store message", 500);
      const domains = taskForTick.state?.domains || ["language"];
      let trackDelta = 0.5;
      if (kind === "verify" && Array.isArray(metaIn.claims)) trackDelta = metaIn.claims.some((c) => c.verdict === "wrong") ? 0.42 : 0.62;
      if (kind === "objection") trackDelta = 0.58;
      if (kind === "vote") trackDelta = metaIn.approve ? 0.56 : 0.46;
      const nextProfile = mutateTrack(seat.profile, domains, trackDelta);
      await sb.from("cr_seats").update({ last_seen: nowISO(), status: "idle", profile: nextProfile }).eq("seat", seat.seat);
      await advanceTask(taskForTick);
      return json({ ok: true, message_id: msg.id, seq: msg.seq });
    }
    if (route === "draw" && method === "POST") {
      const admin = isAdmin(url, req);
      let seat = null;
      if (!admin) {
        seat = await seatFromToken(req, url);
        if (!seat) return err("invalid seat token (illustrator only, or admin)", 401);
        if (seat.role !== "illustrator") return err("only the illustrator seat (seat 9) may draw, or an admin", 403);
      }
      const b = await req.json().catch(() => ({}));
      const sheetId = str(b.sheet_id);
      if (!sheetId) return err("sheet_id is required");
      const ops = (Array.isArray(b.ops) ? b.ops : []).slice(0, 200).map(sanitizeOp).filter(Boolean);
      if (!ops.length) return err("no valid ops");
      const author = admin ? "admin" : "illustrator";
      const inserted = await insertOps(sheetId, author, ops);
      const { data: sheet } = await sb.from("cr_sheets").select("session_id, idx").eq("id", sheetId).maybeSingle();
      if (sheet) {
        const { data: t } = await sb.from("cr_tasks").select("*").eq("session_id", sheet.session_id).eq("phase", "draw").order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (t) await sb.from("cr_tasks").update({ state: { ...t.state, drawn: true }, updated_at: nowISO() }).eq("id", t.id);
        await insertMessage({
          session_id: sheet.session_id,
          role: "council",
          author: admin ? "admin" : "Seat 9 \xB7 illustrator",
          kind: "board_event",
          body: `Illustrator drew ${inserted.length} operation(s) on Sheet ${sheet.idx}.`,
          meta: { sheet_id: sheetId, count: inserted.length }
        });
        await tick(sheet.session_id);
      }
      return json({ ok: true, inserted: inserted.length });
    }
    if (route === "memory" && method === "GET") {
      const sessionId = str(url.searchParams.get("session_id"));
      if (!sessionId) return err("session_id is required");
      return json({ memory: await sessionMemory(sessionId) });
    }
    if (route === "memory" && method === "POST") {
      const seat = await seatFromToken(req, url);
      const admin = isAdmin(url, req);
      if (!admin && (!seat || seat.role !== "scribe")) return err("only the scribe or admin may update memory", 403);
      const b = await req.json().catch(() => ({}));
      const sessionId = str(b.session_id);
      const body = trim(b.body, 2500);
      if (!sessionId || !body) return err("session_id and body are required");
      const updatedBy = admin ? "admin" : `Seat ${seat.seat} \xB7 scribe`;
      await sb.from("cr_memory").upsert({ session_id: sessionId, body, updated_at: nowISO(), updated_by: updatedBy });
      return json({ ok: true, memory: { body, updated_at: nowISO(), updated_by: updatedBy } });
    }
    if (route === "search" && method === "GET") {
      const sessionId = str(url.searchParams.get("session_id")), q = str(url.searchParams.get("q"));
      if (!sessionId || !q) return err("session_id and q are required");
      const terms = normal(q).split(" ").filter((x) => x.length > 2).slice(0, 10).join(" & ");
      const { data } = await sb.from("cr_messages").select("seq,kind,author,body,created_at").eq("session_id", sessionId).textSearch("search_vector", terms).order("seq").limit(8);
      return json({ hits: (data ?? []).map((m) => ({ seq: m.seq, kind: m.kind, author: m.author, created_at: m.created_at, snippet: trim(m.body, 500) })) });
    }
    if (route === "stats" && method === "GET") {
      const [{ data: tasks }, seats] = await Promise.all([sb.from("cr_tasks").select("phase,round,created_at,updated_at"), getSeats()]);
      const finished = (tasks ?? []).filter((t) => ["done", "final", "draw"].includes(t.phase));
      const mean = finished.length ? Math.round(finished.reduce((sum, t) => sum + Math.max(0, new Date(t.updated_at).getTime() - new Date(t.created_at).getTime()), 0) / finished.length / 1e3) : 0;
      return json({ questions_answered: finished.length, mean_deliberation_s: mean, rounds_per_question: finished.length ? Number((finished.reduce((n, t) => n + Number(t.round || 1), 0) / finished.length).toFixed(2)) : 0, agreement_rate: finished.length ? Number((finished.filter((t) => Number(t.round || 1) === 1).length / finished.length).toFixed(2)) : 0, scorecards: seats.map((s) => ({ seat: s.seat, role: s.role, calibration: profileOf(s).calibration, track: profileOf(s).track })) });
    }
    if (route === "export" && method === "GET") {
      if (!isAdmin(url, req)) return err("admin key required (?admin=KEY)", 403);
      const sessionId = str(url.searchParams.get("session_id"));
      if (!sessionId) return err("session_id is required");
      const [{ data: session }, { data: messages }, { data: tasks }, { data: sheets }, memory, { data: files }, { data: media }] = await Promise.all([
        sb.from("cr_sessions").select("*").eq("id", sessionId).maybeSingle(),
        sb.from("cr_messages").select("*").eq("session_id", sessionId).order("seq"),
        sb.from("cr_tasks").select("*").eq("session_id", sessionId),
        sb.from("cr_sheets").select("*").eq("session_id", sessionId).order("idx"),
        sessionMemory(sessionId),
        sb.from("cr_files").select("*").or(`session_id.eq.${sessionId},session_id.is.null`).is("deleted_at", null),
        sb.from("cr_media").select("*").eq("session_id", sessionId)
      ]);
      if (!session) return err("session not found", 404);
      const enc = new TextEncoder();
      const safeTitle = String(session.title).replace(/[^a-z0-9_-]+/gi, "-").slice(0, 60) || "session";
      const root = `${safeTitle}-${sessionId}`;
      const transcript = (messages ?? []).map((m) => `## ${m.seq} \xB7 ${m.author} \xB7 ${m.kind}

${m.body}
`).join("\n");
      const entries = [{ name: `${root}/transcript.md`, bytes: enc.encode(transcript) }, { name: `${root}/MEMORY.md`, bytes: enc.encode(memory.body || "") }, { name: `${root}/manifest.json`, bytes: enc.encode(JSON.stringify({ session, files, media, sheets }, null, 2)) }];
      for (const task of tasks ?? []) {
        const rows = (messages ?? []).filter((m) => m.meta?.task_id === task.id && ["note", "objection", "verify", "vote", "draft"].includes(m.kind));
        entries.push({ name: `${root}/deliberation/${task.id}.md`, bytes: enc.encode(rows.map((m) => `## ${m.author} \xB7 ${m.kind}

${m.body}`).join("\n\n")) });
      }
      for (const sh of sheets ?? []) if (sh.png_path) {
        const { data } = await sb.storage.from("classroom").download(sh.png_path);
        if (data) entries.push({ name: `${root}/sheets/${sh.idx}-${String(sh.title).replace(/[^a-z0-9_-]+/gi, "-")}.png`, bytes: new Uint8Array(await data.arrayBuffer()) });
      }
      const zip = zipStore(entries);
      return new Response(zip, { headers: { ...CORS, "content-type": "application/zip", "content-disposition": `attachment; filename="${safeTitle}.zip"` } });
    }
    if (route === "transcript" && method === "GET") {
      const sessionId = str(url.searchParams.get("session_id"));
      const from = Math.max(0, parseInt(url.searchParams.get("from") ?? "0", 10) || 0);
      const to = Math.max(from, parseInt(url.searchParams.get("to") ?? "0", 10) || 0);
      const limit = Math.min(40, parseInt(url.searchParams.get("limit") ?? "40", 10) || 40);
      if (!sessionId) return err("session_id is required");
      let q = sb.from("cr_messages").select("*").eq("session_id", sessionId).order("seq").limit(limit);
      if (from) q = q.gte("seq", from);
      if (to) q = q.lte("seq", to);
      const { data } = await q;
      return json({ messages: data ?? [] });
    }
    if (["reset", "kick", "log", "settings"].includes(segs[0])) {
      if (!isAdmin(url, req)) return err("admin key required (?admin=KEY)", 403);
      if (route === "reset" && method === "POST") {
        const b = await req.json().catch(() => ({}));
        const sessionId = b.session_id ? str(b.session_id) : null;
        const hard = url.searchParams.get("hard") === "1";
        let q = sb.from("cr_tasks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (sessionId) q = q.eq("session_id", sessionId);
        await q;
        if (hard) {
          let mq = sb.from("cr_messages").delete().neq("id", 0);
          if (sessionId) mq = mq.eq("session_id", sessionId);
          await mq;
        }
        await sb.from("cr_seats").update({ token: null, agent_name: null, claimed_at: null, last_seen: null, status: "offline" }).gte("seat", 1);
        return json({ ok: true, cleared: "tasks+seats", kept: "sheets" + (hard ? "" : "+messages") });
      }
      if (route === "kick" && method === "POST") {
        const b = await req.json().catch(() => ({}));
        const seatNo = parseInt(String(b.seat ?? url.searchParams.get("seat") ?? ""), 10);
        if (!(seatNo >= 1 && seatNo <= 10)) return err("seat 1..10 required");
        await sb.from("cr_seats").update({ token: null, agent_name: null, claimed_at: null, last_seen: null, status: "offline" }).eq("seat", seatNo);
        return json({ ok: true, kicked: seatNo });
      }
      if (route === "log") {
        const [{ data: tasks }, { data: seats }, { data: msgs }] = await Promise.all([
          sb.from("cr_tasks").select("*").order("created_at", { ascending: false }).limit(20),
          sb.from("cr_seats").select("*").order("seat"),
          sb.from("cr_messages").select("id,session_id,seq,role,author,kind,created_at").order("id", { ascending: false }).limit(100)
        ]);
        return json({ tasks, seats, messages: msgs });
      }
      if (route === "settings" && method === "POST") {
        const b = await req.json().catch(() => ({}));
        const patch = {};
        for (const k of ["quorum", "phase_timeout_s", "max_rounds", "draw_timeout_s", "revise_timeout_s"]) {
          if (typeof b[k] === "number" && isFinite(b[k])) patch[k] = b[k];
        }
        const next = await putSettings(patch);
        return json({ ok: true, settings: next });
      }
      return err("unknown admin route", 404);
    }
    return err("not found", 404);
  } catch (e) {
    console.error("classroom error", e);
    return json({ error: "internal error: " + (e?.message ?? String(e)) }, 500);
  }
}
if (import.meta.main) Deno.serve(handler);
export {
  handler
};
