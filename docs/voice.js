/* Browser-native speech: no voice/audio secrets leave the device. */
(() => {
  "use strict";
  class ClassroomVoice {
    constructor({ onState } = {}) {
      this.enabled = localStorage.getItem("ai-classroom-sound") === "on";
      this.verbose = localStorage.getItem("ai-classroom-voice-verbose") === "on";
      this.queue = []; this.speaking = false; this.onState = onState;
    }
    setEnabled(value) { this.enabled = !!value; localStorage.setItem("ai-classroom-sound", this.enabled ? "on" : "off"); if (!this.enabled) this.stop(); this.onState?.(this.enabled); }
    setVerbose(value) { this.verbose = !!value; localStorage.setItem("ai-classroom-voice-verbose", this.verbose ? "on" : "off"); }
    enqueue(message) {
      if (!message?.body || !this.enabled || !("speechSynthesis" in window)) return;
      const body = this.verbose ? message.body : String(message.body).slice(0, 520);
      this.queue.push({ ...message, body }); this.next();
    }
    next() {
      if (this.speaking || !this.enabled || !this.queue.length) return;
      const message = this.queue.shift(), utterance = new SpeechSynthesisUtterance(message.body);
      const mode = message.meta?.voice || "teacher"; const voices = speechSynthesis.getVoices();
      utterance.voice = voices.find((v) => /en/i.test(v.lang) && (mode === "calm" ? /zira|samantha|female/i.test(v.name) : mode === "energetic" ? /david|male/i.test(v.name) : true)) || voices.find((v) => /en/i.test(v.lang)) || null;
      utterance.rate = mode === "energetic" ? 1.08 : .96; utterance.onend = utterance.onerror = () => { this.speaking = false; this.next(); };
      this.speaking = true; speechSynthesis.speak(utterance);
    }
    replay(text, meta = {}) { if (!("speechSynthesis" in window)) return; const before = this.enabled; this.enabled = true; this.queue.unshift({ body: text, meta }); this.next(); this.enabled = before || true; }
    stop() { this.queue = []; if ("speechSynthesis" in window) speechSynthesis.cancel(); this.speaking = false; }
    skip() { if ("speechSynthesis" in window) speechSynthesis.cancel(); }
    dictate(target) {
      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Recognition) throw new Error("Speech recognition is not available in this browser.");
      const recognition = new Recognition(); recognition.lang = "en-US"; recognition.interimResults = true;
      recognition.onresult = (event) => { target.value = [...event.results].map((r) => r[0].transcript).join(" "); target.dispatchEvent(new Event("input")); };
      recognition.start(); return recognition;
    }
  }
  window.ClassroomVoice = ClassroomVoice;
})();
