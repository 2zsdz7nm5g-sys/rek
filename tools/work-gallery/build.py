"""REK work gallery: photo classification -> projects.json (source of truth for [rek_work_gallery]).

Every photo from the client's ZIP (67 JPEGs, no duplicates) is listed exactly once.
Service is inferred from what the photos show (the photos themselves do not state
the job): the matte vehicle -> PPF (matte), gloss exteriors -> Nano Ceramic, cabin
photos -> Interior detailing. Same vehicle = one project; exterior and cabin of
the same vehicle are separate projects under their own services.
Run: python3 build.py <dir with dims.json>  (writes ../../wp-theme/rek-proffset/assets/work-gallery/projects.json)
"""
import json, sys, os

SERVICES = [
    {"key": "ppf", "ar": "PPF", "en": "PPF"},
    {"key": "ceramic", "ar": "نانو سيراميك", "en": "Nano Ceramic"},
    {"key": "polish", "ar": "تلميع", "en": "Polish"},
    {"key": "interior", "ar": "العناية الداخلية · حمام داخلي", "en": "Interior detailing"},
    {"key": "windshield", "ar": "حماية الزجاج الأمامي", "en": "Windshield protection"},
    {"key": "pdr", "ar": "PDR", "en": "PDR"},
    {"key": "other", "ar": "أخرى", "en": "Other"},
]
FAMILIES = {
    "land-cruiser": {"ar": "تويوتا لاند كروزر", "en": "Toyota Land Cruiser"},
    "range-rover": {"ar": "رينج روفر", "en": "Range Rover"},
    "g-class": {"ar": "مرسيدس G-Class", "en": "Mercedes G-Class"},
    "bmw-x7": {"ar": "BMW X7", "en": "BMW X7"},
    "defender": {"ar": "لاند روفر ديفندر", "en": "Land Rover Defender"},
    "rox": {"ar": "ROX 01", "en": "ROX 01"},
}
G = {"ar": "لامع", "en": "Gloss"}
M = {"ar": "مطفي", "en": "Matte"}
# (id, service, family, model, colour, finish, photos-in-display-order)
P = [
    ("lc-matte-black", "ppf", "land-cruiser", ("لاند كروزر", "Land Cruiser"), ("أسود", "Black"), M, [2, 4, 3]),
    ("rr-black", "ceramic", "range-rover", ("رينج روفر", "Range Rover"), ("أسود", "Black"), G, [29, 28, 30, 32, 33, 31, 34, 35, 36, 37]),
    ("rrs-red", "ceramic", "range-rover", ("رينج روفر سبورت", "Range Rover Sport"), ("أحمر بسقف أسود", "Red, black roof"), G, [12, 14, 13]),
    ("rrs-svr-blue", "ceramic", "range-rover", ("رينج روفر سبورت SVR", "Range Rover Sport SVR"), ("أزرق بغطاء محرك وسقف كاربون", "Blue, carbon bonnet and roof"), G, [67, 60, 65, 61, 62, 64, 63, 68]),
    ("g63-grey", "ceramic", "g-class", ("مرسيدس AMG G 63", "Mercedes-AMG G 63"), ("رمادي", "Grey"), G, [19, 18, 20, 21, 22, 23]),
    ("x7-blue", "ceramic", "bmw-x7", ("BMW X7", "BMW X7"), ("أزرق", "Blue"), G, [6, 10, 5, 7, 8, 9]),
    ("defender-bronze", "ceramic", "defender", ("لاند روفر ديفندر", "Land Rover Defender"), ("برونزي معدني", "Metallic bronze"), G, [42, 41, 43, 46, 45, 44, 47]),
    ("rox-white", "ceramic", "rox", ("ROX 01", "ROX 01"), ("أبيض بسقف أسود", "White, black roof"), G, [51, 50, 52, 53, 58, 59, 54, 55]),
    # cabins (interior detailing), one project per vehicle
    ("rr-black-cabin", "interior", "range-rover", ("رينج روفر", "Range Rover"), ("مقصورة عنابية", "Burgundy cabin"), None, [38, 39, 40]),
    ("rrs-red-cabin", "interior", "range-rover", ("رينج روفر سبورت", "Range Rover Sport"), ("مقصورة حمراء وسوداء", "Red and black cabin"), None, [15, 16, 17]),
    ("rrs-svr-blue-cabin", "interior", "range-rover", ("رينج روفر سبورت SVR", "Range Rover Sport SVR"), ("مقصورة بيضاء وسوداء", "White and black cabin"), None, [66]),
    ("g63-grey-cabin", "interior", "g-class", ("مرسيدس AMG G 63", "Mercedes-AMG G 63"), ("مقصورة حمراء", "Red cabin"), None, [24, 25, 26, 27]),
    ("x7-blue-cabin", "interior", "bmw-x7", ("BMW X7", "BMW X7"), ("مقصورة بنية", "Cognac cabin"), None, [11]),
    ("defender-bronze-cabin", "interior", "defender", ("لاند روفر ديفندر", "Land Rover Defender"), ("مقصورة بنية فاتحة", "Tan cabin"), None, [48, 49]),
    ("rox-white-cabin", "interior", "rox", ("ROX 01", "ROX 01"), ("مقصورة برتقالية", "Orange cabin"), None, [56, 57]),
]
# exterior colour of the vehicle a cabin belongs to (so visitors can match the cabin to the car)
CABIN_OF = {"rr-black-cabin": "rr-black", "rrs-red-cabin": "rrs-red", "rrs-svr-blue-cabin": "rrs-svr-blue", "g63-grey-cabin": "g63-grey",
            "x7-blue-cabin": "x7-blue", "defender-bronze-cabin": "defender-bronze", "rox-white-cabin": "rox-white"}

def main(src):
    dims = json.load(open(os.path.join(src, 'dims.json')))
    used = [n for p in P for n in p[6]]
    assert len(used) == len(set(used)) == 67, (len(used), len(set(used)))
    assert sorted(used) == sorted(int(k[1:]) for k in dims), 'every photo exactly once'
    byid = {p[0]: p for p in P}
    projects = []
    for pid, svc, fam, model, colour, finish, photos in P:
        ph = []
        for n in photos:
            W, H = dims['p%03d' % n]
            ph.append({"f": 'p%03d' % n, "w": W, "h": H, "s": [min(480, W), min(960, W), min(1600, W)]})
        item = {"id": pid, "service": svc, "family": fam, "model": {"ar": model[0], "en": model[1]},
                "colour": {"ar": colour[0], "en": colour[1]}, "finish": finish, "photos": ph}
        if pid in CABIN_OF:
            ext = byid[CABIN_OF[pid]]
            item["vehicle"] = {"ar": ext[4][0] + ' ' + ext[5]['ar'], "en": ext[5]['en'] + ' ' + ext[4][1].lower()}
        projects.append(item)
    out = {"services": SERVICES, "families": FAMILIES, "projects": projects}
    dst = os.path.join(os.path.dirname(__file__), '../../wp-theme/rek-proffset/assets/work-gallery/projects.json')
    json.dump(out, open(dst, 'w'), ensure_ascii=False, separators=(',', ':'))
    print('projects', len(projects), 'photos', len(used), 'bytes', os.path.getsize(dst))

if __name__ == '__main__':
    main(sys.argv[1])
