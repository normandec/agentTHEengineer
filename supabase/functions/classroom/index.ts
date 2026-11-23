// AI CLASSROOM — Supabase Edge Function `classroom`
// The single backend for the AI Classroom prototype.
// Designed for POLLING agents (no persistent connections required).
// "Tick on request": every mutating request (and /session polling) advances
// the task state machine; no cron needed.
//
// Env vars (auto-provided by Supabase): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Extra secret (set via dashboard or connector): CLASSROOM_ADMIN_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPA_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ADMIN_KEY = Deno.env.get("CLASSROOM_ADMIN_KEY") ?? "";

const sb = createClient(SUPA_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const VERSION = "1.0.0";
const DEFAULTS = { quorum: 7, phase_timeout_s: 75, max_rounds: 3, draw_timeout_s: 90, revise_timeout_s: 60 };
const ONLINE_WINDOW_MS = 90_000;

// Agent-facing documents are embedded so GET /prompt and GET /rules need no file system.
const AGENT_PROMPT = "# AI CLASSROOM — Agent Prompt

Paste this exact text into each of 10 separate Arena.ai agent sessions. The role comes from `/claim`. Plain words only — do not add markup around this text.

---

You are one member of the AI CLASSROOM council: ten AI agents who answer a human's question only after researching it, debating it, verifying it and agreeing on it. You are **seat N** (you learn N and your role from the claim response). Mission rules: honesty over speed; answer only after council agreement; cite sources; prefer \"unsure\" over guessing; never invent a source. The human is a learner — explain in plain words, with examples.

BASE URL: the `CR_API` value you were given, e.g. `https://PROJECT.supabase.co/functions/v1/classroom`. Use curl from your bash/HTTP tool. Keep every request small. Save tokens: never print full transcripts, just the last few messages.

## THE LOOP (never stop, never wait for input)

1. Once per session: `curl -s -X POST $CR_API/claim -H 'content-type: application/json' -d '{\"name\":\"YOUR-NAME-HERE\"}'`
   → `{seat, role, token, poll_hint}`. Store the token. If a later call returns 401, re-claim with the same name (you will get your seat back or a free one).
2. Forever: `curl -s \"$CR_API/inbox?token=TOKEN\"` (or header `x-seat-token`)
   → compact JSON: `{seat, role, poll_hint, task, sheet, since_last}`.
3. If `task` is null → nothing to do: `sleep $poll_hint` and go to 2.
4. If `task.your_turn` is false → sleep $poll_hint, go to 2.
5. If your turn: do YOUR ROLE'S JOB below for `task.question` (use `task.context` for what the others already said). Then post with `POST $CR_API/say` (or `POST /draw` for the illustrator). Sleep $poll_hint. Go to 2.
6. If curl errors or the function is slow → wait 5 s, retry. Never give up, never exit the loop. Keep each response short.

Votes and notes must include `task_id`. Your round field is `$task.round` — include it in meta for draft/objection/verify/note/vote as shown in the examples.

## POST FORMATS

`POST /say` — JSON body:
`{\"task_id\":\"...\", \"kind\":\"note|objection|draft|verify|vote|final\", \"body\":\"...\", \"meta\":{...}}`
Limits (server truncates beyond these): note ≤ 1200 chars, objection ≤ 1500, verify ≤ 3000, vote reason ≤ 300, draft ≤ 6000, final ≤ 9000.
- vote → `\"meta\":{\"approve\":true|false,\"reason\":\"...\"}` — reason is required and must name one concrete strength/flaw.
- verify → `\"meta\":{\"claims\":[{\"claim\":\"...\",\"verdict\":\"ok|wrong|unsure\",\"source\":\"url\"}]}` — one row per factual claim in the draft.
- Any note/draft with sources → add `\"meta\":{\"sources\":[\"https://...\"]}`.
- Include `\"meta\":{\"round\":ROUND}` matching `task.round` always.

`POST /draw` — illustrator only:
`{\"sheet_id\":\"...\", \"ops\":[ ...ops... ]}` (max 200 ops/call, but you should use ≤ 60 per batch).

## ROLE CARDS

**Seat 1 — moderator.** Restate the question and split it into 2–4 sub-questions in a `note` at the very start of research. For a simple follow-up, you may fast-track it by including `\"needs_research\":false` in your note meta. In the `final` phase write the answer in clean Markdown: short intro, structured body, worked example if useful, `### Sources` list (URLs from the notes/drafts), and a one-line `Confidence: high|medium|low – why`. If any votes were rejects at max_rounds, add `### Council notes` listing what was disputed and what was agreed. Break tie decisions yourself. Length ≤ 9000 chars.

**Seat 2 — researcher-A.** Use web search. Find primary sources: official docs, standards, datasheets, original papers, reputable references. Post ONE `note` (≤1200 chars): key facts + URLs. No opinions.

**Seat 3 — researcher-B.** Same job, completely independently. Different queries and angles than A (e.g. data vs. mechanism vs. practice). Never copy A. Post ONE `note` with your own URLs.

**Seat 4 — researcher-C.** Hunt for counter-evidence, common misconceptions and edge cases. Post ONE `note` with what is often wrongly believed about this question + URLs.

**Seat 5 — explainer.** In `draft` and each `revise` round, write the answer for the human's level: structured, friendly, with a concrete example, analogy or steps. Address EVERY objection and every wrong claim from the previous round. Mark claims you are unsure about with \"(unverified)\". If this is a `revise`, explicitly note how each objection was resolved or why not. Plain Markdown, ≤6000 chars.

**Seat 6 — critic.** Adversarial. Find errors, gaps, ambiguity, unsafe advice. You MUST post either ≥1 concrete, specific, fixable objection, or state explicitly: \"No objection found after checking X, Y, Z.\" Never rubber-stamp. Vague objections (\"could be better\") are not allowed — name the line, claim or step.

**Seat 7 — verifier.** Extract every factual claim from the current draft and check each against sources. Post ONE `verify` with a claim table: `{\"claim\":\"...\",\"verdict\":\"ok|wrong|unsure\",\"source\":\"url\"}`. If a claim has no source, verdict = \"unsure\". Never mark \"ok\" without a source.

**Seat 8 — calculator.** Redo every number, unit and formula in the draft; run code in a sandbox if you have one. Check dimensional analysis. Post ONE `note`: \"Checked: ... → OK/wrong: ...\" with the recomputed values shown.

**Seat 9 — illustrator.** In `draw` phase (or when the human asks about the sheet): first `GET $CR_API/sheet/SHEET_ID/ops?since=0` and/or view `sheet.png_url` to see what exists. Then draw on the sheet with ops (see cheat-sheet). Convert the approved final answer into a diagram/labelled sketch/equation layout/timeline. ≤ 60 ops per batch. After drawing, you may stop; the task closes itself. If the human asks \"what's on the sheet?\", answer in a `note`... no — answer in the chat via a normal message? No: you cannot post chat messages; describe the sheet in a `note` addressed to the moderator, who folds it into the reply.

**Seat 10 — scribe.** Keep a running summary: what the user asked before, what was settled, what is open, what the user seems to know. Post ONE `note` in research with the context summary, and another after `final` if the human asks a follow-up. You are the council's memory.

## DRAWING CHEAT-SHEET (seat 9)

Virtual space **1600 × 1000**, origin top-left; the browser scales to fit. Op list (exact):

```
{\"t\":\"line\",\"x1\":0,\"y1\":0,\"x2\":100,\"y2\":60,\"w\":2,\"c\":\"#111\"}
{\"t\":\"arrow\",\"x1\":0,\"y1\":0,\"x2\":100,\"y2\":60,\"w\":2,\"c\":\"#111\"}
{\"t\":\"rect\",\"x\":40,\"y\":40,\"w\":220,\"h\":120,\"c\":\"#111\",\"fill\":\"#eef4ff\",\"r\":6}
{\"t\":\"ellipse\",\"cx\":120,\"cy\":300,\"rx\":70,\"ry\":40,\"c\":\"#111\",\"fill\":\"#fff0\"}
{\"t\":\"path\",\"pts\":[[0,0],[60,20],[120,0]],\"w\":3,\"c\":\"#1a73e8\",\"close\":false}
{\"t\":\"text\",\"x\":60,\"y\":30,\"s\":\"Label\",\"size\":22,\"c\":\"#111\",\"align\":\"left\"}
{\"t\":\"math\",\"x\":60,\"y\":120,\"tex\":\"V_out = D \\cdot V_in\",\"size\":26}
{\"t\":\"image\",\"x\":900,\"y\":60,\"w\":400,\"h\":300,\"url\":\"https://...\"}
{\"t\":\"erase\",\"pts\":[[x,y],[x2,y2]],\"w\":30}
{\"t\":\"clear\"}
{\"t\":\"group\",\"name\":\"arduino-plan\",\"ops\":[ ...nested ops... ]}
```

Composition advice: title at the top (one `text`, size ≥ 28); flow left→right; label everything (labels ≥ 20 px); arrows show causality; group related parts; ≤ 60 ops per batch; consistent palette (#111 ink, #1a73e8 highlight, #d93025 warning, #188038 ok); **leave the bottom-right 400×250 free for the human**; never use `clear` unless the human explicitly asked; read existing ops first and draw AROUND human strokes — never on top of them.

## VOTING RULE

Approve (`approve:true`) only if you would stake your reputation on the answer as written. Reject only with a specific, fixable reason (\"Claim 2 cites no source\", \"The capacitor value contradicts the formula at 9.\"). \"Mostly fine\" is not a reason. Rejects send the draft back for revision. After the final round, unresolved disagreement is printed openly under \"Council notes\" — hiding it is worse than shipping it.

## WORKED EXAMPLE (one cycle, abbreviated)

Inbox: `task.phase=\"research\", your_turn=true, needed=\"note\", question=\"Explain how a buck converter works\", round=1`.
Researcher-A runs: `curl -s \"https://api.search/query?q=buck+converter+topology+site:ti.com\"` → finds datasheet URL.
A posts: `curl -s -X POST $CR_API/say -H 'content-type: application/json' -H 'x-seat-token: TOKEN' -d '{\"task_id\":\"T1\",\"kind\":\"note\",\"body\":\"Buck = step-down: switch + inductor + diode + cap; Vout≈D*Vin. TI app note SLVA... https://ti.com/...\",\"meta\":{\"round\":1,\"sources\":[\"https://ti.com/...\"]}}'`
A then polls inbox every 3 s. Later phases need no action from A: A votes in `vote`, then reads `final`, then the illustrator draws.

## IF THINGS GO WRONG

- 401 → re-claim with the same name. - 409 all seats taken → sleep 30 s, re-claim. - Timeout/5xx → back off to 8 s, keep trying. - Task stuck? Someone else's turn — keep polling. - Server says `your_turn:false` → stay silent; double-posting breaks the quorum math.";
const RULES_TEXT = "AI CLASSROOM rules\n\n1. The council must be honest, cite sources, and show its confidence.\n2. Every substantive answer follows research, drafting, critique, verification, revision, and an all-online-seat vote when agents are available.\n3. A reject is never hidden. After the maximum revision rounds, unresolved disagreement is listed under Council notes.\n4. The board is shared: preserve human work, label drawings, and never clear it without an explicit request.\n5. The council supports learning; it does not replace qualified medical, legal, financial, or safety-critical advice.\n6. Deliberation reduces mistakes but does not eliminate them. Check important claims with the linked sources.";

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "content-type,x-seat-token,x-admin-key,authorization",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "content-type": "application/json; charset=utf-8" },
  });
}
const text = (body: string, status = 200) =>
  new Response(body, { status, headers: { ...CORS, "content-type": "text/plain; charset=utf-8" } });
