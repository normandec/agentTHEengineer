/* Small presentation helpers kept separate from app state. */
(() => {
  "use strict";
  const ROLES = {
    moderator: { color: "#f5b301", label: "Moderator" },
    "researcher-A": { color: "#1a73e8", label: "Researcher A" },
    "researcher-B": { color: "#4a90e2", label: "Researcher B" },
    "researcher-C": { color: "#7fb3f0", label: "Researcher C" },
    explainer: { color: "#2ea44f", label: "Explainer" }, critic: { color: "#d7263d", label: "Critic" },
    verifier: { color: "#7b2cbf", label: "Verifier" }, calculator: { color: "#f26419", label: "Calculator" },
    illustrator: { color: "#17a2b8", label: "Illustrator" }, scribe: { color: "#6c757d", label: "Scribe" }
  };
  const phases = ["research", "draft", "critique", "revise", "vote", "final", "draw"];
  const info = (role) => ROLES[role] || { color: "#6c757d", label: role || "Council" };
  const esc = (x) => String(x || "").replace(/[&<>'"]/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));

  function renderCouncil(root, council = [], task, onPick) {
    if (!root) return;
    const online = council.filter((seat) => seat.status !== "offline").length;
    const label = root.querySelector(".council-label");
    if (label) label.innerHTML = `Council: <b>${online}/10</b> online`;
    const dots = root.querySelector(".seat-dots"); if (!dots) return;
    dots.innerHTML = "";
    for (let n = 1; n <= 10; n++) {
      const seat = council.find((s) => s.seat === n) || { seat: n, role: "unclaimed", status: "offline" };
      const role = info(seat.role); const state = seat.status || "offline";
      const vote = task?.state?.last_votes && task.phase === "final" ? "voted" : "";
      const b = document.createElement("button"); b.type = "button"; b.className = `seat-dot ${state} ${vote} ${seat.watching ? "watching" : ""}`;
      b.style.setProperty("--seat-color", role.color);
      const score = Object.values(seat.profile?.track || {}).length ? ` · track ${(Object.values(seat.profile.track).reduce((a, v) => Number(a) + Number(v), 0) / Object.values(seat.profile.track).length).toFixed(2)}` : "";
      b.title = `Seat ${n} · ${role.label}${seat.name ? ` · ${seat.name}` : ""} · ${state}${seat.watching ? " · watching sheet" : ""}${score}`;
      b.setAttribute("aria-label", b.title); b.textContent = n;
      b.addEventListener("click", () => onPick?.(n)); dots.append(b);
    }
  }

  function phaseBar(task) {
    const current = task?.phase || ""; const i = phases.indexOf(current);
    const secs = task?.deadline ? Math.max(0, Math.ceil((new Date(task.deadline).getTime() - Date.now()) / 1000)) : 0;
    const urgent = secs < 15 ? (secs ? "urgent" : "late") : "";
    return `<div class="phase-bar ${urgent}" aria-label="Council phase"><div class="phase-steps">${phases.map((p, n) => `<span class="phase-step ${n < i ? "complete" : ""} ${n === i ? "current" : ""}"><i></i>${p}</span>`).join("")}</div>${task ? `<span class="count-ring">${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}</span><span class="round-count">R${task.round}</span>` : ""}</div>`;
  }

  function ticker(messages = [], task) {
    const newest = messages[messages.length - 1];
    if (!newest) return task ? `Council ${task.phase} · round ${task.round}` : "Council ready";
    const actor = newest.author || "Council";
    const verbs = { note: "shared a note", objection: "raised an objection", verify: "checked claims", draft: "updated the draft", vote: "cast a vote", status: newest.body, board_event: newest.body, media: "shared media" };
    return newest.kind === "status" || newest.kind === "board_event" ? String(newest.body) : `${actor} ${verbs[newest.kind] || "updated the room"}`;
  }
  window.ClassroomUI = { ROLES, info, esc, renderCouncil, phaseBar, ticker };
})();
