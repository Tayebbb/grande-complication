"""Author the full Perpetual Calendar Chronograph sculpt spec.

Loads the scaffold object-sculpt-spec.json and replaces the placeholder
sections with the observed, componentized watch reconstruction.
World units: 1 unit = 10 mm. Case diameter D = 4.10 (41 mm).
Frame: dial faces +Z, +Y toward 12 o'clock (upper strap), +X toward 3 o'clock (crown).
"""
import json, sys, copy

SPEC = sys.argv[1] if len(sys.argv) > 1 else "object-sculpt-spec.json"

with open(SPEC, "r", encoding="utf-8") as f:
    spec = json.load(f)

D = 4.10
EV = ["full-object"]
EV_DIAL = ["full-object", "zone-dial-center"]
EV_FLANK = ["full-object", "zone-right-flank"]
EV_STRAP = ["full-object", "zone-strap-bottom"]


def comp(id, name, level, role, primitive, topo, topo_why, parent, *,
         importance=0.8, confidence=0.85, mat="mat-case-polished", mats=None,
         dims=(1, 1, 1), pos=(0, 0, 0), rot=(0, 0, 0),
         attach=None, pivot_pos=(0, 0, 0), pivot_axis=(0, 0, 1),
         anim_role="static-detail", detach=True, collider="box",
         geo_intent="", edge=("bevel", 0.015, 2), uv="generated procedural coordinates",
         features=None, surface=None, ev=EV, details=None, tier="form-refinement",
         sockets=None, seams=None):
    c = {
        "id": id, "name": name, "level": level, "role": role,
        "importance": importance, "confidence": confidence,
        "primitive": primitive, "topologyClass": topo, "topologyRationale": topo_why,
        "geometryDescriptor": {
            "topologyIntent": geo_intent or f"{primitive} construction for {name}",
            "edgeTreatment": {"type": edge[0], "bevelRadius": edge[1], "segments": edge[2]},
            "deformationStack": [],
            "uvStrategy": uv,
            "normalStrategy": "smooth vertex normals with hard creases at facet boundaries",
        },
        "parent": parent,
        "attachment": attach,
        "dimensions": {"width": dims[0], "height": dims[1], "depth": dims[2],
                       "units": "world (1 unit = 10 mm)", "confidence": confidence},
        "transform": {"position": list(pos), "rotation": list(rot), "scale": [1, 1, 1]},
        "actionProfile": {
            "animationRole": anim_role,
            "pivot": {"mode": "custom", "localPosition": list(pivot_pos),
                      "axis": list(pivot_axis), "confidence": 0.9},
            "transformChannels": {"translate": True, "rotate": True, "scale": False,
                                  "bend": False, "twist": False, "detach": detach,
                                  "visibility": True, "materialState": True},
            "sockets": sockets or [],
            "collider": {"type": collider, "offset": [0, 0, 0], "scale": [1, 1, 1],
                         "isTrigger": False, "notes": "simplified proxy for hover picking"},
            "constraints": [],
            "destruction": {"breakable": False, "fractureGroup": id, "seamRefs": seams or [],
                            "detachableFragments": [], "breakImpulse": 0.0,
                            "debrisMaterial": mat},
        },
        "material": mat,
        "materialLayers": mats or [mat],
        "deformations": [],
        "joints": [],
        "seams": seams or [],
        "localFeatures": features or [],
        "surfaceDetail": surface or {
            "macroRoughness": 0.2, "microRoughness": 0.08, "bumpAmplitude": 0.0,
            "normalPattern": "none", "displacementPattern": "none",
            "occlusionPattern": "crevice AO at seams", "edgeWearPattern": "none",
            "notes": ""},
        "evidenceRefs": ev,
        "details": details or [],
        "fidelityTier": tier,
    }
    return c


def att(socket, start, end, contact, embed, gap=0.01, overlap=None):
    a = {"parentSocket": socket, "localStart": list(start), "localEnd": list(end),
         "contactType": contact, "embedDepth": embed, "gapTolerance": gap}
    if overlap is not None:
        a["overlap"] = overlap
    return a


def feat(id, kind, desc, effect, ev):
    return {"id": id, "kind": kind, "description": desc,
            "geometryEffect": effect, "evidenceRefs": ev, "confidence": 0.9}


tree = []

# ---------- macro ----------
tree.append(comp(
    "root", "Perpetual Calendar Chronograph", "macro", "body", "box", "assembled-solid",
    "Logical bounding volume for the full watch stack (case cylinder + strap slabs); children carry real geometry.",
    None, importance=1.0, confidence=0.95, dims=(4.6, 12.0, 1.9),
    anim_role="root", detach=False,
    geo_intent="empty pivot group; no rendered geometry of its own", tier="blockout"))

tree.append(comp(
    "strap-assembly", "Strap Assembly", "macro", "assembly-group", "box", "assembled-solid",
    "Grouping pivot for the two strap halves and their stitching; bounding slab volume.",
    "root", importance=0.85, dims=(2.24, 12.0, 0.9), pos=(0, 0, -0.15),
    attach=att("root-core", (0, 1.95, 0), (0, 4.6, -0.85), "socket", 0.15),
    anim_role="assembly", detach=False, mat="mat-strap", ev=EV_STRAP, tier="blockout"))

tree.append(comp(
    "case-assembly", "Case Assembly", "macro", "assembly-group", "cylinder", "assembled-solid",
    "Grouping pivot for case band, bezel, crystal, back, lugs, crown, pushers; cylindrical envelope.",
    "root", importance=1.0, confidence=0.95, dims=(4.6, 4.6, 1.7),
    attach=att("root-core", (0, 0, 0), (0, 0, 0), "socket", 0.2),
    anim_role="assembly", detach=False, tier="blockout"))

tree.append(comp(
    "dial-assembly", "Dial Assembly", "macro", "assembly-group", "cylinder", "assembled-solid",
    "Grouping pivot for dial plate, rings, markers, apertures, subdials, moonphase.",
    "root", importance=1.0, confidence=0.95, dims=(3.4, 3.4, 0.35), pos=(0, 0, 0.28),
    attach=att("case-bore", (0, 0, 0.24), (0, 0, 0.34), "socket", 0.05),
    anim_role="assembly", detach=False, mat="mat-dial-plate", ev=EV_DIAL, tier="blockout"))

tree.append(comp(
    "hand-assembly", "Hand Assembly", "macro", "assembly-group", "cylinder", "assembled-solid",
    "Grouping pivot for the central hand stack and subdial hands around the cannon pinion.",
    "root", importance=0.95, confidence=0.9, dims=(3.2, 3.2, 0.25), pos=(0, 0, 0.40),
    attach=att("dial-center-pinion", (0, 0, 0.34), (0, 0, 0.50), "socket", 0.04),
    anim_role="assembly", detach=False, mat="mat-hands-polished", ev=EV_DIAL, tier="blockout"))

# ---------- strap ----------
strap_surface = {
    "macroRoughness": 0.78, "microRoughness": 0.35, "bumpAmplitude": 0.06,
    "normalPattern": "diagonal chevron braid, ~9 columns across width",
    "displacementPattern": "braid ridges as real geometry ripple (silhouette-visible at edges)",
    "occlusionPattern": "deep AO between braid cords",
    "edgeWearPattern": "none (pristine product shot)",
    "notes": "CORRECTED from zone r2c1: chunky braided textile, not embossed leather"}

