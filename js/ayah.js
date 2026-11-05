/* عرض الآيات الملوّنة، بطاقة الشرح عند اللمس، والتلاوة الصوتية */
/*
 * js/ayah.js — Rendering of colour-coded Quran examples, the "tap to explain"
 * bottom sheet, and ayah audio playback.
 *
 * Load order: after js/data/*.js and js/store.js, before js/app.js
 * (see index.html). It needs TAJWEED.groups, TAJWEED.ruleById,
 * TAJWEED.chapterById and TAJWEED.store to exist already.
 *
 * Adds to the global TAJWEED namespace:
 *   T.esc(str)              HTML-escape any value before putting it in markup.
 *   T.ar(n)                 Convert Western digits to Arabic-Indic digits (٠١٢…).
 *   T.parseMarkup(text)     Split example markup into segments (see MARK below).
 *   T.stripMarkup(text)     Same text with the markup removed (plain Quran text).
 *   T.ayahHtml(ex, opts)    HTML card for one example ayah.
 *   T.reciters              List of reciters offered in Settings.
 *   T.audioUrl(s, a)        everyayah.com MP3 URL for surah s, ayah a.
 *   T.audioHtml(s, a)       The "listen" button markup.
 *   T.stopAudio()           Stop whatever is playing (called on every route change).
 *   T.explain(ruleId, ...)  Open the explanation sheet for a rule.
 *   T.closeSheet()          Close that sheet.
 *
 * Event handling is delegated on `document`, so ayah cards can be re-rendered
 * freely by app.js without re-binding listeners.
 */
