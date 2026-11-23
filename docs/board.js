/* AI CLASSROOM board: a dependency-free renderer for append-only vector operations. */
(function () {
  "use strict";
  const W = 1600, H = 1000;
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

  class ClassroomBoard {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.options = options;
      this.rows = [];
      this.tool = "pen";
      this.color = "#16213e";
      this.width = 4;
      this.zoom = 1;
      this.pan = { x: 0, y: 0 };
      this.pointer = null;
      this.dragImage = null;
      this.imageCache = new Map();
      this.progressQueue = [];
      this.progressTimer = null;
      this.dirty = false;
      this.streamChain = Promise.resolve();
      this.mediaLayer = document.createElement("div");
      this.mediaLayer.className = "board-media-layer";
      canvas.parentElement.append(this.mediaLayer);
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(canvas.parentElement);
      this.bindEvents();
      this.resize();
    }

    bindEvents() {
      const c = this.canvas;
      c.addEventListener("pointerdown", (e) => this.pointerDown(e));
      c.addEventListener("pointermove", (e) => this.pointerMove(e));
      c.addEventListener("pointerup", (e) => this.pointerUp(e));
      c.addEventListener("pointercancel", (e) => this.pointerUp(e));
      c.addEventListener("wheel", (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? .9 : 1.1;
        this.setZoom(this.zoom * delta, this.screenToBoard(e));
      }, { passive: false });
    }

    resize() {
      const box = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.round(box.width * dpr));
      const height = Math.max(1, Math.round(box.height * dpr));
      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
      }
      this.render();
    }

    transform() {
      const rect = this.canvas.getBoundingClientRect();
      const scale = Math.min(rect.width / W, rect.height / H) * this.zoom;
      return {
        scale,
        x: (rect.width - W * scale) / 2 + this.pan.x,
        y: (rect.height - H * scale) / 2 + this.pan.y,
      };
    }

    screenToBoard(event) {
      const rect = this.canvas.getBoundingClientRect();
      const tr = this.transform();
      return {
        x: (event.clientX - rect.left - tr.x) / tr.scale,
        y: (event.clientY - rect.top - tr.y) / tr.scale,
      };
    }

    setTool(tool) {
      this.tool = tool;
      this.canvas.style.cursor = tool === "pan" ? "grab" : tool === "text" ? "text" : tool === "select" ? "default" : "crosshair";
    }
    setColor(color) { this.color = color; }
    setWidth(width) { this.width = Number(width) || 4; }
    setZoom(zoom, anchor) {
      const previous = this.transform();
      const before = anchor ? { x: (anchor.x * previous.scale + previous.x), y: (anchor.y * previous.scale + previous.y) } : null;
      this.zoom = clamp(zoom, .35, 3);
      if (anchor && before) {
        const next = this.transform();
        this.pan.x += before.x - (anchor.x * next.scale + next.x);
        this.pan.y += before.y - (anchor.y * next.scale + next.y);
      }
      this.render();
      this.options.onZoom?.(this.zoom);
    }
    resetView() { this.zoom = 1; this.pan = { x: 0, y: 0 }; this.render(); this.options.onZoom?.(1); }

    setRows(rows) {
      this.rows = (rows || []).map((row) => ({ ...row, op: row.op || row }));
      this.progressQueue = [];
      this.dirty = false;
      this.render();
      this.notifyChange(false);
    }
    maxSeq() { return this.rows.reduce((max, r) => Math.max(max, Number(r.seq) || 0), 0); }
    operationCount() { return this.rows.filter((r) => r.op?.t !== "undo").length; }

    appendRows(rows, progressive = false) {
      const fresh = (rows || []).filter((row) => row && row.op && !this.rows.some((r) => r.seq && r.seq === row.seq));
      if (!fresh.length) return;
      if (progressive) {
        this.progressQueue.push(...fresh);
        this.drainProgress();
      } else {
        this.rows.push(...fresh);
        this.render();
        this.notifyChange(false);
      }
    }

    drainProgress() {
      if (this.progressTimer || !this.progressQueue.length) return;
      const next = () => {
        const row = this.progressQueue.shift();
        if (row) {
          this.rows.push(row);
          this.render();
          this.notifyChange(false);
        }
        if (this.progressQueue.length) this.progressTimer = window.setTimeout(next, 300);
        else this.progressTimer = null;
      };
      next();
    }

    reconcile(serverRows) {
      for (const row of serverRows || []) {
        const serialized = JSON.stringify(row.op);
        const pendingAt = this.rows.findIndex((r) => r.pending && JSON.stringify(r.op) === serialized);
        if (pendingAt >= 0) this.rows.splice(pendingAt, 1);
        if (!this.rows.some((r) => r.seq === row.seq)) this.rows.push({ ...row, op: row.op });
      }
      this.dirty = true;
      this.render();
      this.notifyChange(true);
    }

    optimistic(ops) {
      this.rows.push(...ops.map((op) => ({ op, pending: true, author: "user" })));
      this.dirty = true;
      this.render();
      this.notifyChange(true);
    }

    async commit(ops) {
      if (!ops?.length) return;
      this.optimistic(ops);
      try {
        const result = await this.options.onCommit?.(ops);
        if (result?.ops) this.reconcile(result.ops);
      } catch (error) {
        // Keep the optimistic stroke visible; a later reload makes failed writes explicit.
        this.options.onError?.(error);
      }
    }

    pointerDown(e) {
      if (e.button !== 0 && e.pointerType !== "touch") return;
      const p = this.screenToBoard(e);
      this.canvas.setPointerCapture?.(e.pointerId);
      if (this.tool === "text") {
        const words = window.prompt("Text for the sheet:");
        if (words?.trim()) this.commit([{ t: "text", x: p.x, y: p.y, s: words.trim(), size: 23, c: this.color, align: "left" }]);
        return;
      }
      if (this.tool === "select") {
        const picked = this.pickImage(p);
        if (picked) this.dragImage = { ...picked, start: p, x: picked.row.op.x, y: picked.row.op.y };
        return;
      }
      this.pointer = { id: e.pointerId, start: p, last: p, points: [p], pan: { ...this.pan }, streamPart: 0, lastStream: Date.now() };
      if (this.tool === "pan" || e.shiftKey || e.button === 1) this.canvas.style.cursor = "grabbing";
    }

    pointerMove(e) {
      if (!this.pointer && !this.dragImage) return;
      const p = this.screenToBoard(e);
      if (this.dragImage) {
        const d = this.dragImage;
        d.previewX = d.x + p.x - d.start.x;
        d.previewY = d.y + p.y - d.start.y;
        this.render({ moving: d });
        return;
      }
      const drag = this.pointer;
      if (e.pointerId !== drag.id) return;
      if (this.tool === "pan" || e.shiftKey) {
        const rect = this.canvas.getBoundingClientRect();
        const dx = e.clientX - rect.left - (drag.start.x * this.transform().scale + this.transform().x);
        const dy = e.clientY - rect.top - (drag.start.y * this.transform().scale + this.transform().y);
        this.pan = { x: drag.pan.x + dx, y: drag.pan.y + dy };
        this.render();
        return;
      }
      drag.last = p;
      // Sampling avoids huge freehand payloads while still preserving the natural curve.
      if (Math.hypot(p.x - drag.points[drag.points.length - 1].x, p.y - drag.points[drag.points.length - 1].y) > 1.4) drag.points.push(p);
      if (this.tool === "pen" && Date.now() - drag.lastStream >= 250) { this.streamStroke(drag, false); drag.lastStream = Date.now(); }
      this.render({ preview: this.previewOp(drag) });
    }

    pointerUp(e) {
      if (this.dragImage) {
        const d = this.dragImage;
        this.dragImage = null;
        if (Math.hypot((d.previewX ?? d.x) - d.x, (d.previewY ?? d.y) - d.y) > 2 && d.row.seq) {
          const next = { ...d.row.op, x: clamp(d.previewX, -W, W * 2), y: clamp(d.previewY, -H, H * 2) };
          this.commit([{ t: "undo", seq: d.row.seq }, next]);
        } else this.render();
        return;
      }
      const drag = this.pointer;
      if (!drag || e.pointerId !== drag.id) return;
      this.pointer = null;
      this.canvas.style.cursor = this.tool === "pan" ? "grab" : this.tool === "text" ? "text" : this.tool === "select" ? "default" : "crosshair";
      if (this.tool === "pan" || e.shiftKey) { this.render(); return; }
      const op = this.previewOp(drag);
      if (this.tool === "pen" && op) { this.streamStroke(drag, true); this.render(); }
      else if (op) this.commit([op]);
      else this.render();
    }

    streamStroke(drag, done) {
      const base = this.previewOp(drag); if (!base || !this.options.onStream) { if (done) this.commit([base]); return; }
      const op = { ...base, stroke_id: `s-${Date.now()}-${drag.id}`, part: drag.streamPart++, done };
      // Keep an id stable for the entire stroke.
      if (!drag.strokeId) drag.strokeId = op.stroke_id;
      op.stroke_id = drag.strokeId;
      this.streamChain = this.streamChain.then(async () => {
        const result = await this.options.onStream(op);
        if (done) {
          this.optimistic([{ t: "path", pts: base.pts, w: base.w, c: base.c, close: false }]);
          if (result?.ops) this.reconcile(result.ops);
        }
      }).catch((error) => this.options.onError?.(error));
    }

    previewOp(drag) {
      if (this.tool === "eraser") return { t: "erase", pts: drag.points.map((p) => [p.x, p.y]), w: Math.max(18, this.width * 6) };
      if (this.tool === "pen") {
        const pts = drag.points.length > 1 ? drag.points : [drag.start, { x: drag.start.x + .1, y: drag.start.y + .1 }];
        return { t: "path", pts: pts.map((p) => [p.x, p.y]), w: this.width, c: this.color, close: false };
      }
      return null;
    }

    pickImage(p) {
      const hidden = this.hiddenSeqs();
      const rows = this.rows.filter((r) => r.op?.t === "image" && r.seq && !hidden.has(r.seq));
      for (let i = rows.length - 1; i >= 0; i--) {
        const row = rows[i], o = row.op;
        if (p.x >= o.x && p.x <= o.x + o.w && p.y >= o.y && p.y <= o.y + o.h) return { row };
      }
      return null;
    }

    hiddenSeqs() {
      const hidden = new Set();
      for (const row of this.rows) if (row.op?.t === "undo" && Number.isFinite(row.op.seq)) hidden.add(row.op.seq);
      return hidden;
    }

    undoLatest() {
      const hidden = this.hiddenSeqs();
      const candidate = [...this.rows].reverse().find((r) => r.seq && r.author === "user" && r.op?.t !== "undo" && !hidden.has(r.seq));
      if (candidate) this.commit([{ t: "undo", seq: candidate.seq }]);
      else this.options.onInfo?.("There is no saved human operation to undo yet.");
    }

    activeRows() {
      const hidden = this.hiddenSeqs();
      let start = 0;
      this.rows.forEach((row, i) => { if (row.op?.t === "clear" && !hidden.has(row.seq)) start = i + 1; });
      return this.rows.slice(start).filter((r) => !hidden.has(r.seq) && r.op?.t !== "undo" && r.op?.t !== "clear" && !(r.op?.t === "pointer" && r.op.expires_at && new Date(r.op.expires_at).getTime() < Date.now()));
    }

    render(extra = {}) {
      const ctx = this.ctx, canvas = this.canvas, dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const tr = this.transform();
      ctx.setTransform(dpr * tr.scale, 0, 0, dpr * tr.scale, dpr * tr.x, dpr * tr.y);
      for (const row of this.activeRows()) this.drawOp(ctx, row.op);
      if (extra.preview) this.drawOp(ctx, extra.preview);
      if (extra.moving) this.drawOp(ctx, { ...extra.moving.row.op, x: extra.moving.previewX, y: extra.moving.previewY });
      this.renderMedia(tr);
    }

    renderMedia(tr) {
      const rows = this.activeRows().filter((r) => ["video", "model3d"].includes(r.op?.t));
      this.mediaLayer.innerHTML = "";
      for (const row of rows) {
        const op = row.op, el = op.t === "video" ? document.createElement("video") : document.createElement("model-viewer");
        el.className = "board-media"; el.style.left = `${tr.x + op.x * tr.scale}px`; el.style.top = `${tr.y + op.y * tr.scale}px`; el.style.width = `${op.w * tr.scale}px`; el.style.height = `${op.h * tr.scale}px`;
        if (op.t === "video") { el.src = op.url; el.poster = op.poster || ""; el.controls = true; el.loop = true; el.muted = true; el.playsInline = true; }
        else { el.setAttribute("src", op.url); el.setAttribute("camera-controls", ""); el.setAttribute("auto-rotate", ""); if (op.poster) el.setAttribute("poster", op.poster); }
        this.mediaLayer.append(el);
      }
    }

    drawOp(ctx, op) {
      if (!op || !op.t) return;
      ctx.save();
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      const stroke = (color, width) => { ctx.strokeStyle = color || "#111"; ctx.lineWidth = Math.max(.5, Number(width) || 2); };
      const path = (pts) => {
        if (!pts?.length) return false;
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        return true;
      };
      if (op.t === "line" || op.t === "arrow") {
        stroke(op.c, op.w); ctx.beginPath(); ctx.moveTo(op.x1, op.y1); ctx.lineTo(op.x2, op.y2); ctx.stroke();
        if (op.t === "arrow") {
          const a = Math.atan2(op.y2 - op.y1, op.x2 - op.x1), s = 10 + (Number(op.w) || 2) * 2;
          ctx.beginPath(); ctx.moveTo(op.x2, op.y2); ctx.lineTo(op.x2 - s * Math.cos(a - .48), op.y2 - s * Math.sin(a - .48)); ctx.lineTo(op.x2 - s * Math.cos(a + .48), op.y2 - s * Math.sin(a + .48)); ctx.closePath(); ctx.fillStyle = op.c || "#111"; ctx.fill();
        }
      } else if (op.t === "rect") {
        ctx.beginPath(); this.roundRect(ctx, op.x, op.y, op.w, op.h, op.r || 0); ctx.fillStyle = op.fill || "transparent"; ctx.fill(); stroke(op.c, 2); ctx.stroke();
      } else if (op.t === "ellipse") {
        ctx.beginPath(); ctx.ellipse(op.cx, op.cy, Math.abs(op.rx), Math.abs(op.ry), 0, 0, Math.PI * 2); ctx.fillStyle = op.fill || "transparent"; ctx.fill(); stroke(op.c, 2); ctx.stroke();
      } else if (op.t === "path") {
        if (path(op.pts)) { if (op.close) ctx.closePath(); stroke(op.c, op.w); ctx.stroke(); }
      } else if (op.t === "erase") {
        ctx.globalCompositeOperation = "destination-out"; if (path(op.pts)) { stroke("#000", op.w || 30); ctx.stroke(); }
      } else if (op.t === "text") {
        ctx.fillStyle = op.c || "#111"; ctx.font = `${Math.max(8, op.size || 22)}px DM Sans, Arial, sans-serif`; ctx.textAlign = op.align || "left"; ctx.textBaseline = "alphabetic"; ctx.fillText(op.s || "", op.x, op.y);
      } else if (op.t === "math") {
        ctx.fillStyle = "#111"; ctx.font = `${Math.max(8, op.size || 26)}px Georgia, serif`; ctx.fillText(op.tex || "", op.x, op.y);
      } else if (op.t === "image") {
        this.drawImage(ctx, op);
      } else if (op.t === "note") {
        ctx.fillStyle = op.fill || "#fff5bd"; ctx.fillRect(op.x, op.y, op.w, op.h); ctx.strokeStyle = op.c || "#f5b301"; ctx.strokeRect(op.x, op.y, op.w, op.h); ctx.fillStyle = "#17213b"; ctx.font = "20px DM Sans"; const lines = String(op.s || "").split(/\n/); lines.forEach((line, i) => ctx.fillText(line, op.x + 12, op.y + 30 + i * 24));
      } else if (op.t === "highlight") {
        ctx.globalAlpha = op.alpha || .25; ctx.fillStyle = op.c || "#f5b301"; ctx.fillRect(op.x, op.y, op.w, op.h);
      } else if (op.t === "pointer") {
        ctx.fillStyle = op.c || "#d7263d"; ctx.beginPath(); ctx.arc(op.x, op.y, 12, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#fff"; ctx.font = "12px DM Sans"; ctx.fillText(op.who || "", op.x + 16, op.y + 4);
      } else if (op.t === "group") {
        (op.ops || []).forEach((inner) => this.drawOp(ctx, inner));
      }
      ctx.restore();
    }

    roundRect(ctx, x, y, w, h, r) {
      r = Math.min(Math.abs(r), Math.abs(w) / 2, Math.abs(h) / 2);
      ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }

    drawImage(ctx, op) {
      if (!op.url) return;
      let image = this.imageCache.get(op.url);
      if (!image) {
        image = new Image(); image.crossOrigin = "anonymous";
        image.onload = () => this.render(); image.onerror = () => { image.failed = true; this.render(); };
        image.src = op.url; this.imageCache.set(op.url, image);
      }
      if (image.complete && image.naturalWidth) ctx.drawImage(image, op.x, op.y, op.w, op.h);
      else { ctx.fillStyle = "#edf1f7"; ctx.fillRect(op.x, op.y, op.w, op.h); ctx.strokeStyle = "#b8c2d1"; ctx.strokeRect(op.x, op.y, op.w, op.h); ctx.fillStyle = "#7c8798"; ctx.font = "18px DM Sans"; ctx.fillText("Loading image…", op.x + 12, op.y + 28); }
    }

    snapshotDataURL(width = W) {
      const height = Math.round(width * H / W), off = document.createElement("canvas");
      off.width = width; off.height = height;
      const ctx = off.getContext("2d");
      ctx.fillStyle = "#fffefa"; ctx.fillRect(0, 0, width, height);
      ctx.setTransform(width / W, 0, 0, height / H, 0, 0);
      for (const row of this.activeRows()) this.drawOp(ctx, row.op);
      return off.toDataURL("image/png");
    }

    notifyChange(local) {
      this.options.onRender?.({ count: this.operationCount(), local, dirty: this.dirty });
    }
  }
  window.ClassroomBoard = ClassroomBoard;
})();
