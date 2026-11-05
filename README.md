# موسوعة التجويد

تطبيق ويب ثابت (بلا خادم) لتعلّم أحكام تجويد القرآن الكريم برواية حفص عن عاصم من طريق الشاطبية.

**جرّبه:** افتح `index.html` مباشرة، أو شغّل أي خادم ملفات ثابت في المجلد (`npm start` ثم `http://localhost:8080`). يعمل كما هو على GitHub Pages.

## ما الذي يقدّمه

- **مسار تعلّم مرتّب** من ١٣ بابًا: المدخل، المخارج، الصفات، النون الساكنة والتنوين، الميم الساكنة، المدود، القلقلة، الراء، اللام، التفخيم والترقيق، الإدغام العام، الوقف والسكت، همزة الوصل والقطع.
- **آيات ملوّنة بالأحكام** (١٥١ مثالًا، ١٨٢ موضعًا مظلّلًا): المس أي جزء ملوّن لتظهر بطاقة تشرح الحكم، ولماذا ينطبق هنا تحديدًا، وكيف يُؤدّى.
- **تلاوات صوتية** لكل آية مثال من everyayah.com باختيار القارئ (الحصري، الحصري المعلّم، عبد الباسط، المنشاوي، العفاسي).
- **اختبار لكل باب** (٩٥ سؤالًا) مع تعليل كل إجابة، وتسجيل أفضل نتيجة؛ النجاح بنسبة ٨٠٪ يُتمّ الباب تلقائيًّا.
- **تدريب «تعرّف على الحكم»**: أمثلة عشوائية من الآيات مع خيارات، يمكن تصفيتها بالباب أو بالحكم.
- **مخطط تفاعلي لمخارج الحروف**، ودليل ألوان، ومسرد مصطلحات، وبحث يتجاهل التشكيل.
- **تقدّم محفوظ محليًّا** (أبواب مكتملة، نتائج، أيام متتالية) دون أي إرسال للبيانات.
- واجهة عربية RTL كاملة، وضع داكن، خط عثماني (Amiri Quran) مضمّن محليًّا، يعمل دون اتصال بعد أول زيارة (Service Worker)، وقابل للتثبيت كتطبيق (PWA).

## بنية الملفات

```
index.html            الصفحة الوحيدة (تطبيق صفحة واحدة بتوجيه عبر #)
css/app.css           التصميم (متغيّرات ألوان للوضعين الفاتح والداكن)
css/fonts.css         تعريف الخطوط المضمّنة
js/data/rules.js      الأحكام ومجموعات الألوان
js/data/chapters.js   الأبواب والأمثلة الملوّنة
js/data/quizzes.js    الاختبارات
js/data/glossary.js   المصطلحات
js/store.js           التقدّم والإعدادات (localStorage)
js/ayah.js            عرض الآيات، بطاقة الشرح، الصوت
js/app.js             التوجيه والصفحات
scripts/validate.js   فحص سلامة البيانات (npm test)
```

## ترميز الأمثلة

نص المثال يُكتب كما في المصحف مع تظليل مواضع الأحكام بالصيغة:

```
{معرّف-الحكم|النص المظلّل|ملاحظة اختيارية تشرح سبب انطباق الحكم هنا}
```

مثال: `وَءَامَنَهُم {izhar|مِّنْ خَ|نون ساكنة بعدها خاء: إظهار}وْفٍۭ`. معرّفات الأحكام في `js/data/rules.js`. شغّل `npm test` بعد أي تعديل للتأكد من صحة المعرّفات والمراجع.

## إضافة محتوى

1. أضف الحكم في `rules.js` (إن كان جديدًا) مع مجموعته اللونية.
2. أضف الفقرة والأمثلة في الباب المناسب في `chapters.js` مع مرجع الآية `[رقم السورة, رقم الآية, 'اسم السورة']` ليعمل الصوت.
3. أضف أسئلة الاختبار في `quizzes.js`.
4. `npm test`.

## الترخيص والمصادر

- الخطوط Amiri وAmiri Quran وNoto Naskh Arabic برخصة SIL Open Font License 1.1 (`fonts/OFL.txt`).
- التلاوات تُبثّ من everyayah.com ولا تُخزَّن في المشروع.
- المحتوى تعليمي مبسّط ولا يُغني عن التلقّي عن شيخ متقن.

## Developer guide (English)

A quick orientation for new contributors. Every file also starts with a header comment explaining what it does.

### Run it

- No build step and no dependencies. Open `index.html` directly, or run `npm start` and open `http://localhost:8080` (the service worker only runs over http).
- `npm test` validates all content data. Run it after every content change.
- `npm run screenshots` (needs Playwright and a running server) captures every page on mobile, desktop and dark mode and fails on any console error. Use it as a smoke test after code changes.

### How it fits together

- Plain classic `<script>` tags, no modules or framework, so the app also works from `file://`. Everything hangs off one global object, `window.TAJWEED` (usually aliased as `T`).
- Load order in `index.html` matters: `js/data/*.js` (pure data) → `js/store.js` (localStorage) → `js/ayah.js` (ayah rendering, explanation sheet, audio) → `js/app.js` (router and pages).
- Routing is hash based: `#/chapter/madd#rule-madd-lazim` means route `chapter`, param `madd`, then scroll to the element with id `rule-madd-lazim`. Each route is a function in `pages` (in `app.js`) that returns an HTML string for `<main id="view">`. The full route list is at the top of `app.js`.
- Clicks are handled by event delegation on `document` or `#view`, so pages can re-render without re-binding.

### Content data

| File | Contains | Key format |
| --- | --- | --- |
| `js/data/rules.js` | `groups` (colours) and `rules` | rule `{ id, chapter, group, name, letters, short, detail, how }` |
| `js/data/chapters.js` | learning path | chapter → `sections[]` → `examples[]` of `{ text, ref: [surah, ayah, name], note }` |
| `js/data/quizzes.js` | quizzes by chapter id | `{ q, options[], answer (0-based), why }` |
| `js/data/glossary.js` | glossary | `{ term, def }` |

Coloured Quran text uses the markup `{ruleId|text to colour|optional why-note}` (see "ترميز الأمثلة" above). The rule's `group` picks the colour; `ayah.js` turns each group into a CSS class `g-<group>` with a `--c` colour variable for light and dark mode.

### Audio, storage, offline

- Audio streams from `https://everyayah.com/data/<reciter>/<SSS><AAA>.mp3` (surah and ayah padded to 3 digits). Reciters are listed in `T.reciters` in `ayah.js`. Nothing is downloaded into the repo.
- Progress and settings live in `localStorage` under `tajweed:progress`, `tajweed:settings` and `tajweed:theme`. The shape is documented at the top of `js/store.js`. No data leaves the device.
- `sw.js` caches the app shell network-first, so online users always get the latest files. Add new files to its `SHELL` list if they are needed offline.

### Conventions

- Escape every dynamic value with `T.esc()` before putting it in HTML. Only chapter `body` fields are trusted HTML.
- Show numbers to users with `T.ar()` (Arabic-Indic digits).
- UI text is Arabic and the layout is RTL; code comments are in English.
- Never change Quran text when editing markup: only wrap existing text in `{…|…}`.