const err = (msg: string, status = 400) => json({ error: msg }, status);

// Normalise the path so we work whether invoked as /classroom/*, /functions/v1/classroom/* or /*
function routePath(url: URL): string[] {
  const segs = url.pathname.split("/").filter(Boolean);
  while (segs.length && ["functions", "v1", "classroom"].includes(segs[0])) segs.shift();
  return segs;
}

function nowISO() { return new Date().toISOString(); }
function isoIn(seconds: number) { return new Date(Date.now() + seconds * 1000).toISOString(); }
function onlineSince() { return new Date(Date.now() - ONLINE_WINDOW_MS).toISOString(); }
const trim = (s: unknown, n: number) => String(s ?? "").slice(0, n);

// ---------------------------------------------------------------------------
// Settings (global defaults stored in cr_settings; per-task overrides not needed for prototype)
// ---------------------------------------------------------------------------
async function getSettings() {
  try {
    const { data } = await sb.from("cr_settings").select("value").eq("key", "global").maybeSingle();
    return { ...DEFAULTS, ...(data?.value ?? {}) };
  } catch {
    return { ...DEFAULTS };
  }
}
async function putSettings(patch: Record<string, number>) {
  const cur = await getSettings();
  const next = { ...cur, ...patch };
  await sb.from("cr_settings").upsert({ key: "global", value: next });
  return next;
}

