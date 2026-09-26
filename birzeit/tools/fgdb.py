"""Minimal File Geodatabase (OpenFileGDB format) reader -> GeoJSON, stdlib only.
Follows the public format description (GDAL OpenFileGDB). Reads XY of points/lines/polygons;
curves are kept as their vertices (chords)."""
import struct, json, sys, os, datetime

def varuint(b, p):
    shift = 0; v = 0
    while True:
        c = b[p]; p += 1
        v |= (c & 0x7F) << shift
        if not c & 0x80: return v, p
        shift += 7

def varint(b, p):
    c = b[p]; p += 1
    v = c & 0x3F; neg = c & 0x40; shift = 6
    while c & 0x80:
        c = b[p]; p += 1
        v |= (c & 0x7F) << shift; shift += 7
    return (-v if neg else v), p

class Table:
    def __init__(self, path):
        self.path = path
        self.b = open(path + '.gdbtable', 'rb').read()
        self.x = open(path + '.gdbtablx', 'rb').read()
        b = self.b
        self.nrows = struct.unpack_from('<i', b, 4)[0]
        fdo = struct.unpack_from('<q', b, 32)[0]
        p = fdo
        hsize, ver, flags, nfields = struct.unpack_from('<IIIH', b, p); p += 14
        self.geomtype = flags & 0xFF
        self.fields = []; self.geom = None
        for _ in range(nfields):
            n = b[p]; p += 1; name = b[p:p+2*n].decode('utf-16-le'); p += 2*n
            n = b[p]; p += 1; alias = b[p:p+2*n].decode('utf-16-le'); p += 2*n
            t = b[p]; p += 1
            f = {'name': name, 'alias': alias, 'type': t}
            if t == 6:
                p += 2; f['nullable'] = False
            elif t == 4:
                width, flag = struct.unpack_from('<IB', b, p); p += 5
                f['nullable'] = bool(flag & 1)
                if flag & 4:
                    dl, p = varuint(b, p); p += dl
            elif t == 7:
                p += 1; flag = b[p]; p += 1; f['nullable'] = bool(flag & 1)
                wl = struct.unpack_from('<H', b, p)[0]; p += 2
                f['wkt'] = b[p:p+wl].decode('utf-16-le'); p += wl
                mz = b[p]; p += 1
                hasM = bool(mz & 2); hasZ = bool(mz & 4)
                xo, yo, xys = struct.unpack_from('<ddd', b, p); p += 24
                g = {'xo': xo, 'yo': yo, 'xys': xys, 'hasM': hasM, 'hasZ': hasZ}
                if hasM: g['mo'], g['ms'] = struct.unpack_from('<dd', b, p); p += 16
                if hasZ: g['zo'], g['zs'] = struct.unpack_from('<dd', b, p); p += 16
                p += 8  # xy tolerance
                if hasM: p += 8
                if hasZ: p += 8
                g['extent'] = struct.unpack_from('<dddd', b, p); p += 32
                # spatial index grid: optional zmin/zmax/mmin/mmax then 0 byte, count, doubles
                while True:
                    if b[p] == 0 and 1 <= struct.unpack_from('<I', b, p+1)[0] <= 3:
                        cnt = struct.unpack_from('<I', b, p+1)[0]; p += 5 + 8*cnt; break
                    p += 8
                f['geom'] = g; self.geom = f
            elif t in (8, 12):
                p += 1; flag = b[p]; p += 1; f['nullable'] = bool(flag & 1)
            elif t in (10, 11):
                p += 1; flag = b[p]; p += 1; f['nullable'] = bool(flag & 1)
            elif t == 9:
                raise Exception('raster field unsupported')
            else:  # numeric / date types
                width = b[p]; flag = b[p+1]; dl = b[p+2]; p += 3 + dl
                f['nullable'] = bool(flag & 1)
            self.fields.append(f)
        self.nnullable = sum(1 for f in self.fields if f.get('nullable'))

    def offsets(self):
        x = self.x
        n1024, nfx, osz = struct.unpack_from('<iii', x, 4)
        p = 16
        for i in range(nfx):
            off = int.from_bytes(x[p:p+osz], 'little'); p += osz
            if off: yield off

    def rows(self):
        b = self.b
        for off in self.offsets():
            size = struct.unpack_from('<I', b, off)[0]
            p = off + 4
            nb = (self.nnullable + 7) // 8
            nullbits = b[p:p+nb]; p += nb
            ni = 0; rec = {}; geom = None
            for f in self.fields:
                t = f['type']
                if t == 6: continue
                if f.get('nullable'):
                    isnull = nullbits[ni >> 3] & (1 << (ni & 7)); ni += 1
                    if isnull: rec[f['name']] = None; continue
                if t == 0: v = struct.unpack_from('<h', b, p)[0]; p += 2
                elif t == 1: v = struct.unpack_from('<i', b, p)[0]; p += 4
                elif t == 2: v = struct.unpack_from('<f', b, p)[0]; p += 4
                elif t == 3: v = struct.unpack_from('<d', b, p)[0]; p += 8
                elif t == 5:
                    d = struct.unpack_from('<d', b, p)[0]; p += 8
                    try: v = (datetime.datetime(1899, 12, 30) + datetime.timedelta(days=d)).isoformat()
                    except Exception: v = None
                elif t == 13: v = struct.unpack_from('<q', b, p)[0]; p += 8
                elif t in (14, 15, 16): v = struct.unpack_from('<d', b, p)[0]; p += 8 + (2 if t == 16 else 0)
                elif t in (4, 12):
                    l, p = varuint(b, p); v = b[p:p+l].decode('utf-8', 'replace'); p += l
                elif t == 8:
                    l, p = varuint(b, p); v = None; p += l
                elif t in (10, 11):
                    v = b[p:p+16].hex(); p += 16
                elif t == 7:
                    l, p = varuint(b, p); geom = self.parse_geom(b[p:p+l]); p += l; continue
                rec[f['name']] = v
            yield rec, geom

    def parse_geom(self, g):
        G = self.geom['geom']; xo, yo, s = G['xo'], G['yo'], G['xys']
        p = 0
        gt, p = varuint(g, p)
        base = gt & 0xFF
        hasZ = base in (9, 11, 13, 15, 18, 20, 32) or bool(gt & 0x80000000)
        hasCurves = bool(gt & 0x20000000)
        if base in (1, 9, 11, 21, 52):
            x, p = varuint(g, p); y, p = varuint(g, p)
            if x == 0: return None
            return {'type': 'Point', 'coordinates': [(x-1)/s + xo, (y-1)/s + yo]}
        if base in (8, 18, 20, 28, 53):
            n, p = varuint(g, p)
            for _ in range(4): _, p = varuint(g, p)
            X = Y = 0; pts = []
            for _ in range(n):
                dx, p = varint(g, p); dy, p = varint(g, p); X += dx; Y += dy
                pts.append([X/s + xo, Y/s + yo])
            return {'type': 'MultiPoint', 'coordinates': pts}
        if base in (3, 5, 10, 13, 15, 19, 23, 25, 50, 51):
            n, p = varuint(g, p)
            if n == 0: return None
            nparts, p = varuint(g, p)
            if hasCurves: _, p = varuint(g, p)
            for _ in range(4): _, p = varuint(g, p)
            sizes = []
            for _ in range(nparts - 1):
                v, p = varuint(g, p); sizes.append(v)
            sizes.append(n - sum(sizes))
            X = Y = 0; parts = []
            for sz in sizes:
                ring = []
                for _ in range(sz):
                    dx, p = varint(g, p); dy, p = varint(g, p); X += dx; Y += dy
                    ring.append([round(X/s + xo, 3), round(Y/s + yo, 3)])
                parts.append(ring)
            poly = base in (5, 15, 19, 25, 51)
            if poly:
                return {'type': 'Polygon_rings', 'rings': parts}
            return {'type': 'MultiLineString', 'coordinates': parts} if len(parts) > 1 else {'type': 'LineString', 'coordinates': parts[0]}
        return None

