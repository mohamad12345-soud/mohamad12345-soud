"""Minimal 7z extractor (LZMA/LZMA2/BCJ/copy) using only the stdlib."""
import struct, lzma, sys, os

class R:
    def __init__(s, b): s.b = b; s.p = 0
    def byte(s): v = s.b[s.p]; s.p += 1; return v
    def bytes(s, n): v = s.b[s.p:s.p+n]; s.p += n; return v
    def num(s):
        first = s.byte(); mask = 0x80; val = 0
        for i in range(8):
            if first & mask == 0:
                hi = first & (mask - 1)
                return val | (hi << (8 * i))
            val |= s.byte() << (8 * i); mask >>= 1
        return val
    def u32(s): return struct.unpack('<I', s.bytes(4))[0]
    def u64(s): return struct.unpack('<Q', s.bytes(8))[0]

def bits(r, n):
    out = []; mask = 0; b = 0
    for i in range(n):
        if mask == 0: b = r.byte(); mask = 0x80
        out.append(bool(b & mask)); mask >>= 1
    return out

def defined_bits(r, n):
    alldef = r.byte()
    return [True]*n if alldef else bits(r, n)

def read_digests(r, n):
    d = defined_bits(r, n)
    return [r.u32() if x else None for x in d]

def pack_info(r):
    pos = r.num(); n = r.num(); sizes = []
    while True:
        t = r.byte()
        if t == 0: break
        if t == 9: sizes = [r.num() for _ in range(n)]
        elif t == 10: read_digests(r, n)
    return pos, sizes

def folder(r):
    nc = r.num(); coders = []; tin = tout = 0
    for _ in range(nc):
        flag = r.byte(); idsize = flag & 0xF; cid = r.bytes(idsize)
        if flag & 0x10: ni = r.num(); no = r.num()
        else: ni = no = 1
        props = r.bytes(r.num()) if flag & 0x20 else b''
        coders.append((cid, ni, no, props)); tin += ni; tout += no
    bonds = [(r.num(), r.num()) for _ in range(tout - 1)]
    npacked = tin - len(bonds)
    packed = [r.num() for _ in range(npacked)] if npacked > 1 else None
    return {'coders': coders, 'bonds': bonds, 'packed': packed, 'tout': tout}

def unpack_info(r):
    assert r.byte() == 0x0B
    nf = r.num(); assert r.byte() == 0
    folders = [folder(r) for _ in range(nf)]
    assert r.byte() == 0x0C
    for f in folders: f['sizes'] = [r.num() for _ in range(f['tout'])]
    while True:
        t = r.byte()
        if t == 0: break
        if t == 10: read_digests(r, nf)
    return folders

def substreams(r, folders):
    nums = [1]*len(folders); sizes = []
    t = r.byte()
    if t == 0x0D:
        nums = [r.num() for _ in folders]; t = r.byte()
    have_sizes = (t == 9)
    for f, n in zip(folders, nums):
        if n == 0: continue
        total = unpack_size(f); s = 0
        for _ in range(n - 1):
            if have_sizes: v = r.num(); sizes.append(v); s += v
        sizes.append(total - s)
    if have_sizes: t = r.byte()
    while t != 0:
        if t == 10:
            nd = sum(nums)  # approximate: read digests for all
            read_digests(r, nd)
        t = r.byte()
    return nums, sizes

def unpack_size(f):
    bound_out = {o for _, o in f['bonds']}
    for i in range(f['tout']):
        if i not in bound_out: return f['sizes'][i]

def streams_info(r):
    pi = folders = ss = None
    while True:
        t = r.byte()
        if t == 0: break
        if t == 6: pi = pack_info(r)
        elif t == 7: folders = unpack_info(r)
        elif t == 8: ss = substreams(r, folders)
    return pi, folders, ss

def decode_folder(data, packpos, f, packsizes):
    # support single chain: [BCJ ->] LZMA/LZMA2 or copy
    coders = f['coders']
    filters = []
    # order: coder 0 is last applied when decoding? chain given as bonds; build simple chain
    main = None; pre = []
    for cid, ni, no, props in coders:
        if cid == b'\x21': main = {'id': lzma.FILTER_LZMA2, 'dict_size': lzma._decode_filter_properties(lzma.FILTER_LZMA2, props)['dict_size']}
        elif cid == b'\x03\x01\x01': main = lzma._decode_filter_properties(lzma.FILTER_LZMA1, props); main['id'] = lzma.FILTER_LZMA1
        elif cid == b'\x03\x03\x01\x03': pre.append({'id': lzma.FILTER_X86})
        elif cid == b'\x00': main = 'copy'
        else: raise Exception('unsupported coder %s' % cid.hex())
    raw = data[packpos:packpos+packsizes[0]]
    if main == 'copy': return raw
    out = lzma.LZMADecompressor(lzma.FORMAT_RAW, filters=pre + [main]).decompress(raw)
    return out[:unpack_size(f)]

def extract(path, outdir):
    data = open(path, 'rb').read()
    nho, nhs, _ = struct.unpack('<QQI', data[12:32])
    hdr = data[32+nho:32+nho+nhs]; base = 32
    r = R(hdr); t = r.byte()
    while t == 0x17:
        (pos, sizes), folders, _ = streams_info(r)
        hdr = decode_folder(data, base + pos, folders[0], sizes)
        r = R(hdr); t = r.byte()
    assert t == 1
    t = r.byte(); main = None; names = []; empty = []; emptyfile = []
    if t == 2:
        while r.byte() != 0: pass
        t = r.byte()
    if t == 3:
        raise Exception('additional streams unsupported')
    if t == 4:
        main = streams_info(r); t = r.byte()
    if t == 5:
        nfiles = r.num()
        while True:
            pt = r.byte()
            if pt == 0: break
            size = r.num(); body = R(r.bytes(size))
            if pt == 0x11:
                body.byte()
                raw = body.b[1:]
                names = raw.decode('utf-16-le').split('\x00')[:nfiles]
            elif pt == 0x0E: empty = bits(body, nfiles)
            elif pt == 0x0F: emptyfile = bits(body, empty.count(True))
    (pos, packsizes), folders, (nums, sizes) = main
    # compute pack offsets per folder
    offs = []; p = base + pos; pi = 0
    for f in folders:
        npk = 1 if f['packed'] is None else len(f['packed'])
        offs.append((p, packsizes[pi:pi+npk])); p += sum(packsizes[pi:pi+npk]); pi += npk
    fi = 0; si = 0; streams = []
    for f, n, (o, ps) in zip(folders, nums, offs):
        buf = decode_folder(data, o, f, ps); q = 0
        for _ in range(n):
            streams.append(buf[q:q+sizes[si]]); q += sizes[si]; si += 1
    k = 0; e = 0
    for i, name in enumerate(names):
        path2 = os.path.join(outdir, name.replace('\\', '/'))
        if empty and empty[i]:
            isfile = emptyfile[e] if emptyfile else False; e += 1
            if isfile:
                os.makedirs(os.path.dirname(path2) or '.', exist_ok=True); open(path2, 'wb').close()
            else: os.makedirs(path2, exist_ok=True)
            continue
        os.makedirs(os.path.dirname(path2) or '.', exist_ok=True)
        open(path2, 'wb').write(streams[k]); k += 1
    return names

if __name__ == '__main__':
    for n in extract(sys.argv[1], sys.argv[2]): print(n)
