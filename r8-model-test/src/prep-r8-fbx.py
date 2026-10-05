"""r8.fbx (flattened by Three.js FBXLoader) -> cleaned, PBR glTF (uncompressed). Source FBX untouched."""
import pickle, numpy as np, json, struct, collections
parts = pickle.load(open('flat.pkl', 'rb'))
log = collections.Counter()

# ---- 1. per-material triangle soup, with UVs ------------------------------------------------
soup = collections.defaultdict(lambda: [[], [], []])  # material -> P, N, U (per corner)
for m, P, N, U in parts:
    s = soup[m['material']]; s[0].append(P.reshape(-1, 3, 3)); s[1].append(N.reshape(-1, 3, 3)); s[2].append(U.reshape(-1, 3, 2))
for k in soup: soup[k] = [np.concatenate(x).astype(np.float64) for x in soup[k]]

# ---- 2. centre: x/z centred, tyres on y = 0, front of the car towards +z --------------------
allp = np.concatenate([s[0].reshape(-1, 3) for s in soup.values()])
lo, hi = allp.min(0), allp.max(0)
shift = np.array([-(lo[0] + hi[0]) / 2, -lo[1], -(lo[2] + hi[2]) / 2])
print('size (m)', (hi - lo).round(4), 'shift', shift.round(4))

# ---- 3. remove coincident duplicate triangles (z-fighting) ----------------------------------
seen = set()
for k, (P, N, U) in soup.items():
    keep = []
    for t in range(len(P)):
        key = tuple(sorted(map(tuple, np.round(P[t], 5))))
        keep.append(key not in seen); seen.add(key)
    keep = np.array(keep); log['duplicate triangles removed'] += int((~keep).sum())
    # degenerate triangles
    area = np.linalg.norm(np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0]), axis=1)
    keep &= area > 1e-10; log['degenerate removed'] += int((area <= 1e-10).sum())
    soup[k] = [P[keep], N[keep], U[keep]]

# ---- 4. winding agrees with authored normals (fix inside-out triangles) --------------------
for k, (P, N, U) in soup.items():
    fn = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0])
    flip = (fn * N.mean(1)).sum(1) < 0
    log['inside-out triangles flipped'] += int(flip.sum())
    P[flip] = P[flip][:, [0, 2, 1]]; N[flip] = N[flip][:, [0, 2, 1]]; U[flip] = U[flip][:, [0, 2, 1]]

# ---- 5. smooth normals with a crease angle (keeps designed edges crisp), weld with UVs ----
CREASE = {'body_color': 40, 'glass_window': 40, 'tyre': 45, 'rims_1': 35, 'chrome': 35}
def build(P, N, U, crease):
    P = P + shift; n = len(P)
    k = np.round(P.reshape(-1, 3) / 1e-4).astype(np.int64); _, vid = np.unique(k, axis=0, return_inverse=True); vid = vid.reshape(n, 3)
    fn = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0]); area = np.linalg.norm(fn, axis=1); fnu = fn / area[:, None]
    cosc = np.cos(np.radians(crease)); cv = vid.ravel(); cf = np.repeat(np.arange(n), 3)
    order = np.argsort(cv, kind='stable'); scv = cv[order]; scf = cf[order]
    starts = np.r_[0, np.flatnonzero(np.diff(scv)) + 1, len(scv)]; NN = np.zeros((n * 3, 3))
    for s, e in zip(starts[:-1], starts[1:]):
        F = fnu[scf[s:e]]; W = area[scf[s:e]][:, None] * F
        NN[order[s:e]] = ((F @ F.T) >= cosc) @ W
    NN /= np.linalg.norm(NN, axis=1, keepdims=True) + 1e-15
    uv = U.reshape(-1, 2)
    key = np.c_[cv, np.round(NN * 1024).astype(np.int64), np.round(uv * 4096).astype(np.int64)]
    _, first, inv = np.unique(key, axis=0, return_index=True, return_inverse=True)
    return P.reshape(-1, 3)[first].astype(np.float32), NN[first].astype(np.float32), uv[first].astype(np.float32), inv.ravel().astype(np.uint32)