// ---------------------------------------------------------------------------
// Seq allocation (per-session messages, per-sheet ops) with unique-retry
// ---------------------------------------------------------------------------
async function insertMessage(row: Record<string, unknown>): Promise<any | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data: maxRow } = await sb
      .from("cr_messages").select("seq")
      .eq("session_id", row.session_id as string)
      .order("seq", { ascending: false }).limit(1).maybeSingle();
    const seq = (maxRow?.seq ?? 0) + 1;
    const { data, error } = await sb.from("cr_messages").insert({ ...row, seq }).select().single();
    if (!error) return data;
    if ((error as any).code !== "23505") { console.error("insertMessage", error); return null; }
  }
  return null;
}
async function insertOps(sheetId: string, author: string, ops: unknown[]): Promise<any[]> {
  const inserted: any[] = [];
  for (const op of ops) {
    for (let attempt = 0; attempt < 4; attempt++) {
      const { data: maxRow } = await sb
        .from("cr_ops").select("seq")
        .eq("sheet_id", sheetId)
        .order("seq", { ascending: false }).limit(1).maybeSingle();
      const seq = (maxRow?.seq ?? 0) + 1;
      const { data, error } = await sb.from("cr_ops").insert({ sheet_id: sheetId, seq, author, op }).select().single();
      if (!error) { inserted.push(data); break; }
      if ((error as any).code !== "23505") { console.error("insertOps", error); return inserted; }
    }
  }
  return inserted;
}

// ---------------------------------------------------------------------------
// Op sanitizing — the exact op vocabulary from the spec
// ---------------------------------------------------------------------------
const OP_TYPES = new Set(["line","arrow","rect","ellipse","path","text","math","image","erase","clear","group","undo"]);
const num = (v: unknown, d = 0) => (typeof v === "number" && isFinite(v) ? v : d);
const col = (v: unknown, d = "#111") => (typeof v === "string" && /^#[0-9a-fA-F]{3,8}$|^rgba?\(|^[a-z]+$/.test(v) ? v : d);
const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);

