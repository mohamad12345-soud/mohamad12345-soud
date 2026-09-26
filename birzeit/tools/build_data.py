"""يبني ملفات بيانات المنصة (birzeit/data/*.geojson) من حزمة ArcGIS Pro وجدول أحواض سلطة الأراضي.

الاستخدام:
    python3 birzeit/tools/build_data.py birzeat_data.lpkx All_Property_Desc_cat_395.xlsx

- الحزمة (.lpkx) تُفك وتُقرأ مباشرة (بلا GDAL) — فيها قاعدة birzeatmap.gdb.
- الإحداثيات الأصلية بالشبكة الفلسطينية (EPSG:28191) تُحوّل لـ WGS84 للعرض على الخريطة فقط.
- لا يُكتب أي حقل فيه أسماء مالكين أو مسّاحين (طبقات معاملات المساحة لا تُنشر إطلاقاً).
"""
import csv, json, math, os, re, sys, tempfile, zipfile, xml.etree.ElementTree as ET

sys.path.insert(0, os.path.dirname(__file__))
from fgdb import Table, rings_to_geojson, ring_area, point_in_ring  # noqa: E402
from un7z import extract  # noqa: E402
from palgrid import to_wgs84  # noqa: E402

OUT = os.path.join(os.path.dirname(__file__), '..', 'data')
GDB_NAME = 'birzeatmap.gdb'
VILLAGE_AR = 'بيرزيت'           # اسم البلدة بجدول سلطة الأراضي (العمود VName)
MIN_BUILDING_M2 = 5             # أصغر من هيك غالباً رموز أو خطوط مساعدة بملف الأوتوكاد
PLA_URL = 'https://plaapp.pla.pna.ps/Owners/Owners/Info?gpkey='


