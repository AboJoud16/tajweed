# موسوعة التجويد

تطبيق ويب ثابت (بلا خادم) لتعلّم أحكام تجويد القرآن الكريم برواية حفص عن عاصم من طريق الشاطبية.

**جرّبه:** افتح `index.html` مباشرة، أو شغّل أي خادم ملفات ثابت في المجلد (`npm start` ثم `http://localhost:8080`). يعمل كما هو على GitHub Pages.

## ما الذي يقدّمه

- **المصحف كاملًا** بالرسم العثماني (نص Tanzil برواية حفص، مُتحقَّق منه ومقارَن حرفًا بحرف مع نص مجمع الملك فهد)، مع تلوين أحكام التجويد في كل آية كمُعين تعليمي يمكن إخفاؤه، وعلامات الوقف والسجدة والأحزاب، وفهرس السور والأجزاء، وعلامات القراءة، وتلاوة متواصلة للسورة، وحفظ آخر موضع قراءة. تفاصيل المصادر والتحقق في `REFERENCES.md` و`data/mushaf/VERIFICATION.md`.
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
js/mushaf.js          المصحف: فهرس السور، صفحة القراءة، التلاوة المتواصلة
js/app.js             التوجيه والصفحات
data/mushaf/          نص المصحف ومواضع الأحكام وعلامات الوقف (ملف لكل سورة) وتقرير التحقق
scripts/build_mushaf.py  يبني data/mushaf من المصادر ويتحقق منها (python3 -I scripts/build_mushaf.py)
scripts/validate.js   فحص سلامة البيانات (npm test)
REFERENCES.md         قائمة المصادر والتراخيص وطريقة التحقق منها
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

- نص المصحف من Tanzil.net (رخصة CC BY 3.0، لا يجوز تعديله) ويُنقل حرفيًّا؛ علامات الوقف من نص مجمع الملك فهد؛ تظليل الأحكام من مشروع quran-tajweed (CC BY 4.0) بعد إعادة محاذاته والتحقق منه. القائمة الكاملة بالروابط والبصمات في `REFERENCES.md`.
- الخطوط Amiri وAmiri Quran وNoto Naskh Arabic برخصة SIL Open Font License 1.1 (`fonts/OFL.txt`).
- التلاوات تُبثّ من everyayah.com ولا تُخزَّن في المشروع.
- المحتوى تعليمي مبسّط ولا يُغني عن التلقّي عن شيخ متقن.

## Developer guide (English)

**What this is.** A static single-page app: plain HTML, CSS and classic JavaScript, no bundler, no framework, no server. Open `index.html` directly or serve the folder (`npm start`). GitHub Pages serves it as is.

**How it fits together.**

- `index.html` loads the scripts in a fixed order: `js/data/*.js` (content only, attached to `window.TAJWEED`), `js/store.js` (localStorage), `js/ayah.js` (coloured-ayah rendering, the explain sheet, audio), `js/mushaf.js` (full-Quran reader) and finally `js/app.js` (router and the other pages, renders on load).
- Routing is hash based, `#/route/param?query#anchor`. `app.js` keeps a `pages` registry; `mushaf.js` registers its pages on `TAJWEED.pages`. Every page returns an HTML string; anything asynchronous or event-bound runs in `setTimeout(..., 0)` after the HTML is in the DOM.
- Lesson examples are written as `{rule-id|text|note}` inside the ayah text (parsed in `ayah.js`). Rule ids and colour groups live in `js/data/rules.js`.
- The mushaf data is one JSON per surah in `data/mushaf/`: each ayah is `{ n, t, j, w }` where `t` is the verbatim Tanzil text, `j` the tajweed spans `[start, end, ruleId]` and `w` the pause/sajdah/hizb marks `[offset, mark]`. `js/mushaf.js` (`colorHtml`) merges the three at display time. The reader toolbar toggles colours, switches flow/list mode and font size, and the player streams per-ayah MP3s from everyayah.com.
- `sw.js` caches the shell and any surah file once visited, so the app works offline after the first visit. Bump `CACHE` when the shell list changes.

**Workflow.**

1. Edit content in `js/data/*.js` (see the file headers for the schemas), or UI in `js/*.js` and `css/app.css`.
2. `npm test` validates everything, including a checksum of the Quran text, so the text cannot be edited by hand. If you must regenerate the mushaf data (new source version), run `python3 -I scripts/build_mushaf.py` from the repo root; it downloads the sources into `sources/` (gitignored), rebuilds `data/mushaf/`, and rewrites `data/mushaf/VERIFICATION.md`.
3. Optional visual check: `npm start` in one terminal, `npm run screenshots` in another (needs Playwright).

**Where things are documented.** Every source file starts with an English header describing its role and data shapes. `REFERENCES.md` lists every external source with URLs, checksums, licenses and the verification performed; `data/mushaf/VERIFICATION.md` is the Arabic report generated by the last build.