tree.append(comp(
    "strap-upper", "Upper Strap", "meso", "strap", "curve-sweep", "continuous-sculpt",
    "Curved tapered slab following a wrist-curve path; smooth continuous volume, never a straight box.",
    "strap-assembly", importance=0.9, mat="mat-strap",
    dims=(2.24, 2.7, 0.30), pos=(0, 3.2, -0.28),
    attach=att("lug-channel-top", (0, 1.95, -0.02), (0, 4.55, -0.95), "socket", 0.12),
    pivot_pos=(0, 1.95, -0.02), pivot_axis=(1, 0, 0), anim_role="detachable-strap",
    geo_intent="sweep a rounded-rectangle cross-section along a curve bending toward -Z; slight width taper away from lugs; rolled raised edges",
    features=[feat("strap-weave-upper", "surface-relief",
                   "chevron braid columns as displaced geometry rows", "displacement", EV_STRAP)],
    surface=strap_surface, ev=EV_STRAP))

tree.append(comp(
    "strap-lower", "Lower Strap", "meso", "strap", "curve-sweep", "continuous-sculpt",
    "Mirror of upper strap along -Y with identical cross-section and curve language.",
    "strap-assembly", importance=0.9, mat="mat-strap",
    dims=(2.24, 2.9, 0.30), pos=(0, -3.3, -0.30),
    attach=att("lug-channel-bottom", (0, -1.95, -0.02), (0, -4.7, -1.0), "socket", 0.12),
    pivot_pos=(0, -1.95, -0.02), pivot_axis=(1, 0, 0), anim_role="detachable-strap",
    geo_intent="mirrored curve-sweep of strap-upper",
    features=[feat("strap-weave-lower", "surface-relief",
                   "chevron braid columns as displaced geometry rows", "displacement", EV_STRAP)],
    surface=strap_surface, ev=EV_STRAP))

stitch_surface = {
    "macroRoughness": 0.6, "microRoughness": 0.3, "bumpAmplitude": 0.02,
    "normalPattern": "twisted-cord surface", "displacementPattern": "none",
    "occlusionPattern": "contact AO in stitch groove", "edgeWearPattern": "none",
    "notes": "rope-style twisted stitches, recessed groove near strap edge"}

for side, parent in (("upper", "strap-upper"), ("lower", "strap-lower")):
    sy = 1 if side == "upper" else -1
    tree.append(comp(
        f"stitch-{side}", f"{side.title()} Stitching", "micro", "stitching",
        "instanced-cluster", "fiber-strand",
        "Repeated short twisted cord segments along both strap edges; thin elongated repeated strands.",
        parent, importance=0.55, confidence=0.9, mat="mat-stitch",
        dims=(0.06, 2.5, 0.06), pos=(0, sy * 3.25, -0.10),
        attach=att(f"strap-{side}-edge-grooves", (-1.03, sy * 2.1, 0.08), (1.03, sy * 4.4, -0.6),
                   "embed", 0.02),
        pivot_pos=(0, sy * 1.95, 0), anim_role="static-detail", collider="capsule",
        geo_intent="instance ~7 visible twisted capsule segments per edge in a recessed groove inset 0.09 from each strap edge",
        features=[feat("strap-stitching", "repetition",
                       "twisted ivory stitches, ~7 per edge per segment (det-15)", "geometry", EV_STRAP)],
        surface=stitch_surface, ev=EV_STRAP, details=["det-15"]))

# ---------- case ----------
polished_surface = {
    "macroRoughness": 0.14, "microRoughness": 0.05, "bumpAmplitude": 0.0,
    "normalPattern": "none (mirror polish)", "displacementPattern": "none",
    "occlusionPattern": "seam AO where bezel meets band", "edgeWearPattern": "none",
    "notes": "platinum mirror polish; curvature read via env reflections"}

tree.append(comp(
    "case-main", "Main Case Band", "meso", "case-body", "lathe", "continuous-sculpt",
    "Revolved profile: convex polished flank swelling to max radius mid-band; single smooth revolution surface.",
    "case-assembly", importance=1.0, confidence=0.9,
    dims=(4.1, 4.1, 0.76), pos=(0, 0, -0.04),
    attach=att("case-assembly-core", (0, 0, -0.42), (0, 0, 0.34), "butt", 0.05),
    anim_role="anchor", detach=False, collider="cylinder",
    geo_intent="lathe profile from r1.86@z-0.42 bulging to r2.05@z0.0 to r1.95@z0.34; 96 radial segments",
    sockets=[
        {"id": "crown-socket", "position": [2.05, 0, -0.02], "axis": [1, 0, 0]},
        {"id": "pusher-socket-upper", "position": [1.78, 1.02, -0.02], "axis": [0.866, 0.5, 0]},
        {"id": "pusher-socket-lower", "position": [1.78, -1.02, -0.02], "axis": [0.866, -0.5, 0]},
        {"id": "lug-roots", "position": [0, 0, 0], "axis": [0, 1, 0]},
        {"id": "case-front-rim", "position": [0, 0, 0.34], "axis": [0, 0, 1]},
        {"id": "case-back-rim", "position": [0, 0, -0.42], "axis": [0, 0, -1]}],
    surface=polished_surface, ev=EV_FLANK))

tree.append(comp(
    "bezel", "Bezel", "meso", "case-front-ring", "lathe", "continuous-sculpt",
    "Revolved concave ring profile sloping inward from case rim to crystal bore.",
    "case-assembly", importance=0.95, confidence=0.9, dims=(4.0, 4.0, 0.28), pos=(0, 0, 0.44),
    attach=att("case-front-rim", (0, 0, 0.30), (0, 0, 0.58), "overlap", 0.06, overlap=0.06),
    anim_role="explode-layer", collider="cylinder",
    geo_intent="lathe: outer r2.00@z0.30 -> concave slope -> inner r1.74@z0.56; polished",
    features=[feat("bezel", "case-detail",
                   "concave polished slope + step to crystal bore (det-13)", "geometry", EV_FLANK)],
    surface=polished_surface, ev=EV_FLANK, details=["det-13"]))

tree.append(comp(
    "crystal", "Sapphire Crystal", "meso", "glazing", "lathe", "continuous-sculpt",
    "Revolved shallow dome (boxed glass): vertical wall rising from bezel bore then doming to apex.",
    "case-assembly", importance=0.9, confidence=0.8, mat="mat-crystal",
    dims=(3.44, 3.44, 0.42), pos=(0, 0, 0.62),
    attach=att("bezel-bore", (0, 0, 0.50), (0, 0, 0.86), "socket", 0.08),
    anim_role="explode-layer", collider="cylinder",
    geo_intent="lathe: r1.72 wall z0.50->0.68 then dome to apex r0@z0.86; transmission material; dome height inferred (~0.36) from reflection streaks",
    surface={"macroRoughness": 0.03, "microRoughness": 0.01, "bumpAmplitude": 0.0,
             "normalPattern": "none", "displacementPattern": "none",
             "occlusionPattern": "none", "edgeWearPattern": "none",
             "notes": "sapphire: transmission ~1, IOR 1.76, controlled streak reflections"},
    ev=EV))

tree.append(comp(
    "case-back", "Case Back", "meso", "case-rear", "lathe", "continuous-sculpt",
    "Revolved shallow polished disc closing the case rear; HIDDEN in reference - inferred from convention.",
    "case-assembly", importance=0.6, confidence=0.5, dims=(3.84, 3.84, 0.2), pos=(0, 0, -0.52),
    attach=att("case-back-rim", (0, 0, -0.42), (0, 0, -0.62), "overlap", 0.05, overlap=0.05),
    anim_role="explode-layer", collider="cylinder",
    geo_intent="lathe: r1.92 disc with soft convex bulge to z-0.62; screw-down look via shallow rim step",
    surface=polished_surface, ev=EV))

