/* تحويل الإحداثيات: WGS84 ⇄ فلسطين 1923 / الشبكة الفلسطينية (EPSG:28191).
 * نفس معادلات ومعاملات tools/palgrid.py (اللي بنى ملفات البيانات)، حتى الأرقام المعروضة تطابق الأصل.
 * Cassini-Soldner على Clarke 1880 (Benoit) + Helmert بسبع معاملات (towgs84 القياسي). */
(function () {
  "use strict";
  var A = 6378300.789, B = 6356566.435, E2 = 1 - (B * B) / (A * A);
  var LAT0 = 31.73409694444445 * Math.PI / 180, LON0 = 35.21208055555556 * Math.PI / 180;
  var FE = 170251.555, FN = 126867.909;
  var TX = -275.7224, TY = 94.7824, TZ = 340.8944, S = 1e-6;
  var SEC = Math.PI / 180 / 3600, RX = -8.001 * SEC, RY = -4.42 * SEC, RZ = -11.821 * SEC;
  var WA = 6378137.0, WF = 1 / 298.257223563, WE2 = WF * (2 - WF);

  function mer(phi) {
    var e2 = E2, e4 = e2 * e2, e6 = e4 * e2;
    return A * ((1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * phi
      - (3 * e2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * Math.sin(2 * phi)
      + (15 * e4 / 256 + 45 * e6 / 1024) * Math.sin(4 * phi)
      - (35 * e6 / 3072) * Math.sin(6 * phi));
  }
  var M0 = mer(LAT0);

  function toEcef(phi, lam, a, e2) {
    var s = Math.sin(phi), nu = a / Math.sqrt(1 - e2 * s * s);
    return [nu * Math.cos(phi) * Math.cos(lam), nu * Math.cos(phi) * Math.sin(lam), nu * (1 - e2) * s];
  }
  function fromEcef(p, a, e2) {
    var lam = Math.atan2(p[1], p[0]), r = Math.hypot(p[0], p[1]), phi = Math.atan2(p[2], r * (1 - e2));
    for (var i = 0; i < 6; i++) {
      var s = Math.sin(phi), nu = a / Math.sqrt(1 - e2 * s * s);
      phi = Math.atan2(p[2] + e2 * nu * s, r);
    }
    return [phi, lam];
  }
  // WGS84 → فلسطين 1923 (عكس towgs84)
  function helmertInv(p) {
    var x = p[0] - TX, y = p[1] - TY, z = p[2] - TZ, sc = 1 - S;
    return [sc * (x + RZ * y - RY * z), sc * (-RZ * x + y + RX * z), sc * (RY * x - RX * y + z)];
  }

  /** (lon, lat) WGS84 → [E, N] بالمتر على الشبكة الفلسطينية */
  function fromWgs84(lon, lat) {
    var g = fromEcef(helmertInv(toEcef(lat * Math.PI / 180, lon * Math.PI / 180, WA, WE2)), A, E2);
    var phi = g[0], lam = g[1];
    var s = Math.sin(phi), nu = A / Math.sqrt(1 - E2 * s * s), t = Math.pow(Math.tan(phi), 2);
    var c = E2 * Math.pow(Math.cos(phi), 2) / (1 - E2), a = (lam - LON0) * Math.cos(phi);
    var x = nu * (a - t * Math.pow(a, 3) / 6 - (8 - t + 8 * c) * t * Math.pow(a, 5) / 120);
    var y = mer(phi) - M0 + nu * Math.tan(phi) * (a * a / 2 + (5 - t + 6 * c) * Math.pow(a, 4) / 24);
    return [FE + x, FN + y];
  }

  window.PalGrid = { fromWgs84: fromWgs84 };
})();