# ---- 6. realistic PBR materials (glTF, linear values) -------------------------------------
def srgb(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
def M(name, color, metal, rough, alpha=None, ext=None, emissive=None, double=True):
    m = {'name': name, 'pbrMetallicRoughness': {'baseColorFactor': [round(v, 4) for v in color] + [1 if alpha is None else alpha], 'metallicFactor': metal, 'roughnessFactor': rough}, 'doubleSided': double}
    if alpha is not None: m['alphaMode'] = 'BLEND'
    if emissive: m['emissiveFactor'] = emissive
    if ext: m['extensions'] = ext
    return m
CC = lambda f, r: {'KHR_materials_clearcoat': {'clearcoatFactor': f, 'clearcoatRoughnessFactor': r}}
GLASS = lambda ior=1.52: {'KHR_materials_transmission': {'transmissionFactor': 1.0}, 'KHR_materials_ior': {'ior': ior}, 'KHR_materials_volume': {'thicknessFactor': 0.005}}
MAT = {
    # painted body: automotive paint under a gloss PPF clearcoat (the studio recolours only this)
    'body_color':       M('body_color', srgb('c80b2c'), 0.0, 0.3, ext=CC(1.0, 0.012)),
    'glass_window':     M('glass_window', [0.035, 0.042, 0.048], 0.0, 0.015, ext=GLASS()),
    'glass_lamp':       M('glass_lamp', [0.92, 0.94, 0.96], 0.0, 0.01, ext=GLASS(1.49)),
    'glass_projector':  M('glass_projector', [0.75, 0.78, 0.8], 0.0, 0.03, ext=GLASS(1.5)),
    'light':            M('light', [0.8, 0.82, 0.85], 0.95, 0.12),
    'tail_light_red_1': M('tail_light_red_1', srgb('ff0000'), 0.0, 0.25, emissive=[0.25, 0.0, 0.0], ext=CC(1.0, 0.04)),
    'tail_light_red_2': M('tail_light_red_2', srgb('b10000'), 0.1, 0.2, emissive=[0.18, 0.0, 0.0], ext=CC(1.0, 0.04)),
    'tail_light_red_3': M('tail_light_red_3', srgb('971818'), 0.1, 0.22, emissive=[0.12, 0.0, 0.0], ext=CC(1.0, 0.04)),
    'logo_red':         M('logo_red', srgb('d01010'), 0.0, 0.3, ext=CC(1.0, 0.05)),
    'tyre':             M('tyre', [0.016, 0.016, 0.016], 0.0, 0.88, ext={'KHR_materials_specular': {'specularFactor': 0.35}}),
    'rims_1':           M('rims_1', [0.6, 0.61, 0.63], 1.0, 0.22, ext=CC(0.6, 0.08)),
    'chrome':           M('chrome', [0.92, 0.93, 0.94], 1.0, 0.05),
    'Aluminium_1':      M('Aluminium_1', [0.62, 0.63, 0.64], 1.0, 0.3),
    'Aluminum_2':       M('Aluminum_2', [0.35, 0.36, 0.37], 1.0, 0.38),
    'metal_1':          M('metal_1', [0.27, 0.27, 0.28], 0.9, 0.4),
    'metal_2':          M('metal_2', [0.07, 0.07, 0.075], 0.85, 0.5),
    'black_gloss':      M('black_gloss', [0.012, 0.012, 0.014], 0.0, 0.2, ext=CC(0.7, 0.08)),
    'black_matt':       M('black_matt', [0.016, 0.016, 0.017], 0.0, 0.85),
    'grille':           M('grille', [0.008, 0.008, 0.009], 0.1, 0.6),
    'trim':             M('trim', [0.014, 0.014, 0.016], 0.0, 0.32, ext=CC(0.8, 0.06)),
    'interior_1':       M('interior_1', [0.008, 0.008, 0.008], 0.0, 0.66),
    'interior_2':       M('interior_2', srgb('f2f2ea'), 0.0, 0.6, ext={'KHR_materials_sheen': {'sheenColorFactor': [0.5, 0.5, 0.5], 'sheenRoughnessFactor': 0.6}}),
    'interior_roof':    M('interior_roof', srgb('252324'), 0.0, 0.92),
    'FrontColor':       M('FrontColor', [0.85, 0.85, 0.85], 0.0, 0.45),
}
# logical groups (scene hierarchy); every material stays its own mesh
GROUPS = {'Body': ['body_color'],
          'Glass': ['glass_window'],
          'Lights': ['glass_lamp', 'glass_projector', 'light', 'tail_light_red_1', 'tail_light_red_2', 'tail_light_red_3'],
          'Wheels': ['rims_1', 'tyre'],
          'Trim': ['chrome', 'black_gloss', 'black_matt', 'grille', 'trim', 'logo_red', 'FrontColor'],
          'Interior': ['interior_1', 'interior_2', 'interior_roof'],
          'Mechanical': ['Aluminium_1', 'Aluminum_2', 'metal_1', 'metal_2']}
assert sorted(sum(GROUPS.values(), [])) == sorted(soup.keys()), set(soup) ^ set(sum(GROUPS.values(), []))

gl = {'asset': {'version': '2.0', 'generator': 'REK PPF Color Studio prep (from r8.fbx via Three.js FBXLoader)'},
      'extensionsUsed': sorted({e for m in MAT.values() for e in m.get('extensions', {})}),
      'scene': 0, 'scenes': [{'name': 'R8', 'nodes': [0]}], 'nodes': [{'name': 'R8', 'children': []}],
      'meshes': [], 'materials': [], 'accessors': [], 'bufferViews': [], 'buffers': []}
blob = bytearray()
def add(arr, target, comp, typ, mm=False):
    while len(blob) % 4: blob.append(0)
    o = len(blob); blob.extend(arr.tobytes())
    gl['bufferViews'].append({'buffer': 0, 'byteOffset': o, 'byteLength': arr.nbytes, 'target': target})
    a = {'bufferView': len(gl['bufferViews']) - 1, 'componentType': comp, 'count': len(arr), 'type': typ}
    if mm: a['min'] = arr.min(0).tolist(); a['max'] = arr.max(0).tolist()
    gl['accessors'].append(a); return len(gl['accessors']) - 1
stats = {}
for gname, mats in GROUPS.items():
    gl['nodes'].append({'name': gname, 'children': []}); gi = len(gl['nodes']) - 1; gl['nodes'][0]['children'].append(gi)
    for mname in mats:
        P, N, U = soup[mname]
        pos, nor, uv, idx = build(P, N, U, CREASE.get(mname, 30))
        gl['materials'].append(MAT[mname])
        prim = {'attributes': {'POSITION': add(pos, 34962, 5126, 'VEC3', True), 'NORMAL': add(nor, 34962, 5126, 'VEC3'), 'TEXCOORD_0': add(uv, 34962, 5126, 'VEC2')},
                'indices': add(idx, 34963, 5125, 'SCALAR'), 'material': len(gl['materials']) - 1}
        gl['meshes'].append({'name': mname, 'primitives': [prim]})
        gl['nodes'].append({'name': mname, 'mesh': len(gl['meshes']) - 1}); gl['nodes'][gi]['children'].append(len(gl['nodes']) - 1)
        stats[mname] = (len(idx) // 3, len(pos))
while len(blob) % 4: blob.append(0)
gl['buffers'].append({'byteLength': len(blob)})
js = json.dumps(gl, separators=(',', ':')).encode(); js += b' ' * ((4 - len(js) % 4) % 4)
open('r8-fbx-clean-raw.glb', 'wb').write(struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(js) + 8 + len(blob)) + struct.pack('<I4s', len(js), b'JSON') + js + struct.pack('<I4s', len(blob), b'BIN\x00') + bytes(blob))
for k, v in log.items(): print(k, v)
print('meshes', len(stats), 'triangles', sum(v[0] for v in stats.values()), 'vertices', sum(v[1] for v in stats.values()))
json.dump(stats, open('stats.json', 'w'))