tree.append(comp(
    "movement-plate", "Movement Plate (inferred)", "meso", "internal-layer", "cylinder", "assembled-solid",
    "Thin cylindrical plate standing in for the invisible movement; conventional layer for the exploded story, labeled inferred.",
    "case-assembly", importance=0.5, confidence=0.4, mat="mat-case-brushed",
    dims=(3.16, 3.16, 0.33), pos=(0, 0, -0.215),
    attach=att("case-bore-rear", (0, 0, -0.05), (0, 0, -0.38), "socket", 0.04),
    anim_role="explode-layer", collider="cylinder",
    geo_intent="r1.58 disc, brushed dark metal, shallow relief rings hinting bridges; NOT observed - convention",
    surface={"macroRoughness": 0.4, "microRoughness": 0.2, "bumpAmplitude": 0.01,
             "normalPattern": "circular brushing", "displacementPattern": "none",
             "occlusionPattern": "ring grooves", "edgeWearPattern": "none",
             "notes": "inferred layer"},
    ev=EV))

tree.append(comp(
    "lugs", "Lugs (4x)", "meso", "strap-anchor", "extrude", "continuous-sculpt",
    "Four tapering faceted prisms flowing out of the case band; smooth tapered volumes with chamfered flanks (extrude+taper, not boxes).",
    "case-assembly", importance=0.85, confidence=0.8,
    dims=(0.46, 0.78, 0.5), pos=(0, 0, -0.05),
    attach=att("lug-roots", (1.28, 1.55, -0.05), (1.06, 2.18, -0.12), "embed", 0.15),
    anim_role="anchor", detach=False,
    geo_intent="extrude teardrop-taper profile per lug at (+-1.17, +-1.86); polished top facet + chamfer; integral with case (do NOT separate in explosion)",
    features=[feat("lugs", "case-detail",
                   "faceted tapering lugs, polished tops, chamfered flanks (det-18)", "geometry", EV_STRAP)],
    surface=polished_surface, ev=EV_STRAP, details=["det-18"]))

tree.append(comp(
    "crown", "Crown", "meso", "control", "cylinder", "assembled-solid",
    "Fluted cylinder with countable rectangular ribs and flat end cap; discrete rigid control part.",
    "case-assembly", importance=0.9, confidence=0.95,
    dims=(0.30, 0.68, 0.68), pos=(2.34, 0, -0.02), rot=(0, 0, -1.5708),
    attach=att("crown-socket", (2.05, 0, -0.02), (2.49, 0, -0.02), "socket", 0.10),
    pivot_pos=(2.05, 0, -0.02), pivot_axis=(1, 0, 0), anim_role="control-spin",
    collider="cylinder",
    geo_intent="r0.34 x w0.30 cylinder on r0.16 stem collar; 20 axial flutes (repetition system rep-crown-flutes); embossed round end medallion r0.20 raised 0.02",
    features=[feat("crown", "control",
                   "~20 axial flutes + embossed end medallion + stem collar (det-11)", "geometry", EV_FLANK)],
    surface=polished_surface, ev=EV_FLANK, details=["det-11"]))

pusher_surface = {
    "macroRoughness": 0.32, "microRoughness": 0.1, "bumpAmplitude": 0.004,
    "normalPattern": "linear brushing on top face", "displacementPattern": "none",
    "occlusionPattern": "base seam AO", "edgeWearPattern": "none",
    "notes": "brushed satin top, polished flanks (det-12)"}

for pid, sy, sock in (("pusher-upper", 1, "pusher-socket-upper"),
                      ("pusher-lower", -1, "pusher-socket-lower")):
    ang = 0.5236 * sy
    tree.append(comp(
        pid, pid.replace("-", " ").title(), "meso", "control", "extrude", "assembled-solid",
        "Trapezoidal block with rounded outer edge; discrete rigid pressed control, canted to the case tangent.",
        "case-assembly", importance=0.8, confidence=0.9, mat="mat-case-brushed",
        mats=["mat-case-brushed", "mat-case-polished"],
        dims=(0.42, 0.30, 0.34), pos=(1.96, sy * 1.13, -0.02), rot=(0, 0, ang),
        attach=att(sock, (1.78, sy * 1.02, -0.02), (2.18, sy * 1.26, -0.02), "socket", 0.10),
        pivot_pos=(1.78, sy * 1.02, -0.02), pivot_axis=(0.866, sy * 0.5, 0),
        anim_role="control-press",
        geo_intent="extrude rounded trapezoid along radial insertion axis at +-30 deg from +X; brushed top face, polished sides",
        features=[feat(pid, "control", "trapezoidal chrono pusher, brushed top (det-12)",
                       "geometry", EV_FLANK)],
        surface=pusher_surface, ev=EV_FLANK, details=["det-12"]))

# ---------- dial ----------
dial_surface = {
    "macroRoughness": 0.5, "microRoughness": 0.25, "bumpAmplitude": 0.003,
    "normalPattern": "fine radial sunburst brushing",
    "displacementPattern": "none",
    "occlusionPattern": "recess AO inside subdial wells and apertures",
    "edgeWearPattern": "none",
    "notes": "radial satin gradient: warm gray-brown center -> near-black rim (det-17)"}

tree.append(comp(
    "dial-plate", "Dial Plate", "meso", "dial-face", "cylinder", "assembled-solid",
    "Thin rigid disc with aperture cutouts; carries the printed scale systems as canvas-texture material.",
    "dial-assembly", importance=1.0, confidence=0.95, mat="mat-dial-plate",
    dims=(3.4, 3.4, 0.05), pos=(0, 0, 0.275),
    attach=att("case-bore", (0, 0, 0.25), (0, 0, 0.30), "socket", 0.03),
    anim_role="explode-layer", collider="cylinder",
    geo_intent="r1.70 disc t0.05; canvas texture 2048px carries tachymeter band, railway track, date arc, brand text; apertures cut via shape holes",
    features=[
        feat("dial-apertures-cutouts", "aperture",
             "twin rectangular day/month cutouts under 12 (det-01 geometry half)", "boolean-cut", EV_DIAL),
        feat("dial-round-window-cutouts", "aperture",
             "two round cutouts at ~7:30 and ~4:30 (det-04 geometry half)", "boolean-cut", EV_DIAL),
        feat("moonphase-cutout", "aperture",
             "fan-shaped moonphase cutout at 6 (det-02 geometry half)", "boolean-cut", EV_DIAL)],
    surface=dial_surface, ev=EV_DIAL, details=["det-17", "det-05", "det-06", "det-16"]))

tree.append(comp(
    "rehaut-ring", "Rehaut Ring", "micro", "dial-trim", "lathe", "continuous-sculpt",
    "Thin polished revolved ring between dial edge and bezel bore.",
    "dial-assembly", importance=0.6, confidence=0.85,
    dims=(3.48, 3.48, 0.14), pos=(0, 0, 0.37),
    attach=att("dial-perimeter", (0, 0, 0.30), (0, 0, 0.44), "butt", 0.03),
    anim_role="explode-layer", collider="cylinder",
    geo_intent="lathe ring r1.70->1.74, z0.30->0.44, mirror polish",
    surface=polished_surface, ev=EV_FLANK, details=["det-13"]))

tree.append(comp(
    "hour-markers", "Applied Hour Markers", "micro", "dial-furniture", "extrude", "assembled-solid",
    "Repeated faceted baton prisms with pyramidal ridge crease; instanced via rep-hour-markers.",
    "dial-assembly", importance=0.85, confidence=0.95, mat="mat-hands-polished",
    dims=(0.075, 0.34, 0.045), pos=(0, 0, 0.315),
    attach=att("dial-face-front", (0, 1.10, 0.30), (0, 1.44, 0.30), "butt", 0.012),
    anim_role="explode-layer",
    geo_intent="extrude baton profile w0.075 l0.34 t0.045 with ridge crease; 8 singles at h1,2,4,5,7,8,10,11 + double at 12; inner r1.10 outer r1.44",
    features=[feat("hour-markers", "applied-marker",
                   "faceted batons, double at 12 (det-07)", "geometry", EV_DIAL)],
    surface=polished_surface, ev=EV_DIAL, details=["det-07"]))

