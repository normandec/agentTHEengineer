/* AI CLASSROOM static viewer. The only network dependency is the classroom Edge Function. */
(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const pageParams = new URLSearchParams(location.search);
  const API_OVERRIDE = pageParams.get("api");
  const API = String(API_OVERRIDE || window.CR_API || "").replace(/\/$/, "");
  // An administrator may intentionally open the room with ?admin=... . The key is
  // never committed or persisted; it is forwarded only to the configured Function.
  const ADMIN_KEY = pageParams.get("admin") || "";
  const storageKey = `ai-classroom-session:${API}`;
  const state = { sessionId: null, latestSeq: 0, messages: new Map(), task: null, sheets: [], activeSheet: null, lessons: [], council: [], files: [], folders: [], fileFolder: "", media: [], settings: {}, polling: false, opsPolling: false, pngDirty: false, toastTimer: null, drawerTab: "sheets", seenSpeak: new Set(), mode: localStorage.getItem("ai-classroom-mode") || "full", autoscroll: localStorage.getItem("ai-classroom-autoscroll") !== "off", theme: localStorage.getItem("ai-classroom-theme") || "light", stats: null, chatRenderKey: null, forceChatFollow: false, chatFocused: false, boardFocused: false, pendingLesson: null, lessonPlayback: null };
  const els = {
    chat: $("#chat-log"), chatFocus: $("#chat-fullscreen-button"), jumpLatest: $("#jump-latest"), notice: $("#connection-notice"), form: $("#ask-form"), question: $("#question-input"), ask: $("#ask-button"), phase: $("#phase-pill"), phaseSlot: $("#phase-bar-slot"), ticker: $("#live-ticker"), council: $("#council-strip"), dots: $(".seat-dots"), sheetName: $("#sheet-name"), sync: $("#sheet-sync"), liveLesson: $("#live-lesson-status"), boardStatus: $("#board-status"), boardFocus: $("#board-fullscreen-button"), playLesson: $("#play-lesson"), ops: $("#ops-count"), empty: $("#board-empty"), zoom: $("#zoom-reset"), toast: $("#toast"), sheetsList: $("#sheets-list"), lessonsList: $("#lessons-list"), filesList: $("#files-list"), mediaList: $("#media-list"), knowledgeList: $("#knowledge-list"), knowledgeSummary: $("#knowledge-summary"), drawer: $("#sheets-drawer"), scrim: $("#drawer-scrim"), image: $("#image-input"), filesInput: $("#files-input"), knowledgeInput: $("#knowledge-input"), libraryKnowledgeInput: $("#library-knowledge-input"), uploadQueue: $("#upload-queue"), drop: $("#drop-zone"), filesCount: $("#files-count"), lessonsCount: $("#lessons-count")
  };

  function api(path, options = {}) {
    if (!API) return Promise.reject(new Error("No API URL is configured. Set window.CR_API in docs/config.js."));
    const headers = { ...(options.body ? { "content-type": "application/json" } : {}), ...(ADMIN_KEY ? { "x-admin-key": ADMIN_KEY } : {}), ...(options.headers || {}) };
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
  const isLiveLecture = (value) => Boolean(value?.meta?.live || value?.meta?.mode === "live_lecture" || value?.meta?.lesson?.live);
  function renderLiveLectureStatus() {
    const lesson = state.lessons.find((item) => item.status === "recording" && isLiveLecture(item));
    els.liveLesson.hidden = !lesson;
    if (lesson) {
      els.liveLesson.textContent = "● Live lecture";
      els.liveLesson.title = `${lesson.title || "Live lecture"}: narration continues while saved drawing batches arrive.`;
    }
  }

  function toast(message, ms = 3600) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => els.toast.classList.remove("show"), ms);
  }
  function showNotice(message) { els.notice.hidden = !message; els.notice.textContent = message || ""; }
  function applyTheme(theme = state.theme) {
    state.theme = theme === "dark" ? "dark" : "light";
    document.documentElement.classList.toggle("theme-dark", state.theme === "dark");
    localStorage.setItem("ai-classroom-theme", state.theme);
    const button = $("#theme-button");
    if (button) { button.textContent = state.theme === "dark" ? "☀" : "◐"; button.title = state.theme === "dark" ? "Use light appearance" : "Use dark appearance"; }
  }
  function applyMode(mode = state.mode) {
    state.mode = ["full", "quick", "debate"].includes(mode) ? mode : "full";
    localStorage.setItem("ai-classroom-mode", state.mode);
    const button = $("#mode-button"); if (button) button.textContent = `${state.mode[0].toUpperCase()}${state.mode.slice(1)} mode`;
    document.querySelectorAll("#mode-options input").forEach((input) => { input.checked = input.value === state.mode; });
  }
  function formatSeconds(seconds) { const n = Math.max(0, Number(seconds) || 0); return n >= 60 ? `${Math.floor(n / 60)}m ${Math.round(n % 60)}s` : `${Math.round(n)}s`; }
  async function refreshStats() {
    try {
      const stats = await api("/stats"); state.stats = stats;
      $("#stat-questions").textContent = stats.questions_answered ?? "—";
      $("#stat-time").textContent = formatSeconds(stats.mean_deliberation_s);
      $("#stat-online").textContent = `${state.council.filter((seat) => seat.status !== "offline").length}/10`;
      if (ADMIN_KEY) {
        $("#admin-settings").hidden = false;
        $("#setting-quorum").value = state.settings.quorum ?? "";
        $("#setting-phase").value = state.settings.phase_timeout_s ?? "";
        $("#setting-revise").value = state.settings.revise_timeout_s ?? "";
      }
    } catch (error) { toast(`Could not load room statistics: ${error.message}`); }
  }

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
    state.council = council;
    window.ClassroomUI?.renderCouncil(els.council, council, state.task, (seat) => filterDeliberation(seat));
  }
  function filterDeliberation(seat) {
    document.querySelectorAll(".signal").forEach((node) => { node.hidden = !node.textContent.includes(`Seat ${seat} `); });
    toast(`Showing deliberation from seat ${seat}. Click another seat to change the filter.`);
  }

  function phaseName(phase) { return ({ research:"researching", draft:"drafting", critique:"checking", revise:"revising", vote:"voting", final:"writing answer", draw:"drawing", done:"complete" })[phase] || phase || "ready"; }
  function renderPhase() {
    els.phaseSlot.innerHTML = window.ClassroomUI?.phaseBar(state.task) || "";
    if (!state.task || ["done", "failed"].includes(state.task.phase)) { els.phase.hidden = true; return; }
    const remaining = Math.max(0, new Date(state.task.deadline || Date.now()).getTime() - Date.now());
    const seconds = Math.ceil(remaining / 1000);
    els.phase.hidden = false; els.phase.textContent = `Council ${phaseName(state.task.phase)} · round ${state.task.round} · ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2,"0")}`;
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
    const actions = document.createElement("div"); actions.className = "answer-actions";
    [["👍","Helpful feedback"],["👎","Needs improvement"],["Explain simpler","Explain the last answer in simpler language."],["Go deeper","Go deeper on the last answer with sources."],["Study guide","Turn the last answer and relevant learning-library material into a concise study guide with key terms, retrieval questions, and sources."],["Excel workbook","Create a real downloadable .xlsx workbook from the last answer. Use meaningful sheet names, headers, formulas where useful, and upload it to outputs/spreadsheets; do not rename a CSV as Excel."],["Word document","Create a real downloadable .docx report from the last answer with a title, clear sections, sources, and a filename in outputs/reports."],["File pack","Create the most useful downloadable deliverables for the last answer. You may publish real DOCX, XLSX, PDF, PPTX, CSV, code, images, models, audio, archives, or other valid file types; upload each to a sensible outputs folder and list the filenames."],["Flashcards","Create ten high-quality question-and-answer flashcards from the last answer and any relevant learned files."],["Practice","Create a graduated practice set from the last answer. Ask one question at a time and wait for my reply before revealing feedback."],["Live lecture","Start a live, extended narrated lesson from the last answer. Turn sound on, create a saved live lesson first, then keep explaining in 500–1100-character voice chunks while the illustrator immediately and progressively adds small verified drawing batches. Do not wait for the drawing to finish before continuing the narration; complete the saved lesson after the final recap."],["Teach it live","Create a saved, step-by-step lesson from the last answer. Start the lesson record first, then explain in short spoken chunks while the illustrator adds durable drawing steps between chunks. Include an erase or correction step only where it helps learning, and complete the saved lesson after its final recap."],["Draw it","Draw a clearer labelled explanation on the current sheet. Confirm the saved board operations before saying the drawing is complete."],["Animate it (Blender)","Create a short sheet-linked animation explaining the last answer, upload it, and publish a synchronized narration only after the video and board ops are saved."],["Quiz me on this","Quiz me with five questions about the last answer."],["Speak it","Speak a short summary of the last answer."]].forEach(([label,prompt]) => { const b=document.createElement("button"); b.type="button"; b.textContent=label; b.addEventListener("click",()=> { if(label==="👍"||label==="👎") post("/feedback",{session_id:state.sessionId,task_id:final.meta?.task_id,rating:label==="👍"?1:-1,body:prompt}).then(()=>toast("Feedback shared with the council.")); else { if (label === "Live lecture") { voice.setEnabled(true); toast("Sound is on. The live lecture will narrate while the sheet builds."); } ask(prompt); } }); actions.append(b); });
    node.append(actions); addCopyButtons(node);
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

  function mediaCard(message) {
    const meta = message.meta || {}, node = document.createElement("article"); node.className = "message media-card";
    const url = meta.url || "", kind = meta.kind || (meta.mime || "").split("/")[0];
    let body = `<div class="answer-meta">${escapeHtml(message.author || "Shared")}</div><strong>${escapeHtml(meta.filename || message.body || "Shared file")}</strong><p>${escapeHtml(message.body || "")}</p>`;
    if (kind === "video") body += `<video controls loop muted playsinline poster="${escapeHtml(meta.poster_url || "")}" src="${escapeHtml(url)}"></video>`;
    else if (kind === "image") body += `<img loading="lazy" src="${escapeHtml(url)}" alt="${escapeHtml(message.body || meta.filename || "Shared image")}">`;
    else if ((meta.mime || "").startsWith("audio/")) body += `<audio controls src="${escapeHtml(url)}"></audio>`;
    else if (url) body += `<a class="button outline compact" href="${escapeHtml(url)}" target="_blank" rel="noopener">Download</a>`;
    node.innerHTML = body; return node;
  }
  function speakCard(message) {
    const live = isLiveLecture(message);
    const card = document.createElement("article"); card.className = `message speak-card${live ? " live-lecture-card" : ""}`;
    const linkedMedia = message.meta?.media_id || message.meta?.media_url || message.meta?.lesson?.media_id || message.meta?.lesson?.media_url;
    const lessonId = lessonIdReference(message);
    card.innerHTML = `<span>${live ? "🎙" : "🔊"}</span><div><b>${live ? "Live lecture · " : ""}${escapeHtml(message.author || "Council")}</b><p>${escapeHtml(message.body)}</p></div><button type="button">${lessonId ? live ? "Open live lesson" : "Open lesson" : linkedMedia ? "Play lesson" : "Replay"}</button>`;
    card.querySelector("button").addEventListener("click", () => lessonId ? playSavedLesson(lessonId) : linkedMedia ? playLesson(message) : voice.replay(message.body, message.meta));
    return card;
  }

  function nearChatBottom() {
    return els.chat.scrollHeight - els.chat.scrollTop - els.chat.clientHeight < 72;
  }
  function updateJumpLatest() {
    if (nearChatBottom()) els.jumpLatest.hidden = true;
  }
  function fingerprint(value) {
    let hash = 2166136261;
    for (const char of String(value ?? "")) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
    return (hash >>> 0).toString(36);
  }
  function messageSignature(message) {
    return `${message.seq}:${message.kind}:${message.role}:${fingerprint(message.body)}:${fingerprint(JSON.stringify(message.meta || {}))}`;
  }
  function chatKey(messages) {
    const messageKey = messages.map(messageSignature).join("|");
    const taskKey = state.task ? `${state.task.id}:${state.task.phase}:${state.task.round}` : "idle";
    return `${messageKey}::${taskKey}`;
  }
  function welcomeCard() {
    const card = document.createElement("article"); card.className = "welcome-card";
    card.innerHTML = `<span class="mini-mark">AI</span><h2>Ten perspectives. One transparent answer.</h2><p>Ask a question. The council researches, drafts, challenges, verifies and votes before it replies. While it works, both of you can use the shared board.</p><div class="welcome-tags"><span>Sources shown</span><span>Confidence stated</span><span>Disagreements visible</span></div>`;
    return card;
  }
  function renderTurn(chunk, latest, signature) {
    const turn = document.createElement("section"); turn.className = "chat-turn";
    turn.dataset.questionSeq = String(chunk.question.seq); turn.dataset.signature = signature;
    const question = document.createElement("article"); question.className = "message user";
    question.innerHTML = `<div class="question-bubble">${escapeHtml(chunk.question.body)}</div>`; turn.append(question);
    for (const final of chunk.finals) turn.append(answerCard(final, chunk.signals));
    for (const signal of chunk.signals.filter((item) => item.kind === "media")) turn.append(mediaCard(signal));
    for (const signal of chunk.signals.filter((item) => item.kind === "speak")) turn.append(speakCard(signal));
    if (!chunk.finals.length && latest) {
      const progress = document.createElement("article"); progress.className = "message progress-card";
      const phase = state.task?.phase ? phaseName(state.task.phase) : "waiting for the council";
      progress.innerHTML = `<b>The council is ${escapeHtml(phase)}.</b> It will publish sources, confidence and any unresolved disagreement with the answer.`;
      turn.append(progress);
      if (chunk.signals.length) turn.append(deliberationDetails(chunk.signals, true));
    }
    return turn;
  }
  function renderChat(options = {}) {
    const messages = [...state.messages.values()].sort((a, b) => a.seq - b.seq);
    const key = chatKey(messages);
    const forcedFollow = options.follow === true || state.forceChatFollow;
    state.forceChatFollow = false;
    if (!options.force && key === state.chatRenderKey) {
      if (forcedFollow) { els.chat.scrollTop = els.chat.scrollHeight; els.jumpLatest.hidden = true; }
      return false;
    }
    // Preserve existing turn nodes whenever their messages are unchanged. This
    // avoids flicker and also preserves a reader's open deliberation details.
    const follow = forcedFollow || (state.autoscroll && nearChatBottom());
    if (!messages.length) {
      const existingWelcome = els.chat.children.length === 1 && els.chat.firstElementChild?.classList.contains("welcome-card");
      if (!existingWelcome) els.chat.replaceChildren(welcomeCard());
      state.chatRenderKey = key; els.jumpLatest.hidden = true;
      return !existingWelcome;
    }
    const chunks = [];
    let current = null;
    for (const message of messages) {
      if (message.kind === "question" && message.role === "user") { current = { question: message, signals: [], finals: [] }; chunks.push(current); }
      else if (current) { (message.kind === "final" && message.role === "council" ? current.finals : current.signals).push(message); }
    }
    const existingTurns = new Map([...els.chat.querySelectorAll(":scope > .chat-turn")].map((turn) => [turn.dataset.questionSeq, turn]));
    const desired = chunks.map((chunk, index) => {
      const latest = index === chunks.length - 1;
      const progress = !chunk.finals.length && latest ? `${state.task?.id || ""}:${state.task?.phase || ""}:${state.task?.round || ""}` : "";
      const signature = `${messageSignature(chunk.question)}|${chunk.signals.map(messageSignature).join("|")}|${chunk.finals.map(messageSignature).join("|")}|${progress}`;
      const old = existingTurns.get(String(chunk.question.seq));
      return old?.dataset.signature === signature ? old : renderTurn(chunk, latest, signature);
    });
    let marker = els.chat.firstChild;
    for (const turn of desired) {
      if (turn === marker) marker = marker.nextSibling;
      else els.chat.insertBefore(turn, marker);
    }
    while (marker) { const next = marker.nextSibling; marker.remove(); marker = next; }
    state.chatRenderKey = key;
    if (follow) { els.chat.scrollTop = els.chat.scrollHeight; els.jumpLatest.hidden = true; }
    else els.jumpLatest.hidden = false;
    return true;
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

  function renderLessons() {
    els.lessonsCount.textContent = state.lessons.length;
    els.lessonsList.innerHTML = "";
    if (!state.lessons.length) {
      els.lessonsList.innerHTML = `<section class="lesson-empty"><span>▶</span><div><b>No saved lessons yet</b><p>Ask the council to turn an answer into a step-by-step lesson. Its explanation, drawing, and erasing sequence will appear here.</p></div></section>`;
      return;
    }
    for (const lesson of state.lessons) {
      const card = document.createElement("article"); card.className = "lesson-item";
      const status = lesson.status === "complete" ? "Saved" : "Recording";
      const date = lesson.completed_at || lesson.updated_at || lesson.created_at;
      card.innerHTML = `<div class="lesson-item-head"><span class="lesson-play-mark">▶</span><div><b>${escapeHtml(lesson.title)}</b><small>${escapeHtml(status)} · ${Number(lesson.step_count || 0)} step${Number(lesson.step_count || 0) === 1 ? "" : "s"} · ${date ? new Date(date).toLocaleDateString() : ""}</small></div></div>${lesson.summary ? `<p>${escapeHtml(text(lesson.summary, 280))}</p>` : ""}<div class="lesson-item-actions"><button type="button">Play lesson</button><button type="button" class="lesson-sheet">Open sheet</button></div>`;
      const [play, sheet] = card.querySelectorAll("button");
      play.addEventListener("click", () => playSavedLesson(lesson.id));
      sheet.addEventListener("click", async () => { try { await openSheet(lesson.sheet_id); closeDrawer(); } catch (error) { toast(`Could not open lesson sheet: ${error.message}`); } });
      els.lessonsList.append(card);
    }
  }

  const voice = new window.ClassroomVoice({
    onState: (enabled) => { const b=$("#sound-button"); if (b) b.textContent = enabled ? "🔈 Sound on" : "🔇 Sound off"; },
    onUnavailable: (locale) => toast(`No installed ${locale} voice is available, so this response remains text only.`)
  });
  const uploadProgress = (file, percent, label) => {
    const id = `upload-${file.name}-${file.lastModified}`; let row = document.getElementById(id);
    if (!row) { row = document.createElement("div"); row.id=id; row.className="upload-row"; els.uploadQueue.append(row); }
    row.innerHTML = `<span>${escapeHtml(file.name)}</span><i><b style="width:${percent}%"></b></i><small>${escapeHtml(label)}</small>`;
    if (percent >= 100) setTimeout(() => row.remove(), 2200);
  };
  const files = new window.ClassroomFiles({ post, api, getSession: () => state.sessionId, notify: toast, progress: uploadProgress, onComplete: async () => { await refreshAssets(); await poll(); } });

  async function refreshAssets() {
    if (!state.sessionId) return;
    try {
      const [fileData, mediaData] = await Promise.all([api(`/files?session_id=${state.sessionId}`), api(`/media?session_id=${state.sessionId}`)]);
      state.files = fileData.files || []; state.folders = fileData.folders || []; state.media = mediaData.media || []; renderAssets();
    } catch (_) { /* Asset lists are supplemental; polling chat still works without them. */ }
  }
  function humanBytes(bytes) { const n=Number(bytes)||0; return n < 1024*1024 ? `${Math.round(n/1024)} KB` : `${(n/1024/1024).toFixed(1)} MB`; }
  function filePresentation(file) {
    const name = String(file?.name || "").toLowerCase(), mime = String(file?.mime || "").toLowerCase();
    const extension = name.includes(".") ? name.split(".").pop() : "";
    if (["xlsx", "xls", "ods", "csv"].includes(extension) || /spreadsheet|excel|csv/.test(mime)) return { icon: "▦", label: extension === "csv" ? "Spreadsheet data" : "Workbook" };
    if (["docx", "doc", "odt", "rtf"].includes(extension) || /word|document|rtf/.test(mime)) return { icon: "▤", label: "Document" };
    if (["pptx", "ppt", "odp"].includes(extension) || /presentation|powerpoint/.test(mime)) return { icon: "▧", label: "Presentation" };
    if (extension === "pdf" || mime === "application/pdf") return { icon: "▣", label: "PDF" };
    if (/^image\//.test(mime)) return { icon: "▧", label: "Image" };
    if (/^audio\//.test(mime)) return { icon: "♪", label: "Audio" };
    if (/^video\//.test(mime)) return { icon: "▶", label: "Video" };
    if (["zip", "7z", "rar", "tar", "gz"].includes(extension)) return { icon: "▤", label: "Archive" };
    if (["py", "js", "ts", "html", "css", "json", "md", "ipynb", "ino"].includes(extension)) return { icon: "⌘", label: "Code or data" };
    return { icon: "📄", label: "File" };
  }
  function renderAssets() {
    els.filesCount.textContent = state.files.length;
    const learned = state.files.filter((file) => file.learned);
    const paths = new Set(state.folders.map((folder) => folder.path));
    for (const file of state.files) {
      const bits = String(file.path || "").split("/").filter(Boolean);
      for (let i = 1; i <= bits.length; i++) paths.add(bits.slice(0, i).join("/"));
    }
    const folders = [...paths].sort();
    const currentFiles = state.files.filter((file) => String(file.path || "") === state.fileFolder);
    els.filesList.innerHTML = `<div class="file-tools"><span>${escapeHtml(state.fileFolder || "Shared files")}</span><span><button type="button" id="attach-file-button">+ Upload</button><button type="button" id="learn-file-button">✦ Learn</button><button type="button" id="new-folder-button">+ Folder</button></span></div><div class="folder-tree"><button type="button" class="${state.fileFolder ? "" : "active"}" data-folder="">⌂ Shared files</button>${folders.map((path) => `<button type="button" class="${path === state.fileFolder ? "active" : ""}" data-folder="${escapeHtml(path)}">⌁ ${escapeHtml(path)}</button>`).join("")}</div>`;
    const list = document.createElement("div"); list.className = "file-rows";
    if (!currentFiles.length) list.innerHTML = `<p class="eyebrow">No files in this folder</p>`;
    for (const file of currentFiles) {
      const row = document.createElement("article"); row.className = "file-item";
      const type = filePresentation(file), icon = file.learned ? "📚" : type.icon, learning = file.learned ? "In learning library" : "Available to this conversation";
      row.innerHTML = `<span>${icon}</span><div><b>${escapeHtml(file.name)}</b><small>${escapeHtml(type.label)} · ${humanBytes(file.bytes)} · ${escapeHtml(file.author || "You")} · ${learning}</small></div><a href="${escapeHtml(file.url || "#")}" target="_blank" download>⇩</a>`;
      const learn = document.createElement("button"); learn.type = "button"; learn.textContent = file.learned ? "Remove learning" : "Add to learning";
      learn.addEventListener("click", async () => { try { await post("/file/learn", { file_id: file.id, learned: !file.learned }); await refreshAssets(); toast(file.learned ? "Removed from the learning library." : "Added to the learning library."); } catch (error) { toast(error.message); } });
      const move = document.createElement("button"); move.type = "button"; move.textContent = "Move";
      move.addEventListener("click", async () => { const path = window.prompt("Move file to folder (blank for Shared files):", file.path || ""); if (path === null) return; try { await post("/files/move", { session_id: state.sessionId, file_id: file.id, path }); state.fileFolder = path.trim().replace(/^\/+|\/+$/g, ""); await refreshAssets(); } catch (error) { toast(`Could not move ${file.name}: ${error.message}`); } });
      row.append(learn, move); list.append(row);
    }
    els.filesList.append(list);
    els.filesList.querySelectorAll("[data-folder]").forEach((button) => button.addEventListener("click", () => { state.fileFolder = button.dataset.folder || ""; renderAssets(); }));
    $("#attach-file-button").addEventListener("click", () => els.filesInput.click());
    $("#learn-file-button").addEventListener("click", () => els.knowledgeInput.click());
    $("#new-folder-button").addEventListener("click", async () => { const path = window.prompt("Name a shared folder:", state.fileFolder ? `${state.fileFolder}/` : ""); if (!path?.trim()) return; try { await post("/files/mkdir", { session_id: state.sessionId, path }); state.fileFolder = path.trim().replace(/^\/+|\/+$/g, ""); await refreshAssets(); toast("Shared folder created."); } catch (error) { toast(`Could not create folder: ${error.message}`); } });
    els.knowledgeSummary.innerHTML = learned.length ? `<b>${learned.length} learned file${learned.length === 1 ? "" : "s"}</b><span>The council can cite these materials when answering.</span><div class="learned-file-list">${learned.slice(0, 8).map((file) => `<span>📚 ${escapeHtml(file.name)}</span>`).join("")}</div>` : "<b>Nothing learned yet</b><span>Add a study file to give the council a private, citable source.</span>";
    els.mediaList.innerHTML = state.media.length ? "" : `<p class="eyebrow">No media yet</p>`;
    for (const item of state.media) {
      const row = document.createElement("article"); row.className = "file-item";
      row.innerHTML = `<span>${item.kind === "video" ? "▶" : item.kind === "model3d" ? "◇" : item.kind === "audio" ? "♪" : "▧"}</span><div><b>${escapeHtml(item.filename)}</b><small>${escapeHtml(item.caption || item.kind)} · ${humanBytes(item.bytes)}</small></div><a href="${escapeHtml(item.url || "#")}" target="_blank">Open</a>`;
      if (item.kind === "video") { const play = document.createElement("button"); play.type = "button"; play.textContent = "Play on sheet"; play.addEventListener("click", () => playLesson({ meta: { media_id: item.id, media_url: item.url }, body: "" })); row.append(play); }
      els.mediaList.append(row);
    }
  }

  function updateBoardStatus(count, local = false) {
    if (local) els.boardStatus.textContent = "Saving your mark…";
    else if (!count) els.boardStatus.textContent = "Waiting for saved marks";
    else els.boardStatus.textContent = `${count} saved board mark${count === 1 ? "" : "s"}`;
  }
  const board = new window.ClassroomBoard($("#board"), {
    minimap: $("#minimap"),
    onCommit: async (ops) => {
      if (!state.activeSheet) throw new Error("There is no active sheet yet.");
      els.sync.textContent = "saving…";
      const response = await post(`/sheet/${state.activeSheet.id}/ops`, { ops, author: "user" });
      els.sync.textContent = "saved"; state.pngDirty = true; return response;
    },
    onStream: async (op) => {
      if (!state.activeSheet) throw new Error("There is no active sheet yet.");
      const response = await post(`/sheet/${state.activeSheet.id}/ops`, { ops: [op], author: "user" });
      if (op.done) state.pngDirty = true;
      return response;
    },
    onPointer: async (op) => {
      if (!state.activeSheet) return;
      await post(`/sheet/${state.activeSheet.id}/ops`, { ops: [op], author: "user" });
    },
    onError: (error) => { els.sync.textContent = "not saved"; toast(`Board change not saved: ${error.message}`); },
    onInfo: toast,
    onReplay: (playing) => { const b = $("#replay-button"); b.classList.toggle("active", playing); b.title = playing ? "Stop sheet replay" : "Replay this sheet from the beginning"; },
    onZoom: (zoom) => { els.zoom.textContent = `${Math.round(zoom * 100)}%`; },
    onRender: ({ count, local, dirty }) => { els.ops.textContent = `${count} operation${count === 1 ? "" : "s"}`; els.empty.style.opacity = count ? "0" : "1"; updateBoardStatus(count, local); window.setTimeout(() => { els.playLesson.disabled = !board.hasPlayableMedia(); }, 0); if (local || dirty) state.pngDirty = true; }
  });

  async function openSheet(id) {
    const data = await api(`/sheet/${id}`);
    state.activeSheet = data.sheet;
    const fromList = state.sheets.find((sheet) => sheet.id === id);
    if (fromList) Object.assign(fromList, data.sheet);
    board.setRows(data.ops || []);
    board.setLivePointer(data.sheet.state?.pointer || null);
    els.sheetName.textContent = data.sheet.title;
    els.sync.textContent = "synced";
    els.playLesson.disabled = !board.hasPlayableMedia();
    renderSheets();
  }

  async function reloadBoard(message = "") {
    if (!state.activeSheet) return false;
    const data = await api(`/sheet/${state.activeSheet.id}`);
    board.setRows(data.ops || []); board.setLivePointer(data.sheet?.state?.pointer || null);
    els.sync.textContent = "synced"; els.playLesson.disabled = !board.hasPlayableMedia();
    if (message) toast(message);
    return (data.ops || []).length > 0;
  }
  async function pollOps() {
    if (state.opsPolling || state.lessonPlayback || !state.activeSheet) return;
    state.opsPolling = true;
    try {
      const data = await api(`/sheet/${state.activeSheet.id}/ops?since=${board.maxSeq()}`);
      if (data.ops?.length) {
        const progressive = data.ops.some((row) => row.author === "illustrator");
        board.appendRows(data.ops, progressive);
        els.sync.textContent = "synced";
      }
      els.playLesson.disabled = !board.hasPlayableMedia();
    } catch (error) { els.boardStatus.textContent = "Board sync needs a retry"; }
    finally { state.opsPolling = false; }
  }
  async function verifyBoardEvent(message) {
    if (!message?.meta?.sheet_id || message.meta.sheet_id !== state.activeSheet?.id || !Number(message.meta?.count)) return;
    try {
      const hasOps = await reloadBoard();
      if (!hasOps) {
        els.boardStatus.textContent = "Illustration was not saved";
        toast("The council reported a drawing, but no saved board marks arrived. It must retry before claiming completion.", 6500);
      } else if (message.meta?.lesson_id) {
        const action = message.meta?.lesson_action === "erase" ? "erase" : "drawing";
        els.boardStatus.textContent = `Saved lesson step ${message.meta?.lesson_step || ""}: ${action}`.trim();
      }
    } catch (_) { els.boardStatus.textContent = "Could not verify the illustration"; }
  }
  function lessonReference(message) {
    const meta = message?.meta || {}, lesson = meta.lesson || {};
    return lesson.media_id || meta.media_id || lesson.media_url || meta.media_url || meta.url || "";
  }
  async function startLessonMedia(message) {
    const started = await board.playMedia(lessonReference(message));
    if (!started) toast("No playable lesson animation is on this sheet yet.");
    return started;
  }
  async function playLesson(message) {
    const latest = [...state.messages.values()].reverse();
    const narration = message?.body ? message : latest.find((item) => item.kind === "speak" && lessonReference(item)) || latest.find((item) => item.kind === "speak") || null;
    const started = await startLessonMedia(narration);
    if (narration?.body) voice.replay(narration.body, narration.meta || {});
    if (started) els.boardStatus.textContent = "Playing explanation with sheet animation";
  }
  const pause = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
  function lessonIdReference(message) {
    const lesson = message?.meta?.lesson || {};
    return lesson.lesson_id || lesson.id || message?.meta?.lesson_id || "";
  }
  function stopLessonPlayback() {
    if (!state.lessonPlayback) return;
    state.lessonPlayback.cancelled = true;
    state.lessonPlayback = null;
    board.stopReplay();
  }
  async function playSavedLesson(lessonId) {
    stopLessonPlayback();
    const playback = { id: String(lessonId), cancelled: false };
    state.lessonPlayback = playback;
    try {
      const data = await api(`/lesson/${encodeURIComponent(lessonId)}`);
      if (playback.cancelled || state.lessonPlayback !== playback) return;
      const lesson = data.lesson, sheetData = await api(`/sheet/${encodeURIComponent(lesson.sheet_id)}`);
      if (playback.cancelled || state.lessonPlayback !== playback) return;
      state.activeSheet = sheetData.sheet;
      const knownSheet = state.sheets.find((sheet) => sheet.id === lesson.sheet_id);
      if (knownSheet) Object.assign(knownSheet, sheetData.sheet);
      else state.sheets.push(sheetData.sheet);
      const rows = (sheetData.ops || []).sort((a, b) => Number(a.seq) - Number(b.seq));
      board.setRows(rows.filter((row) => Number(row.seq) <= Number(lesson.base_op_seq || 0)));
      board.setLivePointer(sheetData.sheet.state?.pointer || null);
      els.sheetName.textContent = sheetData.sheet.title;
      els.sync.textContent = "lesson replay";
      renderSheets();
      closeDrawer();
      const steps = (data.steps || []).sort((a, b) => Number(a.step_no) - Number(b.step_no));
      if (!steps.length) { toast("This saved lesson has no recorded steps yet."); return; }
      for (const step of steps) {
        if (playback.cancelled || state.lessonPlayback !== playback) return;
        const label = step.kind === "erase" ? "erasing" : step.kind === "draw" ? "drawing" : step.kind === "narrate" ? "explaining" : "playing";
        els.boardStatus.textContent = `Lesson step ${step.step_no}/${steps.length}: ${label}`;
        if (step.kind === "narrate") {
          if (step.meta?.media_id) await board.playMedia(step.meta.media_id);
          if (step.body) voice.replay(step.body, { lang: step.meta?.lang, voice: step.meta?.voice || "teacher" });
          await pause(Math.min(4800, Math.max(850, String(step.body || "").length * 30)));
          continue;
        }
        const from = Number(step.op_from || 0), to = Number(step.op_to || 0);
        const stepRows = rows.filter((row) => Number(row.seq) >= from && Number(row.seq) <= to);
        if (stepRows.length) board.appendRows(stepRows, true);
        await pause(Math.min(4200, Math.max(420, stepRows.length * 330)));
      }
      if (!playback.cancelled) {
        els.boardStatus.textContent = `Finished saved lesson: ${lesson.title}`;
        toast(`Finished “${lesson.title}”.`);
      }
    } catch (error) {
      if (!playback.cancelled) toast(`Could not play this lesson: ${error.message}`, 5200);
    } finally {
      if (state.lessonPlayback === playback) state.lessonPlayback = null;
    }
  }

  async function createSession() {
    const data = await post("/session", { title: "AI Classroom session" });
    stopLessonPlayback();
    state.sessionId = data.session_id; state.latestSeq = 0; state.messages.clear(); state.task = null; state.sheets = []; state.lessons = []; state.chatRenderKey = null; state.forceChatFollow = true;
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
      state.lessons = data.lessons || [];
      state.settings = data.settings || state.settings;
      renderCouncil(data.council || []); renderPhase(); renderLiveLectureStatus(); renderChat(); renderSheets(); renderLessons();
      els.ticker.textContent = window.ClassroomUI?.ticker(data.messages || [], state.task) || "Council ready";
      const boardEvents = (data.messages || []).filter((message) => message.kind === "board_event");
      for (const message of data.messages || []) if (message.kind === "speak" && !state.seenSpeak.has(message.seq)) {
        state.seenSpeak.add(message.seq); voice.enqueue(message);
        if (lessonReference(message)) state.pendingLesson = message;
      }
      if (!state.activeSheet && state.sheets.length) await openSheet(state.sheets[state.sheets.length - 1].id);
      const activeMeta = state.sheets.find((sheet) => sheet.id === state.activeSheet?.id);
      if (activeMeta?.state?.pointer) board.setLivePointer(activeMeta.state.pointer);
      if (activeMeta?.state?.fresh_requested_at) { state.pngDirty = true; await snapshot(true); }
      await pollOps();
      for (const event of boardEvents) await verifyBoardEvent(event);
      if (state.pendingLesson) { const lesson = state.pendingLesson; state.pendingLesson = null; await startLessonMedia(lesson); }
      await refreshAssets();
      if (first) els.question.focus();
    } catch (error) {
      showNotice(`Connection issue: ${error.message}`);
      els.sync.textContent = "offline";
    } finally { state.polling = false; }
  }

  async function ask(value) {
    const prompt = String(value || "").trim();
    if (!prompt) return;
    const suppliedMode = /^\/(quick|debate)\b/i.test(prompt);
    const taskText = suppliedMode || state.mode === "full" ? prompt : `/${state.mode} ${prompt}`;
    if (!state.sessionId) await createSession();
    els.ask.disabled = true; els.question.disabled = true;
    try {
      await post("/ask", { session_id: state.sessionId, text: taskText, sheet_id: state.activeSheet?.id || null });
      state.forceChatFollow = true; els.question.value = ""; await poll();
    } catch (error) { state.forceChatFollow = false; toast(`The question was not sent: ${error.message}`, 5000); }
    finally { els.ask.disabled = false; els.question.disabled = false; els.question.focus(); }
  }

  function openDrawer() { els.drawer.classList.add("open"); els.drawer.setAttribute("aria-hidden", "false"); els.scrim.hidden = false; $("#sheets-button").setAttribute("aria-expanded", "true"); $("#files-button").setAttribute("aria-expanded", "true"); $("#learn-button").setAttribute("aria-expanded", "true"); $("#lessons-button").setAttribute("aria-expanded", "true"); }
  function closeDrawer() { els.drawer.classList.remove("open"); els.drawer.setAttribute("aria-hidden", "true"); els.scrim.hidden = true; $("#sheets-button").setAttribute("aria-expanded", "false"); $("#files-button").setAttribute("aria-expanded", "false"); $("#learn-button").setAttribute("aria-expanded", "false"); $("#lessons-button").setAttribute("aria-expanded", "false"); }
  function setChatFocus(focused) {
    if (focused && state.boardFocused) setBoardFocus(false);
    const wasFollowing = nearChatBottom();
    state.chatFocused = Boolean(focused);
    document.body.classList.toggle("chat-focus", state.chatFocused);
    els.chatFocus.setAttribute("aria-pressed", String(state.chatFocused));
    els.chatFocus.textContent = state.chatFocused ? "× Exit focus" : "⛶ Full chat";
    els.chatFocus.title = state.chatFocused ? "Return to the shared room" : "Expand the conversation for focused reading";
    requestAnimationFrame(() => { if (wasFollowing) { els.chat.scrollTop = els.chat.scrollHeight; els.jumpLatest.hidden = true; } });
  }
  function setBoardFocus(focused) {
    if (focused && state.chatFocused) setChatFocus(false);
    state.boardFocused = Boolean(focused);
    document.body.classList.toggle("board-focus", state.boardFocused);
    els.boardFocus.setAttribute("aria-pressed", String(state.boardFocused));
    els.boardFocus.textContent = state.boardFocused ? "×" : "⛶";
    els.boardFocus.title = state.boardFocused ? "Return to the shared room" : "Expand the shared sheet";
    requestAnimationFrame(() => board.resize());
  }

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

  async function uploadFiles(fileList, learned = false) {
    const queue = [...fileList];
    if (learned && queue.length) { openDrawer(); switchDrawer("knowledge"); }
    for (const file of queue) {
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      const media = /^(image|video|audio)\//.test(file.type) || ["glb", "gltf", "stl", "obj"].includes(ext);
      try {
        const result = await files.upload(file, { learned: learned && !media, media, sheetId: media ? state.activeSheet?.id || null : null, taskId: state.task?.id || null, path: media ? "" : state.fileFolder, caption: media ? `${file.name} shared by the learner.` : "" });
        toast(media ? `${file.name} is embedded in the room.` : learned && result.learningReady ? `${file.name} is ready for the council to cite.` : learned ? `${file.name} is stored, but not yet readable learning material.` : `${file.name} is available to the council.`);
      } catch (error) { toast(`Could not upload ${file.name}: ${error.message}`, 5000); }
    }
  }

  async function snapshot(force = false) {
    if ((!state.pngDirty && !force) || !state.activeSheet) return;
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

  async function exportSession() {
    if (!state.sessionId) return;
    if (!ADMIN_KEY) { toast("Open the room with ?admin=YOUR_ADMIN_KEY to export a session.", 5200); return; }
    try {
      const response = await fetch(`${API}/export?session_id=${encodeURIComponent(state.sessionId)}`, { headers: { "x-admin-key": ADMIN_KEY } });
      if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error || `Export failed (${response.status})`); }
      const blob = await response.blob(), link = document.createElement("a");
      link.href = URL.createObjectURL(blob); link.download = `ai-classroom-${state.sessionId}.zip`; link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
    } catch (error) { toast(`Could not export this session: ${error.message}`, 5000); }
  }
  async function saveAdminSettings() {
    if (!ADMIN_KEY) return;
    const settings = { quorum: Number($("#setting-quorum").value), phase_timeout_s: Number($("#setting-phase").value), revise_timeout_s: Number($("#setting-revise").value) };
    try { const data = await post("/settings", settings); state.settings = data.settings || state.settings; toast("Room timing saved for future tasks."); }
    catch (error) { toast(`Could not save room timing: ${error.message}`, 5000); }
  }

  // Wire page controls.
  applyTheme(); applyMode();
  $("#sound-button").textContent = voice.enabled ? "🔈 Sound on" : "🔇 Sound off";
  $("#sound-button").addEventListener("click", () => voice.setEnabled(!voice.enabled));
  $("#voice-skip-button").addEventListener("click", () => { voice.skip(); toast("Voice skipped."); });
  els.chatFocus.addEventListener("click", () => setChatFocus(!state.chatFocused));
  els.boardFocus.addEventListener("click", () => setBoardFocus(!state.boardFocused));
  els.playLesson.addEventListener("click", () => playLesson());
  els.jumpLatest.addEventListener("click", () => { els.chat.scrollTop = els.chat.scrollHeight; els.jumpLatest.hidden = true; });
  els.chat.addEventListener("scroll", updateJumpLatest, { passive: true });
  $("#theme-button").addEventListener("click", () => applyTheme(state.theme === "dark" ? "light" : "dark"));
  $("#mode-button").addEventListener("click", () => $("#mode-dialog").showModal());
  $("#close-mode").addEventListener("click", () => $("#mode-dialog").close());
  document.querySelectorAll("#mode-options input").forEach((input) => input.addEventListener("change", () => { applyMode(input.value); $("#mode-dialog").close(); toast(`${input.value[0].toUpperCase()}${input.value.slice(1)} council mode selected.`); }));
  $("#settings-button").addEventListener("click", async () => { $("#autoscroll-toggle").checked = state.autoscroll; $("#voice-verbose-toggle").checked = voice.verbose; $("#settings-dialog").showModal(); await refreshStats(); });
  $("#close-settings").addEventListener("click", () => $("#settings-dialog").close());
  $("#autoscroll-toggle").addEventListener("change", (event) => { state.autoscroll = event.target.checked; localStorage.setItem("ai-classroom-autoscroll", state.autoscroll ? "on" : "off"); });
  $("#voice-verbose-toggle").addEventListener("change", (event) => voice.setVerbose(event.target.checked));
  $("#refresh-stats").addEventListener("click", refreshStats); $("#save-settings").addEventListener("click", saveAdminSettings); $("#export-session").addEventListener("click", exportSession);
  $("#mic-button").addEventListener("click", () => { try { voice.dictate(els.question); } catch (error) { toast(error.message); } });
  els.filesInput.addEventListener("change", () => { uploadFiles(els.filesInput.files); els.filesInput.value = ""; });
  const addToKnowledge = (input) => { input.addEventListener("change", () => { uploadFiles(input.files, true); input.value = ""; }); };
  addToKnowledge(els.knowledgeInput); addToKnowledge(els.libraryKnowledgeInput);
  $("#files-button").addEventListener("click", () => { openDrawer(); switchDrawer("files"); });
  $("#learn-button").addEventListener("click", () => { openDrawer(); switchDrawer("knowledge"); });
  $("#lessons-button").addEventListener("click", () => { openDrawer(); switchDrawer("lessons"); renderLessons(); });
  document.querySelectorAll("[data-drawer-tab]").forEach((b) => b.addEventListener("click", () => switchDrawer(b.dataset.drawerTab)));
  let knowledgeSearchTimer = null;
  $("#knowledge-search").addEventListener("input", (event) => { clearTimeout(knowledgeSearchTimer); knowledgeSearchTimer = setTimeout(async () => { const q = event.target.value.trim(); if (!state.sessionId) return; if (!q) { $("#knowledge-results").textContent = ""; return; } try { const data = await api(`/kb/search?session_id=${state.sessionId}&q=${encodeURIComponent(q)}`); $("#knowledge-results").innerHTML = (data.hits || []).map((hit) => `<article class="knowledge-hit"><b>${escapeHtml(hit.file)}${hit.page ? ` p.${hit.page}` : ""}</b><p>${escapeHtml(hit.text)}</p></article>`).join("") || "No matching chunks."; } catch (error) { toast(error.message); } }, 240); });
  // A drag event can be fired by a browser integration without a file payload.
  // Show the full-screen drop target only for real files, and always provide a
  // deterministic close path so it cannot trap the classroom behind an overlay.
  let dropHideTimer = null;
  const isFileDrag = (event) => Array.from(event.dataTransfer?.types || []).includes("Files") || Boolean(event.dataTransfer?.files?.length);
  const closeDropZone = () => { clearTimeout(dropHideTimer); els.drop.hidden = true; };
  const openDropZone = (event) => { if (!isFileDrag(event)) return false; clearTimeout(dropHideTimer); els.drop.hidden = false; return true; };
  document.addEventListener("dragenter", (event) => { if (openDropZone(event)) event.preventDefault(); });
  document.addEventListener("dragover", (event) => { if (openDropZone(event)) { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; } });
  document.addEventListener("dragleave", (event) => {
    if (!isFileDrag(event)) return;
    // Drag leave bubbles for child elements; wait briefly and only close when
    // the pointer actually leaves the document or the drop target.
    if (!event.relatedTarget || !document.documentElement.contains(event.relatedTarget)) dropHideTimer = setTimeout(closeDropZone, 40);
  });
  document.addEventListener("drop", (event) => { if (!isFileDrag(event)) return; event.preventDefault(); closeDropZone(); if (event.dataTransfer?.files?.length) uploadFiles(event.dataTransfer.files, event.shiftKey); });
  window.addEventListener("blur", closeDropZone); window.addEventListener("pagehide", closeDropZone);
  $("#cancel-drop").addEventListener("click", closeDropZone);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.drop.hidden) { closeDropZone(); return; }
    if (event.key === "Escape" && state.chatFocused) { event.preventDefault(); setChatFocus(false); return; }
    if (event.key === "Escape" && state.boardFocused) { event.preventDefault(); setBoardFocus(false); return; }
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); ask(els.question.value); }
    if (event.target.matches("textarea,input")) return;
    if (event.key.toLowerCase() === "n") newSheet();
    if (event.key.toLowerCase() === "p") document.querySelector('[data-tool="pen"]').click();
    if (event.key.toLowerCase() === "e") document.querySelector('[data-tool="eraser"]').click();
    if (event.key.toLowerCase() === "h") document.querySelector('[data-tool="highlight"]').click();
    if (event.key.toLowerCase() === "l") document.querySelector('[data-tool="laser"]').click();
    if (event.key.toLowerCase() === "r") board.replay();
    if (event.key === " ") document.querySelector('[data-tool="pan"]').click();
  });
  function switchDrawer(tab) { state.drawerTab=tab; document.querySelectorAll("[data-drawer-tab]").forEach((b)=>b.classList.toggle("active",b.dataset.drawerTab===tab)); document.querySelectorAll(".drawer-panel").forEach((p)=>p.hidden=p.id!==`${tab}-list`); }
  els.form.addEventListener("submit", (event) => { event.preventDefault(); ask(els.question.value); });
  $("#new-session").addEventListener("click", () => { if (confirm("Start a new session? This keeps older sessions in the database, but switches this browser to a clean room.")) createSession(); });
  $("#sheets-button").addEventListener("click", openDrawer); $("#close-sheets").addEventListener("click", closeDrawer); els.scrim.addEventListener("click", closeDrawer); $("#new-sheet").addEventListener("click", newSheet);
  $("#about-button").addEventListener("click", () => $("#about-dialog").showModal()); $("#close-about").addEventListener("click", () => $("#about-dialog").close());
  $("#ask-sheet").addEventListener("click", () => ask("Please explain what is shown on the current sheet and how it relates to our discussion."));
  $("#download-png").addEventListener("click", downloadPNG); $("#undo-button").addEventListener("click", () => board.undoLatest());
  $("#replay-button").addEventListener("click", () => board.replayLimit === null ? board.replay() : board.stopReplay());
  $("#zoom-in").addEventListener("click", () => board.setZoom(board.zoom * 1.15)); $("#zoom-out").addEventListener("click", () => board.setZoom(board.zoom / 1.15)); els.zoom.addEventListener("click", () => board.resetView());
  els.image.addEventListener("change", () => uploadImage(els.image.files?.[0]));
  $("#grid-toggle").addEventListener("click", () => { $("#board-wrap").classList.toggle("no-grid"); $("#grid-toggle").classList.toggle("active"); });
  $("#snapshot-sheet").addEventListener("click", async () => { await snapshot(true); const old=state.activeSheet; await newSheet(); if(old) toast("Snapshot saved; a new blank sheet is open."); });
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