def ring_area(r):
    a = 0
    for i in range(len(r) - 1):
        a += r[i][0]*r[i+1][1] - r[i+1][0]*r[i][1]
    return a / 2

def point_in_ring(pt, r):
    x, y = pt; inside = False; j = len(r) - 1
    for i in range(len(r)):
        xi, yi = r[i]; xj, yj = r[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-30) + xi: inside = not inside
        j = i
    return inside

def rings_to_geojson(rings):
    # Esri: outer rings clockwise (negative area in standard math orientation), holes counter-clockwise
    outers = [r for r in rings if ring_area(r) < 0]; holes = [r for r in rings if ring_area(r) >= 0]
    if not outers: outers, holes = holes, []
    polys = [[o[::-1]] for o in outers]  # GeoJSON: exterior CCW
    for h in holes:
        for poly, o in zip(polys, outers):
            if point_in_ring(h[0], o): poly.append(h); break
    if len(polys) == 1: return {'type': 'Polygon', 'coordinates': polys[0]}
    return {'type': 'MultiPolygon', 'coordinates': polys}

def catalog(gdb):
    t = Table(os.path.join(gdb, 'a00000001'))
    return [(i + 1, r['Name']) for i, (r, _) in enumerate(t.rows())]

if __name__ == '__main__':
    gdb = sys.argv[1]
    for i, name in catalog(gdb): print(i, hex(i), name)