tree.append(comp(
    "dial-apertures", "Day/Month Aperture Set", "micro", "complication-window", "box", "assembled-solid",
    "Two polished rectangular bevel frames + white printed discs behind the dial cutouts.",
    "dial-assembly", importance=0.9, confidence=0.95, mat="mat-hands-polished",
    mats=["mat-hands-polished", "mat-aperture-disc"],
    dims=(1.24, 0.34, 0.06), pos=(0, 0.86, 0.29),
    attach=att("dial-aperture-cutouts", (-0.56, 0.86, 0.26), (0.56, 0.86, 0.32), "embed", 0.03),
    anim_role="explode-layer",
    geo_intent="two 0.50x0.30 beveled frames centered x=+-0.30 y=0.86; SAT | MAR white discs (canvas print) recessed 0.02",
    features=[feat("dial-apertures", "aperture",
                   "twin day/month windows w/ polished frames + printed discs (det-01)", "geometry", EV_DIAL)],
    ev=EV_DIAL, details=["det-01"]))

tree.append(comp(
    "dial-round-windows", "Day/Night + Leap Year Windows", "micro", "complication-window",
    "cylinder", "assembled-solid",
    "Two small polished ring frames + printed discs in the round dial cutouts at ~7:30 and ~4:30.",
    "dial-assembly", importance=0.7, confidence=0.9, mat="mat-hands-polished",
    mats=["mat-hands-polished", "mat-aperture-disc"],
    dims=(0.27, 0.27, 0.06), pos=(0, -0.82, 0.29),
    attach=att("dial-round-cutouts", (-0.82, -0.82, 0.27), (0.82, -0.82, 0.31), "embed", 0.03),
    anim_role="explode-layer",
    geo_intent="ring frames r0.135 at (+-0.82,-0.82); white discs behind; leap window prints '3'",
    features=[feat("dial-round-windows", "aperture",
                   "day/night + leap year round windows (det-04)", "geometry", EV_DIAL)],
    ev=EV_DIAL, details=["det-04"]))

azurage = {
    "macroRoughness": 0.5, "microRoughness": 0.3, "bumpAmplitude": 0.004,
    "normalPattern": "concentric azurage grooves",
    "displacementPattern": "none",
    "occlusionPattern": "groove AO", "edgeWearPattern": "none",
    "notes": "recessed well with concentric engraved rings + double white ring border print (det-08)"}

tree.append(comp(
    "subdials", "Subdial Pair", "meso", "complication", "cylinder", "assembled-solid",
    "Two recessed cylindrical wells sunk into the dial plate at 3 and 9.",
    "dial-assembly", importance=0.9, confidence=0.94,
    mat="mat-dial-plate", dims=(2.44, 0.6, 0.04), pos=(0, 0, 0.265),
    attach=att("dial-subdial-wells", (-0.92, 0, 0.26), (0.92, 0, 0.26), "embed", 0.03),
    anim_role="explode-layer",
    geo_intent="grouping pivot for subdial-left/right recessed discs",
    features=[feat("subdials", "subdial",
                   "recessed wells w/ azurage + ring border print (det-08)", "geometry", EV_DIAL)],
    surface=azurage, ev=EV_DIAL, details=["det-08"]))

for sid, sx, scale_desc in (("subdial-left", -0.92, "small seconds 10-60"),
                            ("subdial-right", 0.92, "30-minute counter")):
    tree.append(comp(
        sid, sid.replace("-", " ").title(), "micro", "complication", "cylinder", "assembled-solid",
        "Recessed disc 0.035 below dial surface with concentric groove relief and printed scale.",
        "subdials", importance=0.8, confidence=0.9, mat="mat-dial-plate",
        dims=(1.2, 1.2, 0.03), pos=(sx, 0, 0.255),
        attach=att("dial-subdial-wells", (sx, 0, 0.24), (sx, 0, 0.27), "embed", 0.035),
        anim_role="explode-layer", collider="cylinder",
        geo_intent=f"r0.60 disc recessed; canvas print: {scale_desc}; azurage rings via normal/bump rings",
        surface=azurage, ev=EV_DIAL, details=["det-08"]))

tree.append(comp(
    "date-subdial", "Date Subdial + Moonphase Zone", "meso", "complication", "cylinder", "assembled-solid",
    "Recessed disc at 6 carrying the printed 1-31 date arc, wrapping the moonphase aperture; small date hand above.",
    "dial-assembly", importance=0.9, confidence=0.9, mat="mat-dial-plate",
    dims=(1.2, 1.2, 0.03), pos=(0, -0.88, 0.255),
    attach=att("dial-date-well", (0, -0.88, 0.24), (0, -0.88, 0.27), "embed", 0.035),
    anim_role="explode-layer", collider="cylinder",
    geo_intent="r0.60 recessed disc; canvas print date arc 1-31; fan cutout for moonphase",
    features=[feat("date-subdial", "scale",
                   "printed 1-31 date arc + azurage (det-03)", "texture+geometry", EV_DIAL)],
    surface=azurage, ev=EV_DIAL, details=["det-03"]))

tree.append(comp(
    "moonphase", "Moonphase Disc", "micro", "complication", "cylinder", "assembled-solid",
    "Navy lacquer disc behind the dial cutout carrying moon + star artwork; rotates in the real mechanism.",
    "date-subdial", importance=0.85, confidence=0.93, mat="mat-moonphase",
    dims=(0.8, 0.8, 0.02), pos=(0, -0.80, 0.245),
    attach=att("moonphase-cutout", (0, -0.80, 0.24), (0, -0.80, 0.26), "behind", 0.02),
    anim_role="rotating-disc", collider="cylinder", pivot_pos=(0, -0.80, 0.245),
    geo_intent="r0.40 disc; canvas art: deep navy, 6-point textured stars, pale-gold moon disc w/ crater dots",
    features=[feat("moonphase", "complication",
                   "navy disc + stars + moon behind fan cutout (det-02)", "texture", EV_DIAL)],
    surface={"macroRoughness": 0.25, "microRoughness": 0.1, "bumpAmplitude": 0.001,
             "normalPattern": "star emboss", "displacementPattern": "none",
             "occlusionPattern": "cutout edge AO", "edgeWearPattern": "none",
             "notes": "gloss lacquer"},
    ev=EV_DIAL, details=["det-02"]))

# ---------- hands ----------
hand_pol = {
    "macroRoughness": 0.12, "microRoughness": 0.04, "bumpAmplitude": 0.0,
    "normalPattern": "two-facet ridge crease", "displacementPattern": "none",
    "occlusionPattern": "none", "edgeWearPattern": "none",
    "notes": "polished white metal, leaf profile with center ridge (det-09)"}

tree.append(comp(
    "hand-hour", "Hour Hand", "meso", "indicator", "extrude", "continuous-sculpt",
    "Leaf (feuille) profile: smooth tapered pointed leaf swept flat with a center ridge; extruded 2D shape, never a box.",
    "hand-assembly", importance=0.95, confidence=0.95, mat="mat-hands-polished",
    dims=(0.145, 1.02, 0.02), pos=(0, 0, 0.36), rot=(0, 0, 2.20),
    attach=att("dial-center-pinion", (0, 0, 0.34), (0, 0, 0.375), "socket", 0.02),
    pivot_pos=(0, 0, 0.36), pivot_axis=(0, 0, 1), anim_role="hand-rotate",
    geo_intent="extrude leaf outline (quadratic curves), length 1.02, max width 0.145 at 40%; ridge via two-facet bevel; round hub r0.09",
    features=[feat("hand-hour", "hand", "leaf hour hand w/ ridge (det-09)", "geometry", EV_DIAL)],
    surface=hand_pol, ev=EV_DIAL, details=["det-09"]))