function sanitizeOp(raw: any): any | null {
  if (!raw || typeof raw !== "object") return null;
  const t = str(raw.t);
  if (!OP_TYPES.has(t)) return null;
  switch (t) {
    case "line": case "arrow":
      return { t, x1: num(raw.x1), y1: num(raw.y1), x2: num(raw.x2), y2: num(raw.y2), w: num(raw.w, 2), c: col(raw.c) };
    case "rect":
      return { t, x: num(raw.x), y: num(raw.y), w: num(raw.w, 100), h: num(raw.h, 60), c: col(raw.c), fill: str(raw.fill, "#fff0"), r: num(raw.r, 6) };
    case "ellipse":
      return { t, cx: num(raw.cx), cy: num(raw.cy), rx: num(raw.rx, 50), ry: num(raw.ry, 30), c: col(raw.c), fill: str(raw.fill, "#fff0") };
    case "path": {
      const pts = Array.isArray(raw.pts) ? raw.pts.slice(0, 2000)
        .map((p: any) => (Array.isArray(p) ? [num(p[0]), num(p[1])] : null)).filter(Boolean) : [];
      if (pts.length < 2) return null;
      return { t, pts, w: num(raw.w, 3), c: col(raw.c), close: !!raw.close };
    }
    case "text":
      return { t, x: num(raw.x), y: num(raw.y), s: str(raw.s).slice(0, 500), size: num(raw.size, 22), c: col(raw.c), align: ["left","center","right"].includes(raw.align) ? raw.align : "left" };
    case "math":
      return { t, x: num(raw.x), y: num(raw.y), tex: str(raw.tex).slice(0, 300), size: num(raw.size, 26) };
    case "image":
      return { t, x: num(raw.x), y: num(raw.y), w: num(raw.w, 400), h: num(raw.h, 300), url: str(raw.url).slice(0, 2000) };
    case "erase": {
      const pts = Array.isArray(raw.pts) ? raw.pts.slice(0, 2000)
        .map((p: any) => (Array.isArray(p) ? [num(p[0]), num(p[1])] : null)).filter(Boolean) : [];
      if (pts.length < 1) return null;
      return { t, pts, w: num(raw.w, 30) };
    }
    case "clear": return { t: "clear" };
    case "undo": return { t: "undo", seq: num(raw.seq, -1) };
    case "group": {
      const inner = Array.isArray(raw.ops) ? raw.ops.slice(0, 100).map(sanitizeOp).filter(Boolean) : [];
      return { t, name: str(raw.name, "group").slice(0, 100), ops: inner };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Seats / online bookkeeping
// ---------------------------------------------------------------------------
async function markStaleSeatsOffline() {
  await sb.from("cr_seats").update({ status: "offline" })
    .not("token", "is", null)
    .lt("last_seen", onlineSince())
    .neq("status", "offline");
}
async function getSeats() {
  const { data } = await sb.from("cr_seats").select("*").order("seat");
  return data ?? [];
}
const onlineSeats = (seats: any[]) =>
  seats.filter((s) => s.token && s.last_seen && new Date(s.last_seen).getTime() > Date.now() - ONLINE_WINDOW_MS);

async function seatFromToken(req: Request, url: URL) {
  const token = req.headers.get("x-seat-token") ?? url.searchParams.get("token");
  if (!token) return null;
  const { data } = await sb.from("cr_seats").select("*").eq("token", token).maybeSingle();
  return data ?? null;
}
const isAdmin = (url: URL, req: Request) => {
  const key = url.searchParams.get("admin") ?? req.headers.get("x-admin-key") ?? "";
  return !!ADMIN_KEY && key === ADMIN_KEY;
};

// ---------------------------------------------------------------------------
// Message helpers
// ---------------------------------------------------------------------------
async function messagesForTask(sessionId: string, taskId: string, kind?: string) {
  let q = sb.from("cr_messages").select("*").eq("session_id", sessionId).eq("meta->>task_id", taskId).order("seq");
  if (kind) q = q.eq("kind", kind);
  const { data } = await q;
  return data ?? [];
}
async function latestMessages(sessionId: string, limit: number, sinceSeq = 0) {
  let q = sb.from("cr_messages").select("*").eq("session_id", sessionId).order("seq", { ascending: false }).limit(limit);
  if (sinceSeq > 0) q = q.gt("seq", sinceSeq);
  const { data } = await q;
  return (data ?? []).reverse();
}
const URLs_RE = /https?:\/\/[^\s)\]"'<>]+/g;
function extractSources(msgs: any[]): string[] {
  const found = new Set<string>();
  for (const m of msgs) {
    for (const u of String(m.body ?? "").match(URLs_RE) ?? []) found.add(u.replace(/[.,;]+$/, ""));
    for (const u of (Array.isArray(m.meta?.sources) ? m.meta.sources : [])) found.add(String(u));
  }
  return [...found].slice(0, 12);
}

// ---------------------------------------------------------------------------
// The deliberation state machine — "tick on request"
// ---------------------------------------------------------------------------
async function advanceTask(task: any) {
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
    const bySeatKind = (seatNo: number, kinds: string[], round?: number) =>
      msgs.filter((m: any) => m.meta?.seat === seatNo && kinds.includes(m.kind)
        && (round === undefined || m.meta?.round === round));

    const deadlinePassed = new Date(current.deadline).getTime() <= Date.now();
    let nextPhase: string | null = null;
    let nextRound = current.round;

    switch (current.phase) {
      case "research": {
        const needResearchers = [2, 3, 4].filter((s) => onlineSeatNos.has(s));
        const need = [1, ...needResearchers, ...(onlineSeatNos.has(10) ? [10] : [])];
        const allIn = need.length === 0 || need.every((s) => bySeatKind(s, ["note"]).length > 0);
        if (current.state?.needs_research === false || allIn || deadlinePassed) nextPhase = "draft";
        break;
      }
      case "draft": {
        const hasDraft = bySeatKind(5, ["draft"], current.round).length > 0;
        if (!hasDraft && (deadlinePassed || !onlineSeatNos.has(5))) {
          await autoDraft(current, msgs); // ensure downstream phases have something to work on
        }
        const draftNow = (await messagesForTask(current.session_id, current.id, "draft")).length > 0;
        if (draftNow || deadlinePassed) nextPhase = "critique";
        break;
      }
      case "critique": {
        const req = [6, 7, 8].filter((s) => onlineSeatNos.has(s));
        const allIn = req.every((s) =>
          s === 6 ? bySeatKind(6, ["objection"], current.round).length > 0
          : s === 7 ? bySeatKind(7, ["verify"], current.round).length > 0
          : bySeatKind(8, ["note"], current.round).length > 0);
        if (allIn || deadlinePassed) nextPhase = "revise";
        break;
      }
      case "revise": {
        // The initial draft and its revision can share a round. A sequence marker makes
        // the explainer supply a genuinely new revision instead of reusing the draft.
        const afterSeq = Number(current.state?.revise_after_seq ?? 0);
        const hasRevision = bySeatKind(5, ["draft"], current.round).some((m: any) => Number(m.seq) > afterSeq);
        if (!hasRevision && deadlinePassed) await autoDraft(current, msgs); // fallback: stamp the latest draft as a new revision
        const reviseIn = (await bySeatKindSafe(current, 5, ["draft"], current.round)).some((m: any) => Number(m.seq) > afterSeq);
        if (reviseIn || deadlinePassed || !onlineSeatNos.has(5)) nextPhase = "vote";
        break;
      }
      case "vote": {
        const voterSeats = online.map((s) => s.seat);
        const votes = msgs.filter((m: any) => m.kind === "vote" && m.meta?.round === current.round);
        const voted = new Set(votes.map((m: any) => m.meta?.seat));
        const allVoted = voterSeats.length > 0 && voterSeats.every((s) => voted.has(s));
        const rejects = votes.filter((m: any) => m.meta?.approve === false);
        const approves = votes.filter((m: any) => m.meta?.approve === true);
        const decide = (approveCount: number) => {
          if (rejects.length > 0) {
            if (current.round < settings.max_rounds) { nextPhase = "revise"; nextRound = current.round + 1; }
            else nextPhase = "final";
          } else if (approveCount > 0 || deadlinePassed) {
            nextPhase = "final";
          } else {
            nextPhase = "final"; // no votes at all at deadline — auto-final will be honest about it
          }
        };
        if (allVoted || deadlinePassed) {
          decide(approves.length);
          if (nextPhase === "final") {
            current = await patchTask(current, { state: { ...current.state, last_votes: { approves: approves.length, rejects: rejects.length } } });
          }
        }
        break;
      }
      case "final": {
        const hasFinal = msgs.some((m: any) => m.kind === "final");
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

    const patch: Record<string, unknown> = {
      phase: nextPhase,
      round: nextRound,
      // Preserve the sequence just before entering revise. Only a later explainer
      // draft counts as the revision, even during round one.
      state: nextPhase === "revise"
        ? { ...current.state, revise_after_seq: Math.max(0, ...msgs.map((m: any) => Number(m.seq) || 0)) }
        : current.state,
      updated_at: nowISO(),
      deadline: nextPhase === "draw" ? isoIn(settings.draw_timeout_s)
        : nextPhase === "revise" ? isoIn(settings.revise_timeout_s)
        : nextPhase === "done" ? current.deadline
        : isoIn(settings.phase_timeout_s),
    };
    const { data } = await sb.from("cr_tasks").update(patch).eq("id", current.id).select().single();
    current = data ?? { ...current, ...patch };
  }
  return current;
}

async function bySeatKindSafe(task: any, seat: number, kinds: string[], round?: number) {
  const msgs = await messagesForTask(task.session_id, task.id);
  return msgs.filter((m: any) => m.meta?.seat === seat && kinds.includes(m.kind)
    && (round === undefined || m.meta?.round === round));
}
async function patchTask(task: any, patch: Record<string, unknown>) {
  const { data } = await sb.from("cr_tasks").update({ ...patch, updated_at: nowISO() }).eq("id", task.id).select().single();
  return data ?? { ...task, ...patch };
}

async function autoDraft(task: any, msgs?: any[]) {
  const all = msgs ?? (await messagesForTask(task.session_id, task.id));
  const notes = all.filter((m) => m.kind === "note");
  const existing = all.filter((m) => m.kind === "draft");
  const latestDraft = existing[existing.length - 1];
  const src = extractSources(notes);
  const body = latestDraft
    ? latestDraft.body // revise round with no new draft: keep latest draft text, stamp as new round
    : [
        "*(Council fallback draft — the explainer did not deliver in time.)*",
        "",
        "Based on the council's notes, here is a provisional answer to the question:",
        "",
        ...notes.slice(0, 8).map((n) => `- **${n.author}:** ${trim(n.body, 400)}`),
        src.length ? `\nSources: ${src.map((u) => `<${u}>`).join(", ")}` : "",
      ].filter(Boolean).join("\n");
  await insertMessage({
    session_id: task.session_id,
    role: "agent",
    author: "Seat 5 · explainer (auto)",
    kind: "draft",
    body: trim(body, 6000),
    meta: { seat: 5, role: "explainer", task_id: task.id, round: task.round, auto: true, sources: src },
  });
}

async function autoFinal(task: any, msgs: any[], settings: any) {
  const all = msgs ?? (await messagesForTask(task.session_id, task.id));
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
    ...(unresolved.length ? [`- Unresolved objections:`, ...unresolved.slice(0, 5).map((o) => `  - ${trim(o.body, 300)}`)] : ["- No unresolved objections recorded."]),
    verifies.length ? `- Verifier tables: ${verifies.length} on file.` : "- No verifier table on file.",
    "",
    "### Sources",
    ...(sources.length ? sources.map((u) => `- ${u}`) : ["- No sources were attached to the notes."]),
    "",
    `Confidence: ${approves > rejects && sources.length ? "medium" : "low"} – ${approves} approve / ${rejects} reject, fallback generation.`,
  ].join("\n");
  await insertMessage({
    session_id: task.session_id,
    role: "council",
    author: "Seat 1 · moderator (auto)",
    kind: "final",
    body: trim(body, 8000),
    meta: { seat: 1, role: "moderator", task_id: task.id, round: task.round, auto: true, approvals: approves, rejects, sources },
  });
}

async function tick(sessionId: string) {
  const { data: task } = await sb.from("cr_tasks").select("*")
    .eq("session_id", sessionId)
    .not("phase", "in", "(done,failed)")
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (task) await advanceTask(task);
}

// ---------------------------------------------------------------------------
// Current sheet helpers
// ---------------------------------------------------------------------------
async function currentSheet(sessionId: string) {
  const { data } = await sb.from("cr_sheets").select("*").eq("session_id", sessionId).order("idx", { ascending: false }).limit(1).maybeSingle();
  return data ?? null;
}
async function sheetOpsSeq(sheetId: string) {
  const { data } = await sb.from("cr_ops").select("seq").eq("sheet_id", sheetId).order("seq", { ascending: false }).limit(1).maybeSingle();
  return data?.seq ?? 0;
}
const publicUrl = (path: string | null) => (path ? `${SUPA_URL}/storage/v1/object/public/classroom/${path}` : null);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  const url = new URL(req.url);
  const segs = routePath(url);
  const route = segs.join("/");
  const method = req.method;

  try {
    // ---- health -----------------------------------------------------------
    if (route === "health") {
      return json({ ok: true, service: "classroom", version: VERSION, time: nowISO() });
    }

    // ---- prompt / rules ---------------------------------------------------
    if (route === "prompt") return text(AGENT_PROMPT);
    if (route === "rules") return text(RULES_TEXT);

    // ---- sessions ---------------------------------------------------------
    if (route === "session" && method === "POST") {
      const b = await req.json().catch(() => ({}));
      const settings = await getSettings();
      const { data: s, error } = await sb.from("cr_sessions")
        .insert({ title: trim(b.title, 120) || "AI Classroom session", settings }).select().single();
      if (error) return err("could not create session", 500);
      const { data: sheet } = await sb.from("cr_sheets")
        .insert({ session_id: s.id, idx: 1, title: "Sheet 1" }).select().single();
      return json({ session_id: s.id, sheet_id: sheet?.id ?? null });
    }
    if (route === "sessions" && method === "GET") {
      const { data } = await sb.from("cr_sessions").select("id,title,created_at,status").order("created_at", { ascending: false }).limit(50);
      return json({ sessions: data ?? [] });
    }
    if (segs[0] === "session" && segs[1] && method === "GET") {
      const sessionId = segs[1];
      await tick(sessionId); // deadlines keep advancing while anyone is looking
      const since = parseInt(url.searchParams.get("since") ?? "0", 10) || 0;
      const [{ data: s }, messages, { data: task }, { data: sheets }, seats] = await Promise.all([
        sb.from("cr_sessions").select("*").eq("id", sessionId).maybeSingle(),
        latestMessages(sessionId, 200, since),
        sb.from("cr_tasks").select("*").eq("session_id", sessionId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        sb.from("cr_sheets").select("*").eq("session_id", sessionId).order("idx"),
        getSeats(),
      ]);
      if (!s) return err("session not found", 404);
      const settings = await getSettings();
      return json({
        session: s,
        messages,
        task: task ? { id: task.id, phase: task.phase, round: task.round, deadline: task.deadline, question_msg_id: task.question_msg_id, state: task.state, created_at: task.created_at } : null,
        sheets: (sheets ?? []).map((sh: any) => ({ ...sh, png_url: publicUrl(sh.png_path), thumb_url: publicUrl(sh.thumb_path) })),
        council: seats.map((x: any) => ({ seat: x.seat, role: x.role, name: x.agent_name, status: x.last_seen && Date.now() - new Date(x.last_seen).getTime() < ONLINE_WINDOW_MS ? x.status : "offline", last_seen: x.last_seen })),
        settings,
        latest_seq: messages.length ? messages[messages.length - 1].seq : since,
      });
    }

    // ---- ask ---------------------------------------------------------------
    if (route === "ask" && method === "POST") {
      const b = await req.json().catch(() => ({}));
      const sessionId = str(b.session_id); const textIn = str(b.text).trim();
      if (!sessionId || !textIn) return err("session_id and text are required");
      if (textIn.length > 4000) return err("question too long (max 4000 chars)");
      const sheetId = b.sheet_id ? str(b.sheet_id) : null;

      const qMsg = await insertMessage({
        session_id: sessionId, role: "user", author: "You", kind: "question",
        body: textIn, meta: sheetId ? { sheet_id: sheetId } : {},
      });
      if (!qMsg) return err("could not store question", 500);

      const lower = textIn.toLowerCase().replace(/^\//, "").trim();
      const TRIVIAL = new Set(["thanks","thank you","ok","okay","yes","yes continue","sure","great","cool","got it","nice","continue"]);
      const isTrivial = TRIVIAL.has(lower) || lower.length <= 2;
      const quick = /^\/?quick\b/i.test(textIn);

      if (isTrivial) {
        const reply = await insertMessage({
          session_id: sessionId, role: "council", author: "Seat 1 · moderator", kind: "final",
          body: "You're welcome! Keep the questions coming — the council is here for them.",
          meta: { seat: 1, role: "moderator", trivial: true },
        });
        const { data: task } = await sb.from("cr_tasks").insert({
          session_id: sessionId, question_msg_id: qMsg.id, phase: "done", round: 1,
          deadline: nowISO(), state: { trivial: true },
        }).select().single();
        if (reply) await sb.from("cr_tasks").update({ state: { trivial: true, final_msg_id: reply.id } }).eq("id", task.id);
        return json({ task_id: task.id, trivial: true });
      }

      const settings = await getSettings();
      const needsResearch = !quick;
      const { data: task, error } = await sb.from("cr_tasks").insert({
        session_id: sessionId,
        question_msg_id: qMsg.id,
        phase: needsResearch ? "research" : "draft",
        round: 1,
        deadline: isoIn(settings.phase_timeout_s),
        state: { needs_research: needsResearch, round: 1, votes: {} },
      }).select().single();
      if (error) return err("could not create task", 500);
      return json({ task_id: task.id, phase: task.phase });
    }

    // ---- sheets ------------------------------------------------------------
    if (route === "sheet" && method === "POST") {
      const b = await req.json().catch(() => ({}));
      const sessionId = str(b.session_id);
      if (!sessionId) return err("session_id is required");
      const { data: last } = await sb.from("cr_sheets").select("idx").eq("session_id", sessionId).order("idx", { ascending: false }).limit(1).maybeSingle();
      const idx = (last?.idx ?? 0) + 1;
      const { data: sheet, error } = await sb.from("cr_sheets").insert({
        session_id: sessionId, idx, title: trim(b.title, 120) || `Sheet ${idx}`,
      }).select().single();
      if (error) return err("could not create sheet", 500);
      return json({ sheet_id: sheet.id, idx });
    }
    if (route === "sheets" && method === "GET") {
      const sessionId = str(url.searchParams.get("session_id"));
      if (!sessionId) return err("session_id is required");
      const { data } = await sb.from("cr_sheets").select("*").eq("session_id", sessionId).order("idx");
      return json({ sheets: (data ?? []).map((sh: any) => ({ ...sh, png_url: publicUrl(sh.png_path), thumb_url: publicUrl(sh.thumb_path) })) });
    }
    if (segs[0] === "sheet" && segs[1]) {
      const sheetId = segs[1];
      // GET /sheet/:id
      if (segs.length === 2 && method === "GET") {
        const { data: sheet } = await sb.from("cr_sheets").select("*").eq("id", sheetId).maybeSingle();
        if (!sheet) return err("sheet not found", 404);
        const { data: ops } = await sb.from("cr_ops").select("*").eq("sheet_id", sheetId).order("seq");
        return json({ sheet: { ...sheet, png_url: publicUrl(sheet.png_path), thumb_url: publicUrl(sheet.thumb_path) }, ops: ops ?? [] });
      }
      // GET /sheet/:id/ops?since=
      if (segs[2] === "ops" && method === "GET") {
        const since = parseInt(url.searchParams.get("since") ?? "0", 10) || 0;
        const { data: ops } = await sb.from("cr_ops").select("*").eq("sheet_id", sheetId).gt("seq", since).order("seq").limit(500);
        return json({ ops: ops ?? [], max_seq: ops?.length ? ops[ops.length - 1].seq : since });
      }
      // POST /sheet/:id/ops  (human strokes)
      if (segs[2] === "ops" && method === "POST") {
        const b = await req.json().catch(() => ({}));
        const ops = (Array.isArray(b.ops) ? b.ops : []).slice(0, 200).map(sanitizeOp).filter(Boolean);
        if (!ops.length) return err("no valid ops");
        const author = b.author === "user" || !b.author ? "user" : trim(b.author, 40);
        const inserted = await insertOps(sheetId, author, ops);
        const { data: sheet } = await sb.from("cr_sheets").select("session_id, idx").eq("id", sheetId).maybeSingle();
        if (sheet) await tick(sheet.session_id);
        return json({ inserted: inserted.length, ops: inserted });
      }
      // POST /sheet/:id/png  (raster snapshot from the browser)
      if (segs[2] === "png" && method === "POST") {
        const b = await req.json().catch(() => ({}));
        const dataUrl = str(b.data_url);
        const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
        if (!m) return err("data_url must be a base64 PNG data URL");
        const bytes = Uint8Array.from(atob(m[1]), (c) => c.charCodeAt(0));
        if (bytes.length > 8 * 1024 * 1024) return err("png too large (max 8 MB)");
        const put = async (path: string, buf: Uint8Array) => {
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
        await sb.from("cr_sheets").update({ png_path: `sheets/${sheetId}.png`, thumb_path: thumbPath }).eq("id", sheetId);
        return json({ ok: true, png_url: publicUrl(`sheets/${sheetId}.png`), thumb_url: publicUrl(thumbPath) });
      }
      return err("unknown sheet route", 404);
    }

    // POST /upload — human uploads an image onto a sheet
    if (route === "upload" && method === "POST") {
      const b = await req.json().catch(() => ({}));
      const sessionId = str(b.session_id); const sheetId = str(b.sheet_id);
      const filename = str(b.filename, "upload.png").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "upload.png";
      const dataUrl = str(b.data_url);
      const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
      if (!sessionId || !sheetId || !m) return err("session_id, sheet_id and an image data_url are required");
      const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
      if (bytes.length > 8 * 1024 * 1024) return err("file too large (max 8 MB)");
      const path = `uploads/${sessionId}/${Date.now()}-${filename}`;
      const { error } = await sb.storage.from("classroom").upload(path, bytes, { contentType: m[1], upsert: false });
      if (error) return err("storage: " + error.message, 500);
      const url = publicUrl(path)!;
      const w = num(b.w, 500), h = num(b.h, 380);
      const inserted = await insertOps(sheetId, "user", [{ t: "image", x: 120, y: 120, w: Math.min(w, 900), h: Math.min(h, 700), url }]);
      await insertMessage({ session_id: sessionId, role: "user", author: "You", kind: "board_event", body: `Uploaded image "${filename}" to the sheet.`, meta: { sheet_id: sheetId, url } });
      await tick(sessionId);
      return json({ ok: true, url, ops: inserted });
    }

    // ---- agent auth --------------------------------------------------------
    if (route === "claim" && method === "POST") {
      const b = await req.json().catch(() => ({}));
      const name = trim(b.name, 60) || `agent-${Math.floor(Math.random() * 10000)}`;
      // Claiming is compare-and-set: two agents arriving together cannot both get
      // seat 1 just because they observed it as free in the same read.
      for (let attempt = 0; attempt < 12; attempt++) {
        const seats = await getSeats();
        const free = seats.find((s: any) => !s.token);
        const stale = seats.find((s: any) => s.token && (!s.last_seen || Date.now() - new Date(s.last_seen).getTime() > ONLINE_WINDOW_MS));
        const mine = seats.find((s: any) => s.agent_name === name);
        const target = free ?? stale ?? mine;
        if (!target) return err("all 10 seats are claimed and online — try again later", 409);
        const token = crypto.randomUUID();
        let update = sb.from("cr_seats").update({
          token, agent_name: name, claimed_at: nowISO(), last_seen: nowISO(), status: "idle",
        }).eq("seat", target.seat);
        if (free) update = update.is("token", null);
        else if (stale && target.seat === stale.seat) update = update.eq("token", stale.token);
        else update = update.eq("agent_name", name);
        const { data, error } = await update.select().maybeSingle();
        if (data) return json({ seat: data.seat, role: data.role, token, poll_hint: 3 });
        if (error && (error as any).code !== "PGRST116") console.warn("claim retry", error);
      }
      return err("seat claim raced with another agent; retry", 409);
    }

    if (route === "inbox" && method === "GET") {
      const seat = await seatFromToken(req, url);
      if (!seat) return err("invalid seat token (re-claim with POST /claim)", 401);
      await markStaleSeatsOffline();

      // find the latest actionable task in the session this seat... any session with an active task?
      // Seats serve the most recent active task across sessions.
      const { data: task } = await sb.from("cr_tasks").select("*")
        .not("phase", "in", "(done,failed)").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (task) await advanceTask(task); // keep the world moving even if only agents call us
      const { data: fresh } = task
        ? await sb.from("cr_tasks").select("*").eq("id", task.id).maybeSingle()
        : { data: null };
      const t = fresh ?? task;

      let needed = "none", yourTurn = false;
      let question = "";
      let context: any[] = [];
      let sinceLast: any[] = [];
      let sheet: any = null;
      if (t) {
        const qMsgId = t.question_msg_id;
        if (qMsgId) {
          const { data: qm } = await sb.from("cr_messages").select("body").eq("id", qMsgId).maybeSingle();
          question = qm?.body ?? "";
        }
        const recent = await latestMessages(t.session_id, 14, 0);
        context = recent.slice(-6).map((m: any) => ({ role: m.role, author: m.author, kind: m.kind, body: trim(m.body, 280), seq: m.seq }));
        const lastSeen = Number(url.searchParams.get("last_seq") ?? "0") || 0;
        sinceLast = recent.slice(-8).filter((m: any) => m.seq > lastSeen)
          .map((m: any) => ({ seq: m.seq, role: m.role, author: m.author, kind: m.kind, body: trim(m.body, 200) }));
        const sh = await currentSheet(t.session_id);
        if (sh) sheet = { id: sh.id, ops_seq: await sheetOpsSeq(sh.id), png_url: publicUrl(sh.png_path) };

        const msgs = await messagesForTask(t.session_id, t.id);
        const has = (kinds: string[], round?: number) =>
          msgs.some((m: any) => m.meta?.seat === seat.seat && kinds.includes(m.kind)
            && (round === undefined || m.meta?.round === round));
        switch (t.phase) {
          case "research":
            if ([1, 2, 3, 4, 10].includes(seat.seat) && !has(["note"])) { yourTurn = true; needed = "note"; }
            break;
          case "draft":
            if (seat.seat === 5 && !has(["draft"], t.round)) { yourTurn = true; needed = "draft"; }
            break;
          case "critique":
            if (seat.seat === 6 && !has(["objection"], t.round)) { yourTurn = true; needed = "objection"; }
            else if (seat.seat === 7 && !has(["verify"], t.round)) { yourTurn = true; needed = "verify"; }
            else if (seat.seat === 8 && !has(["note"], t.round)) { yourTurn = true; needed = "note"; }
            break;
          case "revise": {
            const afterSeq = Number(t.state?.revise_after_seq ?? 0);
            const revised = msgs.some((m: any) => m.meta?.seat === 5 && m.kind === "draft" && m.meta?.round === t.round && Number(m.seq) > afterSeq);
            if (seat.seat === 5 && !revised) { yourTurn = true; needed = "draft"; }
            break;
          }
          case "vote":
            if (!has(["vote"], t.round)) { yourTurn = true; needed = "vote"; }
            break;
          case "final":
            if (seat.seat === 1 && !msgs.some((m: any) => m.kind === "final")) { yourTurn = true; needed = "final"; }
            break;
          case "draw":
            if (seat.seat === 9 && !t.state?.drawn) { yourTurn = true; needed = "draw"; }
            break;
        }
      }

      // presence: update last_seen, reflect working state
      await sb.from("cr_seats").update({
        last_seen: nowISO(),
        status: yourTurn ? (t?.phase === "vote" ? "voting" : "working") : "idle",
      }).eq("seat", seat.seat);

      return json({
        seat: seat.seat,
        role: seat.role,
        poll_hint: 3,
        now: nowISO(),
        task: t ? {
          id: t.id, phase: t.phase, round: t.round, deadline: t.deadline,
          question: trim(question, 1200), context, your_turn: yourTurn, needed,
          needs_research: t.state?.needs_research ?? true,
        } : null,
        sheet,
        since_last: sinceLast,
      });
    }

    if (route === "say" && method === "POST") {
      const seat = await seatFromToken(req, url);
      if (!seat) return err("invalid seat token", 401);
      const b = await req.json().catch(() => ({}));
      const taskId = str(b.task_id); const kind = str(b.kind); let body = str(b.body);
      const LIMITS: Record<string, number> = { note: 1200, objection: 1500, draft: 6000, vote: 300, verify: 3000, final: 9000 };
      if (!taskId || !(kind in LIMITS) || !body.trim()) return err("task_id, valid kind and body are required");
      let truncated = false;
      if (body.length > LIMITS[kind]) { body = body.slice(0, LIMITS[kind]); truncated = true; }

      const { data: task } = await sb.from("cr_tasks").select("*").eq("id", taskId).maybeSingle();
      if (!task) return err("task not found", 404);
      const metaIn = (b.meta && typeof b.meta === "object") ? b.meta : {};
      if (kind === "vote" && typeof metaIn.approve !== "boolean") return err("vote requires meta.approve (true|false) and meta.reason");

      // The moderator can fast-track a simple follow-up while preserving the task trail.
      // The server, not the client, owns this state transition.
      let taskForTick = task;
      if (seat.seat === 1 && kind === "note" && task.phase === "research" && metaIn.needs_research === false) {
        taskForTick = await patchTask(task, { state: { ...task.state, needs_research: false } });
      }

      const role = kind === "final" ? "council" : "agent";
      const author = `Seat ${seat.seat} · ${seat.role}`;
      const msg = await insertMessage({
        session_id: task.session_id, role, author, kind, body,
        meta: {
          ...metaIn, seat: seat.seat, role: seat.role, task_id: task.id,
          round: task.round, truncated,
          agent_name: seat.agent_name,
          ...(kind === "vote" ? { reason: trim(metaIn.reason, 300) } : {}),
        },
      });
      if (!msg) return err("could not store message", 500);
      await sb.from("cr_seats").update({ last_seen: nowISO(), status: "idle" }).eq("seat", seat.seat);
      await advanceTask(taskForTick);
      return json({ ok: true, message_id: msg.id, seq: msg.seq });
    }

    if (route === "draw" && method === "POST") {
      const admin = isAdmin(url, req);
      let seat: any = null;
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
        // mark the active draw-phase task as drawn
        const { data: t } = await sb.from("cr_tasks").select("*").eq("session_id", sheet.session_id)
          .eq("phase", "draw").order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (t) await sb.from("cr_tasks").update({ state: { ...t.state, drawn: true }, updated_at: nowISO() }).eq("id", t.id);
        await insertMessage({
          session_id: sheet.session_id, role: "council", author: admin ? "admin" : "Seat 9 · illustrator",
          kind: "board_event", body: `Illustrator drew ${inserted.length} operation(s) on Sheet ${sheet.idx}.`,
          meta: { sheet_id: sheetId, count: inserted.length },
        });
        await tick(sheet.session_id);
      }
      return json({ ok: true, inserted: inserted.length });
    }

    if (route === "transcript" && method === "GET") {
      const sessionId = str(url.searchParams.get("session_id"));
      const limit = Math.min(100, parseInt(url.searchParams.get("limit") ?? "30", 10) || 30);
      if (!sessionId) return err("session_id is required");
      const msgs = await latestMessages(sessionId, limit, 0);
      return json({ messages: msgs });
    }

    // ---- admin -------------------------------------------------------------
    if (["reset", "kick", "log", "settings"].includes(segs[0])) {
      if (!isAdmin(url, req)) return err("admin key required (?admin=KEY)", 403);

      if (route === "reset" && method === "POST") {
        // clears tasks + seat claims, keeps sheets (and messages unless ?hard=1)
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
        await sb.from("cr_seats").update({ token: null, agent_name: null, claimed_at: null, last_seen: null, status: "offline" })
          .gte("seat", 1);
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
          sb.from("cr_messages").select("id,session_id,seq,role,author,kind,created_at").order("id", { ascending: false }).limit(100),
        ]);
        return json({ tasks, seats, messages: msgs });
      }
      if (route === "settings" && method === "POST") {
        const b = await req.json().catch(() => ({}));
        const patch: Record<string, number> = {};
        for (const k of ["quorum", "phase_timeout_s", "max_rounds", "draw_timeout_s", "revise_timeout_s"]) {
          if (typeof b[k] === "number" && isFinite(b[k])) patch[k] = b[k];
        }
        const next = await putSettings(patch);
        return json({ ok: true, settings: next });
      }
      return err("unknown admin route", 404);
    }

    return err("not found", 404);
  } catch (e: any) {
    console.error("classroom error", e);
    return json({ error: "internal error: " + (e?.message ?? String(e)) }, 500);
  }
});