def read_xlsx(path):
    z = zipfile.ZipFile(path)
    ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    ss = [''.join(t.text or '' for t in si.iter('{%s}t' % ns['m']))
          for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si', ns)]
    rows = []
    for row in ET.fromstring(z.read('xl/worksheets/sheet1.xml')).iter('{%s}row' % ns['m']):
        rec = {}
        for c in row.findall('m:c', ns):
            col = re.match(r'[A-Z]+', c.get('r')).group(0)
            v = c.find('m:v', ns)
            rec[col] = None if v is None else (ss[int(v.text)] if c.get('t') == 's' else v.text)
        rows.append(rec)
    head = rows[0]
    return [{head[k]: r.get(k) for k in head} for r in rows[1:]]


def gpkey_factory(xlsx):
    """كود القطعة بنظام سلطة الأراضي: محافظة(2) بلدة(5) حوض(6) قطعة(8) + "159" + 7 أصفار.
    مستنتج من مثالين حقيقيين: الطيبة حوض 10 قطعة 3 = 1300023000466000000031590000000
    وبيرزيت حوض 13 (المراح) قطعة 205 = 1300019000289000002051590000000.
    الأرقام الداخلية (GID/VID/BID) من جدول الأحواض، ورقم الحوض (BNO) هو BLOCK_NO بالطبقة."""
    rows = [r for r in read_xlsx(xlsx) if r['VName'] == VILLAGE_AR]
    gid, vid = int(rows[0]['GID']), int(rows[0]['VID'])
    bid = {int(r['BNO']): int(r['BID']) for r in rows}

    def key(block_no, parcel_no):
        return f'{gid:02d}{vid:05d}{bid[block_no]:06d}{parcel_no:08d}1590000000'
    assert f'{13:02d}{23:05d}{466:06d}{3:08d}1590000000' == '1300023000466000000031590000000'
    return key, bid


def ll(pt):
    lon, lat = to_wgs84(pt[0], pt[1])
    return [round(lon, 7), round(lat, 7)]


def geom_ll(g):
    if g['type'] == 'Polygon':
        return {'type': 'Polygon', 'coordinates': [[ll(p) for p in r] for r in g['coordinates']]}
    if g['type'] == 'MultiPolygon':
        return {'type': 'MultiPolygon', 'coordinates': [[[ll(p) for p in r] for r in poly] for poly in g['coordinates']]}
    if g['type'] == 'Point':
        return {'type': 'Point', 'coordinates': ll(g['coordinates'])}
    raise ValueError(g['type'])


def centroid(ring):
    a = cx = cy = 0
    for i in range(len(ring) - 1):
        x0, y0 = ring[i]; x1, y1 = ring[i + 1]
        f = x0 * y1 - x1 * y0
        a += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f
    if abs(a) < 1e-9:
        return ring[0]
    return [cx / (3 * a), cy / (3 * a)]


def outer_rings(g):
    return [g['coordinates'][0]] if g['type'] == 'Polygon' else [p[0] for p in g['coordinates']]


def bbox(ring):
    xs = [p[0] for p in ring]; ys = [p[1] for p in ring]
    return min(xs), min(ys), max(xs), max(ys)


def write(name, feats, extra=None):
    fc = {'type': 'FeatureCollection', 'features': feats}
    if extra:
        fc.update(extra)
    path = os.path.join(OUT, name)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(fc, f, ensure_ascii=False, separators=(',', ':'))
    print(f'{name}: {len(feats)} ({os.path.getsize(path) / 1e6:.2f} MB)')


def main(lpkx, xlsx):
    os.makedirs(OUT, exist_ok=True)
    tmp = tempfile.mkdtemp()
    extract(lpkx, tmp)
    gdb = os.path.join(tmp, 'commondata', GDB_NAME)
    cat = {name: i for i, (r, _) in enumerate(Table(os.path.join(gdb, 'a00000001')).rows(), 1) for name in [r['Name']]}

    def table(name):
        return Table(os.path.join(gdb, 'a%08x' % cat[name]))

    key, bid = gpkey_factory(xlsx)

    # ===== حدود البلدية =====
    (b, g), = list(table('birzeat_bourder').rows())
    border_g = rings_to_geojson(g['rings'])
    border_area = sum(abs(ring_area(r)) for r in outer_rings(border_g))
    write('border.geojson', [{'type': 'Feature', 'properties': {'name': 'بيرزيت', 'area_m2': round(border_area)},
                              'geometry': geom_ll(border_g)}])

    # ===== القطع =====
    parcels = []
    for r, g in table('birzeat_parcel').rows():
        gg = rings_to_geojson(g['rings'])
        parcels.append((r, gg, [bbox(x) for x in outer_rings(gg)]))
    parcels.sort(key=lambda p: (p[0]['BLOCK_NO'], p[0]['PLOT_NO']))

    # ===== المباني (من ملف الأوتوكاد) =====
    seen = set(); buildings = []
    for r, g in table('Polygon').rows():
        if r['Layer'] != 'Buildings' or not g:
            continue
        gg = rings_to_geojson(g['rings'])
        area = sum(abs(ring_area(x)) for x in outer_rings(gg))
        if area < MIN_BUILDING_M2:
            continue
        c = centroid(outer_rings(gg)[0])
        k = (round(c[0], 1), round(c[1], 1), round(area))
        if k in seen:
            continue
        seen.add(k)
        buildings.append((gg, area, c))

    # ربط كل مبنى بالقطعة اللي فيها مركزه
    def parcel_at(pt):
        for i, (r, gg, boxes) in enumerate(parcels):
            for ring, bb in zip(outer_rings(gg), boxes):
                if bb[0] <= pt[0] <= bb[2] and bb[1] <= pt[1] <= bb[3] and point_in_ring(pt, ring):
                    return i
        return None

    b_by_parcel = {}
    bfeats = []
    for n, (gg, area, c) in enumerate(sorted(buildings, key=lambda x: (-x[2][1], x[2][0])), 1):
        pi = parcel_at(c)
        props = {'id': n, 'area': round(area, 1)}
        if pi is not None:
            pr = parcels[pi][0]
            props.update({'b': pr['BLOCK_NO'], 'p': pr['PLOT_NO']})
            b_by_parcel.setdefault(pi, []).append(area)
        bfeats.append({'type': 'Feature', 'properties': props, 'geometry': geom_ll(gg)})

    pfeats = []
    for i, (r, gg, _) in enumerate(parcels):
        bl = b_by_parcel.get(i, [])
        pfeats.append({'type': 'Feature', 'properties': {
            'b': r['BLOCK_NO'], 'bn': r['BLOCK_A'], 'p': r['PLOT_NO'],
            'area': round(r['Shape_Area'], 1), 'code': r['BQPCODE'], 'k': key(r['BLOCK_NO'], r['PLOT_NO']),
            'nb': len(bl), 'ba': round(sum(bl), 1)}, 'geometry': geom_ll(gg)})
    assert next(f for f in pfeats if f['properties']['b'] == 13 and f['properties']['p'] == 205)['properties']['k'] \
        == '1300019000289000002051590000000'
    write('parcels.geojson', pfeats)
    # جدول القطع مع رابط سلطة الأراضي (للموظفين؛ يفتح بـ Excel) — خارج مجلد الموقع حتى ما ينشر
    csv_path = os.path.join(os.path.dirname(__file__), '..', 'parcels_gpkey.csv')
    with open(csv_path, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f)
        w.writerow(['رقم الحوض', 'اسم الحوض', 'رقم القطعة', 'المساحة م2', 'BQPCODE', 'gpkey', 'رابط سلطة الأراضي'])
        for x in pfeats:
            p = x['properties']
            w.writerow([p['b'], p['bn'], p['p'], p['area'], p['code'], p['k'], PLA_URL + p['k']])
    write('buildings.geojson', bfeats)

    # ===== الأحواض =====
    stats = {}
    for f in pfeats:
        s = stats.setdefault(f['properties']['b'], {'parcels': 0, 'buildings': 0, 'built': 0.0})
        s['parcels'] += 1; s['buildings'] += f['properties']['nb']; s['built'] += f['properties']['ba']
    blocks = []
    for r, g in sorted(table('birzeat_block').rows(), key=lambda x: x[0]['BLOCK_NO']):
        gg = rings_to_geojson(g['rings']); no = r['BLOCK_NO']; s = stats.get(no, {})
        blocks.append({'type': 'Feature', 'properties': {
            'b': no, 'name': r['BLOCK_A'], 'name_en': r['BLOCK_E'], 'bid': bid.get(no),
            'area': round(r['Shape_Area']), 'parcels': s.get('parcels', 0), 'buildings': s.get('buildings', 0),
            'built': round(s.get('built', 0))}, 'geometry': geom_ll(gg)})
    write('blocks.geojson', blocks)

    # ===== أعمدة الكهرباء (الإنارة العامة من مسؤولية البلدية) =====
    bx = bbox(outer_rings(border_g)[0])
    poles = []
    for r, g in table('Point').rows():
        if r['Layer'] != 'Elecrticity_Pole' or not g:
            continue
        x, y = g['coordinates']
        if not (bx[0] - 200 <= x <= bx[2] + 200 and bx[1] - 200 <= y <= bx[3] + 200):
            continue
        poles.append({'type': 'Feature', 'properties': {'id': len(poles) + 1},
                      'geometry': {'type': 'Point', 'coordinates': ll([x, y])}})
    write('poles.geojson', poles)

    summary = {'border_km2': round(border_area / 1e6, 2), 'parcels': len(pfeats), 'blocks': len(blocks),
               'buildings': len(bfeats), 'poles': len(poles),
               'built_m2': round(sum(x[1] for x in buildings))}
    with open(os.path.join(OUT, 'summary.json'), 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=1)
    print(summary)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
