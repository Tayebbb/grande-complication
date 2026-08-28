"""Debug: dump foreground-mask bboxes the way diagnose_render sees them."""
import sys
from pathlib import Path

SK = Path(r"c:\Users\moham\.copilot\skills\img2threejs\forge")
sys.path.insert(0, str(SK / "stage1_intake"))
sys.path.insert(0, str(SK / "_shared"))

from extract_pbr_evidence import build_foreground_mask, load_image  # noqa: E402

for name in sys.argv[1:]:
    w, h, pixels, load_warn = load_image(Path(name))
    mask, info, warnings = build_foreground_mask(w, h, pixels)
    xs = [i % w for i, v in enumerate(mask) if v]
    ys = [i // w for i, v in enumerate(mask) if v]
    if not xs:
        print(name, "EMPTY MASK", warnings)
        continue
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    bw, bh = x1 - x0 + 1, y1 - y0 + 1
    print(f"{name}: img {w}x{h} bbox x[{x0}..{x1}] y[{y0}..{y1}] -> {bw}x{bh} aspect {bw/bh:.4f} fill {len(xs)/(w*h):.3f}")
    print("  info:", {k: v for k, v in info.items() if not isinstance(v, list)}, "warn:", warnings)