tree.append(comp(
    "hand-minute", "Minute Hand", "meso", "indicator", "extrude", "continuous-sculpt",
    "Longer, slimmer leaf profile than hour hand; same construction language.",
    "hand-assembly", importance=0.95, confidence=0.95, mat="mat-hands-polished",
    dims=(0.12, 1.50, 0.018), pos=(0, 0, 0.40), rot=(0, 0, -0.42),
    attach=att("dial-center-pinion", (0, 0, 0.38), (0, 0, 0.415), "socket", 0.02),
    pivot_pos=(0, 0, 0.40), pivot_axis=(0, 0, 1), anim_role="hand-rotate",
    geo_intent="extrude leaf outline length 1.50 max width 0.12; hub r0.075",
    features=[feat("hand-minute", "hand", "leaf minute hand (det-09)", "geometry", EV_DIAL)],
    surface=hand_pol, ev=EV_DIAL, details=["det-09"]))

tree.append(comp(
    "hand-chrono", "Chronograph Seconds Hand", "meso", "indicator", "extrude", "continuous-sculpt",
    "Very slender tapered needle with counterweight tail; frosted finish; extruded sliver profile.",
    "hand-assembly", importance=0.85, confidence=0.9, mat="mat-chrono-frosted",
    dims=(0.03, 1.93, 0.012), pos=(0, 0, 0.44), rot=(0, 0, 3.02),
    attach=att("dial-center-pinion", (0, 0, 0.42), (0, 0, 0.455), "socket", 0.015),
    pivot_pos=(0, 0, 0.44), pivot_axis=(0, 0, 1), anim_role="hand-rotate",
    geo_intent="needle length 1.58 + tail 0.35, width 0.03 tapering to 0.008 tip; bead-blasted response",
    features=[feat("hand-chrono", "hand", "frosted slender chrono needle (det-10)", "geometry+material", EV_DIAL)],
    surface={"macroRoughness": 0.45, "microRoughness": 0.3, "bumpAmplitude": 0.0,
             "normalPattern": "none", "displacementPattern": "none",
             "occlusionPattern": "none", "edgeWearPattern": "none",
             "notes": "bead-blasted matte metal (det-10)"},
    ev=EV_DIAL, details=["det-10"]))

for hid, hx, hy, hrot in (("subhand-left", -0.92, 0.0, 1.05),
                          ("subhand-right", 0.92, 0.0, -2.62),
                          ("hand-date", 0.0, -0.88, 2.35)):
    tree.append(comp(
        hid, hid.replace("-", " ").title(), "micro", "indicator", "extrude", "continuous-sculpt",
        "Small polished leaf hand on its subdial pivot; extruded leaf sliver.",
        "hand-assembly", importance=0.6, confidence=0.85, mat="mat-hands-polished",
        dims=(0.05, 0.5, 0.012), pos=(hx, hy, 0.30), rot=(0, 0, hrot),
        attach=att("subdial-pivots", (hx, hy, 0.285), (hx, hy, 0.315), "socket", 0.012),
        pivot_pos=(hx, hy, 0.30), pivot_axis=(0, 0, 1), anim_role="hand-rotate",
        geo_intent="leaf sliver length 0.50 (date hand 0.38) w/ disc hub r0.05",
        surface=hand_pol, ev=EV_DIAL, details=["det-03"] if hid == "hand-date" else []))

tree.append(comp(
    "pinion-cap", "Center Pinion Cap", "micro", "indicator-hub", "cylinder", "assembled-solid",
    "Small polished dome cap closing the central hand stack.",
    "hand-assembly", importance=0.5, confidence=0.8, mat="mat-hands-polished",
    dims=(0.09, 0.09, 0.03), pos=(0, 0, 0.465),
    attach=att("dial-center-pinion", (0, 0, 0.45), (0, 0, 0.48), "socket", 0.01),
    anim_role="static-detail", collider="cylinder",
    geo_intent="r0.045 dome cap", surface=hand_pol, ev=EV_DIAL))

spec["componentTree"] = tree

# ---------- materials ----------
def bands(macro_f, macro_a, meso_f, meso_a, micro_f, micro_a, meso_role, micro_role):
    return [
        {"id": "macro", "frequency": macro_f, "amplitude": macro_a, "role": "broad tonal/height breakup"},
        {"id": "meso", "frequency": meso_f, "amplitude": meso_a, "role": meso_role},
        {"id": "micro", "frequency": micro_f, "amplitude": micro_a, "role": micro_role},
    ]


def material(id, name, base, *, type="physical", metal=(1.0, 0.0), rough=(0.15, 0.06),
             secondary=None, bands_=None, normal=("none", 0.0, 1.0), clearcoat=None,
             transmission=None, overrides=None, notes="", res=2048, repeat=(1, 1),
             rough_local="", sheen=None, emissive=None):
    m = {
        "id": id, "name": name, "type": type,
        "shaderModel": "MeshPhysicalMaterial",
        "baseColor": base, "color": base,
        "albedo": {"dominant": base, "secondary": secondary or [],
                   "samplingNotes": "image-observed local color zones"},
        "colorVariation": {"palette": [base] + (secondary or []), "pattern": "zoned",
                           "amplitude": 0.06, "heightCorrelation": 0.2},
        "textureResolution": res,
        "textureProjection": {"mode": "uv", "repeat": list(repeat), "anisotropy": 8,
                              "texelDensityIntent": "stable world-scale detail"},
        "surfaceFrequencyBands": bands_ or bands(2, 0.1, 14, 0.05, 60, 0.02,
                                                 "surface relief", "highlight breakup"),
        "roughness": {"base": rough[0], "variation": rough[1],
                      "map": "independent-procedural-field",
                      "localResponse": rough_local or "subtle variation from finishing"},
        "metalness": {"base": metal[0], "variation": metal[1]},
        "normal": {"pattern": normal[0], "strength": normal[1], "scale": normal[2],
                   "space": "tangent"},
        "bump": {"pattern": "none", "amplitude": 0.0, "scale": 1.0},
        "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0,
                         "silhouetteAffects": False},
        "ambientOcclusion": {"cavityStrength": 0.3, "contactShadowBias": 0.3,
                             "notes": "darken recesses, wells, grooves"},
        "wear": {"edgeWear": 0.0, "scratches": [], "chips": []},
        "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#1A1713"},
        "localOverrides": overrides or [],
        "shaderNotes": [
            "MeshPhysicalMaterial; independent albedo/roughness/normal channels",
            notes],
        "notes": notes,
    }
    if clearcoat:
        m["clearcoat"] = {"value": clearcoat[0], "roughness": clearcoat[1]}
    if transmission:
        m["transmission"] = {"value": transmission[0], "ior": transmission[1],
                             "thickness": transmission[2]}
    if sheen:
        m["sheen"] = {"value": sheen[0], "color": sheen[1]}
    if emissive:
        m["emissive"] = {"color": emissive[0], "intensity": emissive[1]}
    return m


def override(id, desc, region, channels, ev):
    return {"id": id, "description": desc, "region": region,
            "channels": channels, "evidenceRefs": ev, "confidence": 0.9}