window.TAJWEED = window.TAJWEED || {};
(function () {
  const T = TAJWEED;
  // Escape the five HTML-special characters. Every piece of data that ends up
  // inside a template string must go through esc() (except `body` fields in
  // chapters.js, which are trusted HTML on purpose).
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  T.esc = esc;

  /* ألوان المجموعات كمتغيّرات CSS (فاتح/داكن) */
  // Builds one <style> tag from TAJWEED.groups (js/data/rules.js) so that any
  // element with class `g-<group>` gets a CSS variable --c holding that group's
  // colour. The dark colour applies when the user picked dark mode
  // (data-theme="dark") or when the OS is dark and the user did not force light.
  // CSS then uses var(--c) for text colour, underline, legend swatches, etc.
  (function injectColors() {
    const ids = Object.keys(T.groups);
    const light = ids.map(g => `.g-${g}{--c:${T.groups[g].color}}`).join('');
    const dark = sel => ids.map(g => `${sel} .g-${g}{--c:${T.groups[g].dark}}`).join('');
    const style = document.createElement('style');
    style.textContent = light + '\n' + dark(':root[data-theme="dark"]') + '\n@media (prefers-color-scheme: dark){' + dark(':root:not([data-theme="light"])') + '}';
    document.head.appendChild(style);
  })();

  // Example markup used in chapters.js:  {ruleId|highlighted text|optional note}
  //   group 1 = rule id (must exist in rules.js; scripts/validate.js checks it)
  //   group 2 = the exact Quran text to colour (cannot contain { } or |)
  //   group 3 = optional "why here?" note shown in the explanation sheet
  // Keep this regex in sync with the copy in scripts/validate.js.
  const MARK = /\{([a-z0-9-]+)\|([^{}|]+)(?:\|([^{}]*))?\}/g;

  /* يحوّل نص المثال إلى مقاطع */
  // Returns an array of segments in reading order:
  //   plain text  -> { t }
  //   marked text -> { t, rule, note }
  // Segment indexes matter: the practice page highlights one segment by index.
  function parse(text) {
    const out = []; let last = 0; let m;
    MARK.lastIndex = 0;
    while ((m = MARK.exec(text))) {
      if (m.index > last) out.push({ t: text.slice(last, m.index) });
      out.push({ t: m[2], rule: m[1], note: m[3] || '' });
      last = m.index + m[0].length;
    }
    if (last < text.length) out.push({ t: text.slice(last) });
    return out;
  }
  T.parseMarkup = parse;
  T.stripMarkup = text => text.replace(MARK, (m, id, t) => t);

  // HTML for one segment. Marked segments become focusable <span class="tj g-…">
  // carrying the rule id, note and text in data-* attributes; the document-level
  // click handler at the bottom of this file reads them to open the sheet.
  // The ayah-end sign ۝ is wrapped so CSS can style it.
  function segHtml(seg, i, opts) {
    const txt = esc(seg.t).replace(/۝/g, '<span class="end">۝</span>');
    if (!seg.rule) return txt;
    const r = T.ruleById[seg.rule]; const g = r ? r.group : 'izhar';
    const cls = 'tj g-' + g + (opts.targetIndex === i ? ' target' : '');
    return `<span class="${cls}" role="button" tabindex="0" data-rule="${seg.rule}" data-note="${esc(seg.note)}" data-text="${esc(seg.t)}">${txt}</span>`;
  }

  /* HTML لبطاقة آية */
  // ex   = an example object from chapters.js: { text, ref?: [surah, ayah, surahName], note? }
  // opts = {
  //   plain:       true -> card is not clickable (used by the practice page so
  //                tapping does not reveal the answer),
  //   targetIndex: index of the segment to highlight as the question target,
  //   hideNote:    true -> do not show ex.note under the ayah,
  //   noAudio:     true -> no listen button,
  // }
  T.ayahHtml = function (ex, opts) {
    opts = opts || {};
    const segs = parse(ex.text);
    const q = segs.map((s, i) => segHtml(s, i, opts)).join('');
    let ref = '';
    if (ex.ref) {
      const [s, a, name] = ex.ref;
      ref = `<span>${esc(name)} ﴿${toArabicDigits(a)}﴾</span>${opts.noAudio ? '' : T.audioHtml(s, a)}`;
    }
    const note = ex.note && !opts.hideNote ? `<div class="note">${esc(ex.note)}</div>` : '';
    return `<div class="ayah fade-in ${opts.plain ? 'plain' : ''}"><div class="q">${q}</div>${ref ? `<div class="ref">${ref}</div>` : ''}${note}</div>`;
  };

  function toArabicDigits(n) { return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]); }
  T.ar = toArabicDigits;

  /* ---------- الصوت ---------- */
  // Audio is streamed (never bundled or cached) from everyayah.com.
  // URL pattern: https://everyayah.com/data/<reciterFolder>/<SSS><AAA>.mp3
  // where SSS / AAA are the surah / ayah numbers zero-padded to 3 digits.
  // `id` below is the reciter's folder name on everyayah.com; to add a reciter,
  // add an entry whose folder exists there. The chosen id is saved in settings.
  T.reciters = [
    { id: 'Husary_128kbps', name: 'محمود خليل الحصري (مرتّل)' },
    { id: 'Husary_Muallim_128kbps', name: 'الحصري (المصحف المعلّم)' },
    { id: 'Abdul_Basit_Murattal_192kbps', name: 'عبد الباسط عبد الصمد (مرتّل)' },
    { id: 'Minshawy_Murattal_128kbps', name: 'محمد صدّيق المنشاوي (مرتّل)' },
    { id: 'Alafasy_128kbps', name: 'مشاري العفاسي' },
  ];
  const pad = (n, l) => String(n).padStart(l, '0');
  T.audioUrl = function (s, a) {
    const reciter = T.store.settings().reciter || 'Husary_128kbps';
    return `https://everyayah.com/data/${reciter}/${pad(s, 3)}${pad(a, 3)}.mp3`;
  };
  T.audioHtml = (s, a) => `<span class="audio"><button type="button" class="play" data-s="${s}" data-a="${a}" aria-label="استمع للآية"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg><span>استمع</span></button></span>`;

  // A single shared <audio> element is reused for every ayah, so only one
  // recitation plays at a time. `current` is the button that is playing.
  let audio = null, current = null;
  function stopAudio() {
    if (audio) { audio.pause(); }
    if (current) { current.classList.remove('playing'); current.querySelector('span').textContent = 'استمع'; current = null; }
  }
  T.stopAudio = stopAudio;
  // Play / stop toggle for every .play button on the page. Button label goes
  // "استمع" (listen) -> "جارٍ التحميل…" (loading) -> "إيقاف" (stop). On a network
  // error, a small .err message is added next to the button.
  document.addEventListener('click', e => {
    const btn = e.target.closest('button.play');
    if (!btn) return;
    if (current === btn) { stopAudio(); return; }
    stopAudio();
    audio = audio || new Audio();
    audio.src = T.audioUrl(btn.dataset.s, btn.dataset.a);
    current = btn; btn.classList.add('playing'); btn.querySelector('span').textContent = 'جارٍ التحميل…';
    const errEl = btn.parentElement.querySelector('.err'); if (errEl) errEl.remove();
    audio.onplaying = () => { if (current === btn) btn.querySelector('span').textContent = 'إيقاف'; };
    audio.onended = stopAudio;
    audio.onerror = () => { stopAudio(); const s = document.createElement('span'); s.className = 'err'; s.textContent = 'تعذّر تحميل التلاوة (تحقّق من الاتصال)'; btn.parentElement.appendChild(s); };
    audio.play().catch(() => { audio.onerror(); });
  });

  /* ---------- بطاقة الشرح ---------- */
  // The bottom sheet (#sheet and #sheet-backdrop live in index.html). It closes
  // on backdrop click, on Escape, and on every route change (app.js render()).
  // activeSpan is the coloured word the user tapped, kept highlighted while open.
  const sheet = document.getElementById('sheet');
  const backdrop = document.getElementById('sheet-backdrop');
  let activeSpan = null;
  function openSheet(html) { sheet.innerHTML = html; sheet.classList.add('open'); backdrop.classList.add('open'); sheet.focus?.(); }
  function closeSheet() { sheet.classList.remove('open'); backdrop.classList.remove('open'); if (activeSpan) { activeSpan.classList.remove('active'); activeSpan = null; } }
  T.closeSheet = closeSheet;
  T.openSheet = openSheet;
  backdrop.addEventListener('click', closeSheet);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

  // Open the sheet for a rule.
  //   ruleId - id from rules.js (required)
  //   text   - the tapped Quran text, shown as a coloured sample (optional)
  //   note   - the example's "why here?" note (optional)
  //   span   - the tapped element, to keep it highlighted (optional)
  // Shows the rule's short definition, letters, detail, how-to, and links to
  // its chapter and to practice filtered on this rule.
  T.explain = function (ruleId, text, note, span) {
    const r = T.ruleById[ruleId]; if (!r) return;
    const ch = T.chapterById[r.chapter];
    const g = T.groups[r.group];
    if (activeSpan) activeSpan.classList.remove('active');
    activeSpan = span || null; if (activeSpan) activeSpan.classList.add('active');
    openSheet(`
      <div class="grip"></div>
      <div class="rule-name g-${r.group}"><i></i><h3 id="sheet-title">${esc(r.name)}</h3></div>
      <div class="eyebrow">${esc(ch ? ch.title : '')} · ${esc(g.name)}</div>
      ${text ? `<div class="sample g-${r.group}">${esc(text)}</div>` : ''}
      ${note ? `<div class="why"><b>لماذا هنا؟</b>${esc(note)}</div>` : ''}
      <p>${esc(r.short)}</p>
      ${r.letters ? `<div class="chip">الحروف: <span class="pill-letters">${esc(r.letters)}</span></div>` : ''}
      <details style="margin-top:10px"><summary style="cursor:pointer;font-weight:600">التفصيل</summary><p style="margin-top:8px">${esc(r.detail)}</p></details>
      ${r.how ? `<div class="how"><b>كيف تؤدّيه</b>${esc(r.how)}</div>` : ''}
      <div class="row" style="margin-top:12px">
        <a class="btn small primary" href="#/chapter/${r.chapter}#rule-${r.id}" onclick="TAJWEED.closeSheet()">اذهب إلى الباب</a>
        <a class="btn small" href="#/practice?rule=${r.id}" onclick="TAJWEED.closeSheet()">تدرّب على هذا الحكم</a>
        <button class="btn small ghost" type="button" onclick="TAJWEED.closeSheet()">إغلاق</button>
      </div>`);
  };

  // Tap / keyboard activation of any coloured segment opens the sheet,
  // except inside `.ayah.plain` cards (practice mode).
  document.addEventListener('click', e => {
    const span = e.target.closest('.tj');
    if (!span || span.closest('.ayah.plain')) return;
    T.explain(span.dataset.rule, span.dataset.text, span.dataset.note, span);
  });
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList?.contains('tj')) { e.preventDefault(); e.target.click(); }
  });
})();
