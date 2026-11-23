/* Signed-upload client and best-effort browser text extraction. */
(() => {
  "use strict";
  const extension = (name) => (name.split(".").pop() || "").toLowerCase();
  const isText = (file) => file.type.startsWith("text/") || ["md","txt","csv","json","js","ts","py","html","css","ino","svg","xml","yaml","yml","kicad_sch","kicad_pcb"].includes(extension(file.name));
  const pageMarkers = (text) => text || "";

  class ClassroomFiles {
    constructor({ post, api, getSession, notify, onComplete, progress }) { Object.assign(this, { post, api, getSession, notify, onComplete, progress }); }
    async upload(file, options = {}) {
      const sessionId = this.getSession(); if (!sessionId) throw new Error("Start a session before uploading files.");
      if (file.size > 100 * 1024 * 1024) throw new Error(`${file.name} exceeds the 100 MB limit.`);
      // The Files panel keeps every upload (including .blend/.glb) in the shared folder.
      // Callers explicitly opt into /media for inline renderable output.
      const media = options.media === true;
      const endpoint = media ? "/media/begin" : "/file/begin";
      this.progress?.(file, 3, "Preparing signed upload…");
      // A file becomes learned only after readable text has been extracted and indexed.
      // This prevents a failed PDF/DOCX parser from showing an unusable file as a source.
      const begin = await this.post(endpoint, { session_id: sessionId, filename: file.name, name: file.name, mime: file.type || "application/octet-stream", bytes: file.size, sheet_id: options.sheetId || null, caption: options.caption || "", path: options.path || "", learned: false, available_all: !!options.availableAll, task_id: options.taskId || null });
      const id = begin.media_id || begin.file_id;
      this.progress?.(file, 30, "Uploading directly to classroom storage…");
      const put = await fetch(begin.upload_url, { method: "PUT", headers: { "content-type": file.type || "application/octet-stream", ...(begin.headers || {}) }, body: file });
      if (!put.ok) throw new Error(`Storage upload failed (${put.status}).`);
      this.progress?.(file, 82, "Saving file record…");
      const done = await this.post(media ? "/media/done" : "/file/done", media ? { media_id: id } : { file_id: id });
      let extraction = null;
      if (!media) {
        try {
          extraction = await this.extract(file);
          if (extraction?.text) {
            this.progress?.(file, 90, options.learned ? "Indexing study material…" : "Indexing readable text…");
            await this.post(`/file/${id}/text`, { text: extraction.text });
            if (options.learned) await this.post("/file/learn", { file_id: id, learned: true });
          } else if (options.learned) this.notify?.(`${file.name} was uploaded, but this format has no readable text to add to learning.`);
        } catch (error) {
          console.info("Text extraction skipped", error);
          if (options.learned) this.notify?.(`${file.name} was uploaded, but text extraction failed so it was not added to learning.`);
        }
      }
      this.progress?.(file, 100, "Ready"); this.onComplete?.(done, file);
      return { ...done, learningReady: !options.learned || Boolean(extraction?.text) };
    }
    async extract(file) {
      if (isText(file)) return { text: pageMarkers(await file.text()) };
      const ext = extension(file.name);
      if (ext === "pdf") return this.pdf(file);
      if (ext === "docx") return this.docx(file);
      if (["xlsx","xls"].includes(ext)) return this.sheet(file);
      if (["zip"].includes(ext)) return this.archive(file);
      return null;
    }
    async pdf(file) {
      if (!window.pdfjsLib) await this.load("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs", "pdfjsLib");
      const bytes = new Uint8Array(await file.arrayBuffer()); const document = await window.pdfjsLib.getDocument({ data: bytes }).promise; let text = "";
      for (let page = 1; page <= document.numPages; page++) { const content = await (await document.getPage(page)).getTextContent(); text += `\n=== page ${page} ===\n${content.items.map((x) => x.str).join(" ")}\n`; }
      return { text };
    }
    async docx(file) {
      if (!window.mammoth) await this.script("https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js", "mammoth");
      const result = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() }); return { text: result.value };
    }
    async sheet(file) {
      if (!window.XLSX) await this.script("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js", "XLSX");
      const wb = window.XLSX.read(await file.arrayBuffer(), { type: "array" }); return { text: wb.SheetNames.map((name) => `=== page ${name} ===\n${window.XLSX.utils.sheet_to_csv(wb.Sheets[name])}`).join("\n") };
    }
    async archive(file) {
      if (!window.JSZip) await this.script("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js", "JSZip");
      const zip = await window.JSZip.loadAsync(await file.arrayBuffer()); return { text: `Archive contents:\n${Object.keys(zip.files).join("\n")}` };
    }
    script(src, global) { return new Promise((resolve, reject) => { if (window[global]) return resolve(); const s = document.createElement("script"); s.src = src; s.onload = resolve; s.onerror = () => reject(new Error(`Could not load ${global}`)); document.head.append(s); }); }
    async load(src, global) { try { await import(src); } catch { await this.script(src.replace(/\.mjs$/, ".js"), global); } }
  }
  window.ClassroomFiles = ClassroomFiles;
})();
