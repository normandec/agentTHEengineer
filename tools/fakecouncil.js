#!/usr/bin/env node
/*
 * A deterministic polling council for an API smoke test.
 * Usage: node tools/fakecouncil.js <API_URL> [seconds]
 * It creates a session, claims all ten seats, asks a sample question, then
 * follows the same /inbox -> /say|/draw loop a real agent uses.
 */
"use strict";

const base = String(process.argv[2] || "").replace(/\/$/, "");
const runFor = Math.max(5, Number(process.argv[3] || 120));
if (!base) {
  console.error("Usage: node tools/fakecouncil.js <API_URL> [seconds]");
  process.exit(2);
}
// The requested budget covers the actual council cycle. Seat claiming and calibration
// are setup work and can take a little while on a cold Edge Function instance.
let started = 0;
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const { readFileSync, writeFileSync, unlinkSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
let errors = 0;
const errorNotes = [];
const agents = Array.from({ length: 10 }, (_, n) => ({ expectedSeat: n + 1, name: `fakecouncil-seat-${n + 1}`, token: null, lastSeq: 0, done: new Set() }));

async function request(path, options = {}) {
  const response = await fetch(base + path, {
    ...options,
    headers: { accept: "application/json", ...(options.body ? { "content-type": "application/json" } : {}), ...(options.headers || {}) },
  });
  const raw = await response.text();
  let data;
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = { raw }; }
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path}: ${data.error || response.status}`);
  return data;
}
const post = (path, body, token) => request(path, { method: "POST", body: JSON.stringify(body), headers: token ? { "x-seat-token": token } : {} });

function sourceNote(seat) {
  const notes = {
    1: "Decomposition: define the mechanism, identify the energy source, show one numerical intuition, and name a practical limitation. The council will check sources before concluding.",
    2: "A heat pump moves heat with a refrigerant cycle. The U.S. Department of Energy explains that it transfers heat rather than generating it by resistance. Source: https://www.energy.gov/energysaver/heat-pump-systems",
    3: "The International Energy Agency notes that heat pumps can be highly efficient because they deliver ambient heat in addition to electrical input. Source: https://www.iea.org/reports/the-future-of-heat-pumps",
    4: "Counter-evidence: efficiency falls as the temperature lift gets larger; cold-climate equipment still works, but performance depends on design and conditions. Source: https://www.energy.gov/energysaver/heat-pump-systems",
    10: "Scribe context: the learner asked for a physical explanation. Keep the answer beginner-friendly, distinguish moving heat from creating it, and state that real performance changes with outdoor temperature.",
  };
  return notes[seat] || "Council research note.";
}
function draft(round) {
  const revised = round > 1;
  return `${revised ? "## Revised explanation\n\n" : "## How a heat pump moves heat\n\n"}A heat pump is like a refrigerator used in reverse: it uses electricity to move heat from a cooler place to a warmer place. A refrigerant evaporates outside, absorbing heat; a compressor raises its pressure and temperature; indoors it condenses and releases that heat.\n\nFor every unit of electricity, the pump can often deliver several units of heat because most of the delivered energy was collected from air, ground, or water. This ratio is the coefficient of performance, COP = heat delivered / electric energy used. A COP of 3 means 1 kWh of electricity can deliver about 3 kWh of heat under those conditions.\n\nIn cold weather it has to lift heat across a bigger temperature gap, so COP normally drops. It still does not violate conservation of energy: electricity powers the compressor while the rest is moved environmental heat.\n\n### Sources\n- https://www.energy.gov/energysaver/heat-pump-systems\n- https://www.iea.org/reports/the-future-of-heat-pumps\n\nConfidence: medium – the mechanism is well-established; exact COP depends on equipment and temperatures.`;
}
function finalAnswer() {
  return `## Heat pumps, in one picture\n\nA heat pump uses a small amount of electricity to **move** heat. Its refrigerant picks up heat outside as it evaporates, the compressor raises that refrigerant's temperature, and the indoor coil releases heat as the refrigerant condenses.\n\nA useful check is **COP = heat delivered / electricity used**. If COP is 3, 1 kWh of electricity can deliver about 3 kWh of indoor heat; the extra energy came from the surroundings. In very cold conditions the larger temperature lift usually lowers COP, so the number is not fixed.\n\n### Sources\n- https://www.energy.gov/energysaver/heat-pump-systems\n- https://www.iea.org/reports/the-future-of-heat-pumps\n\nConfidence: high – the council independently checked the basic refrigerant-cycle explanation and numerical definition; actual performance varies by installation and weather.`;
}

