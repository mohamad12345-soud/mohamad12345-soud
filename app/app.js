/* دليل التجمعات السكانية الفلسطينية 2026 — داشبورد + مستعرض خرائط
 * يقرأ مباشرة من Feature Services (ArcGIS Online) بترميز وليبل app_layers.lyrx (layers-config.js).
 */
require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/layers/GraphicsLayer",
  "esri/Graphic",
  "esri/widgets/LayerList",
  "esri/widgets/Legend",
  "esri/widgets/BasemapGallery",
  "esri/widgets/Expand",
  "esri/widgets/Home",
  "esri/widgets/ScaleBar",
  "esri/geometry/operators/geodeticAreaOperator",
  "esri/core/reactiveUtils"
], function (Map, MapView, FeatureLayer, GraphicsLayer, Graphic, LayerList, Legend, BasemapGallery, Expand, Home, ScaleBar, geodeticAreaOperator, reactiveUtils) {
  "use strict";

  // ===== إعدادات =====
  // الطبقات الإضافية (أوسلو، الجدار، المستعمرات، البؤر، القرى المهجرة) تظهر في قائمة الطبقات مطفأة افتراضياً.
  // لإخفائها كلياً من التطبيق: false
  var SHOW_EXTRA_LAYERS = true;
  var EXTRA = ["oslo", "wall", "settlements", "outposts", "displaced"];
  // أقصى مقياس عند التقريب على تجمع (لازم أصغر من minScale طبقة التجمعات حتى تظهر)
  var LOCALITY_ZOOM_SCALE = 60000;

  // التجمعات المعتمدة: اللي إلها رمز (LOCCODE). بيستثني 6 قرى مهجرة بدون رمز
  // (لطرون، الخلايل، دير ايوب، بيت محسير، المزار، سلبيت) — من العدّ والبحث والشارت والخريطة.
  var LOC_WHERE = "LOCCODE > ' '";
  var LOC_FIELDS = ["OBJECTID", "LOCCODE", "Loc_Name", "Locality_Name_Ar", "Locality_Name_En", "GOV_NAME", "GOVCODE", "Notes", "Shape__Area"];

  // ===== أدوات مساعدة =====
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function blank(v) { return v == null || String(v).trim() === ""; }
  function fmt(n, d) { return Number(n).toLocaleString("en-US", { maximumFractionDigits: d || 0 }); }

  // توحيد النص العربي للبحث: إزالة التشكيل والتطويل، توحيد الألف والتاء المربوطة والياء
  function norm(s) {
    return String(s || "")
      .replace(/[ً-ٰٟـ]/g, "")
      .replace(/[أإآٱ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      .replace(/['’`ʼ]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  // ===== popups (عربي، جدول مرتب، الحقول الفارغة لا تظهر) =====
  function table(rows) {
    var t = el("table", "pp");
    rows.forEach(function (r) {
      if (blank(r[1])) return;
      var tr = el("tr");
      tr.appendChild(el("th", null, r[0]));
      tr.appendChild(el("td", null, String(r[1])));
      t.appendChild(tr);
    });
    return t;
  }
  function areaKm2(geom) {
    if (!geom || !geodeticAreaOperator.isLoaded()) return null;
    try {
      var a = geodeticAreaOperator.execute(geom, { unit: "square-kilometers" });
      return a > 0 ? fmt(a, 2) + " كم²" : null;
    } catch (e) { return null; }
  }

  var govCounts = {}; // GOVCODE -> عدد التجمعات

  var POPUPS = {
    localities: {
      title: "{Locality_Name_Ar}",
      outFields: LOC_FIELDS,
      rows: function (a, g) {
        return [
          ["اسم التجمع", a.Loc_Name || a.Locality_Name_Ar],
          ["الاسم بالإنجليزية", a.Locality_Name_En],
          ["المحافظة", a.GOV_NAME],
          ["رمز التجمع", blank(a.LOCCODE) ? null : a.LOCCODE],
          ["المساحة التقريبية", areaKm2(g.geometry)],
          ["ملاحظات", a.Notes]
        ];
      }
    },
    governorates: {
      title: "محافظة {NAME_AR}",
      outFields: ["NAME_AR", "NAME_EN", "GOV_CODE"],
      rows: function (a, g) {
        return [
          ["المحافظة", a.NAME_AR],
          ["الاسم بالإنجليزية", a.NAME_EN],
          ["رمز المحافظة", a.GOV_CODE],
          ["عدد التجمعات", govCounts[a.GOV_CODE] != null ? fmt(govCounts[a.GOV_CODE]) : null],
          ["المساحة التقريبية", areaKm2(g.geometry)]
        ];
      }
    },
    oslo: {
      title: "{LandClassificationValue_Arabic}",
      outFields: ["LandClassificationValue_Arabic", "LandClassificationDescription_A", "LayerName_Arabic"],
      rows: function (a) {
        return [
          ["التصنيف", a.LandClassificationValue_Arabic],
          ["الوصف", a.LandClassificationDescription_A],
          ["الطبقة", a.LayerName_Arabic]
        ];
      }
    },
    wall: {
      title: "جدار الضم والتوسع",
      outFields: ["status_arabic", "Status", "Type"],
      rows: function (a) {
        var type = { Concrete: "جدار إسمنتي", Fence: "سياج" }[a.Type] || a.Type;
        return [["الحالة", a.status_arabic || a.Status], ["النوع", type]];
      }
    },
    settlements: {
      title: "{NAME_AR}",
      outFields: ["NAME_AR", "NAME", "TYPE_", "ESTABLISH", "DISTRICT"],
      rows: function (a) {
        return [
          ["الاسم", a.NAME_AR],
          ["الاسم بالإنجليزية", a.NAME],
          ["سنة الإنشاء", a.ESTABLISH ? String(a.ESTABLISH) : null],
          ["المنطقة", a.DISTRICT]
        ];
      }
    },
    outposts: {
      title: "{NAMEMANE}",
      outFields: ["NAMEMANE", "MOTHER_COL", "DISTRICT"],
      rows: function (a) {
        return [["الاسم", a.NAMEMANE], ["المستعمرة الأم", a.MOTHER_COL], ["المنطقة", a.DISTRICT]];
      }
    },
    displaced: {
      title: "{NAMEAR}",
      outFields: ["NAMEAR", "NAMEEN", "NOTES"],
      rows: function (a) {
        return [["الاسم", String(a.NAMEAR || "").replace(/\*$/, "")], ["الاسم بالإنجليزية", a.NAMEEN], ["ملاحظات", a.NOTES]];
      }
    }
  };

  function popupTemplate(id) {
    var p = POPUPS[id];
    if (!p) return null;
    return {
      title: p.title,
      outFields: p.outFields,
      returnGeometry: true,
      content: function (e) { return table(p.rows(e.graphic.attributes, e.graphic)); }
    };
  }

  // ليبل التجمعات: الأصلي (من lyrx) يظهر بس تحت 1:72,000. منزيد مستوى أبعد بنفس الشكل وخط أصغر،
  // حتى تبين الأسماء على مقياس المحافظة (الخريطة بتخفي الأسماء المتراكبة لحالها).
  var LOCALITY_FAR_LABEL_SIZE = 11;
  function localityLabels(c) {
    var near = c.labelingInfo[0];
    if (!near || !near.minScale || !c.minScale) return c.labelingInfo;
    var far = JSON.parse(JSON.stringify(near));
    far.symbol.font.size = LOCALITY_FAR_LABEL_SIZE;
    far.symbol.haloSize = 1;
    far.minScale = c.minScale;
    far.maxScale = near.minScale;
    return c.labelingInfo.concat([far]);
  }

  // ===== الطبقات من layers-config.js =====
  var layers = {};
  var ordered = window.APP_LAYERS.filter(function (c) {
    return SHOW_EXTRA_LAYERS || EXTRA.indexOf(c.id) < 0;
  }).map(function (c) {
    var props = {
      id: c.id,
      title: c.title,
      url: c.url,
      visible: c.visible,
      opacity: c.opacity,
      renderer: c.renderer,
      labelsVisible: c.labelsVisible,
      labelingInfo: c.labelingInfo,
      minScale: c.minScale || 0,
      maxScale: c.maxScale || 0,
      outFields: POPUPS[c.id] ? POPUPS[c.id].outFields : [],
      // التجمعات والمحافظات: بطاقات خاصة بدل الـ popup
      popupEnabled: !!POPUPS[c.id] && c.id !== "localities" && c.id !== "governorates"
    };
    var pt = popupTemplate(c.id);
    if (pt) props.popupTemplate = pt;
    // حدود المحافظات وحدود فلسطين للعرض فقط (لا تغطي popup التجمعات)
    if (c.id === "govBorders" || c.id === "border") props.legendEnabled = c.id === "border";
    if (c.id === "localities") { props.labelingInfo = localityLabels(c); props.definitionExpression = LOC_WHERE; }
    var lyr = new FeatureLayer(props);
    layers[c.id] = lyr;
    return lyr;
  });

  var map = new Map({ basemap: "satellite", layers: ordered });
  // تمييز التجمع المختار: طبقة رسومات تحت طبقة التجمعات، حتى يضل اسم التجمع ظاهر فوق التمييز
  var selLayer = new GraphicsLayer({ title: "التجمع المختار", listMode: "hide" });
  map.add(selLayer, map.layers.indexOf(layers.localities));
  var SEL_SYMBOLS = [
    { type: "simple-fill", color: [250, 204, 21, 0.22], outline: { color: [250, 204, 21, 0.35], width: 9 } },
    { type: "simple-fill", color: [0, 0, 0, 0], outline: { color: [250, 204, 21, 1], width: 3 } }
  ];
  function markLocality(geom) {
    selLayer.removeAll();
    if (geom) selLayer.addMany(SEL_SYMBOLS.map(function (sym) { return new Graphic({ geometry: geom, symbol: sym }); }));
  }
  var view = new MapView({
    container: "map",
    map: map,
    center: [35.1, 31.85],
    zoom: 8,
    constraints: { minZoom: 6, snapToZoom: false },
    popup: { dockEnabled: false, dockOptions: { buttonEnabled: false } }
  });
  view.ui.padding = { top: 12, right: 12, bottom: 12, left: 12 };
  window.appView = view; // للفحص من الـ console

  // لون التمييز: ذهبي مع تعبئة خفيفة (بدل السماوي الافتراضي اللي بيغطي الخريطة)
  var HIGHLIGHT = { color: [250, 204, 21, 1], haloOpacity: 1, fillOpacity: 0.18 };
  if (view.highlights && view.highlights.length) {
    var hl0 = view.highlights.getItemAt(0);
    hl0.color = HIGHLIGHT.color; hl0.haloOpacity = HIGHLIGHT.haloOpacity; hl0.fillOpacity = HIGHLIGHT.fillOpacity;
  } else {
    view.highlightOptions = HIGHLIGHT;
  }

  var home = new Home({ view: view });
  view.ui.add(home, "top-right");
  view.ui.add(new ScaleBar({ view: view, unit: "metric" }), "bottom-right");

  var layerList = new LayerList({
    view: view,
    listItemCreatedFunction: function (e) {
      var item = e.item;
      if (item.layer.type !== "feature" || !item.layer.legendEnabled) return;
      item.panel = { content: "legend", open: false };
    }
  });
  view.ui.add(new Expand({ view: view, content: layerList, expandTooltip: "الطبقات ومفتاح الخريطة", group: "tl", expandIcon: "layers" }), "top-left");
  view.ui.add(new Expand({ view: view, content: new BasemapGallery({ view: view }), expandTooltip: "الخريطة الأساس", group: "tl", expandIcon: "basemap" }), "top-left");

  // تحميل عامل حساب المساحة للـ popup
  geodeticAreaOperator.load().catch(function () {});

  // الامتداد الأولي (وزر الهوم): حدود فلسطين مقرّبة درجة (نص المقياس)، ومتمركزة على الضفة وغزة
  var HOME_ZOOM_FACTOR = 2;
  Promise.all([layers.border.queryExtent(), layers.governorates.queryExtent(), view.when()]).then(function (r) {
    var border = r[0] && r[0].extent, govExt = r[1] && r[1].extent;
    if (!border) return;
    syncPadding();
    return view.goTo(border.expand(1.05), { animate: false }).then(function () {
      return view.goTo({ target: (govExt || border).center, scale: view.scale / HOME_ZOOM_FACTOR }, { animate: false });
    }).then(function () {
      home.viewpoint = view.viewpoint.clone();
    });
  }).catch(function (e) { console.error(e); });

  // ===== حالة التطبيق =====
  var state = { gov: "", q: "", selected: null };
  var localities = []; // {oid, code, name, nameN, nameEn, nameEnN, gov, govCode}
  var govs = [];       // {code, name, count}
  var govHighlight = null;

  // ===== تحميل البيانات: المحافظات + التجمعات =====
  var govQ = layers.governorates.queryFeatures({ where: "1=1", outFields: ["NAME_AR", "GOV_CODE", "Shape__Area"], returnGeometry: false });
  var locQ = layers.localities.queryFeatures({ where: LOC_WHERE, outFields: LOC_FIELDS, returnGeometry: false, num: 2000 });

  // عدد التجمعات للكرت: يُقرأ من الخدمة مباشرة (أي تعديل على الطبقة ينعكس فوراً)
  var cntQ = layers.localities.queryFeatureCount({ where: LOC_WHERE });

  Promise.all([govQ, locQ, cntQ]).then(function (res) {
    countUp($("locCount"), res[2]);
    res[1].features.forEach(function (f) {
      var a = f.attributes;
      var name = a.Locality_Name_Ar || a.Loc_Name;
      localities.push({
        oid: a.OBJECTID, code: blank(a.LOCCODE) ? "" : a.LOCCODE.trim(), name: name, nameN: norm(name) + " " + norm(a.Loc_Name),
        nameEn: a.Locality_Name_En || "", nameEnN: norm(a.Locality_Name_En),
        gov: a.GOV_NAME, govCode: a.GOVCODE,
        nameV: a.Loc_Name || name, notes: a.Notes, area: a.Shape__Area || 0
      });
      govCounts[a.GOVCODE] = (govCounts[a.GOVCODE] || 0) + 1;
    });
    localities.sort(function (x, y) { return x.name.localeCompare(y.name, "ar"); });

    govs = res[0].features.map(function (f) {
      return { code: f.attributes.GOV_CODE, name: f.attributes.NAME_AR, count: govCounts[f.attributes.GOV_CODE] || 0, area: f.attributes.Shape__Area || 0 };
    }).sort(function (x, y) { return x.code < y.code ? -1 : 1; }); // ترتيب الرموز: من الشمال للجنوب

    var sel = $("gov");
    govs.forEach(function (g) {
      var o = el("option", null, g.name + " (" + g.count + ")");
      o.value = g.code;
      sel.appendChild(o);
    });
    drawChart();
    renderRegions();
    renderResults();
    $("tourBtn").disabled = false;
    $("liveTime").textContent = "آخر تحديث " + new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }).catch(function (err) {
    console.error(err);
    $("chart").innerHTML = "";
    $("chart").appendChild(el("div", "err", "تعذّر تحميل البيانات من الخادم. تأكد من الاتصال وأن الطبقات مشاركة للجميع."));
    $("results").appendChild(el("li", "empty", "تعذّر تحميل قائمة التجمعات."));
    $("locCount").textContent = "—";
  });

  // ===== الشارت =====
  function drawChart() {
    var box = $("chart");
    box.innerHTML = "";
    var max = Math.max.apply(null, govs.map(function (g) { return g.count; }));
    govs.forEach(function (g) {
      var b = el("button", "bar" + (g.code.charAt(0) === "2" ? " gz" : ""));
      b.type = "button";
      b.dataset.code = g.code;
      b.title = g.name + ": " + g.count + " تجمع";
      b.setAttribute("aria-label", b.title);
      b.appendChild(el("span", "nm", g.name));
      var tr = el("span", "tr"), fl = el("span", "fl");
      tr.appendChild(fl);
      b.appendChild(tr);
      b.appendChild(el("span", "vl", fmt(g.count)));
      b.addEventListener("click", function () {
        stopTour();
        var code = state.gov === g.code ? "" : g.code;
        setGov(code, true);
        if (code) setTab(isMobile() ? "map" : "search");
      });
      box.appendChild(b);
      requestAnimationFrame(function () { requestAnimationFrame(function () { fl.style.width = (g.count / max * 100) + "%"; }); });
    });
    syncChart();
  }
  function syncChart() {
    Array.prototype.forEach.call(document.querySelectorAll(".bar"), function (b) {
      b.classList.toggle("on", b.dataset.code === state.gov);
      b.setAttribute("aria-pressed", b.dataset.code === state.gov ? "true" : "false");
    });
  }

  // ===== قائمة النتائج =====
  var MAX_RESULTS = 200;
  var lastList = [];
  function renderResults() {
    var q = norm(state.q);
    var list = localities.filter(function (l) {
      if (state.gov && l.govCode !== state.gov) return false;
      if (!q) return true;
      return l.nameN.indexOf(q) >= 0 || l.nameEnN.indexOf(q) >= 0 || (l.code && l.code.indexOf(q) === 0);
    });
    if (q) {
      // الأسماء التي تبدأ بنص البحث أولاً
      list.sort(function (x, y) {
        var ax = x.nameN.indexOf(q) === 0 || x.nameEnN.indexOf(q) === 0 ? 0 : 1;
        var ay = y.nameN.indexOf(q) === 0 || y.nameEnN.indexOf(q) === 0 ? 0 : 1;
        return ax - ay;
      });
    }
    lastList = list;
    var ul = $("results");
    ul.innerHTML = "";
    $("resCount").textContent = fmt(list.length) + " تجمع" + (list.length > MAX_RESULTS ? " (يُعرض أول " + fmt(MAX_RESULTS) + ")" : "");
    if (!list.length) {
      ul.appendChild(el("li", "empty", "لا توجد نتائج مطابقة."));
      return;
    }
    list.slice(0, MAX_RESULTS).forEach(function (l) {
      var li = el("li"), b = el("button", state.selected === l.oid ? "on" : "");
      b.type = "button";
      b.dataset.oid = l.oid;
      var n = el("span", "n", l.name);
      b.appendChild(n);
      b.appendChild(el("span", "s", l.gov + (l.nameEn ? " · " + l.nameEn : "")));
      b.addEventListener("click", function () { selectLocality(l, norm(state.q) ? lastList : null); });
      li.appendChild(b);
      ul.appendChild(li);
    });
  }

  // ===== فلتر المحافظة =====
  // zoom: true = تقريب لمقياس تظهر فيه التجمعات، "fit" = عرض المحافظة كاملة (للجولة)
  function setGov(code, zoom) {
    if (state.selected) {
      var cur = localities.filter(function (x) { return x.oid === state.selected; })[0];
      if (!cur || cur.govCode !== code) closeLoc();
    }
    state.gov = code;
    $("gov").value = code;
    layers.localities.definitionExpression = LOC_WHERE + (code ? " AND GOVCODE = '" + code.replace(/'/g, "''") + "'" : "");
    syncChart();
    renderResults();
    if (govHighlight) { govHighlight.remove(); govHighlight = null; }
    showSpot(code);
    if (!code) return Promise.resolve();
    return layers.governorates.queryFeatures({ where: "GOV_CODE = '" + code.replace(/'/g, "''") + "'", returnGeometry: true, outFields: ["OBJECTID"], outSpatialReference: view.spatialReference })
      .then(function (r) {
        var f = r.features[0];
        if (!f || state.gov !== code) return;
        var km2 = geodeticAreaOperator.isLoaded() ? geodeticAreaOperator.execute(f.geometry, { unit: "square-kilometers" }) : 0;
        $("spotArea").textContent = km2 > 0 ? fmt(km2) : "—";
        view.whenLayerView(layers.governorates).then(function (lv) {
          if (state.gov === code) govHighlight = lv.highlight(f);
        });
        if (!zoom) return;
        // التقريب على المحافظة ثم التأكد أن التجمعات ظاهرة (طبقة التجمعات تظهر تحت مقياس معيّن فقط)
        var ext = f.geometry.extent.expand(1.1);
        var maxS = zoom === "fit" ? 0 : layers.localities.minScale * 0.97;
        return flyTo(ext, maxS).catch(function () {});
      });
  }

  // ===== انتقال سلس ("طيران") =====
  // على الموبايل الحركة أسرع (الشاشة صغيرة والانتظار بينحس أطول)
  var MOBILE_SPEED = 0.6;
  function ms(d) { return Math.round(isMobile() ? d * MOBILE_SPEED : d); }
  // المقياس اللي بيعرض الامتداد كامل ضمن الجزء الظاهر من الخريطة (بعد حجز اللوحة/البطاقة)
  function scaleToFit(ext) {
    var pad = view.padding || {};
    var w = Math.max(view.width - (pad.left || 0) - (pad.right || 0), 50);
    var h = Math.max(view.height - (pad.top || 0) - (pad.bottom || 0), 50);
    var res = Math.max(ext.width / w, ext.height / h);
    return res * view.scale / view.resolution;
  }
  // يطير للهدف: إذا الهدف بعيد عن الشاشة الحالية، يبعّد شوي أولاً (نظرة من فوق) ثم يقرّب بنعومة
  function flyTo(ext, maxScale) {
    var endScale = scaleToFit(ext);
    if (maxScale && endScale > maxScale) endScale = maxScale;
    var target = ext.center;
    var from = view.center;
    var dist = Math.sqrt(Math.pow(target.x - from.x, 2) + Math.pow(target.y - from.y, 2));
    var visible = Math.max(view.extent.width, view.extent.height);
    var end = { target: target, scale: endScale };
    if (dist < visible * 0.6) return view.goTo(end, { duration: ms(1400), easing: "in-out-cubic" });
    // مقياس المرحلة الأولى: بيشمل النقطتين معاً
    var both = { width: Math.abs(target.x - from.x) * 1.6, height: Math.abs(target.y - from.y) * 1.6 };
    var midScale = Math.max(view.scale, endScale, scaleToFit(both));
    var mid = { target: { type: "point", spatialReference: view.spatialReference, x: (from.x + target.x) / 2, y: (from.y + target.y) / 2 }, scale: midScale };
    return view.goTo(mid, { duration: ms(1100), easing: "in-cubic" }).then(function () {
      return view.goTo(end, { duration: ms(1500), easing: "out-cubic" });
    });
  }

  // ===== اختيار تجمع: تقريب + popup + تمييز =====
  function syncSelected() {
    Array.prototype.forEach.call(document.querySelectorAll("#results button"), function (b) {
      b.classList.toggle("on", +b.dataset.oid === state.selected);
    });
  }
  // nav: قائمة التنقل (السابق/التالي). من البحث = نتائج البحث؛ من الخريطة = تجمعات نفس المحافظة
  function selectLocality(l, nav) {
    stopTour();
    state.selected = l.oid;
    state.nav = nav && nav.indexOf(l) >= 0 ? nav : govByCode(l.govCode);
    syncSelected();
    if (isMobile()) setTab("map");
    view.closePopup();
    showLoc(l);
    markLocality(null);
    layers.localities.queryFeatures({ objectIds: [l.oid], outFields: ["OBJECTID"], returnGeometry: true, outSpatialReference: view.spatialReference })
      .then(function (r) {
        var f = r.features[0];
        if (!f || state.selected !== l.oid) return;
        var km2 = geodeticAreaOperator.isLoaded() ? geodeticAreaOperator.execute(f.geometry, { unit: "square-kilometers" }) : 0;
        $("locArea").textContent = km2 > 0 ? fmt(km2, km2 < 10 ? 2 : 1) : "—";
        markLocality(f.geometry);
        return flyTo(f.geometry.extent.expand(1.6), LOCALITY_ZOOM_SCALE);
      }).catch(function (e) { if (e && e.name !== "AbortError") console.error(e); });
  }

  // ===== بطاقة التجمع =====
  // تجمعات المحافظة مرتبة حسب الرمز (من الأصغر للأكبر)
  function govByCode(govCode) {
    return localities.filter(function (x) { return x.govCode === govCode; })
      .sort(function (x, y) { return x.code < y.code ? -1 : x.code > y.code ? 1 : 0; });
  }
  function showLoc(l) {
    var same = localities.filter(function (x) { return x.govCode === l.govCode; });
    var g = govs.filter(function (x) { return x.code === l.govCode; })[0];
    // الترتيب = موقع التجمع بين تجمعات محافظته مرتبة حسب رمز التجمع (LOCCODE)
    var rank = govByCode(l.govCode).indexOf(l) + 1;
    $("locName").textContent = l.nameV;
    $("locCode").textContent = l.code;
    $("locEn").textContent = l.nameEn;
    $("locGov").textContent = "محافظة " + l.gov;
    $("locArea").textContent = "…";
    // النسبة والترتيب من Shape__Area (نفس نظام الإحداثيات للتجمع ومحافظته، فالنسبة صحيحة)
    $("locShare").textContent = g && g.area && l.area ? fmt(l.area / g.area * 100, l.area / g.area < 0.01 ? 2 : 1) + "%" : "—";
    $("locRank").textContent = rank;
    $("locOf").textContent = "من " + same.length;
    var notes = $("locNotes");
    notes.textContent = blank(l.notes) ? "" : l.notes.replace(/\s+/g, " ").trim();
    notes.hidden = blank(l.notes);
    var i = state.nav.indexOf(l);
    $("locPos").textContent = (i + 1) + " / " + state.nav.length;
    var prev = state.nav[i - 1], next = state.nav[i + 1];
    $("locPrev").disabled = !prev;
    $("locNext").disabled = !next;
    $("locPrevName").textContent = prev ? prev.name : "";
    $("locNextName").textContent = next ? next.name : "";
    var card = $("loc");
    card.hidden = true; void card.offsetWidth; card.hidden = false; // إعادة حركة الظهور
    $("loc").parentNode.classList.add("has-loc");
    syncPadding();
  }
  function closeLoc() {
    $("loc").hidden = true;
    $("loc").parentNode.classList.remove("has-loc");
    markLocality(null);
    state.selected = null;
    syncSelected();
    syncPadding();
  }
  function stepLoc(d) {
    if (!state.selected || !state.nav) return;
    var cur = state.nav.filter(function (x) { return x.oid === state.selected; })[0];
    var next = state.nav[state.nav.indexOf(cur) + d];
    if (next) selectLocality(next, state.nav);
  }
  $("locClose").addEventListener("click", closeLoc);
  $("locPrev").addEventListener("click", function () { stepLoc(-1); });
  $("locNext").addEventListener("click", function () { stepLoc(1); });
  $("locGov").addEventListener("click", function () {
    var cur = localities.filter(function (x) { return x.oid === state.selected; })[0];
    closeLoc();
    if (cur) setGov(cur.govCode, true);
  });
  // الأسهم للتنقل (للعرض): بالعربي اليسار = التالي
  document.addEventListener("keydown", function (e) {
    if ($("loc").hidden || /INPUT|SELECT|TEXTAREA/.test((document.activeElement || {}).tagName || "")) return;
    if (e.key === "ArrowLeft") { e.preventDefault(); stepLoc(1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); stepLoc(-1); }
  });

  // ===== التبويبات =====
  var mq = window.matchMedia("(max-width: 760px)");
  function isMobile() { return mq.matches; }
  function setTab(name) {
    if (name === "map" && !isMobile()) name = "dash";
    document.querySelector(".app").dataset.tab = name;
    Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (t) {
      t.setAttribute("aria-selected", t.dataset.tab === name ? "true" : "false");
    });
    if (name === "search" && !isMobile()) $("q").focus({ preventScroll: true });
  }
  Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (t) {
    t.addEventListener("click", function () { setTab(t.dataset.tab); });
  });
  // عند الرجوع من الموبايل للشاشة العريضة لا يبقى تبويب "الخريطة" (غير موجود هناك)
  mq.addEventListener("change", function () {
    if (!isMobile() && document.querySelector(".app").dataset.tab === "map") setTab("dash");
  });
  setTab("dash");

  // ===== أحداث =====
  var t;
  $("q").addEventListener("input", function (e) {
    clearTimeout(t);
    t = setTimeout(function () { state.q = e.target.value; renderResults(); }, 120);
  });
  $("q").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      var first = document.querySelector("#results button");
      if (first) first.click();
    }
  });
  $("gov").addEventListener("change", function (e) { stopTour(); setGov(e.target.value, true); });
  $("reset").addEventListener("click", function () {
    stopTour();
    $("q").value = "";
    state.q = "";
    closeLoc();
    view.closePopup();
    setGov("", false);
    if (home.viewpoint) view.goTo(home.viewpoint, { duration: ms(1400), easing: "in-out-cubic" }).catch(function () {});
  });


  // =====================================================================
  // واجهة الحاسوب: التوزيع الجغرافي، بطاقة المحافظة، التلميح، الجولة، ملء الشاشة
  // =====================================================================
  function total() { return govs.reduce(function (s, g) { return s + g.count; }, 0); }
  function pct(n) { var t = total(); return t ? fmt(n / t * 100, 1) + "%" : "—"; }

  function renderRegions() {
    var wb = 0, gz = 0;
    govs.forEach(function (g) { if (g.code.charAt(0) === "2") gz += g.count; else wb += g.count; });
    var box = $("regions");
    box.innerHTML = "";
    var rg = el("div", "rg");
    var a = el("div", "wb"); a.appendChild(el("b", null, fmt(wb))); a.appendChild(el("span", null, "الضفة الغربية · " + pct(wb)));
    var b = el("div", "gz"); b.appendChild(el("b", null, fmt(gz))); b.appendChild(el("span", null, "قطاع غزة · " + pct(gz)));
    rg.appendChild(a); rg.appendChild(b);
    var split = el("div", "split"), i1 = el("i"), i2 = el("i");
    i1.style.flexGrow = 1; i2.style.flexGrow = 1;
    split.appendChild(i1); split.appendChild(i2);
    box.appendChild(rg); box.appendChild(split);
    requestAnimationFrame(function () { requestAnimationFrame(function () { i1.style.flexGrow = wb; i2.style.flexGrow = gz; }); });
  }

  function showSpot(code) {
    var g = govs.filter(function (x) { return x.code === code; })[0];
    if (!g) { $("spot").hidden = true; syncPadding(); return; }
    // الترتيب الجغرافي من الشمال للجنوب حسب GOVCODE (جنين = 1)؛ govs مرتبة بالرمز
    var rank = govs.indexOf(g) + 1;
    $("spotName").textContent = g.name;
    $("spotShare").textContent = pct(g.count);
    $("spotCode").textContent = g.code;
    $("spotRank").textContent = rank;
    $("spotOf").textContent = "من " + govs.length;
    $("spotArea").textContent = "…";
    $("spot").hidden = false;
    countUp($("spotCount"), g.count);
    syncPadding();
  }
  $("spotClose").addEventListener("click", function () { stopTour(); setGov("", false); });

  // المحافظات: الضغط يختار المحافظة ويظهر بطاقتها (بدل الـ popup) + تلميح عند المرور على الحاسوب
  function syncGovPopup() { layers.governorates.popupEnabled = false; }
  var tip = $("tip"), hoverOid = null, hoverHl = null, moveTimer = null;
  function clearHover() {
    tip.hidden = true; hoverOid = null;
    if (hoverHl) { hoverHl.remove(); hoverHl = null; }
    view.container.style.cursor = "";
  }
  view.on("pointer-move", function (e) {
    if (isMobile()) return;
    clearTimeout(moveTimer);
    moveTimer = setTimeout(function () {
      view.hitTest(e, { include: [layers.localities, layers.governorates] }).then(function (r) {
        var hit = pickHit(r);
        if (!hit) { clearHover(); return; }
        var lyr = hit.graphic.layer, a = hit.graphic.attributes, oid = a.OBJECTID;
        tip.innerHTML = "";
        if (lyr === layers.localities) {
          var l = byOid(oid);
          tip.appendChild(document.createTextNode(l ? l.name : ""));
          tip.appendChild(el("b", null, l ? l.gov : ""));
        } else {
          tip.appendChild(document.createTextNode(a.NAME_AR));
          tip.appendChild(el("b", null, fmt(govCounts[a.GOV_CODE] || 0) + " تجمع"));
        }
        tip.style.left = e.x + "px"; tip.style.top = e.y + "px";
        tip.hidden = false;
        view.container.style.cursor = "pointer";
        var key = lyr.id + ":" + oid;
        if (key !== hoverOid) {
          hoverOid = key;
          if (hoverHl) { hoverHl.remove(); hoverHl = null; }
          // التجمع المختار عنده تمييز أصلاً
          if (lyr === layers.localities && oid === state.selected) return;
          view.whenLayerView(lyr).then(function (lv) { if (hoverOid === key) hoverHl = lv.highlight(oid); });
        }
      }).catch(function () {});
    }, 30);
  });
  view.on("pointer-leave", clearHover);
  function byOid(oid) { return localities.filter(function (x) { return x.oid === oid; })[0]; }
  // التجمع أولاً (فوق المحافظة)
  function pickHit(r) {
    var hits = r.results.filter(function (x) { return x.graphic && (x.graphic.layer === layers.localities || x.graphic.layer === layers.governorates); });
    return hits.filter(function (x) { return x.graphic.layer === layers.localities; })[0] || hits[0];
  }
  view.on("click", function (e) {
    view.hitTest(e, { include: [layers.localities, layers.governorates] }).then(function (r) {
      var hit = pickHit(r);
      if (!hit) return;
      stopTour();
      clearHover();
      if (hit.graphic.layer === layers.localities) {
        var l = byOid(hit.graphic.attributes.OBJECTID);
        if (l) selectLocality(l);
        return;
      }
      setGov(hit.graphic.attributes.GOV_CODE, true);
      if (!isMobile()) setTab("dash");
    });
  });

  // المساحة المحجوزة للّوحة العائمة: التقريب يتمركز بالجزء الظاهر من الخريطة
  // على الموبايل: بطاقة المحافظة تغطي أسفل الخريطة، فنحجز ارتفاعها
  var lastPad = "";
  function syncPadding() {
    var side = isMobile() ? 0 : document.querySelector(".panel").getBoundingClientRect().width + 32;
    var card = !$("loc").hidden ? $("loc") : $("spot");
    var open = isMobile() && !card.hidden;
    var bottom = open ? card.offsetHeight + 36 : 0;
    // على الموبايل: أدوات الخريطة (Powered by Esri) تنزل لأسفل الشاشة تحت البطاقة، والمقياس ينخفي وقت البطاقة مفتوحة
    $("map").parentNode.classList.toggle("card-open", open);
    var key = side + "|" + bottom;
    if (key === lastPad) return; // ما في داعي نعيد ترتيب الخريطة إذا ما تغيّر شي
    lastPad = key;
    view.padding = { right: side, bottom: bottom };
    view.ui.padding = { top: 12, right: 12 + side, bottom: 12, left: 12 };
  }

  // جولة العرض: تمرّ على المحافظات من الشمال للجنوب
  var TOUR_MS = 7000, tour = null;
  function stopTour() {
    if (!tour) return;
    clearTimeout(tour.timer); cancelAnimationFrame(tour.raf);
    tour = null;
    var b = $("tourBtn");
    b.classList.remove("on");
    b.querySelector("span").textContent = "▶";
    b.querySelector("b").textContent = "جولة عرض";
    $("spotTour").hidden = true;
  }
  function tourStep() {
    if (!tour) return;
    if (tour.i >= govs.length) {
      stopTour();
      setGov("", false);
      if (home.viewpoint) view.goTo(home.viewpoint, { duration: ms(1800), easing: "in-out-cubic" }).catch(function () {});
      return;
    }
    var g = govs[tour.i], my = tour;
    setGov(g.code, "fit").then(function () {
      if (tour !== my) return;
      if ($("spotTour").hidden) { $("spotTour").hidden = false; syncPadding(); }
      $("spotStep").textContent = (my.i + 1) + " / " + govs.length;
      var prog = $("spotProg"), t0 = performance.now();
      (function anim(now) {
        if (tour !== my) return;
        prog.style.width = Math.min((now - t0) / TOUR_MS * 100, 100) + "%";
        if (now - t0 < TOUR_MS) my.raf = requestAnimationFrame(anim);
      })(t0);
      my.timer = setTimeout(function () { if (tour === my) { my.i++; tourStep(); } }, TOUR_MS);
    });
  }
  $("tourBtn").addEventListener("click", function () {
    if (tour) { stopTour(); return; }
    view.closePopup();
    setTab(isMobile() ? "map" : "dash");
    tour = { i: 0, timer: null, raf: null };
    var b = $("tourBtn");
    b.classList.add("on");
    b.querySelector("span").textContent = "■";
    b.querySelector("b").textContent = "إيقاف الجولة";
    tourStep();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") stopTour(); });

  // ملء الشاشة
  $("fsBtn").addEventListener("click", function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function () {});
  });
  document.addEventListener("fullscreenchange", function () {
    $("fsBtn").textContent = document.fullscreenElement ? "🗗" : "⛶";
  });

  syncGovPopup();
  view.when(syncPadding);
  window.addEventListener("resize", syncPadding);
  mq.addEventListener("change", function () { syncPadding(); if (isMobile()) clearHover(); });

  // ===== عدّاد الكروت =====
  function countUp(n, to) {
    var start = null;
    n.textContent = "0";
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / 1200, 1);
      n.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  Array.prototype.forEach.call(document.querySelectorAll(".num[data-to]"), function (n) {
    countUp(n, +n.getAttribute("data-to"));
  });
});
