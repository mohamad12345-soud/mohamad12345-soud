# ملخص مشروع: المنصة التفاعلية لدليل التجمعات السكانية الفلسطينية 2026

> هذا الملف لاستكمال العمل في أي جلسة جديدة مع Claude.
> ابدأ الجلسة الجديدة بجملة: **"كمّل تطبيق دليل التجمعات، الملخص بالمستودع PROJECT_NOTES.md"**

---

## 1. المنصة الحالية (ArcGIS Experience Builder)

- **الرابط المنشور (للمشاركة):**
  `https://experience.arcgis.com/experience/2a4600b14eeb48998f45009606cc6114`
  (لا تشارك رابط `?draft=true` لأنه رابط المسودة ولا يفتح إلا للمالك.)
- **الصفحات:** الرئيسية · المنصة التفاعلية · الدليل · البيانات · من نحن
  - الدليل: `.../page/%D8%A7%D9%84%D8%AF%D9%84%D9%8A%D9%84`
  - المنصة التفاعلية: `.../page/%D8%A7%D9%84%D9%85%D9%86%D8%B5%D8%A9-%D8%A7%D9%84%D8%AA%D9%81%D8%A7%D8%B9%D9%84%D9%8A%D8%A9`
- **الجهة:** دولة فلسطين · الفريق الوطني لإعداد دليل التجمعات الفلسطينية (منظمة ArcGIS Online: `pcbs`)

### الأرقام المعتمدة (كروت الصفحة الرئيسية)
| المؤشر | القيمة |
|---|---|
| عدد التجمعات السكانية | 631 |
| عدد المحافظات | 16 |
| عدد التجمعات البدوية | 173 |
| الجهات المشاركة | 16 |

---

## 2. ملفات التحميل (ArcGIS Online – pcbs)

رابط التحميل المباشر = `https://pcbs.maps.arcgis.com/sharing/rest/content/items/<ID>/data`
(بدل رابط `home/item.html?id=...` الذي يفتح صفحة Esri.)

| الملف | Item ID |
|---|---|
| دليل التجمعات 2026 (PDF) | `3e5e3f34ddca47f4a7e67415b1bcc2a3` |
| جدول البيانات (Excel) | `8003b70789d843c08591fac41ebed4b2` |
| قاعدة البيانات المكانية (Geodatabase) | `945b196624484c77a5392d0e69030c07` |

ملاحظات مجرّبة:
- جميع العناصر يجب أن تكون **Shared → Everyone**.
- داخل Experience Builder: `target="_blank"` كان يحتاج refresh قبل التنزيل (بسبب sandbox الـ iframe)،
  فصار Excel و Geodatabase على `target="_top"` و PDF على `target="_blank"`.

---

## 3. الأكواد الجاهزة (داخل `project/snippets/`)

| الملف | الوصف | الحالة |
|---|---|---|
| `header.html` | الهيدر (العنوان + شارة دليل 2026 + النص الفرعي) بألوان جديدة | ✅ شغال |
| `downloads.html` | قسم تحميل البيانات (PDF / Excel / Geodatabase) | ✅ شغال |
| `stats_cards.html` | كروت الإحصاءات + زري "استكشف الدليل" و"المنصة التفاعلية" مع تأثير الماوس | ⏳ لم يؤكَّد بعد داخل EB |

**قاعدة مهمة:** Experience Builder عند المستخدم يقبل الأكواد التي تنسيقها كله **inline `style`**
(بدون `<style>` وبدون `<script>`). النسخة التي تعتمد `<style>/<script>` لم تعمل.

نسخة كاملة تفاعلية (مع `<style>` وعدّاد أرقام) موجودة في `stats/index.html`
لتُنشر على GitHub Pages وتُضاف كرابط Embed → By URL:
`https://mohamad12345-soud.github.io/mohamad12345-soud/stats/`
(GitHub Pages **لم يُفعَّل بعد**: Settings → Pages → Deploy from a branch → الفرع + `/ (root)`؛ المستودع يجب أن يكون Public.)

### الألوان المعتمدة
| الاستخدام | اللون |
|---|---|
| كحلي (العناوين) | `#0c4a6e` |
| أزرق | `#0284c7` / `#0369a1` |
| أخضر | `#047857` |
| ذهبي (الخطوط والحواف) | `#ca8a04` |
| نص رمادي | `#334155` |
| خط الكتابة | `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif` |

---

## 4. الطبقات (من Layer Package: `project/layers/app_layers.lpkx`)

الحزمة **لا تحتوي بيانات**؛ فيها الترميز والليبل فقط، وروابط لـ Feature Services.
ملف الترميز الكامل: `project/layers/app_layers.lyrx` (JSON من نوع CIM).
**المطلوب: الشكل والليبل يبقيان كما هما بالضبط.**

القاعدة: `https://services8.arcgis.com/x3OYmfTujNHGdoex/arcgis/rest/services/`