async function claim(agent) {
  const claimed = await post("/claim", { name: agent.name });
  agent.token = claimed.token;
  if (claimed.seat !== agent.expectedSeat) throw new Error(`${agent.name} claimed seat ${claimed.seat}, expected ${agent.expectedSeat}`);
  const inbox = await request(`/inbox?token=${encodeURIComponent(agent.token)}`);
  if (inbox.calibration) await post("/calibrate", { answers: inbox.calibration.questions.map((q) => ({ id: q.id, answer: "" })), strengths: ["clear explanations"], weaknesses: ["long arithmetic"] }, agent.token);
  console.log(`claimed and calibrated seat ${claimed.seat} (${claimed.role})`);
}
async function say(agent, task, kind, body, meta = {}) {
  const key = `${task.id}:${task.phase}:${task.round}:${kind}`;
  if (agent.done.has(key)) return;
  await post("/say", { task_id: task.id, kind, body, meta: { ...meta, round: task.round } }, agent.token);
  agent.done.add(key);
  console.log(`seat ${agent.expectedSeat} → ${kind} (${task.phase}, round ${task.round})`);
}
async function signedPut(uploadUrl, headers, bytes, mime) {
  const response = await fetch(uploadUrl, { method: "PUT", headers: { "content-type": mime, ...(headers || {}) }, body: bytes });
  if (!response.ok) throw new Error(`signed upload failed (${response.status})`);
}
async function artifact(agent, sessionId, name, mime, bytes, path) {
  const begin = await post("/file/begin", { session_id: sessionId, name, mime, bytes: bytes.length, path, task_id: null }, agent.token);
  await signedPut(begin.upload_url, begin.headers, bytes, mime); return post("/file/done", { file_id: begin.file_id }, agent.token);
}
async function sampleVideo(agent, sessionId, sheetId) {
  const out = join(tmpdir(), `classroom-fake-${process.pid}.mp4`);
  const made = spawnSync("ffmpeg", ["-y", "-f", "lavfi", "-i", "color=c=0x17a2b8:s=320x180:d=3", "-c:v", "libx264", "-pix_fmt", "yuv420p", out], { stdio: "ignore" });
  const bytes = made.status === 0 ? readFileSync(out) : Buffer.from("AI CLASSROOM demo video placeholder");
  try { unlinkSync(out); } catch (_) {}
  const begin = await post("/media/begin", { session_id: sessionId, sheet_id: sheetId, filename: "heat-pump-cycle.mp4", mime: "video/mp4", bytes: bytes.length, caption: "Three-second heat-pump cycle animation." }, agent.token);
  await signedPut(begin.upload_url, begin.headers, bytes, "video/mp4"); return post("/media/done", { media_id: begin.media_id }, agent.token);
}

async function draw(agent, task, sheet) {
  const key = `${task.id}:draw`;
  if (agent.done.has(key)) return;
  const ops = [
    { t: "text", x: 70, y: 75, s: "How a heat pump moves heat", size: 32, c: "#16213e", align: "left" },
    { t: "rect", x: 85, y: 250, w: 280, h: 150, c: "#1a73e8", fill: "#eaf1ff", r: 12 },
    { t: "text", x: 225, y: 325, s: "Outdoor air\nabsorbs heat", size: 23, c: "#16213e", align: "center" },
    { t: "arrow", x1: 375, y1: 325, x2: 635, y2: 325, w: 4, c: "#1a73e8" },
    { t: "rect", x: 650, y: 250, w: 280, h: 150, c: "#188038", fill: "#e7f6ee", r: 12 },
    { t: "text", x: 790, y: 310, s: "Compressor", size: 25, c: "#16213e", align: "center" },
    { t: "text", x: 790, y: 350, s: "uses electricity", size: 20, c: "#16213e", align: "center" },
    { t: "arrow", x1: 940, y1: 325, x2: 1200, y2: 325, w: 4, c: "#1a73e8" },
    { t: "rect", x: 1215, y: 250, w: 280, h: 150, c: "#d93025", fill: "#fff0ef", r: 12 },
    { t: "text", x: 1355, y: 325, s: "Indoor coil\nreleases heat", size: 23, c: "#16213e", align: "center" },
    { t: "text", x: 90, y: 545, s: "COP = heat delivered ÷ electricity used", size: 29, c: "#7b42bc", align: "left" },
    { t: "text", x: 90, y: 595, s: "Cold weather: larger temperature lift → lower COP", size: 22, c: "#d93025", align: "left" },
  ];
  await post("/draw", { sheet_id: sheet.id, ops }, agent.token);
  await sampleVideo(agent, task.session_id, sheet.id);
  agent.done.add(key);
  console.log("seat 9 → drew labelled heat-pump diagram");
}