spec["materials"] = [
    material("mat-case-polished", "Polished Platinum", "#E8E9EB",
             metal=(1.0, 0.0), rough=(0.14, 0.05),
             secondary=["#C9CCD1", "#F4F5F7"],
             bands_=bands(1.5, 0.06, 10, 0.02, 48, 0.015,
                          "soft polish waviness", "micro polish breakup under grazing light"),
             rough_local="slightly higher roughness in lug chamfer transitions",
             notes="mirror-polished platinum; env-map driven curvature read (det zones r1c2)"),
    material("mat-case-brushed", "Brushed Platinum", "#D6D8DB",
             metal=(1.0, 0.0), rough=(0.34, 0.08),
             secondary=["#C2C5C9"],
             normal=("linear brushing (anisotropic streak)", 0.25, 30),
             bands_=bands(1.5, 0.05, 24, 0.06, 80, 0.03,
                          "brush lines", "brush micro sparkle"),
             rough_local="anisotropic satin: brighter along brush direction",
             notes="pusher tops + movement plate; linear satin brushing (det-12)"),
    material("mat-dial-plate", "Sunburst Gradient Dial", "#4A423C",
             metal=(0.25, 0.1), rough=(0.5, 0.12),
             secondary=["#6E6259", "#2A241F", "#191410"],
             normal=("radial sunburst micro-brushing", 0.15, 90),
             bands_=bands(1.2, 0.3, 40, 0.08, 120, 0.03,
                          "radial brushing rows", "print edge micro relief"),
             rough_local="satin sheen strongest along radial highlight; print regions slightly glossier",
             overrides=[
                 override("mat-dial-sunburst",
                          "radial gradient stops: 0.0 #6E6259 / 0.55 #4A423C / 0.8 #2A241F / 1.0 #191410 (det-17)",
                          "full dial disc, radial", ["albedo", "roughness"], EV_DIAL),
                 override("mat-tachy-band",
                          "near-black matte band r0.80->1.0 of dial radius with white print: BASE 1000, 500->160 numerals, tick arrays, SWISS MADE (det-05)",
                          "outer annulus", ["albedo", "roughness"], ["zone-right-flank"]),
                 override("mat-dial-print",
                          "off-white #EFEDE6 print: railway minute track, boxed 5-min numerals, date arc 1-31, PATEK PHILIPPE GENEVE, subdial scales (det-06, det-16, det-03)",
                          "annular + subdial + arc text zones", ["albedo", "roughness"], EV_DIAL)],
             notes="canvas-generated 2048px albedo carrying all print; gradient + print never geometry"),
    material("mat-hands-polished", "Polished White-Metal Furniture", "#EDEEF0",
             metal=(1.0, 0.0), rough=(0.1, 0.04),
             secondary=["#CDD0D4"],
             bands_=bands(2, 0.04, 16, 0.02, 64, 0.01, "facet planes", "polish micro"),
             rough_local="facet-dependent highlight flips",
             notes="hands, markers, aperture frames (det-07, det-09)"),
    material("mat-chrono-frosted", "Frosted Needle Metal", "#D9DBDD",
             metal=(1.0, 0.0), rough=(0.46, 0.08),
             secondary=["#C4C7CA"],
             bands_=bands(2, 0.03, 30, 0.04, 110, 0.05, "blast grain", "grain sparkle"),
             rough_local="uniform matte bead-blast",
             notes="chrono needle (det-10)"),
    material("mat-crystal", "Sapphire Crystal", "#FFFFFF",
             metal=(0.0, 0.0), rough=(0.03, 0.01),
             transmission=(1.0, 1.76, 0.25), clearcoat=(0.6, 0.05),
             bands_=bands(1, 0.01, 8, 0.005, 30, 0.003, "dome curvature streaks", "none"),
             rough_local="uniform optical polish",
             notes="transmission glass; controlled streak reflections from area lights"),
    material("mat-moonphase", "Moonphase Lacquer Disc", "#1B2447",
             metal=(0.6, 0.1), rough=(0.25, 0.08),
             secondary=["#2A3560", "#E8DCB8"],
             overrides=[
                 override("mat-moon-art",
                          "canvas art: 6-point textured stars + pale-gold moon w/ crater dots on deep navy (det-02)",
                          "full disc", ["albedo", "roughness"], EV_DIAL)],
             rough_local="gloss lacquer, stars slightly rougher",
             notes="navy metallic lacquer (det-02)"),
    material("mat-strap", "Braided Textile Strap", "#23262A",
             type="physical", metal=(0.0, 0.0), rough=(0.8, 0.12),
             secondary=["#2C3036", "#191B1F"],
             normal=("chevron braid weave", 0.85, 9), sheen=(0.35, "#3A3E45"),
             bands_=bands(1.5, 0.25, 9, 0.55, 40, 0.12,
                          "braid cord rows (silhouette-visible ripple)", "fiber fuzz breakup"),
             rough_local="deep AO between cords; sheen along cord crowns",
             overrides=[
                 override("mat-strap-weave",
                          "diagonal chevron braid ~9 columns, chunky cords, rolled raised edges (det-14)",
                          "full strap top surface", ["albedo", "roughness", "normal", "displacement"],
                          ["zone-strap-bottom"])],
             notes="CORRECTED: braided textile, not embossed leather (det-14)"),
    material("mat-stitch", "Ivory Rope Stitching", "#E8E2D4",
             metal=(0.0, 0.0), rough=(0.62, 0.1),
             secondary=["#D9D2C2"], sheen=(0.4, "#F4EFE3"),
             bands_=bands(3, 0.1, 26, 0.3, 90, 0.08, "cord twist ridges", "fiber micro"),
             rough_local="twisted cord shading",
             notes="rope-style contrast stitches (det-15)"),
    material("mat-aperture-disc", "Printed Indication Discs", "#F2F0EA",
             metal=(0.0, 0.0), rough=(0.5, 0.05),
             secondary=["#111111"],
             rough_local="matte print disc",
             notes="white discs w/ black canvas print: SAT, MAR, 3 (det-01, det-04)"),
]

# ---------- repetition systems ----------
spec["repetitionSystems"] = [
    {"id": "rep-hour-markers", "name": "Hour marker ring", "componentRef": "hour-markers",
     "pattern": "radial", "count": 9,
     "placement": "8 single batons at hour angles 1,2,4,5,7,8,10,11 + double baton at 12; inner r1.10, outer r1.44 on dial front",
     "instanceVariation": "double baton at 12 is two parallel batons gap 0.05",
     "evidenceRefs": ["zone-dial-center"], "details": ["det-07"]},
    {"id": "rep-crown-flutes", "name": "Crown fluting", "componentRef": "crown",
     "pattern": "radial-axial", "count": 20,
     "placement": "20 rectangular ribs around crown circumference, axis-aligned, depth 0.03",
     "instanceVariation": "none", "evidenceRefs": ["zone-right-flank"], "details": ["det-11"]},
    {"id": "rep-strap-braid", "name": "Strap braid columns", "componentRef": "strap-upper",
     "pattern": "grid-diagonal", "count": 9,
     "placement": "~9 chevron cord columns across strap width, diagonal alternation, on both straps",
     "instanceVariation": "slight per-cord phase jitter (deterministic seed)",
     "evidenceRefs": ["zone-strap-bottom"], "details": ["det-14"]},
    {"id": "rep-stitch-run", "name": "Edge stitch runs", "componentRef": "stitch-upper",
     "pattern": "path-linear", "count": 28,
     "placement": "~7 twisted segments per edge x 2 edges x 2 straps, inset 0.09 from edge",
     "instanceVariation": "twist phase alternates", "evidenceRefs": ["zone-strap-bottom"],
     "details": ["det-15"]},
    {"id": "rep-print-ticks", "name": "Printed tick systems", "componentRef": "dial-plate",
     "pattern": "radial-print", "count": 240,
     "placement": "tachymeter ticks + railway minute track + subdial scales + date arc, all in dial canvas texture",
     "instanceVariation": "per-scale spacing from horological layout",
     "evidenceRefs": ["zone-dial-center", "zone-right-flank"], "details": ["det-05", "det-06"]},
    {"id": "rep-azurage-rings", "name": "Subdial azurage rings", "componentRef": "subdials",
     "pattern": "concentric", "count": 18,
     "placement": "concentric grooves in all three subdial wells, ~18 rings each",
     "instanceVariation": "none", "evidenceRefs": ["zone-dial-center"], "details": ["det-08"]},
]

