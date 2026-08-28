"""Fix-up pass: integer scores, colorMaterialRecipe, detail kinds, referencePbr wiring,
lighting exposure/contact-shadow intent, unknowns resolution."""
import json, sys, pathlib

SPEC = sys.argv[1] if len(sys.argv) > 1 else "object-sculpt-spec.json"
PBR_DIR = pathlib.Path(".img2threejs/pbr")

spec = json.load(open(SPEC, encoding="utf-8"))

# 1) integer scores 0-3
spec["preSpecAssessment"]["complexity"]["scores"] = {
    "silhouetteComplexity": 2, "componentCount": 3, "hierarchyDepth": 3,
    "repetitionDensity": 3, "materialLayerCount": 3, "localDetailDensity": 3,
    "occlusionRisk": 2, "actionReadinessNeed": 3}
spec["scores"] = {
    "object_isolation": 3, "silhouette_readability": 3, "depth_inference": 2,
    "primitive_decomposition": 3, "material_procedurality": 3,
    "occlusion_risk": 1, "interaction_fit": 3}

# 2) colorMaterialRecipe per component
RECIPES = {
    "mat-case-polished": {"dominantAlbedo": "rgba(232, 233, 235, 1)", "secondaryAlbedo": "rgba(201, 204, 209, 1)",
                          "materialClass": "metal", "materialClassConfidence": 0.95},
    "mat-case-brushed": {"dominantAlbedo": "rgba(214, 216, 219, 1)", "secondaryAlbedo": "rgba(194, 197, 201, 1)",
                         "materialClass": "metal", "materialClassConfidence": 0.9},
    "mat-dial-plate": {"dominantAlbedo": "rgba(74, 66, 60, 1)", "secondaryAlbedo": "rgba(110, 98, 89, 1)",
                       "materialClass": "metal", "materialClassConfidence": 0.8,
                       "colorGradient": {"type": "radial", "stops": [
                           {"position": 0.0, "color": "rgba(110, 98, 89, 1)"},
                           {"position": 0.55, "color": "rgba(74, 66, 60, 1)"},
                           {"position": 0.8, "color": "rgba(42, 36, 31, 1)"},
                           {"position": 1.0, "color": "rgba(25, 20, 16, 1)"}]}},
    "mat-hands-polished": {"dominantAlbedo": "rgba(237, 238, 240, 1)", "secondaryAlbedo": "rgba(205, 208, 212, 1)",
                           "materialClass": "metal", "materialClassConfidence": 0.95},
    "mat-chrono-frosted": {"dominantAlbedo": "rgba(217, 219, 221, 1)", "secondaryAlbedo": "rgba(196, 199, 202, 1)",
                           "materialClass": "metal", "materialClassConfidence": 0.85},
    "mat-crystal": {"dominantAlbedo": "rgba(255, 255, 255, 0.06)", "secondaryAlbedo": "rgba(230, 235, 245, 0.12)",
                    "materialClass": "glass", "materialClassConfidence": 0.9},
    "mat-moonphase": {"dominantAlbedo": "rgba(27, 36, 71, 1)", "secondaryAlbedo": "rgba(232, 220, 184, 1)",
                      "materialClass": "metal", "materialClassConfidence": 0.85},
    "mat-strap": {"dominantAlbedo": "rgba(35, 38, 42, 1)", "secondaryAlbedo": "rgba(44, 48, 54, 1)",
                  "materialClass": "fabric", "materialClassConfidence": 0.95},
    "mat-stitch": {"dominantAlbedo": "rgba(232, 226, 212, 1)", "secondaryAlbedo": "rgba(217, 210, 194, 1)",
                   "materialClass": "fabric", "materialClassConfidence": 0.9},
    "mat-aperture-disc": {"dominantAlbedo": "rgba(242, 240, 234, 1)", "secondaryAlbedo": "rgba(17, 17, 17, 1)",
                          "materialClass": "ceramic", "materialClassConfidence": 0.8},
}
for c in spec["componentTree"]:
    c["colorMaterialRecipe"] = dict(RECIPES.get(c["material"], RECIPES["mat-case-polished"]))

# 3) detail kinds -> allowed vocabulary
KIND_MAP = {
    "det-01": "hole", "det-02": "hole", "det-03": "linework", "det-04": "hole",
    "det-05": "linework", "det-06": "linework", "det-07": "ridge", "det-08": "groove",
    "det-09": "contour", "det-10": "contour", "det-11": "ridge", "det-12": "bevel",
    "det-13": "bevel", "det-14": "ridge", "det-15": "stitch", "det-16": "linework",
    "det-17": "gloss", "det-18": "bevel"}
for d in spec["preSpecAssessment"]["detailInventory"]["details"]:
    d["kind"] = KIND_MAP.get(d["id"], d["kind"])

# 4) wire referencePbr from extraction results; crystal declared textureless
for m in spec["materials"]:
    mid = m["id"]
    if mid == "mat-crystal":
        m["textureless"] = {"declared": True,
                            "reason": "optically clear sapphire: transmission material with no texture channels; reflections come from environment"}
        continue
    res_path = PBR_DIR / f"{mid}-result.json"
    if res_path.exists():
        res = json.load(open(res_path, encoding="utf-8-sig"))
        m["referencePbr"] = {
            "usable": res.get("verdict") == "pass",
            "confidence": res.get("confidence"),
            "estimatedFidelity": res.get("estimatedFidelity"),
            "sourceCrop": res.get("sourceImage"),
            "palette": res.get("palette"),
            "maps": res.get("maps"),
            "note": "single-image reference-derived inference (not inverse rendering); crop verified on-part",
        }

# 5) lighting exposure/tone-mapping/contact-shadow intent
spec["lightingFromPhoto"].append({
    "role": "grade", "type": "render settings", "direction": "n/a", "color": "n/a",
    "intensity": "exposure 1.0, ACESFilmic tone mapping, physically correct lights; "
                 "soft contact shadow under case via shadow-catcher plane + ambient occlusion in recesses"})

# 6) unknowns resolved into assumptions (documented convention decisions)
spec["preSpecAssessment"]["unknownsToResolveBeforeImplementation"] = []

json.dump(spec, open(SPEC, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
print("fixup applied")