async function act(agent, inbox) {
  const task = inbox.task;
  if (!task?.your_turn) return;
  const seat = agent.expectedSeat;
  if (task.needed === "note") {
    if (task.phase === "research") await say(agent, task, "note", sourceNote(seat), { sources: seat >= 2 && seat <= 4 ? [seat === 3 ? "https://www.iea.org/reports/the-future-of-heat-pumps" : "https://www.energy.gov/energysaver/heat-pump-systems"] : [] });
    else if (seat === 8) {
      await say(agent, task, "note", "Checked: COP = heat delivered / electric energy used. Example: 3 kWh / 1 kWh = COP 3. Units cancel, so the calculation is dimensionless. → OK.");
      const artifactKey = `${task.id}:calculator-artifacts`;
      if (!agent.done.has(artifactKey)) { await artifact(agent, task.session_id, "cop-check.csv", "text/csv", Buffer.from("electricity_kwh,heat_kwh,cop\n1,3,3\n"), "outputs/csv"); await artifact(agent, task.session_id, "cop-plot.png", "image/png", Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL3VwAAAABJRU5ErkJggg==", "base64"), "outputs/plots"); agent.done.add(artifactKey); }
    }
    return;
  }
  if (task.needed === "draft") return say(agent, task, "draft", draft(task.round), { sources: ["https://www.energy.gov/energysaver/heat-pump-systems", "https://www.iea.org/reports/the-future-of-heat-pumps"] });
  if (task.needed === "objection") return say(agent, task, "objection", "Concrete objection: the draft must explicitly say COP is condition-dependent; without that qualifier a reader may treat COP 3 as a guaranteed performance value.");
  if (task.needed === "verify") return say(agent, task, "verify", "Verification table posted.", { claims: [
    { claim: "A heat pump moves heat with a refrigerant cycle.", verdict: "ok", source: "https://www.energy.gov/energysaver/heat-pump-systems" },
    { claim: "COP equals heat delivered divided by electrical input.", verdict: "ok", source: "https://www.iea.org/reports/the-future-of-heat-pumps" },
    { claim: "COP drops as temperature lift grows.", verdict: "ok", source: "https://www.energy.gov/energysaver/heat-pump-systems" }
  ] });
  if (task.needed === "vote") return say(agent, task, "vote", "Approved: the draft explains the mechanism, gives a correct COP example, and qualifies weather-dependent performance.", { approve: true, reason: "The conditions caveat resolves the critic's specific objection." });
  if (task.needed === "final") return say(agent, task, "final", finalAnswer(), { sources: ["https://www.energy.gov/energysaver/heat-pump-systems", "https://www.iea.org/reports/the-future-of-heat-pumps"] });
  if (task.needed === "draw") return draw(agent, task, inbox.sheet);
}

(async () => {
  try {
    const health = await request("/health");
    if (!health.ok) throw new Error("health endpoint did not report ok");
    const session = await post("/session", { title: "Fake council acceptance run" });
    console.log(`session ${session.session_id}`);
    // Sequential first claims prove the fixed-seat protocol deterministically.
    for (const agent of agents) await claim(agent);
    await post("/ask", { session_id: session.session_id, sheet_id: session.sheet_id, text: "Explain how a heat pump moves heat, including what COP means." });
    started = Date.now();
    console.log(`question submitted; polling ten agents for up to ${runFor}s`);
    while (Date.now() - started < runFor * 1000) {
      const inboxes = await Promise.all(agents.map(async (agent) => {
        try {
          const inbox = await request(`/inbox?token=${encodeURIComponent(agent.token)}&last_seq=${agent.lastSeq}`);
          for (const message of inbox.since_last || []) agent.lastSeq = Math.max(agent.lastSeq, message.seq || 0);
          await act(agent, inbox);
          return inbox;
        } catch (error) {
          errors++;
          const note = `seat ${agent.expectedSeat} error: ${error.message}`;
          errorNotes.push(note);
          console.error(note);
          return null;
        }
      }));
      // The route intentionally hides completed tasks. One clean all-idle poll
      // confirms that the whole state machine reached done, without idling until
      // the test's maximum timeout.
      if (inboxes.every((inbox) => inbox && !inbox.task)) {
        console.log("all seats observed the completed task");
        break;
      }
      await pause(1000);
    }
    const transcript = await request(`/transcript?session_id=${session.session_id}&limit=100`);
    const final = transcript.messages?.find((message) => message.kind === "final");
    const drawing = await request(`/sheet/${session.sheet_id}/ops?since=0`);
    const taskState = await request(`/session/${session.session_id}?since=0`);
    const summary = taskState.task ? `phase=${taskState.task.phase}, round=${taskState.task.round}` : "no active task";
    if (!final) { errors++; console.error(`No final answer appeared before the timeout (${summary}).`); }
    if (!drawing.ops?.length) { errors++; console.error(`No drawing operations appeared before the timeout (${summary}).`); }
    if (errors) {
      console.error(`fakecouncil finished with ${errors} error(s): ${summary}; ${errorNotes.slice(0, 8).join(" | ")}`);
      process.exitCode = 1;
    } else console.log(`fakecouncil completed cleanly: final answer + ${drawing.ops.length} board operations (${summary}).`);
  } catch (error) {
    console.error(`fakecouncil setup error: ${error.message}`);
    process.exitCode = 1;
  }
})();
