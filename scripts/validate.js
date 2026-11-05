#!/usr/bin/env node
/* يتحقق من سلامة بيانات التطبيق: معرّفات الأحكام في الأمثلة، مراجع الآيات، الاختبارات. */
/*
 * Run with `npm test` (or `node scripts/validate.js`) after any content change.
 * Loads the four data files in a Node sandbox (no browser needed) and checks:
 *   - every rule points to an existing chapter and colour group
 *   - every rule id used in sections and example markup exists
 *   - example markup braces are balanced
 *   - every example ref [surah, ayah] is a real ayah (SURAH_AYAT table below)
 *   - every chapter has at least 5 quiz questions with valid, unique options
 * Exits with code 1 and a list of errors if anything is wrong.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = {}; ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['rules', 'chapters', 'quizzes', 'glossary']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'js/data', f + '.js'), 'utf8'), ctx, { filename: f + '.js' });
}
const T = ctx.window.TAJWEED;
const errors = [];
const ruleIds = new Set(T.rules.map(r => r.id));
const chapterIds = new Set(T.chapters.map(c => c.id));
// Number of ayat per surah, only for surahs used so far. When an example cites
// a new surah, add it here (surah number: ayah count).
const SURAH_AYAT = {1:7,2:286,3:200,4:176,5:120,6:165,7:206,9:129,10:109,11:123,12:111,13:43,16:128,17:111,18:110,19:98,20:135,21:112,23:118,24:64,26:227,27:93,30:60,34:54,36:83,38:88,50:45,54:55,69:52,73:20,75:40,77:50,78:40,80:42,81:29,83:36,89:30,91:15,92:21,93:11,96:19,99:8,100:11,102:8,103:3,104:9,105:5,106:4,107:7,108:3,110:3,111:5,112:4,113:5,114:6};

for (const r of T.rules) {
  if (!chapterIds.has(r.chapter)) errors.push(`rule ${r.id}: unknown chapter ${r.chapter}`);
  if (!T.groups[r.group]) errors.push(`rule ${r.id}: unknown group ${r.group}`);
}
let examples = 0, spans = 0;
// Same pattern as MARK in js/ayah.js. Keep both in sync.
const markupRe = /\{([a-z0-9-]+)\|([^{}|]+)(?:\|([^{}]*))?\}/g;
for (const c of T.chapters) {
  if (!T.quizzes[c.id] || T.quizzes[c.id].length < 5) errors.push(`chapter ${c.id}: needs at least 5 quiz questions`);
  for (const s of c.sections) {
    for (const id of (s.rules || [])) if (!ruleIds.has(id)) errors.push(`chapter ${c.id} / ${s.title}: unknown rule ${id}`);
    for (const ex of (s.examples || [])) {
      examples++;
      const stripped = ex.text.replace(markupRe, (m, id) => { spans++; if (!ruleIds.has(id)) errors.push(`example "${ex.text.slice(0, 30)}": unknown rule ${id}`); return ''; });
      if (/[{}|]/.test(stripped)) errors.push(`example "${ex.text.slice(0, 40)}": unbalanced markup`);
      if (ex.ref) {
        const [s, a] = ex.ref;
        if (!SURAH_AYAT[s]) errors.push(`example ref ${s}:${a}: surah not in table (add it)`);
        else if (a < 1 || a > SURAH_AYAT[s]) errors.push(`example ref ${s}:${a}: ayah out of range`);
      }
    }
  }
}
for (const [cid, qs] of Object.entries(T.quizzes)) {
  if (!chapterIds.has(cid)) errors.push(`quiz for unknown chapter ${cid}`);
  qs.forEach((q, i) => {
    if (!Array.isArray(q.options) || q.options.length < 2) errors.push(`${cid} q${i + 1}: needs options`);
    if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= q.options.length) errors.push(`${cid} q${i + 1}: bad answer index`);
    if (new Set(q.options).size !== q.options.length) errors.push(`${cid} q${i + 1}: duplicate options`);
  });
}
const nQ = Object.values(T.quizzes).reduce((n, q) => n + q.length, 0);
console.log(`rules: ${T.rules.length}, chapters: ${T.chapters.length}, examples: ${examples}, marked spans: ${spans}, quiz questions: ${nQ}, glossary: ${T.glossary.length}`);
if (errors.length) { console.error('ERRORS:\n' + errors.join('\n')); process.exit(1); }
console.log('data OK');
