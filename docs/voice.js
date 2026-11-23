/* Browser-native speech: no voice/audio secrets leave the device. */
(() => {
  "use strict";

  const SCRIPT_LOCALES = [
    [/\p{Script=Hangul}/u, "ko-KR"], [/\p{Script=Hiragana}|\p{Script=Katakana}/u, "ja-JP"],
    [/\p{Script=Han}/u, "zh-CN"], [/\p{Script=Thai}/u, "th-TH"], [/\p{Script=Hebrew}/u, "he-IL"],
    [/\p{Script=Greek}/u, "el-GR"], [/\p{Script=Armenian}/u, "hy-AM"], [/\p{Script=Georgian}/u, "ka-GE"],
    [/\p{Script=Bengali}/u, "bn-BD"], [/\p{Script=Devanagari}/u, "hi-IN"], [/\p{Script=Tamil}/u, "ta-IN"],
    [/\p{Script=Telugu}/u, "te-IN"], [/\p{Script=Kannada}/u, "kn-IN"], [/\p{Script=Malayalam}/u, "ml-IN"]
  ];
  const WORD_LOCALES = [
    ["es-ES", ["hola", "gracias", "el", "la", "los", "las", "una", "uno", "que", "para", "con", "como", "por", "del", "está", "son"]],
    ["fr-FR", ["bonjour", "merci", "le", "la", "les", "des", "une", "dans", "pour", "avec", "est", "sont", "que", "qui", "pas", "et"]],
    ["de-DE", ["hallo", "danke", "der", "die", "das", "und", "ist", "sind", "mit", "für", "nicht", "eine", "einer", "den", "auf", "von"]],
    ["it-IT", ["ciao", "grazie", "il", "lo", "la", "gli", "una", "che", "per", "con", "sono", "non", "della", "nel", "come", "dei"]],
    ["pt-BR", ["olá", "obrigado", "obrigada", "o", "a", "os", "as", "uma", "que", "para", "com", "não", "são", "como", "dos", "das", "por"]],
    ["nl-NL", ["de", "het", "een", "van", "voor", "met", "zijn", "niet", "dat", "als", "op", "in", "en", "het"]],
    ["pl-PL", ["nie", "jest", "są", "dla", "oraz", "które", "w", "z", "na", "to", "się", "przez", "jak", "ale"]],
    ["sl-SI", ["in", "je", "so", "za", "da", "na", "se", "ki", "iz", "ter", "pri", "kot", "bodo", "lahko"]],
    ["cs-CZ", ["že", "se", "je", "pro", "které", "jako", "není", "jsou", "také", "na", "z", "do", "ve", "při"]],
    ["ro-RO", ["și", "este", "sunt", "pentru", "cu", "care", "din", "în", "acest", "această", "nu", "sau", "prin", "mai"]],
    ["hu-HU", ["és", "hogy", "nem", "egy", "az", "a", "ez", "van", "mert", "mint", "számára", "között", "vagy", "való"]],
    ["sv-SE", ["och", "att", "är", "det", "som", "för", "med", "inte", "en", "ett", "på", "av", "till", "den"]],
    ["fi-FI", ["ja", "on", "että", "se", "ei", "olla", "kun", "mutta", "joka", "myös", "tämä", "tai", "voi", "ovat"]],
    ["tr-TR", ["ve", "bir", "bu", "için", "ile", "olan", "olarak", "de", "da", "değil", "çok", "nasıl", "gibi", "içinde"]],
    ["id-ID", ["dan", "yang", "untuk", "dengan", "adalah", "dari", "ini", "itu", "pada", "dalam", "tidak", "sebagai", "atau", "oleh"]],
    ["vi-VN", ["và", "của", "là", "cho", "trong", "một", "được", "với", "không", "này", "các", "để", "như", "khi"]],
    ["en-US", ["the", "and", "that", "with", "for", "this", "from", "are", "was", "were", "have", "has", "not", "will"]]
  ];

  function validLocale(value) {
    const raw = String(value || "").trim().replace(/_/g, "-");
    if (!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(raw)) return "";
    try { return Intl.getCanonicalLocales(raw)[0] || ""; } catch { return ""; }
  }
  function tokenScore(tokens, words) {
    let score = 0;
    for (const word of words) if (tokens.has(word)) score++;
    return score;
  }
  function detectLocale(text, hint) {
    const source = String(text || "").trim();
    if (!source) return validLocale(hint) || "";
    if (/\p{Script=Arabic}/u.test(source)) {
      if (/[پچژگک]/u.test(source)) return "fa-IR";
      if (/[ےںھ]/u.test(source)) return "ur-PK";
      return "ar-SA";
    }
    if (/\p{Script=Cyrillic}/u.test(source)) return /[іїєґ]/iu.test(source) ? "uk-UA" : "ru-RU";
    for (const [pattern, locale] of SCRIPT_LOCALES) if (pattern.test(source)) return locale;

    const tokens = new Set((source.toLocaleLowerCase().match(/[\p{L}]+/gu) || []).filter((word) => word.length > 1));
    let best = "", bestScore = 0;
    for (const [locale, words] of WORD_LOCALES) {
      const score = tokenScore(tokens, words);
      if (score > bestScore) { best = locale; bestScore = score; }
    }
    // A supplied BCP-47 tag is useful when there is no language evidence (for
    // example, a number-only status). It never overrides detected response text.
    const supplied = validLocale(hint);
    if (bestScore) return best;
    return supplied;
  }
  function primaryLocale(locale) { return String(locale || "").split("-")[0].toLowerCase(); }
  function matchingVoice(voices, locale, mode) {
    const language = primaryLocale(locale);
    const candidates = voices.filter((voice) => primaryLocale(voice.lang) === language);
    if (!candidates.length) return null;
    const exact = candidates.filter((voice) => voice.lang.toLowerCase() === locale.toLowerCase());
    const preferred = exact.length ? exact : candidates;
    const style = mode === "calm" ? /zira|samantha|female|aria|ava|serena/i : mode === "energetic" ? /david|male|daniel|alex/i : null;
    return (style && preferred.find((voice) => style.test(voice.name))) || preferred.find((voice) => voice.localService) || preferred[0];
  }

  class ClassroomVoice {
    constructor({ onState, onUnavailable } = {}) {
      this.enabled = localStorage.getItem("ai-classroom-sound") === "on";
      this.verbose = localStorage.getItem("ai-classroom-voice-verbose") === "on";
      this.queue = []; this.speaking = false; this.waitingForVoices = false;
      this.onState = onState; this.onUnavailable = onUnavailable;
      if ("speechSynthesis" in window) {
        speechSynthesis.addEventListener?.("voiceschanged", () => { this.waitingForVoices = false; this.next(); });
      }
    }
    setEnabled(value) { this.enabled = !!value; localStorage.setItem("ai-classroom-sound", this.enabled ? "on" : "off"); if (!this.enabled) this.stop(); this.onState?.(this.enabled); }
    setVerbose(value) { this.verbose = !!value; localStorage.setItem("ai-classroom-voice-verbose", this.verbose ? "on" : "off"); }
    enqueue(message) {
      if (!message?.body || !this.enabled || !("speechSynthesis" in window)) return;
      const body = this.verbose ? message.body : String(message.body).slice(0, 520);
      this.queue.push({ ...message, body }); this.next();
    }
    next() {
      const head = this.queue[0];
      if (this.speaking || !head || !(this.enabled || head.force) || !("speechSynthesis" in window)) return;
      const voices = speechSynthesis.getVoices();
      if (!voices.length) { this.waitingForVoices = true; return; }
      const message = this.queue.shift();
      const locale = detectLocale(message.body, message.meta?.lang || message.meta?.language);
      const voice = locale && matchingVoice(voices, locale, message.meta?.voice || "teacher");
      // Letting the browser pick a default voice can turn a non-English response
      // into English narration. Keep the text visible instead when its language is
      // not installed locally.
      if (!voice) {
        const label = locale || "the detected language";
        this.onUnavailable?.(label);
        this.next();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(message.body);
      utterance.lang = voice.lang || locale;
      utterance.voice = voice;
      utterance.rate = message.meta?.voice === "energetic" ? 1.08 : .96;
      utterance.onend = utterance.onerror = () => { this.speaking = false; this.next(); };
      this.speaking = true; speechSynthesis.speak(utterance);
    }
    replay(text, meta = {}) {
      if (!text || !("speechSynthesis" in window)) return;
      this.queue.unshift({ body: text, meta, force: true }); this.next();
    }
    stop() { this.queue = []; if ("speechSynthesis" in window) speechSynthesis.cancel(); this.speaking = false; }
    skip() { if ("speechSynthesis" in window) speechSynthesis.cancel(); }
    dictate(target) {
      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Recognition) throw new Error("Speech recognition is not available in this browser.");
      const recognition = new Recognition(); recognition.lang = navigator.language || "en-US"; recognition.interimResults = true;
      recognition.onresult = (event) => { target.value = [...event.results].map((result) => result[0].transcript).join(" "); target.dispatchEvent(new Event("input")); };
      recognition.start(); return recognition;
    }
  }
  window.ClassroomVoice = ClassroomVoice;
  window.ClassroomVoice.detectLocale = detectLocale;
})();
