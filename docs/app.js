/* AI CLASSROOM static viewer. The only network dependency is the classroom Edge Function. */
(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const API_OVERRIDE = new URLSearchParams(location.search).get("api");
  const API = String(API_OVERRIDE || window.CR_API || "").replace(/\/$/, "");
  const storageKey = `ai-classroom-session:${API}`;
  const state = { sessionId: null, latestSeq: 0, messages: new Map(), task: null, sheets: [], activeSheet: null, polling: false, opsPolling: false, pngDirty: false, toastTimer: null };
  const els = {
    chat: $("#chat-log"), notice: $("#connection-notice"), form: $("#ask-form"), question: $("#question-input"), ask: $("#ask-button"), phase: $("#phase-pill"), council: $("#council-strip"), dots: $(".seat-dots"), sheetName: $("#sheet-name"), sync: $("#sheet-sync"), ops: $("#ops-count"), empty: $("#board-empty"), zoom: $("#zoom-reset"), toast: $("#toast"), sheetsList: $("#sheets-list"), drawer: $("#sheets-drawer"), scrim: $("#drawer-scrim"), image: $("#image-input")
  };

  function api(path, options = {}) {
    if (!API) return Promise.reject(new Error("No API URL is configured. Set window.CR_API in docs/config.js."));
    const headers = { ...(options.body ? { "content-type": "application/json" } : {}), ...(options.headers || {}) };
    return fetch(`${API}${path}`, { ...options, headers }).then(async (response) => {
      const raw = await response.text();
      let payload = null;
      try { payload = raw ? JSON.parse(raw) : {}; } catch { payload = raw; }
      if (!response.ok) throw new Error((payload && payload.error) || `Request failed (${response.status})`);
      return payload;
    });
  }
  const post = (path, body) => api(path, { method: "POST", body: JSON.stringify(body) });
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[c]));
  const text = (value, max) => String(value ?? "").slice(0, max);
  const sourceURL = (url) => /^https?:\/\//i.test(url) ? url : null;

  function toast(message, ms = 3600) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => els.toast.classList.remove("show"), ms);
  }
  function showNotice(message) { els.notice.hidden = !message; els.notice.textContent = message || ""; }

  // Markdown deliberately permits only output generated here. AI text is escaped before markup is added.
  function markdown(raw) {
    const fenced = [], links = [];
    let safe = String(raw ?? "").replace(/```([\w+-]*)\n?([\s\S]*?)```/g, (_m, lang, code) => {
      const id = fenced.length; fenced.push(`<pre><code data-lang="${escapeHtml(lang)}">${escapeHtml(code)}</code></pre>`); return `@@CODE${id}@@`;
    });
    const link = (label, url) => {
      if (!sourceURL(url)) return label;
      const id = links.length;
      links.push(`<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`);
      return `@@LINK${id}@@`;
    };
    // Pull links out before escaping so a URL can never be rewritten inside an href attribute.
    safe = safe.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, label, url) => link(label, url));
    safe = safe.replace(/(https?:\/\/[^\s<]+)/g, (url) => link(url, url));
    safe = escapeHtml(safe);
    safe = safe.replace(/`([^`\n]+)`/g, "<code>$1</code>");
    safe = safe.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    safe = safe.replace(/\$([^$\n]+)\$/g, (_m, formula) => {
      if (!window.katex) return `$${formula}$`;
      try { return window.katex.renderToString(formula, { throwOnError: false, trust: false }); } catch { return `$${formula}$`; }
    });
    safe = safe.replace(/^### (.+)$/gm, "<h3>$1</h3>").replace(/^## (.+)$/gm, "<h2>$1</h2>").replace(/^# (.+)$/gm, "<h1>$1</h1>");
    safe = safe.replace(/(^|\n)- (.+)(?=(\n|$))/g, "$1<li>$2</li>");
    safe = safe.replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br>");
    safe = `<p>${safe}</p>`;
    safe = safe.replace(/<p>(\s*<h[1-3]>)/g, "$1").replace(/(<\/h[1-3]>)<\/p>/g, "$1");
    safe = safe.replace(/<p>(\s*<pre>[\s\S]*?<\/pre>)<\/p>/g, "$1");
    safe = safe.replace(/<p>\s*((?:<li>[\s\S]*?<\/li>\s*)+)<\/p>/g, "<ul>$1</ul>");
    fenced.forEach((block, i) => { safe = safe.replace(`@@CODE${i}@@`, block); });
    links.forEach((block, i) => { safe = safe.replaceAll(`@@LINK${i}@@`, block); });
    return safe;
  }

  function URLs(messages) {
    const found = new Set();
    for (const msg of messages || []) {
      for (const item of (msg.meta?.sources || [])) if (sourceURL(item)) found.add(item);
      for (const item of String(msg.body || "").match(/https?:\/\/[^\s)\]"'<>]+/g) || []) if (sourceURL(item)) found.add(item.replace(/[.,;]+$/, ""));
    }
    return [...found].slice(0, 12);
  }

  function addCopyButtons(container) {
    container.querySelectorAll("pre").forEach((pre) => {
      const b = document.createElement("button"); b.className = "copy-code"; b.type = "button"; b.textContent = "Copy";
      b.addEventListener("click", async () => { try { await navigator.clipboard.writeText(pre.querySelector("code").textContent); b.textContent = "Copied"; setTimeout(() => b.textContent = "Copy", 1200); } catch { toast("Copy was not available in this browser."); } });
      pre.append(b);
    });
  }

  function renderCouncil(council = []) {
    const online = council.filter((seat) => seat.status !== "offline").length;
    els.council.querySelector(".council-label").innerHTML = `Council: <b>${online}/10</b> online`;
    els.dots.innerHTML = "";
    for (let seatNo = 1; seatNo <= 10; seatNo++) {
      const seat = council.find((row) => row.seat === seatNo) || { role: "unclaimed", status: "offline" };
      const dot = document.createElement("span");
      dot.className = `seat-dot ${seat.status || "offline"}`;
      dot.title = `Seat ${seatNo}: ${seat.role}${seat.name ? ` · ${seat.name}` : ""} · ${seat.status || "offline"}`;
      els.dots.append(dot);
    }
  }

  function phaseName(phase) { return ({ research:"researching", draft:"drafting", critique:"checking", revise:"revising", vote:"voting", final:"writing answer", draw:"drawing", done:"complete" })[phase] || phase || "ready"; }
  function renderPhase() {
    if (!state.task || ["done", "failed"].includes(state.task.phase)) { els.phase.hidden = true; return; }
    els.phase.hidden = false; els.phase.textContent = `Council ${phaseName(state.task.phase)} · round ${state.task.round}`;
  }

  function answerCard(final, deliberation) {
    const node = document.createElement("article"); node.className = "message answer-card";
    const auto = final.meta?.auto ? " · fallback" : "";
    node.innerHTML = `<div class="answer-meta"><span class="role-avatar">1</span><span>COUNCIL ANSWER${auto}</span></div><div class="markdown">${markdown(final.body)}</div>`;
    const sources = URLs([final, ...deliberation]);
    if (sources.length) {
      const wrap = document.createElement("div"); wrap.className = "sources";
      for (const source of sources) { const a = document.createElement("a"); a.className = "source-chip"; a.href = source; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = new URL(source).hostname.replace(/^www\./, ""); a.title = source; wrap.append(a); }
      node.append(wrap);
    }
    if (deliberation.length) node.append(deliberationDetails(deliberation));
    addCopyButtons(node);
    return node;
  }

  function deliberationDetails(signals, open = false) {
    const d = document.createElement("details"); d.className = "deliberation"; d.open = open;
    const kinds = new Set(signals.map((signal) => signal.kind));
    d.innerHTML = `<summary>Deliberation · ${signals.length} signal${signals.length === 1 ? "" : "s"} · ${[...kinds].join(", ")}</summary>`;
    for (const signal of signals) {
      const item = document.createElement("div"); item.className = "signal";
      const role = escapeHtml(signal.author || signal.role || "Council");
      item.innerHTML = `<div class="signal-head"><span>${role}</span><span>${escapeHtml(signal.kind || "note")}</span></div><div class="signal-body">${escapeHtml(text(signal.body, 900))}</div>`;
      d.append(item);
    }
    return d;
  }

  function renderChat() {
    const messages = [...state.messages.values()].sort((a, b) => a.seq - b.seq);
    els.chat.innerHTML = "";
    if (!messages.length) {
      els.chat.innerHTML = `<article class="welcome-card"><span class="mini-mark">AI</span><h2>Ten perspectives. One transparent answer.</h2><p>Ask a question. The council researches, drafts, challenges, verifies and votes before it replies. While it works, both of you can use the shared board.</p><div class="welcome-tags"><span>Sources shown</span><span>Confidence stated</span><span>Disagreements visible</span></div></article>`;
      return;
    }
    const chunks = [];
    let current = null;
    for (const message of messages) {
      if (message.kind === "question" && message.role === "user") { current = { question: message, signals: [], finals: [] }; chunks.push(current); }
      else if (current) { (message.kind === "final" && message.role === "council" ? current.finals : current.signals).push(message); }
    }
    for (let index = 0; index < chunks.length; index++) {
      const chunk = chunks[index];
      const q = document.createElement("article"); q.className = "message user"; q.innerHTML = `<div class="question-bubble">${escapeHtml(chunk.question.body)}</div>`; els.chat.append(q);
      for (const final of chunk.finals) els.chat.append(answerCard(final, chunk.signals));
      const latest = index === chunks.length - 1;
      if (!chunk.finals.length && latest) {
        const progress = document.createElement("article"); progress.className = "message progress-card";
        const ph = state.task?.phase ? phaseName(state.task.phase) : "waiting for the council";
        progress.innerHTML = `<b>The council is ${escapeHtml(ph)}.</b> It will publish sources, confidence and any unresolved disagreement with the answer.`;
        els.chat.append(progress);
        if (chunk.signals.length) els.chat.append(deliberationDetails(chunk.signals, true));
      }
    }
    els.chat.scrollTop = els.chat.scrollHeight;
  }

  function renderSheets() {
    els.sheetsList.innerHTML = "";
    if (!state.sheets.length) els.sheetsList.innerHTML = `<p class="eyebrow">No sheets yet</p>`;
    for (const sheet of state.sheets) {
      const b = document.createElement("button"); b.type = "button"; b.className = `sheet-item ${sheet.id === state.activeSheet?.id ? "active" : ""}`;
      const thumbnail = sheet.thumb_url || sheet.png_url;
      b.innerHTML = `<span class="sheet-thumb" ${thumbnail ? `style="background-image:url('${thumbnail}')"` : ""}>${thumbnail ? "" : "✦"}</span><span><h3>${escapeHtml(sheet.title)}</h3><p>Sheet ${sheet.idx} · ${new Date(sheet.created_at).toLocaleDateString()}</p></span>`;
      b.addEventListener("click", () => { openSheet(sheet.id); closeDrawer(); }); els.sheetsList.append(b);
    }
  }

  const board = new window.ClassroomBoard($("#board"), {
    onCommit: async (ops) => {
      if (!state.activeSheet) throw new Error("There is no active sheet yet.");
      els.sync.textContent = "saving…";
      const response = await post(`/sheet/${state.activeSheet.id}/ops`, { ops, author: "user" });
      els.sync.textContent = "saved"; state.pngDirty = true; return response;
    },
    onError: (error) => { els.sync.textContent = "not saved"; toast(`Board change not saved: ${error.message}`); },
    onInfo: toast,
    onZoom: (zoom) => { els.zoom.textContent = `${Math.round(zoom * 100)}%`; },
    onRender: ({ count, local, dirty }) => { els.ops.textContent = `${count} operation${count === 1 ? "" : "s"}`; els.empty.style.opacity = count ? "0" : "1"; if (local || dirty) state.pngDirty = true; }
  });

  async function openSheet(id) {
    const data = await api(`/sheet/${id}`);
    state.activeSheet = data.sheet;
    const fromList = state.sheets.find((sheet) => sheet.id === id);
    if (fromList) Object.assign(fromList, data.sheet);
    board.setRows(data.ops || []);
    els.sheetName.textContent = data.sheet.title;
    els.sync.textContent = "synced";
    renderSheets();
  }

  async function pollOps() {
    if (state.opsPolling || !state.activeSheet) return;
    state.opsPolling = true;
    try {
      const data = await api(`/sheet/${state.activeSheet.id}/ops?since=${board.maxSeq()}`);
      if (data.ops?.length) {
        const progressive = data.ops.some((row) => row.author === "illustrator");
        board.appendRows(data.ops, progressive);
        els.sync.textContent = "synced";
      }
    } catch (error) { /* session polling displays durable failures; do not spam a drawing toast */ }
    finally { state.opsPolling = false; }
  }

  async function createSession() {
    const data = await post("/session", { title: "AI Classroom session" });
    state.sessionId = data.session_id; state.latestSeq = 0; state.messages.clear(); state.task = null; state.sheets = [];
    localStorage.setItem(storageKey, state.sessionId);
    await poll(true);
    if (data.sheet_id) await openSheet(data.sheet_id);
    toast("A fresh classroom session is ready.");
  }

  async function poll(first = false) {
    if (!state.sessionId || state.polling) return;
    state.polling = true;
    try {
      const data = await api(`/session/${state.sessionId}?since=${state.latestSeq}`);
      showNotice("");
      for (const message of data.messages || []) {
        if (!state.messages.has(message.seq)) state.messages.set(message.seq, message);
        state.latestSeq = Math.max(state.latestSeq, Number(message.seq) || 0);
      }
      state.task = data.task;
      state.sheets = data.sheets || [];
      renderCouncil(data.council || []); renderPhase(); renderChat(); renderSheets();
      if (!state.activeSheet && state.sheets.length) await openSheet(state.sheets[state.sheets.length - 1].id);
      await pollOps();
      if (first) els.question.focus();
    } catch (error) {
      showNotice(`Connection issue: ${error.message}`);
      els.sync.textContent = "offline";
    } finally { state.polling = false; }
  }

  async function ask(value) {
    const prompt = String(value || "").trim();
    if (!prompt) return;
    if (!state.sessionId) await createSession();
    els.ask.disabled = true; els.question.disabled = true;
    try {
      await post("/ask", { session_id: state.sessionId, text: prompt, sheet_id: state.activeSheet?.id || null });
      els.question.value = ""; await poll();
    } catch (error) { toast(`The question was not sent: ${error.message}`, 5000); }
    finally { els.ask.disabled = false; els.question.disabled = false; els.question.focus(); }
  }

  function openDrawer() { els.drawer.classList.add("open"); els.drawer.setAttribute("aria-hidden", "false"); els.scrim.hidden = false; $("#sheets-button").setAttribute("aria-expanded", "true"); }
  function closeDrawer() { els.drawer.classList.remove("open"); els.drawer.setAttribute("aria-hidden", "true"); els.scrim.hidden = true; $("#sheets-button").setAttribute("aria-expanded", "false"); }

  async function newSheet() {
    if (!state.sessionId) return;
    const title = window.prompt("Name this new sheet:", `Sheet ${state.sheets.length + 1}`);
    if (title === null) return;
    try { const data = await post("/sheet", { session_id: state.sessionId, title }); await poll(); await openSheet(data.sheet_id); toast("New sheet created."); }
    catch (error) { toast(`Could not create sheet: ${error.message}`); }
  }

  async function uploadImage(file) {
    if (!file || !state.activeSheet || !state.sessionId) return;
    if (file.size > 8 * 1024 * 1024) { toast("Choose an image smaller than 8 MB."); return; }
    const dataUrl = await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file); });
    const dims = await new Promise((resolve) => { const im = new Image(); im.onload = () => resolve({ w: im.naturalWidth, h: im.naturalHeight }); im.onerror = () => resolve({ w: 500, h: 380 }); im.src = dataUrl; });
    try {
      els.sync.textContent = "uploading…";
      const response = await post("/upload", { session_id: state.sessionId, sheet_id: state.activeSheet.id, filename: file.name, data_url: dataUrl, w: dims.w, h: dims.h });
      board.appendRows(response.ops || [], false); state.pngDirty = true; els.sync.textContent = "saved"; toast("Image added to the shared sheet.");
    } catch (error) { els.sync.textContent = "not saved"; toast(`Image upload failed: ${error.message}`); }
    finally { els.image.value = ""; }
  }

  async function snapshot() {
    if (!state.pngDirty || !state.activeSheet) return;
    try {
      const data_url = board.snapshotDataURL(1600), thumb_data_url = board.snapshotDataURL(320);
      await post(`/sheet/${state.activeSheet.id}/png`, { data_url, thumb_data_url });
      state.pngDirty = false;
      els.sync.textContent = "synced";
    } catch (error) { console.warn("Sheet snapshot failed", error); }
  }

  function downloadPNG() {
    try { const a = document.createElement("a"); a.href = board.snapshotDataURL(1600); a.download = `${(state.activeSheet?.title || "ai-classroom-sheet").replace(/[^\w-]+/g, "-")}.png`; a.click(); }
    catch { toast("Could not make a PNG from this sheet."); }
  }

  // Wire page controls.
  els.form.addEventListener("submit", (event) => { event.preventDefault(); ask(els.question.value); });
  $("#new-session").addEventListener("click", () => { if (confirm("Start a new session? This keeps older sessions in the database, but switches this browser to a clean room.")) createSession(); });
  $("#sheets-button").addEventListener("click", openDrawer); $("#close-sheets").addEventListener("click", closeDrawer); els.scrim.addEventListener("click", closeDrawer); $("#new-sheet").addEventListener("click", newSheet);
  $("#about-button").addEventListener("click", () => $("#about-dialog").showModal()); $("#close-about").addEventListener("click", () => $("#about-dialog").close());
  $("#ask-sheet").addEventListener("click", () => ask("Please explain what is shown on the current sheet and how it relates to our discussion."));
  $("#download-png").addEventListener("click", downloadPNG); $("#undo-button").addEventListener("click", () => board.undoLatest());
  $("#zoom-in").addEventListener("click", () => board.setZoom(board.zoom * 1.15)); $("#zoom-out").addEventListener("click", () => board.setZoom(board.zoom / 1.15)); els.zoom.addEventListener("click", () => board.resetView());
  els.image.addEventListener("change", () => uploadImage(els.image.files?.[0]));
  document.querySelectorAll("[data-tool]").forEach((button) => button.addEventListener("click", () => { document.querySelectorAll("[data-tool]").forEach((item) => item.classList.remove("active")); button.classList.add("active"); board.setTool(button.dataset.tool); }));
  document.querySelectorAll("[data-color]").forEach((button) => button.addEventListener("click", () => { document.querySelectorAll("[data-color]").forEach((item) => item.classList.remove("active")); button.classList.add("active"); board.setColor(button.dataset.color); }));
  document.querySelectorAll("[data-width]").forEach((button) => button.addEventListener("click", () => { document.querySelectorAll("[data-width]").forEach((item) => item.classList.remove("active")); button.classList.add("active"); board.setWidth(button.dataset.width); }));

  function schedulePoll() { window.setTimeout(async () => { await poll(); schedulePoll(); }, document.hidden ? 5000 : 1500); }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) poll(); });
  window.setInterval(snapshot, 5000);

  (async () => {
    if (!API) { showNotice("No API URL is configured. Update docs/config.js before using the classroom."); return; }
    state.sessionId = new URLSearchParams(location.search).get("session") || localStorage.getItem(storageKey);
    if (state.sessionId) await poll(true);
    if (!state.sessionId || !state.sheets.length) {
      try { await createSession(); } catch (error) { showNotice(`Could not start a session: ${error.message}`); }
    }
    schedulePoll();
  })();
})();
