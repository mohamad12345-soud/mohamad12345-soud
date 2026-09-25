/* دليل التجمعات السكانية الفلسطينية 2026 — داشبورد + مستعرض خرائط
 * يقرأ مباشرة من Feature Services (ArcGIS Online) بترميز وليبل app_layers.lyrx (layers-config.js).
 */
require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/widgets/LayerList",
  "esri/widgets/Legend",
  "esri/widgets/BasemapGallery",
  "esri/widgets/Expand",
  "esri/widgets/Home",
  "esri/widgets/ScaleBar",
  "esri/geometry/operators/geodeticAreaOperator",
  "esri/core/reactiveUtils"
], function (Map, MapView, FeatureLayer, LayerList, Legend, BasemapGallery, Expand, Home, ScaleBar, geodeticAreaOperator, reactiveUtils) {
  "use strict";

  // ===== إعدادات =====
  // الطبقات الإضافية (أوسلو، الجدار، المستعمرات، البؤر، القرى المهجرة) تظهر في قائمة الطبقات مطفأة افتراضياً.
  // لإخفائها كلياً من التطبيق: false
  var SHOW_EXTRA_LAYERS = true;
  var EXTRA = ["oslo", "wall", "settlements", "outposts", "displaced"];
  // أقصى مقياس عند التقريب على تجمع (لازم أصغر من minScale طبقة التجمعات حتى تظهر)
  var LOCALITY_ZOOM_SCALE = 60000;

  var LOC_FIELDS = ["OBJECTID", "LOCCODE", "Loc_Name", "Locality_Name_Ar", "Locality_Name_En", "GOV_NAME", "GOVCODE", "Notes"];

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
      popupEnabled: !!POPUPS[c.id]
    };
    var pt = popupTemplate(c.id);
    if (pt) props.popupTemplate = pt;
    // حدود المحافظات وحدود فلسطين للعرض فقط (لا تغطي popup التجمعات)
    if (c.id === "govBorders" || c.id === "border") props.legendEnabled = c.id === "border";
    var lyr = new FeatureLayer(props);
    layers[c.id] = lyr;
    return lyr;
  });

  var map = new Map({ basemap: "satellite", layers: ordered });
  var view = new MapView({
    container: "map",
    map: map,
    center: [35.1, 31.85],
    zoom: 8,
    constraints: { minZoom: 6, snapToZoom: false },
    popup: { dockEnabled: false, dockOptions: { buttonEnabled: false } }
  });
  view.ui.padding = { top: 12, right: 12, bottom: 12, left: 12 };

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
  var wide = window.matchMedia("(min-width: 800px)").matches;
  view.ui.add(new Expand({ view: view, content: layerList, expandTooltip: "الطبقات ومفتاح الخريطة", expanded: wide, group: "tl", expandIcon: "layers" }), "top-left");
  view.ui.add(new Expand({ view: view, content: new BasemapGallery({ view: view }), expandTooltip: "الخريطة الأساس", group: "tl", expandIcon: "basemap" }), "top-left");

  // تحميل عامل حساب المساحة للـ popup
  geodeticAreaOperator.load().catch(function () {});

  // الامتداد الأولي = حدود فلسطين
  layers.border.when(function () {
    return layers.border.queryExtent();
  }).then(function (r) {
    if (r && r.extent) {
      var ext = r.extent.expand(1.05);
      home.viewpoint = { targetGeometry: ext };
      return view.when(function () { return view.goTo(ext, { animate: false }); });
    }
  }).catch(function () {});

  // ===== حالة التطبيق =====
  var state = { gov: "", q: "", selected: null };
  var localities = []; // {oid, code, name, nameN, nameEn, nameEnN, gov, govCode}
  var govs = [];       // {code, name, count}
  var govHighlight = null, locHighlight = null;

  // ===== تحميل البيانات: المحافظات + التجمعات =====
  var govQ = layers.governorates.queryFeatures({ where: "1=1", outFields: ["NAME_AR", "GOV_CODE"], returnGeometry: false });
  var locQ = layers.localities.queryFeatures({ where: "1=1", outFields: LOC_FIELDS, returnGeometry: false, num: 2000 });

  Promise.all([govQ, locQ]).then(function (res) {
    // التجمعات بدون رمز (LOCCODE فارغ) هي قرى مهجرة داخل الطبقة — لا تُحسب ولا تظهر في البحث
    res[1].features.forEach(function (f) {
      var a = f.attributes;
      if (blank(a.LOCCODE)) return;
      var name = a.Locality_Name_Ar || a.Loc_Name;
      localities.push({
        oid: a.OBJECTID, code: a.LOCCODE, name: name, nameN: norm(name) + " " + norm(a.Loc_Name),
        nameEn: a.Locality_Name_En || "", nameEnN: norm(a.Locality_Name_En),
        gov: a.GOV_NAME, govCode: a.GOVCODE
      });
      govCounts[a.GOVCODE] = (govCounts[a.GOVCODE] || 0) + 1;
    });
    localities.sort(function (x, y) { return x.name.localeCompare(y.name, "ar"); });

    govs = res[0].features.map(function (f) {
      return { code: f.attributes.GOV_CODE, name: f.attributes.NAME_AR, count: govCounts[f.attributes.GOV_CODE] || 0 };
    }).sort(function (x, y) { return x.code < y.code ? -1 : 1; }); // ترتيب الرموز: من الشمال للجنوب

    var sel = $("gov");
    govs.forEach(function (g) {
      var o = el("option", null, g.name + " (" + g.count + ")");
      o.value = g.code;
      sel.appendChild(o);
    });
    drawChart();
    renderResults();
  }).catch(function (err) {
    console.error(err);
    $("chart").innerHTML = "";
    $("chart").appendChild(el("div", "err", "تعذّر تحميل البيانات من الخادم. تأكد من الاتصال وأن الطبقات مشاركة للجميع."));
    $("results").appendChild(el("li", "empty", "تعذّر تحميل قائمة التجمعات."));
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
        setGov(state.gov === g.code ? "" : g.code, true);
        $("explorer").scrollIntoView({ behavior: "smooth", block: "start" });
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
  function renderResults() {
    var q = norm(state.q);
    var list = localities.filter(function (l) {
      if (state.gov && l.govCode !== state.gov) return false;
      if (!q) return true;
      return l.nameN.indexOf(q) >= 0 || l.nameEnN.indexOf(q) >= 0 || l.code.indexOf(q) === 0;
    });
    if (q) {
      // الأسماء التي تبدأ بنص البحث أولاً
      list.sort(function (x, y) {
        var ax = x.nameN.indexOf(q) === 0 || x.nameEnN.indexOf(q) === 0 ? 0 : 1;
        var ay = y.nameN.indexOf(q) === 0 || y.nameEnN.indexOf(q) === 0 ? 0 : 1;
        return ax - ay;
      });
    }
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
      b.appendChild(el("span", "n", l.name));
      b.appendChild(el("span", "s", l.gov + (l.nameEn ? " · " + l.nameEn : "")));
      b.addEventListener("click", function () { selectLocality(l); });
      li.appendChild(b);
      ul.appendChild(li);
    });
  }

  // ===== فلتر المحافظة =====
  function setGov(code, zoom) {
    state.gov = code;
    $("gov").value = code;
    layers.localities.definitionExpression = code ? "GOVCODE = '" + code.replace(/'/g, "''") + "'" : null;
    syncChart();
    renderResults();
    if (govHighlight) { govHighlight.remove(); govHighlight = null; }
    if (!code) return;
    layers.governorates.queryFeatures({ where: "GOV_CODE = '" + code.replace(/'/g, "''") + "'", returnGeometry: true, outFields: ["OBJECTID"], outSpatialReference: view.spatialReference })
      .then(function (r) {
        var f = r.features[0];
        if (!f || state.gov !== code) return;
        view.whenLayerView(layers.governorates).then(function (lv) {
          if (state.gov === code) govHighlight = lv.highlight(f);
        });
        if (!zoom) return;
        // التقريب على المحافظة ثم التأكد أن التجمعات ظاهرة (طبقة التجمعات تظهر تحت مقياس معيّن فقط)
        var ext = f.geometry.extent.expand(1.1);
        view.goTo(ext).then(function () {
          var maxS = layers.localities.minScale;
          if (maxS && view.scale > maxS * 0.97) return view.goTo({ target: ext.center, scale: maxS * 0.97 });
        }).catch(function () {});
      });
  }

  // ===== اختيار تجمع: تقريب + popup + تمييز =====
  function syncSelected() {
    Array.prototype.forEach.call(document.querySelectorAll("#results button"), function (b) {
      b.classList.toggle("on", +b.dataset.oid === state.selected);
    });
  }
  function selectLocality(l) {
    state.selected = l.oid;
    syncSelected();
    layers.localities.queryFeatures({ objectIds: [l.oid], outFields: LOC_FIELDS, returnGeometry: true, outSpatialReference: view.spatialReference })
      .then(function (r) {
        var f = r.features[0];
        if (!f) return;
        var ext = f.geometry.extent.expand(1.6);
        return view.goTo(ext).then(function () {
          if (view.scale > LOCALITY_ZOOM_SCALE) return view.goTo({ target: ext.center, scale: LOCALITY_ZOOM_SCALE });
        }).then(function () {
          if (locHighlight) locHighlight.remove();
          view.whenLayerView(layers.localities).then(function (lv) { locHighlight = lv.highlight(l.oid); });
          view.openPopup({ features: [f], location: f.geometry.extent.center });
        });
      }).catch(function (e) { if (e && e.name !== "AbortError") console.error(e); });
  }

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
  $("gov").addEventListener("change", function (e) { setGov(e.target.value, true); });
  $("reset").addEventListener("click", function () {
    $("q").value = "";
    state.q = "";
    state.selected = null;
    if (locHighlight) { locHighlight.remove(); locHighlight = null; }
    view.closePopup();
    setGov("", false);
    if (home.viewpoint) view.goTo(home.viewpoint).catch(function () {});
  });

  // إزالة تمييز التجمع عند إغلاق الـ popup
  reactiveUtils.watch(function () { return view.popup && view.popup.visible; }, function (vis) {
    if (!vis && locHighlight) { locHighlight.remove(); locHighlight = null; state.selected = null; syncSelected(); }
  });

  // ===== عدّاد الكروت =====
  Array.prototype.forEach.call(document.querySelectorAll(".num[data-to]"), function (n) {
    var to = +n.getAttribute("data-to"), start = null;
    n.textContent = "0";
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / 1200, 1);
      n.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
});
