/* ============================================================================
 * store.js - persistence in localStorage (nothing is sent to a server).
 * Keys: "tajweed:progress" (chapters done, quiz results, practice stats, streak days),
 *       "tajweed:settings" (reciter, fontScale), "tajweed:mushaf" (last read position,
 *       bookmarks, colour on/off, flow/list mode). "tajweed:theme" is read in index.html.
 * All reads are wrapped in try/catch so the app still works when storage is blocked.
 * ========================================================================== */
/* التخزين المحلي للتقدّم والإعدادات */
window.TAJWEED = window.TAJWEED || {};
TAJWEED.store = (function () {
  const KEY = 'tajweed:progress';
  const SETTINGS = 'tajweed:settings';
  const MUSHAF = 'tajweed:mushaf';
  const def = () => ({ chapters: {}, quizzes: {}, practice: { asked: 0, correct: 0, byRule: {} }, lastChapter: null, days: [] });
  let state = null;
  function load() {
    if (state) return state;
    try { state = Object.assign(def(), JSON.parse(localStorage.getItem(KEY) || '{}')); }
    catch (e) { state = def(); }
    return state;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
  function touchDay() {
    const s = load(); const d = new Date().toISOString().slice(0, 10);
    if (!s.days.includes(d)) { s.days.push(d); if (s.days.length > 400) s.days = s.days.slice(-400); save(); }
  }
  function streak() {
    const s = load(); const set = new Set(s.days); let n = 0; const d = new Date();
    for (;;) { const k = d.toISOString().slice(0, 10); if (!set.has(k)) { if (n === 0) { d.setDate(d.getDate() - 1); const y = d.toISOString().slice(0, 10); if (set.has(y)) { n++; d.setDate(d.getDate() - 1); continue; } } break; } n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  const api = {
    get: load, save,
    touchDay, streak,
    settings() { try { return Object.assign({ reciter: 'Husary_128kbps', fontScale: 1, maddLength: 4 }, JSON.parse(localStorage.getItem(SETTINGS) || '{}')); } catch (e) { return { reciter: 'Husary_128kbps', fontScale: 1 }; } },
    setSetting(k, v) { const s = api.settings(); s[k] = v; try { localStorage.setItem(SETTINGS, JSON.stringify(s)); } catch (e) {} },
    chapterDone(id) { return !!load().chapters[id]?.done; },
    setChapterDone(id, done) { const s = load(); s.chapters[id] = Object.assign(s.chapters[id] || {}, { done, at: Date.now() }); touchDay(); save(); },
    visitChapter(id) { const s = load(); s.lastChapter = id; s.chapters[id] = Object.assign(s.chapters[id] || {}, { visited: true }); touchDay(); save(); },
    quizBest(id) { return load().quizzes[id]?.best ?? null; },
    recordQuiz(id, score, total) {
      const s = load(); const prev = s.quizzes[id] || { best: 0, attempts: 0 };
      s.quizzes[id] = { best: Math.max(prev.best, score), total, attempts: prev.attempts + 1, last: score, at: Date.now() };
      touchDay(); save();
    },
    recordPractice(ruleId, ok) {
      const s = load(); s.practice.asked++; if (ok) s.practice.correct++;
      const r = s.practice.byRule[ruleId] || { asked: 0, correct: 0 }; r.asked++; if (ok) r.correct++; s.practice.byRule[ruleId] = r;
      touchDay(); save();
    },
    overall() {
      const s = load(); const chapters = TAJWEED.chapters;
      let pts = 0, max = 0;
      chapters.forEach(c => {
        max += 2; if (s.chapters[c.id]?.done) pts += 1;
        const q = s.quizzes[c.id]; if (q && q.total) pts += Math.min(1, q.best / q.total);
      });
      return max ? Math.round(100 * pts / max) : 0;
    },
    /* تفضيلات المصحف: آخر قراءة، العلامات، التلوين، طريقة العرض */
    mushaf() { const d = { last: null, bookmarks: [], color: true, mode: 'flow' }; try { return Object.assign(d, JSON.parse(localStorage.getItem(MUSHAF) || '{}')); } catch (e) { return d; } },
    setMushaf(patch) { const m = api.mushaf(); Object.assign(m, patch); try { localStorage.setItem(MUSHAF, JSON.stringify(m)); } catch (e) {} return m; },
    reset() { state = def(); save(); try { localStorage.removeItem(MUSHAF); } catch (e) {} },
  };
  return api;
})();
