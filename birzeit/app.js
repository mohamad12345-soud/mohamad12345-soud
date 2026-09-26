/* بلدية بيرزيت — المنصة الجغرافية الذكية (نسخة تجريبية)
 * نفس أسلوب منصة دليل التجمعات (app/)، بس البيانات ملفات GeoJSON محلية بمجلد data/
 * (مبنية بـ tools/build_data.py من حزمة ArcGIS Pro، ومحوّلة من الشبكة الفلسطينية لـ WGS84 للعرض).
 * الألوان كلها من theme.css.
 */
require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/GeoJSONLayer",
  "esri/layers/GraphicsLayer",
  "esri/Graphic",
  "esri/widgets/LayerList",
  "esri/widgets/BasemapGallery",
  "esri/widgets/Expand",
  "esri/widgets/Home",
  "esri/widgets/ScaleBar",
  "esri/geometry/support/webMercatorUtils",
  "esri/geometry/operators/centroidOperator"
], function (Map, MapView, GeoJSONLayer, GraphicsLayer, Graphic, LayerList, BasemapGallery, Expand, Home, ScaleBar, webMercatorUtils, centroidOperator) {
  "use strict";

  // ===== إعدادات =====
  // رابط بيانات القطعة بسلطة الأراضي؛ الكود (gpkey) محسوب لكل قطعة بملف البيانات
  var PLA_URL = "https://plaapp.pla.pna.ps/Owners/Owners/Info?gpkey=";
  // مقاييس الظهور: القطع والمباني والأعمدة بتظهر لما نقرّب (حتى تضل الخريطة مقروءة من بعيد)
  var PARCELS_MIN_SCALE = 15000;
  var PARCEL_LABELS_MIN_SCALE = 3500;
  var BUILDINGS_MIN_SCALE = 40000;
  var POLES_MIN_SCALE = 7000;
  // أقصى مقياس عند التقريب على قطعة: يكفي حتى يبين رقمها
  var PARCEL_ZOOM_SCALE = 3000;

  // ===== أدوات مساعدة =====
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function fmt(n, d) { return Number(n).toLocaleString("en-US", { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); }
  function dunam(m2) { return fmt(m2 / 1000, m2 < 10000 ? 2 : 1); }
  function pct(a, b) { return b ? fmt(a / b * 100, a / b < 0.1 ? 1 : 0) + "%" : "—"; }
  // الأرقام العربية الهندية ← لاتينية (للبحث برقم القطعة)
  function digits(s) { return String(s || "").replace(/[٠-٩]/g, function (d) { return d.charCodeAt(0) - 1632; }).trim(); }
  var css = getComputedStyle(document.documentElement);
  function tc(name) { return css.getPropertyValue(name).trim(); }

  // ===== الطبقات =====
  function label(expr, size, color, minScale, maxScale) {
    return [{
      labelExpressionInfo: { expression: expr },
      labelPlacement: "always-horizontal",
      minScale: minScale || 0, maxScale: maxScale || 0,
      symbol: {
        type: "text", color: color, haloColor: [8, 47, 73, 0.9], haloSize: 1.4,
        font: { family: "Arial", size: size, weight: "bold" }
      }
    }];
  }
  var noFill = [0, 0, 0, 0];

  var border = new GeoJSONLayer({
    url: "data/border.geojson", title: "حدود البلدية", popupEnabled: false,
    renderer: { type: "simple", symbol: { type: "simple-fill", color: noFill, outline: { color: tc("--map-border"), width: 2.5, style: "dash" } } }
  });
  var blocks = new GeoJSONLayer({
    url: "data/blocks.geojson", title: "الأحواض", outFields: ["*"], popupEnabled: false,
    renderer: { type: "simple", symbol: { type: "simple-fill", color: [255, 255, 255, 0.02], outline: { color: tc("--map-block-line"), width: 1.6 } } },
    labelingInfo: label("'حوض ' + $feature.b + '\\n' + $feature.name", 12, tc("--map-block-label"), 0, PARCEL_LABELS_MIN_SCALE)
  });
  var parcels = new GeoJSONLayer({
    url: "data/parcels.geojson", title: "القطع", outFields: ["*"], popupEnabled: false, minScale: PARCELS_MIN_SCALE,
    renderer: { type: "simple", symbol: { type: "simple-fill", color: [255, 255, 255, 0.01], outline: { color: tc("--map-parcel-line"), width: 0.7 } } },
    labelingInfo: label("Text($feature.p)", 10, tc("--map-parcel-label"), PARCEL_LABELS_MIN_SCALE)
  });
  var buildings = new GeoJSONLayer({
    url: "data/buildings.geojson", title: "المباني", outFields: ["*"], popupEnabled: false, minScale: BUILDINGS_MIN_SCALE,
    renderer: { type: "simple", symbol: { type: "simple-fill", color: tc("--map-building-fill"), outline: { color: tc("--map-building-line"), width: 0.5 } } }
  });
  var poles = new GeoJSONLayer({
    url: "data/poles.geojson", title: "أعمدة الإنارة", outFields: ["*"], popupEnabled: false, minScale: POLES_MIN_SCALE,
    renderer: { type: "simple", symbol: { type: "simple-marker", style: "circle", size: 6, color: tc("--map-pole"), outline: { color: [66, 32, 6, 0.9], width: 0.8 } } }
  });
  // تمييز الاختيار: طبقة رسومات فوق القطع وتحت المباني، حتى تضل المباني والأرقام ظاهرة
  var selLayer = new GraphicsLayer({ title: "الاختيار", listMode: "hide" });

  var map = new Map({ basemap: "satellite", layers: [blocks, parcels, selLayer, buildings, poles, border] });
  var view = new MapView({
    container: "map", map: map,
    spatialReference: { wkid: 3857 },
    center: [35.19, 31.97], zoom: 14,
    constraints: { minZoom: 11, snapToZoom: false },
    popup: { dockEnabled: false, dockOptions: { buttonEnabled: false } }
  });
  window.appView = view; // للفحص من الـ console

  // نقطة على الخريطة ← نص إحداثيات بالشبكة الفلسطينية
  function gridText(pt) {
    var ll = pt.spatialReference && pt.spatialReference.isWebMercator ? webMercatorUtils.xyToLngLat(pt.x, pt.y) : [pt.x, pt.y];
    var en = window.PalGrid.fromWgs84(ll[0], ll[1]);
    return "E " + fmt(en[0]) + " · N " + fmt(en[1]);
  }

  var SEL = tc("--map-select");
  function markSel(geom) {
    selLayer.removeAll();
    if (!geom) return;
    var c = SEL;
    selLayer.addMany([
      new Graphic({ geometry: geom, symbol: { type: "simple-fill", color: [250, 204, 21, 0.2], outline: { color: [250, 204, 21, 0.35], width: 9 } } }),
      new Graphic({ geometry: geom, symbol: { type: "simple-fill", color: noFill, outline: { color: c, width: 3 } } })
    ]);
  }
  var HIGHLIGHT = { color: [250, 204, 21, 1], haloOpacity: 1, fillOpacity: 0.15 };
  if (view.highlights && view.highlights.length) {
    var hl0 = view.highlights.getItemAt(0);
    hl0.color = HIGHLIGHT.color; hl0.haloOpacity = HIGHLIGHT.haloOpacity; hl0.fillOpacity = HIGHLIGHT.fillOpacity;
  } else {
    view.highlightOptions = HIGHLIGHT;
  }

  var home = new Home({ view: view });
  view.ui.add(home, "top-right");
  view.ui.add(new ScaleBar({ view: view, unit: "metric" }), "bottom-right");
  view.ui.add(new Expand({ view: view, content: new LayerList({ view: view }), expandTooltip: "الطبقات", group: "tl", expandIcon: "layers" }), "top-left");
  view.ui.add(new Expand({ view: view, content: new BasemapGallery({ view: view }), expandTooltip: "الخريطة الأساس", group: "tl", expandIcon: "basemap" }), "top-left");

  // الامتداد الأولي وزر الهوم: حدود البلدية كاملة
  Promise.all([border.queryExtent(), view.when()]).then(function (r) {
    syncPadding();
    return view.goTo(r[0].extent.expand(1.08), { animate: false }).then(function () { home.viewpoint = view.viewpoint.clone(); });
  }).catch(function (e) { console.error(e); });

  // ===== حالة المنصة =====
  var state = { block: null, q: "", sel: null, nav: [] };
  var blockList = [];   // {b, name, parcels, buildings, built, area, oid}
  var parcelList = [];  // {b, bn, p, area, nb, ba, k, code, oid}
  var summary = null;

  Promise.all([
    fetch("data/summary.json").then(function (r) { return r.json(); }),
    blocks.queryFeatures({ where: "1=1", outFields: ["*"], returnGeometry: false }),
    parcels.queryFeatures({ where: "1=1", outFields: ["*"], returnGeometry: false })
  ]).then(function (res) {
    summary = res[0];
    blockList = res[1].features.map(function (f) {
      var a = f.attributes;
      return { b: a.b, name: a.name, parcels: a.parcels, buildings: a.buildings, built: a.built, area: a.area, oid: a[blocks.objectIdField] };
    }).sort(function (x, y) { return x.b - y.b; });
    parcelList = res[2].features.map(function (f) {
      var a = f.attributes;
      return { b: a.b, bn: a.bn, p: a.p, area: a.area, nb: a.nb, ba: a.ba, k: a.k, code: a.code, oid: a[parcels.objectIdField] };
    }).sort(function (x, y) { return x.b - y.b || x.p - y.p; });

    countUp($("nParcels"), summary.parcels);
    countUp($("nBlocks"), summary.blocks);
    countUp($("nBuildings"), summary.buildings);
    countUp($("nPoles"), summary.poles);
    renderArea();
    drawChart();
    $("surveyTotal").textContent = "من " + fmt(summary.buildings) + " مبنى";
    var sel = $("blockSel");
    blockList.forEach(function (b) {
      var o = el("option", null, b.b + " · " + b.name + " (" + b.parcels + ")");
      o.value = b.b;
      sel.appendChild(o);
    });
    renderResults();
    $("tourBtn").disabled = false;
  }).catch(function (err) {
    console.error(err);
    $("chart").innerHTML = "";
    $("chart").appendChild(el("div", "err", "تعذّر تحميل بيانات المنصة."));
  });

  // ===== المساحة المبنية =====
  function renderArea() {
    var box = $("regions"), total = summary.border_km2 * 1e6, built = summary.built_m2;
    box.innerHTML = "";
    var rg = el("div", "rg");
    var a = el("div", "ar"); a.appendChild(el("b", null, fmt(summary.border_km2, 2))); a.appendChild(el("span", null, "كم² مساحة البلدية"));
    var b = el("div", "bt"); b.appendChild(el("b", null, fmt(built / 1000))); b.appendChild(el("span", null, "دونم بصمات مباني · " + pct(built, total)));
    rg.appendChild(a); rg.appendChild(b);
    var split = el("div", "split"), i1 = el("i"), i2 = el("i");
    i1.style.flexGrow = 1; i2.style.flexGrow = 1;
    split.appendChild(i1); split.appendChild(i2);
    box.appendChild(rg); box.appendChild(split);
    box.appendChild(el("small", "note", "المباني من ملف المسح (الأوتوكاد)، وتغطي المنطقة المبنية من البلدة."));
    requestAnimationFrame(function () { requestAnimationFrame(function () { i1.style.flexGrow = total - built; i2.style.flexGrow = built; }); });
  }

  // ===== الشارت =====
  function drawChart() {
    var box = $("chart");
    box.innerHTML = "";
    var max = Math.max.apply(null, blockList.map(function (b) { return b.parcels; }));
    blockList.forEach(function (b) {
      var btn = el("button", "bar");
      btn.type = "button";
      btn.dataset.b = b.b;
      btn.title = "حوض " + b.b + " " + b.name + ": " + b.parcels + " قطعة، " + b.buildings + " مبنى";
      btn.setAttribute("aria-label", btn.title);
      btn.appendChild(el("span", "nm", b.b + " · " + b.name));
      var tr = el("span", "tr"), fl = el("span", "fl");
      tr.appendChild(fl);
      btn.appendChild(tr);
      btn.appendChild(el("span", "vl", fmt(b.parcels)));
      btn.appendChild(el("span", "vb", fmt(b.buildings)));
      btn.addEventListener("click", function () {
        stopTour();
        setBlock(state.block === b.b ? null : b.b, true);
        if (state.block && isMobile()) setTab("map");
      });
      box.appendChild(btn);
      requestAnimationFrame(function () { requestAnimationFrame(function () { fl.style.width = (b.parcels / max * 100) + "%"; }); });
    });
    syncChart();
  }
  function syncChart() {
    Array.prototype.forEach.call(document.querySelectorAll(".bar"), function (b) {
      var on = +b.dataset.b === state.block;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  // ===== البحث عن قطعة =====
  var MAX_RESULTS = 200, lastList = [];
  function renderResults() {
    var q = digits(state.q), b = state.block, p = null;
    // "13/205" أو "13 205" = حوض 13 قطعة 205
    var m = q.match(/^(\d+)\s*[/\\\-\s]\s*(\d+)$/);
    if (m) { b = +m[1]; q = m[2]; }
    if (/^\d+$/.test(q)) p = q;
    var list = parcelList.filter(function (x) {
      if (b && x.b !== b) return false;
      if (p && String(x.p).indexOf(p) !== 0) return false;
      return true;
    });
    if (p) list.sort(function (x, y) { return (String(x.p) === p ? 0 : 1) - (String(y.p) === p ? 0 : 1) || x.b - y.b || x.p - y.p; });
    lastList = list;
    var ul = $("results");
    ul.innerHTML = "";
    $("resCount").textContent = fmt(list.length) + " قطعة" + (list.length > MAX_RESULTS ? " (يُعرض أول " + fmt(MAX_RESULTS) + ")" : "");
    if (!list.length) { ul.appendChild(el("li", "empty", "لا توجد قطعة مطابقة.")); return; }
    list.slice(0, MAX_RESULTS).forEach(function (x) {
      var li = el("li"), btn = el("button", state.sel === x ? "on" : "");
      btn.type = "button";
      btn.appendChild(el("span", "n", "قطعة " + x.p + " · حوض " + x.b + " " + x.bn));
      btn.appendChild(el("span", "s", fmt(x.area) + " م² · " + dunam(x.area) + " دونم" + (x.nb ? " · " + x.nb + " مبنى" : "")));
      btn.addEventListener("click", function () { selectParcel(x, lastList); });
      li.appendChild(btn);
      ul.appendChild(li);
    });
  }
  function syncResults() {
    var i = 0;
    Array.prototype.forEach.call(document.querySelectorAll("#results button"), function (btn) {
      btn.classList.toggle("on", lastList[i++] === state.sel);
    });
  }

  // ===== اختيار حوض =====
  var blockHl = null;
  function setBlock(b, zoom) {
    if (state.sel && state.sel.b !== b) closeCards();
    state.block = b;
    $("blockSel").value = b || "";
    syncChart();
    renderResults();
    if (blockHl) { blockHl.remove(); blockHl = null; }
    showSpot(b);
    if (!b) return Promise.resolve();
    return blocks.queryFeatures({ where: "b = " + (+b), returnGeometry: true, outFields: ["*"], outSpatialReference: view.spatialReference }).then(function (r) {
      var f = r.features[0];
      if (!f || state.block !== b) return;
      view.whenLayerView(blocks).then(function (lv) { if (state.block === b) blockHl = lv.highlight(f); });
      if (zoom) return flyTo(f.geometry.extent.expand(1.15)).catch(function () {});
    });
  }
  function showSpot(b) {
    var x = blockList.filter(function (y) { return y.b === b; })[0];
    $("spot").parentNode.classList.toggle("has-spot", !!x);
    if (!x) { $("spot").hidden = true; syncPadding(); return; }
    $("spotNo").textContent = x.b;
    $("spotName").textContent = x.name;
    $("spotBld").textContent = fmt(x.buildings);
    $("spotArea").textContent = fmt(x.area / 1000);
    $("spotCover").textContent = x.built ? pct(x.built, x.area) : "—";
    $("spot").hidden = false;
    countUp($("spotParcels"), x.parcels);
    syncPadding();
  }
  $("spotClose").addEventListener("click", function () { stopTour(); setBlock(null); });

  // ===== اختيار قطعة =====
  function selectParcel(x, nav) {
    stopTour();
    state.sel = x;
    state.nav = nav && nav.indexOf(x) >= 0 ? nav : parcelList.filter(function (y) { return y.b === x.b; });
    syncResults();
    if (isMobile()) setTab("map");
    showParcel(x);
    markSel(null);
    parcels.queryFeatures({ where: "b = " + x.b + " AND p = " + x.p, returnGeometry: true, outFields: ["b"], outSpatialReference: view.spatialReference })
      .then(function (r) {
        var f = r.features[0];
        if (!f || state.sel !== x) return;
        $("locXY").textContent = gridText(centroidOperator.execute(f.geometry) || f.geometry.extent.center);
        markSel(f.geometry);
        return flyTo(f.geometry.extent.expand(2.2), PARCEL_ZOOM_SCALE);
      }).catch(function (e) { if (e && e.name !== "AbortError") console.error(e); });
  }
  function showParcel(x) {
    $("bld").hidden = true;
    $("locName").textContent = "قطعة " + x.p;
    $("locCode").textContent = x.code.replace(/^ps\//, "");
    $("locEn").textContent = "حوض " + x.b;
    $("locBlock").textContent = "حوض " + x.bn;
    $("locArea").textContent = dunam(x.area);
    $("locBld").textContent = fmt(x.nb);
    $("locCover").textContent = x.nb ? pct(x.ba, x.area) : "—";
    $("locM2").textContent = fmt(x.area, 1) + " m²";
    $("locXY").textContent = "…";
    $("locPla").href = PLA_URL + x.k;
    var i = state.nav.indexOf(x);
    $("locPos").textContent = (i + 1) + " / " + state.nav.length;
    $("locPrev").disabled = i <= 0;
    $("locNext").disabled = i >= state.nav.length - 1;
    reveal($("loc"));
  }
  function stepParcel(d) {
    if (!state.sel || $("loc").hidden) return;
    var next = state.nav[state.nav.indexOf(state.sel) + d];
    if (next) selectParcel(next, state.nav);
  }
  $("locPrev").addEventListener("click", function () { stepParcel(-1); });
  $("locNext").addEventListener("click", function () { stepParcel(1); });
  $("locClose").addEventListener("click", closeCards);
  $("locBlock").addEventListener("click", function () {
    var b = state.sel && state.sel.b;
    closeCards();
    if (b) setBlock(b, true);
  });
  document.addEventListener("keydown", function (e) {
    if ($("loc").hidden || /INPUT|SELECT|TEXTAREA/.test((document.activeElement || {}).tagName || "")) return;
    if (e.key === "ArrowLeft") { e.preventDefault(); stepParcel(1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); stepParcel(-1); }
  });

  // ===== اختيار مبنى =====
  var curBld = null;
  function selectBuilding(g) {
    stopTour();
    var a = g.attributes;
    curBld = a;
    state.sel = null;
    syncResults();
    $("loc").hidden = true;
    $("bldName").textContent = "مبنى رقم " + a.id;
    $("bldCode").textContent = "BZT-" + String(a.id).padStart(4, "0");
    $("bldArea").textContent = fmt(a.area);
    var par = a.b ? parcelList.filter(function (y) { return y.b === a.b && y.p === a.p; })[0] : null;
    $("bldSub").textContent = par ? "حوض " + par.b + " · " + par.bn : "خارج القطع المسجّلة";
    $("bldParcel").hidden = !par;
    $("bldParcel").textContent = par ? "قطعة " + par.p : "";
    markSel(g.geometry);
    reveal($("bld"));
  }
  $("bldClose").addEventListener("click", closeCards);
  $("bldParcel").addEventListener("click", function () {
    var par = curBld && parcelList.filter(function (y) { return y.b === curBld.b && y.p === curBld.p; })[0];
    if (par) selectParcel(par);
  });

  function reveal(card) {
    card.hidden = true; void card.offsetWidth; card.hidden = false; // إعادة حركة الظهور
    card.parentNode.classList.add("has-loc");
    syncPadding();
  }
  function closeCards() {
    $("loc").hidden = true;
    $("bld").hidden = true;
    $("loc").parentNode.classList.remove("has-loc");
    markSel(null);
    state.sel = null;
    curBld = null;
    syncResults();
    syncPadding();
  }

  // ===== انتقال سلس (نفس منطق الدليل) =====
  var MOBILE_SPEED = 0.6;
  function ms(d) { return Math.round(isMobile() ? d * MOBILE_SPEED : d); }
  function scaleToFit(ext) {
    var pad = view.padding || {};
    var w = Math.max(view.width - (pad.left || 0) - (pad.right || 0), 50);
    var h = Math.max(view.height - (pad.top || 0) - (pad.bottom || 0), 50);
    return Math.max(ext.width / w, ext.height / h) * view.scale / view.resolution;
  }
  function flyTo(ext, maxScale) {
    var endScale = scaleToFit(ext);
    if (maxScale && endScale > maxScale) endScale = maxScale;
    var target = ext.center, from = view.center;
    var dist = Math.sqrt(Math.pow(target.x - from.x, 2) + Math.pow(target.y - from.y, 2));
    var visible = Math.max(view.extent.width, view.extent.height);
    var end = { target: target, scale: endScale };
    if (dist < visible * 0.6) return view.goTo(end, { duration: ms(1400), easing: "in-out-cubic" });
    var both = { width: Math.abs(target.x - from.x) * 1.6, height: Math.abs(target.y - from.y) * 1.6 };
    var mid = { target: { type: "point", spatialReference: view.spatialReference, x: (from.x + target.x) / 2, y: (from.y + target.y) / 2 }, scale: Math.max(view.scale, endScale, scaleToFit(both)) };
    return view.goTo(mid, { duration: ms(1100), easing: "in-cubic" }).then(function () {
      return view.goTo(end, { duration: ms(1500), easing: "out-cubic" });
    });
  }

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
  mq.addEventListener("change", function () {
    if (!isMobile() && document.querySelector(".app").dataset.tab === "map") setTab("dash");
  });
  setTab("dash");

  // ===== أحداث البحث =====
  var qt;
  $("q").addEventListener("input", function (e) {
    clearTimeout(qt);
    qt = setTimeout(function () { state.q = e.target.value; renderResults(); }, 120);
  });
  $("q").addEventListener("keydown", function (e) {
    if (e.key === "Enter") { var first = document.querySelector("#results button"); if (first) first.click(); }
  });
  $("blockSel").addEventListener("change", function (e) { stopTour(); setBlock(e.target.value ? +e.target.value : null, true); });
  $("reset").addEventListener("click", function () {
    stopTour();
    $("q").value = ""; state.q = "";
    closeCards();
    setBlock(null);
    if (home.viewpoint) view.goTo(home.viewpoint, { duration: ms(1400), easing: "in-out-cubic" }).catch(function () {});
  });

  // ===== الخريطة: المرور والضغط =====
  var tip = $("tip"), hoverKey = null, hoverHl = null, moveTimer = null;
  function clearHover() {
    tip.hidden = true; hoverKey = null;
    if (hoverHl) { hoverHl.remove(); hoverHl = null; }
    view.container.style.cursor = "";
  }
  // الأولوية: المبنى، ثم القطعة (إذا ظاهرة)، ثم الحوض
  function pickHit(r) {
    var order = [buildings, parcels, blocks];
    for (var i = 0; i < order.length; i++) {
      var h = r.results.filter(function (x) { return x.graphic && x.graphic.layer === order[i]; })[0];
      if (h) return h;
    }
    return null;
  }
  function hitLayers() {
    var l = [blocks];
    if (view.scale <= PARCELS_MIN_SCALE) l.unshift(parcels);
    if (view.scale <= BUILDINGS_MIN_SCALE) l.unshift(buildings);
    return l;
  }
  var coords = $("coords");
  view.on("pointer-move", function (e) {
    if (isMobile()) return;
    var pt = view.toMap({ x: e.x, y: e.y });
    if (pt) {
      $("coordsVal").textContent = gridText(pt);
      coords.hidden = false;
    }
    clearTimeout(moveTimer);
    moveTimer = setTimeout(function () {
      view.hitTest(e, { include: hitLayers() }).then(function (r) {
        var hit = pickHit(r);
        if (!hit) { clearHover(); return; }
        var lyr = hit.graphic.layer, a = hit.graphic.attributes;
        tip.innerHTML = "";
        if (lyr === buildings) {
          tip.appendChild(document.createTextNode("مبنى " + a.id));
          tip.appendChild(el("b", null, fmt(a.area) + " م²"));
        } else if (lyr === parcels) {
          tip.appendChild(document.createTextNode("قطعة " + a.p + " · حوض " + a.bn));
          tip.appendChild(el("b", null, dunam(a.area) + " دونم"));
        } else {
          tip.appendChild(document.createTextNode("حوض " + a.b + " " + a.name));
          tip.appendChild(el("b", null, fmt(a.parcels) + " قطعة"));
        }
        tip.style.left = e.x + "px"; tip.style.top = e.y + "px";
        tip.hidden = false;
        view.container.style.cursor = "pointer";
        var oid = a[lyr.objectIdField], key = lyr.id + ":" + oid;
        if (key !== hoverKey) {
          hoverKey = key;
          if (hoverHl) { hoverHl.remove(); hoverHl = null; }
          if (lyr === blocks && a.b === state.block) return; // الحوض المختار عنده تمييز أصلاً
          view.whenLayerView(lyr).then(function (lv) { if (hoverKey === key) hoverHl = lv.highlight(oid); });
        }
      }).catch(function () {});
    }, 30);
  });
  view.on("pointer-leave", function () { clearHover(); coords.hidden = true; });

  view.on("click", function (e) {
    view.hitTest(e, { include: hitLayers() }).then(function (r) {
      var hit = pickHit(r);
      if (!hit) return;
      stopTour();
      clearHover();
      var lyr = hit.graphic.layer, a = hit.graphic.attributes;
      if (lyr === buildings) { selectBuilding(hit.graphic); return; }
      if (lyr === parcels) {
        var x = parcelList.filter(function (y) { return y.b === a.b && y.p === a.p; })[0];
        if (x) selectParcel(x);
        return;
      }
      closeCards();
      setBlock(a.b, true);
      if (!isMobile()) setTab("dash");
    });
  });

  // ===== المساحة المحجوزة للّوحة والبطاقات =====
  var lastPad = "";
  function syncPadding() {
    var side = isMobile() ? 0 : document.querySelector(".panel").getBoundingClientRect().width + 32;
    var card = !$("loc").hidden ? $("loc") : !$("bld").hidden ? $("bld") : $("spot");
    var open = isMobile() && !card.hidden;
    var bottom = open ? card.offsetHeight + 36 : 0;
    $("map").parentNode.classList.toggle("card-open", open);
    var key = side + "|" + bottom;
    if (key === lastPad) return;
    lastPad = key;
    view.padding = { right: side, bottom: bottom };
    view.ui.padding = { top: 12, right: 12 + side, bottom: 12, left: 12 };
  }

  // ===== جولة على الأحواض =====
  var TOUR_MS = 7000, tour = null;
  function stopTour() {
    if (!tour) return;
    clearTimeout(tour.timer); cancelAnimationFrame(tour.raf);
    tour = null;
    var b = $("tourBtn");
    b.classList.remove("on");
    b.querySelector("span").textContent = "▶";
    b.querySelector("b").textContent = "جولة على الأحواض";
    $("spotTour").hidden = true;
  }
  function tourStep() {
    if (!tour) return;
    if (tour.i >= blockList.length) {
      stopTour();
      setBlock(null);
      if (home.viewpoint) view.goTo(home.viewpoint, { duration: ms(1800), easing: "in-out-cubic" }).catch(function () {});
      return;
    }
    var x = blockList[tour.i], my = tour;
    setBlock(x.b, true).then(function () {
      if (tour !== my) return;
      if ($("spotTour").hidden) { $("spotTour").hidden = false; syncPadding(); }
      $("spotStep").textContent = (my.i + 1) + " / " + blockList.length;
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
    closeCards();
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
  document.addEventListener("fullscreenchange", function () { $("fsBtn").textContent = document.fullscreenElement ? "🗗" : "⛶"; });

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
      n.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
});
