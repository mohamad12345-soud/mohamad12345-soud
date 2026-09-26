"""تحويل الإحداثيات: فلسطين 1923 / الشبكة الفلسطينية (EPSG:28191) ⇄ WGS84.

المعاملات القياسية (EPSG):
- الإسقاط: Cassini-Soldner، مركزه القدس، على إهليلج Clarke 1880 (Benoit).
- تحويل المرجع: Helmert بسبع معاملات (towgs84 كما في proj لـ EPSG:28191، اتفاقية Position Vector).
نفس المعادلات منقولة للواجهة (birzeit/app/palgrid.js) حتى تطابق الأرقام بالموقع ما يولّده هذا الملف.
"""
import math

A = 6378300.789
B = 6356566.435
E2 = 1 - (B * B) / (A * A)
LAT0 = math.radians(31.73409694444445)
LON0 = math.radians(35.21208055555556)
FE = 170251.555
FN = 126867.909
# towgs84 (متر، ثواني قوسية، جزء بالمليون)
TX, TY, TZ = -275.7224, 94.7824, 340.8944
RX, RY, RZ = (math.radians(v / 3600) for v in (-8.001, -4.42, -11.821))
S = 1e-6

WA = 6378137.0
WF = 1 / 298.257223563
WE2 = WF * (2 - WF)


def _m(phi):
    e2, e4, e6 = E2, E2 * E2, E2 ** 3
    return A * ((1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * phi
                - (3 * e2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * math.sin(2 * phi)
                + (15 * e4 / 256 + 45 * e6 / 1024) * math.sin(4 * phi)
                - (35 * e6 / 3072) * math.sin(6 * phi))


M0 = _m(LAT0)


def cassini_inverse(e, n):
    m1 = M0 + (n - FN)
    mu = m1 / (A * (1 - E2 / 4 - 3 * E2 ** 2 / 64 - 5 * E2 ** 3 / 256))
    e1 = (1 - math.sqrt(1 - E2)) / (1 + math.sqrt(1 - E2))
    phi1 = (mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * math.sin(2 * mu)
            + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * math.sin(4 * mu)
            + (151 * e1 ** 3 / 96) * math.sin(6 * mu)
            + (1097 * e1 ** 4 / 512) * math.sin(8 * mu))
    s = math.sin(phi1)
    nu1 = A / math.sqrt(1 - E2 * s * s)
    rho1 = A * (1 - E2) / (1 - E2 * s * s) ** 1.5
    t1 = math.tan(phi1) ** 2
    d = (e - FE) / nu1
    phi = phi1 - (nu1 * math.tan(phi1) / rho1) * (d * d / 2 - (1 + 3 * t1) * d ** 4 / 24)
    lam = LON0 + (d - t1 * d ** 3 / 3 + (1 + 3 * t1) * t1 * d ** 5 / 15) / math.cos(phi1)
    return phi, lam


def cassini_forward(phi, lam):
    s = math.sin(phi)
    nu = A / math.sqrt(1 - E2 * s * s)
    t = math.tan(phi) ** 2
    c = E2 * math.cos(phi) ** 2 / (1 - E2)
    a = (lam - LON0) * math.cos(phi)
    x = nu * (a - t * a ** 3 / 6 - (8 - t + 8 * c) * t * a ** 5 / 120)
    y = _m(phi) - M0 + nu * math.tan(phi) * (a * a / 2 + (5 - t + 6 * c) * a ** 4 / 24)
    return FE + x, FN + y


def _to_ecef(phi, lam, a, e2):
    s = math.sin(phi)
    nu = a / math.sqrt(1 - e2 * s * s)
    return nu * math.cos(phi) * math.cos(lam), nu * math.cos(phi) * math.sin(lam), nu * (1 - e2) * s


def _from_ecef(x, y, z, a, e2):
    lam = math.atan2(y, x)
    p = math.hypot(x, y)
    phi = math.atan2(z, p * (1 - e2))
    for _ in range(6):
        s = math.sin(phi)
        nu = a / math.sqrt(1 - e2 * s * s)
        phi = math.atan2(z + e2 * nu * s, p)
    return phi, lam


def _helmert(x, y, z, sign):
    rx, ry, rz, sc = sign * RX, sign * RY, sign * RZ, 1 + sign * S
    if sign > 0:
        return (TX + sc * (x - rz * y + ry * z),
                TY + sc * (rz * x + y - rx * z),
                TZ + sc * (-ry * x + rx * y + z))
    x, y, z = x - TX, y - TY, z - TZ
    return (sc * (x - rz * y + ry * z), sc * (rz * x + y - rx * z), sc * (-ry * x + rx * y + z))


def to_wgs84(e, n):
    """(E, N) بالشبكة الفلسطينية ← (lon, lat) WGS84 بالدرجات."""
    phi, lam = cassini_inverse(e, n)
    x, y, z = _helmert(*_to_ecef(phi, lam, A, E2), 1)
    phi, lam = _from_ecef(x, y, z, WA, WE2)
    return math.degrees(lam), math.degrees(phi)


def from_wgs84(lon, lat):
    """(lon, lat) WGS84 ← (E, N) بالشبكة الفلسطينية."""
    x, y, z = _helmert(*_to_ecef(math.radians(lat), math.radians(lon), WA, WE2), -1)
    phi, lam = _from_ecef(x, y, z, A, E2)
    return cassini_forward(phi, lam)


if __name__ == '__main__':
    for e, n in [(FE, FN), (168700, 153400)]:
        lon, lat = to_wgs84(e, n)
        e2, n2 = from_wgs84(lon, lat)
        print(f'{e:.3f},{n:.3f} -> {lat:.7f},{lon:.7f} -> back {e2 - e:.4f} {n2 - n:.4f} m')