| الطبقة | الخدمة / Layer | ظاهرة افتراضياً | الليبل | الترميز |
|---|---|---|---|---|
| التجمعات السكانية 2026 | `Localities_2026/FeatureServer/4` | ✅ | `Loc_Name` | بسيط |
| المحافظة | `Governorate/FeatureServer/0` | ✅ | `NAME_AR` | قيم فريدة حسب `NAME_EN` |
| حدود المحافظات | `Governorate/FeatureServer/0` | ✅ | `NAME_AR` | بسيط (حدود) |
| حدود فلسطين | `Palestine_Border_gdb/FeatureServer/0` | ✅ | `ENTITY` | بسيط |
| A B C تقسيمات اتفاقية أوسلو | `Jurisdiction_Borders_Area_A_B_C_Extract_اوسلو/FeatureServer/0` | ❌ | `LayerName_Arabic` | قيم فريدة حسب `LandClassificationValue_Arabic` |
| جدار الضم والتوسع | `Wall2020/FeatureServer/0` | ❌ | `Status` | قيم فريدة حسب `Status` |
| المستعمرات الإسرائيلية | `Israeli_Settlements_LIST2017/FeatureServer/0` | ❌ | `NAME_AR` | بسيط |
| البؤر الإستعمارية | `Israeli_Setlments_Outpost_LIST/FeatureServer/0` | ❌ | `NAMEMANE` | بسيط |
| القرى الفلسطينية المهجرة | `Displaced_Palestinian_Villages/FeatureServer/0` | ❌ | `NAMEAR` | بسيط |

---

## 5. التطبيق الصغير (Dashboard + مستعرض خرائط)

المطلوب:
- داشبورد: كروت الأرقام + شارت عدد التجمعات لكل محافظة.
- مستعرض خرائط للمحافظات والتجمعات، يقرأ **مباشرة** من الـ Feature Services أعلاه
  (ArcGIS Maps SDK for JavaScript)، بنفس الترميز والليبل من `app_layers.lyrx`.
- بحث باسم التجمع + فلتر حسب المحافظة (Zoom عند الاختيار).
- Popup عربي مرتب (الحقول تُحدَّد بعد قراءة حقول الطبقات).
- الطبقات المخفية (أوسلو، الجدار، ...) تُضاف كطبقات يمكن تشغيلها/إطفاؤها — **بانتظار تأكيد المستخدم**.
- ينشر على GitHub Pages ويُضاف في Experience Builder كـ Embed → By URL.

**خطوات البداية في الجلسة الجديدة:**
1. التأكد من الوصول: `curl "https://services8.arcgis.com/x3OYmfTujNHGdoex/arcgis/rest/services/Localities_2026/FeatureServer/4?f=json"`
2. قراءة الحقول لكل طبقة واقتراح حقول الـ Popup على المستخدم.
3. تحويل ترميز `app_layers.lyrx` إلى renderers و labelingInfo في JS.

**إعداد البيئة المطلوب:** Network access → Custom مع `arcgis.com` و `*.arcgis.com`
(وليس في خانة Setup script).

---

## 5.1 حالة التطبيق (تم التنفيذ ✅)

الملفات في `app/`:

| الملف | الوصف |
|---|---|
| `app/index.html` | الصفحة: هيدر + كروت + شارت + مستعرض خرائط |
| `app/app.js` | المنطق: تحميل الطبقات، البحث، فلتر المحافظة، popups |
| `app/app.css` | التنسيق بالألوان المعتمدة |
| `app/layers-config.js` | **مولَّد** من `app_layers.lyrx` — لا يُعدَّل يدوياً |
| `project/tools/lyrx_to_js.py` | المولِّد: `python3 project/tools/lyrx_to_js.py` بعد أي تعديل على lyrx |

- الرابط بعد تفعيل GitHub Pages: `https://mohamad12345-soud.github.io/mohamad12345-soud/app/`
  → Experience Builder: Embed → By URL.
- ArcGIS Maps SDK for JavaScript **4.34** (AMD).
- الترميز منقول كـ **CIMSymbol** كما هو (مع تحويل الألوان لصيغة JS: الشفافية 0-100 → 0-255).
- الليبل: نفس الحقل واللون والحجم والهالة ونطاق المقياس. خط **Tahoma غير موجود** على خادم خطوط ArcGIS،
  فاستُبدل بـ **Arial** (فيه حروف عربية). الطبقات التي ليبلها مطفأ في Pro بقي مطفأً.
- الخريطة الأساس: `satellite` (يمكن تغييرها من زر الخرائط الأساس).
- البحث: عربي (يتجاهل التشكيل والهمزات والتاء المربوطة) أو إنجليزي أو برمز التجمع؛ Enter يختار أول نتيجة.
- فلتر المحافظة: من القائمة أو بالضغط على عمود الشارت → يفلتر التجمعات ويقرّب لمقياس تظهر فيه التجمعات.
- الطبقات الإضافية (أوسلو، الجدار، المستعمرات، البؤر، القرى المهجرة) موجودة في قائمة الطبقات **مطفأة**؛
  لإزالتها كلياً: `SHOW_EXTRA_LAYERS = false` في `app/app.js`.
- الـ popup المقترح للتجمعات: الاسم المشكّل، الاسم بالإنجليزية، المحافظة، رمز التجمع، المساحة التقريبية (محسوبة)، ملاحظات
  (الحقول الفارغة لا تظهر) — **بانتظار موافقة المستخدم**.

### ملاحظة على الأرقام
طبقة `Localities_2026` فيها **638** عنصر، منها 6 بدون `LOCCODE`
(لطرون، الخلايل، دير ايوب، بيت محسير، المزار، سلبيت — قرى مهجرة) → استُبعدت من الشارت والبحث،
فصار المجموع **632**، بينما الرقم المعتمد بالكرت **631** → فرق تجمع واحد **بحاجة لتأكيد المستخدم**.

## 6. ملاحظات عامة
- المستخدم يتواصل بالعربية (لهجة شامية).
- الفروع: `claude/upbeat-wright-8wmrrn` (الأساس) ثم `claude/exciting-cori-z7up22` (التطبيق).
- أي تعديل على كود المستخدم: تغيير المطلوب فقط، وإرسال الكود كاملاً جاهزاً للنسخ مع جدول بالتغييرات.