# ---------- silhouette / evidence / camera ----------
spec["suitability"] = "pass"
spec["scores"] = {"object_isolation": 1.0, "silhouette_readability": 0.95,
                  "depth_inference": 0.7, "primitive_decomposition": 0.9,
                  "material_procedurality": 0.85, "occlusion_risk": 0.35,
                  "interaction_fit": 0.95}

spec["silhouette"] = {
    "boundingShape": "vertically elongated stack: central short cylinder (case, axis +Z) + four corner tapered lug prisms + two curved tapered strap slabs receding in -Z",
    "aspectRatios": ["strap width = 0.55 x case diameter", "bezel outer = 0.98 D",
                     "dial opening = 0.82 D", "case thickness = 0.30 D",
                     "crown diameter = 0.17 D", "visible strap length = 1.1 D per side"],
    "symmetry": "bilateral about vertical axis; crown + 2 pushers break symmetry on +X flank; dial internals radial",
    "dominantCurves": ["case band convex flank", "bezel concave slope", "crystal dome",
                       "strap wrist-curve receding in -Z", "leaf hand outlines"],
    "negativeSpaces": ["gap between lug pairs above/below case", "recessed subdial wells",
                       "dial apertures"],
    "landmarks": ["crown at +X (3:00)", "pushers at +-30 deg from +X", "moonphase at 6:00",
                  "twin apertures under 12:00", "double baton at 12:00"],
}

spec["viewEvidence"] = [
    {"id": "full-object", "view": "primary",
     "imageRegion": {"x": 0.0, "y": 0.0, "width": 1.0, "height": 1.0, "units": "normalized"},
     "observations": [
         "front elevation, near-orthographic, white background",
         "watch fills frame height; strap runs off frame top/bottom",
         "key light upper-left: dial gradient highlight biased upper-left",
         "case band strong vertical specular highlight on both flanks"],
     "confidence": 0.95},
    {"id": "zone-dial-center", "view": "detail-crop",
     "imageRegion": {"x": 0.3333, "y": 0.3333, "width": 0.3333, "height": 0.3333, "units": "normalized"},
     "observations": [
         "leaf hands w/ two-facet ridge; frosted slender chrono needle",
         "twin day/month apertures w/ polished bevel frames, SAT | MAR",
         "moonphase: navy disc, textured stars, moon; date arc 1-31 wraps it",
         "applied faceted batons; PATEK PHILIPPE GENEVE print",
         "round leap-year window '3' and day/night window with polished ring frames"],
     "confidence": 0.95},
    {"id": "zone-right-flank", "view": "detail-crop",
     "imageRegion": {"x": 0.6667, "y": 0.3333, "width": 0.3333, "height": 0.3333, "units": "normalized"},
     "observations": [
         "crown: ~20 axial flutes, embossed end medallion, stem collar",
         "pushers: brushed satin tops, polished flanks, trapezoidal, canted",
         "tachymeter band print: numerals 500->160, BASE 1000",
         "subdial azurage concentric grooves; rehaut ring between dial and bezel",
         "bezel concave polished slope"],
     "confidence": 0.95},
    {"id": "zone-strap-bottom", "view": "detail-crop",
     "imageRegion": {"x": 0.3333, "y": 0.6667, "width": 0.3333, "height": 0.3333, "units": "normalized"},
     "observations": [
         "strap = chunky braided textile, diagonal chevron weave ~9 columns",
         "twisted rope-style ivory stitches in recessed grooves along both edges",
         "strap curves away from camera (-Z) as it leaves the lugs",
         "lug taper + polished top facet visible at case junction"],
     "confidence": 0.95},
]

spec["referenceCamera"]["aspect"] = 0.7136
spec["referenceCamera"]["fovDegrees"] = 30.0
spec["referenceCamera"]["positionHint"] = [0.0, 0.0, 14.0]
spec["referenceCamera"]["note"] = "near-orthographic front product view; review renders use fov 30 at z=14 facing origin"

spec["coordinateFrame"] = {
    "front": "+Z (dial faces camera)",
    "up": "+Y (12 o'clock / upper strap)",
    "scaleReference": "1 world unit = 10 mm; case diameter D = 4.10 units (41 mm)",
}

spec["assumptions"] = [
    "case back is a polished screw-down disc (hidden; horological convention)",
    "crystal dome height 0.36 units inferred from reflection streaks",
    "case flank convex polished band inferred from single highlight",
    "strap underside flat; buckle out of frame and omitted",
    "movement-plate layer is a convention-based stand-in for the exploded story (not observed)",
    "time displayed ~10:08 with chrono needle near 30s; subdial hands per reference",
]

spec["risks"] = [
    "dial print density (tachymeter + railway + date arc) must stay legible at 2048px canvas",
    "transmission crystal over dark dial can produce noisy reflections - needs controlled env",
    "braid displacement geometry can explode triangle count - cap via tier segments",
    "single view: flank/back read is convention, disclose in final report",
]

spec["lightingFromPhoto"] = [
    {"role": "key", "type": "large soft area", "direction": "upper-left-front (-0.5, 0.6, 0.8)",
     "color": "#FFFFFF", "intensity": "dominant; creates dial gradient bias and case rim highlight"},
    {"role": "fill", "type": "broad frontal soft", "direction": "front (0,0,1)",
     "color": "#F4F4F6", "intensity": "low; keeps dial text readable"},
    {"role": "rim", "type": "narrow strip", "direction": "right (1,0.2,0.2)",
     "color": "#FFFFFF", "intensity": "subtle; separates case flank from background"},
    {"role": "environment", "type": "studio softbox HDR-like gradient", "direction": "all",
     "color": "#E9EAEC", "intensity": "moderate; drives polished metal curvature read"},
    {"role": "background", "type": "white seamless in photo; DARK premium backdrop in experience",
     "direction": "n/a", "color": "#0B0B0D",
     "intensity": "experience uses dark radial falloff while matching material response"},
]

spec["performanceBudget"]["fpsTarget"] = 60
spec["performanceBudget"]["targetTriangles"] = 220000
spec["performanceBudget"]["maxDrawCalls"] = 120

spec["qualityTargets"]["reviewViewpoints"] = ["front", "three-quarter", "right-side", "top-oblique", "exploded-front"]

# ---------- feature review targets ----------
spec["featureReviewTargets"] = [
    {"id": "case-bezel-crystal-profile", "name": "Case / bezel / crystal profile stack",
     "tier": "critical", "passIds": ["blockout", "structural-pass", "form-refinement"],
     "minimumScore": 0.8, "mustPass": True,
     "componentRefs": ["case-main", "bezel", "crystal"], "evidenceRefs": ["full-object", "zone-right-flank"]},
    {"id": "dial-complication-layout", "name": "Dial complication layout (subdials, apertures, moonphase)",
     "tier": "critical", "passIds": ["structural-pass", "form-refinement", "material-pass"],
     "minimumScore": 0.8, "mustPass": True,
     "componentRefs": ["dial-plate", "subdials", "date-subdial", "dial-apertures", "moonphase"],
     "evidenceRefs": ["zone-dial-center"]},
    {"id": "hands-system", "name": "Hand stack geometry and placement",
     "tier": "critical", "passIds": ["form-refinement"],
     "minimumScore": 0.8, "mustPass": True,
     "componentRefs": ["hand-hour", "hand-minute", "hand-chrono"], "evidenceRefs": ["zone-dial-center"]},
    {"id": "metal-dial-material-split", "name": "Polished metal vs satin dial material response",
     "tier": "critical", "passIds": ["material-pass", "surface-pass", "lighting-pass"],
     "minimumScore": 0.75, "mustPass": True,
     "componentRefs": ["case-main", "dial-plate"], "evidenceRefs": ["full-object", "zone-right-flank"]},
    {"id": "strap-weave-system", "name": "Braided strap + stitching read",
     "tier": "critical", "passIds": ["form-refinement", "material-pass"],
     "minimumScore": 0.75, "mustPass": True,
     "componentRefs": ["strap-upper", "strap-lower", "stitch-upper", "stitch-lower"],
     "evidenceRefs": ["zone-strap-bottom"]},
    {"id": "crown-pusher-architecture", "name": "Crown + pusher flank architecture",
     "tier": "important", "passIds": ["structural-pass", "form-refinement"],
     "minimumScore": 0.65, "mustPass": False,
     "componentRefs": ["crown", "pusher-upper", "pusher-lower"], "evidenceRefs": ["zone-right-flank"]},
    {"id": "marker-ring-fidelity", "name": "Applied marker ring",
     "tier": "important", "passIds": ["form-refinement"],
     "minimumScore": 0.65, "mustPass": False,
     "componentRefs": ["hour-markers"], "evidenceRefs": ["zone-dial-center"]},
    {"id": "moonphase-date-zone", "name": "Moonphase + date arc zone",
     "tier": "important", "passIds": ["material-pass"],
     "minimumScore": 0.65, "mustPass": False,
     "componentRefs": ["date-subdial", "moonphase"], "evidenceRefs": ["zone-dial-center"]},
]

