/* عرض الآيات الملوّنة، بطاقة الشرح عند اللمس، والتلاوة الصوتية */
window.TAJWEED = window.TAJWEED || {};
(function () {
  const T = TAJWEED;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  T.esc = esc;

  /* ألوان المجموعات كمتغيّرات CSS (فاتح/داكن) */
  (function injectColors() {
    const ids = Object.keys(T.groups);
    const light = ids.map(g => `.g-${g}{--c:${T.groups[g].color}}`).join('');
    const dark = sel => ids.map(g => `${sel} .g-${g}{--c:${T.groups[g].dark}}`).join('');
    const style = document.createElement('style');
    style.textContent = light + '\n' + dark(':root[data-theme="dark"]') + '\n@media (prefers-color-scheme: dark){' + dark(':root:not([data-theme="light"])') + '}';
    document.head.appendChild(style);
  })();

  const MARK = /\{([a-z0-9-]+)\|([^{}|]+)(?:\|([^{}]*))?\}/g;

  /* يحوّل نص المثال إلى مقاطع */
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

  function segHtml(seg, i, opts) {
    const txt = esc(seg.t).replace(/۝/g, '<span class="end">۝</span>');
    if (!seg.rule) return txt;
    const r = T.ruleById[seg.rule]; const g = r ? r.group : 'izhar';
    const cls = 'tj g-' + g + (opts.targetIndex === i ? ' target' : '');
    return `<span class="${cls}" role="button" tabindex="0" data-rule="${seg.rule}" data-note="${esc(seg.note)}" data-text="${esc(seg.t)}">${txt}</span>`;
  }

  /* HTML لبطاقة آية */
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

  let audio = null, current = null;
  function stopAudio() {
    if (audio) { audio.pause(); }
    if (current) { current.classList.remove('playing'); current.querySelector('span').textContent = 'استمع'; current = null; }
  }
  T.stopAudio = stopAudio;
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
  const sheet = document.getElementById('sheet');
  const backdrop = document.getElementById('sheet-backdrop');
  let activeSpan = null;
  function openSheet(html) { sheet.innerHTML = html; sheet.classList.add('open'); backdrop.classList.add('open'); sheet.focus?.(); }
  function closeSheet() { sheet.classList.remove('open'); backdrop.classList.remove('open'); if (activeSpan) { activeSpan.classList.remove('active'); activeSpan = null; } }
  T.closeSheet = closeSheet;
  backdrop.addEventListener('click', closeSheet);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

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

  document.addEventListener('click', e => {
    const span = e.target.closest('.tj');
    if (!span || span.closest('.ayah.plain')) return;
    T.explain(span.dataset.rule, span.dataset.text, span.dataset.note, span);
  });
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList?.contains('tj')) { e.preventDefault(); e.target.click(); }
  });
})();