# ---------- build pass component refs ----------
_all = [c["id"] for c in tree]
_pass_refs = {
    "blockout": ["root", "strap-assembly", "case-assembly", "dial-assembly", "hand-assembly"],
    "structural-pass": _all,
    "form-refinement": ["case-main", "bezel", "crystal", "lugs", "crown", "pusher-upper",
                         "pusher-lower", "hour-markers", "hand-hour", "hand-minute",
                         "hand-chrono", "subhand-left", "subhand-right", "hand-date",
                         "strap-upper", "strap-lower", "stitch-upper", "stitch-lower",
                         "dial-apertures", "dial-round-windows", "subdial-left",
                         "subdial-right", "date-subdial", "moonphase", "rehaut-ring",
                         "pinion-cap"],
    "material-pass": _all,
    "surface-pass": ["dial-plate", "subdial-left", "subdial-right", "date-subdial",
                      "strap-upper", "strap-lower", "pusher-upper", "pusher-lower",
                      "crown", "moonphase", "movement-plate"],
    "lighting-pass": ["root"],
    "interaction-pass": _all,
    "optimization-pass": ["root"],
}
for p in spec["buildPasses"]:
    p["componentRefs"] = _pass_refs.get(p["id"], ["root"])

# ---------- explosion metadata (consumed by the factory for userData) ----------
spec["runtimeExplosion"] = {
    "note": "offsets in watch-local units at explosionProgress=1; axis in watch space; order = reveal sequence; anchor parts stay",
    "components": {
        "crystal":            {"axis": [0, 0, 1],  "distance": 3.2,  "order": 1,  "label": "CRYSTAL",       "description": "Domed sapphire glazing"},
        "bezel":              {"axis": [0, 0, 1],  "distance": 2.45, "order": 2,  "label": "BEZEL",         "description": "Concave polished front ring"},
        "rehaut-ring":        {"axis": [0, 0, 1],  "distance": 2.0,  "order": 3,  "label": "REHAUT",        "description": "Inner trim ring"},
        "pinion-cap":         {"axis": [0, 0, 1],  "distance": 1.85, "order": 4,  "label": "",              "description": "Center cap"},
        "hand-chrono":        {"axis": [0, 0, 1],  "distance": 1.7,  "order": 5,  "label": "SECONDS",       "description": "Chronograph seconds needle"},
        "hand-minute":        {"axis": [0, 0, 1],  "distance": 1.45, "order": 6,  "label": "MINUTE",        "description": "Leaf minute hand"},
        "hand-hour":          {"axis": [0, 0, 1],  "distance": 1.2,  "order": 7,  "label": "HOUR",          "description": "Leaf hour hand"},
        "subhand-left":       {"axis": [0, 0, 1],  "distance": 1.0,  "order": 8,  "label": "",              "description": "Small seconds hand"},
        "subhand-right":      {"axis": [0, 0, 1],  "distance": 1.0,  "order": 8,  "label": "",              "description": "30-min counter hand"},
        "hand-date":          {"axis": [0, 0, 1],  "distance": 1.0,  "order": 8,  "label": "",              "description": "Date hand"},
        "hour-markers":       {"axis": [0, 0, 1],  "distance": 0.85, "order": 9,  "label": "MARKERS",       "description": "Applied baton indexes"},
        "dial-apertures":     {"axis": [0, 0, 1],  "distance": 0.7,  "order": 10, "label": "DAY / MONTH",   "description": "Calendar aperture set"},
        "dial-round-windows": {"axis": [0, 0, 1],  "distance": 0.7,  "order": 10, "label": "",              "description": "Day/night + leap year"},
        "subdials":           {"axis": [0, 0, 1],  "distance": 0.55, "order": 11, "label": "SUBDIAL",       "description": "Recessed counter wells"},
        "date-subdial":       {"axis": [0, 0, 1],  "distance": 0.55, "order": 11, "label": "DATE RING",     "description": "Perpetual date arc"},
        "moonphase":          {"axis": [0, 0, 1],  "distance": 0.35, "order": 12, "label": "MOONPHASE",     "description": "Navy lacquer moon disc"},
        "dial-plate":         {"axis": [0, 0, 1],  "distance": 0.45, "order": 13, "label": "DIAL",          "description": "Sunburst gradient plate"},
        "movement-plate":     {"axis": [0, 0, -1], "distance": 0.9,  "order": 14, "label": "MOVEMENT",      "description": "Inferred calibre layer"},
        "case-back":          {"axis": [0, 0, -1], "distance": 2.0,  "order": 15, "label": "CASE BACK",     "description": "Screw-down rear cover"},
        "crown":              {"axis": [1, 0, 0],  "distance": 1.3,  "order": 16, "label": "CROWN",         "description": "Fluted winding crown"},
        "pusher-upper":       {"axis": [0.866, 0.5, 0],  "distance": 0.95, "order": 17, "label": "UPPER PUSHER", "description": "Chronograph start/stop"},
        "pusher-lower":       {"axis": [0.866, -0.5, 0], "distance": 0.95, "order": 17, "label": "LOWER PUSHER", "description": "Chronograph reset"},
        "strap-upper":        {"axis": [0, 1, 0],  "distance": 2.2,  "order": 18, "label": "STRAP",         "description": "Braided calfskin, upper"},
        "strap-lower":        {"axis": [0, -1, 0], "distance": 2.2,  "order": 18, "label": "",              "description": "Braided calfskin, lower"},
        "case-main":          {"axis": [0, 0, 1],  "distance": 0.0,  "order": 0,  "label": "CASE",          "description": "Platinum case band (anchor)"},
        "lugs":               {"axis": [0, 0, 1],  "distance": 0.0,  "order": 0,  "label": "LUGS",          "description": "Integral strap anchors"},
    },
}

# wire detail inventory refs to final component/material override ids
_remap = {
    "subdials": "subdials", "center-hands": "hand-hour", "chrono-hand": "hand-chrono",
    "pushers": "pusher-upper", "strap-stitching": "stitch-upper",
    "mat-strap-weave": "mat-strap-weave", "mat-dial-plate": "mat-dial-sunburst",
}
for d in spec["preSpecAssessment"]["detailInventory"]["details"]:
    ref = d["mapsTo"]["ref"]
    d["mapsTo"]["ref"] = _remap.get(ref, ref)

with open(SPEC, "w", encoding="utf-8") as f:
    json.dump(spec, f, indent=2, ensure_ascii=False)
print("spec authored:", SPEC, "components:", len(tree), "materials:", len(spec["materials"]))
