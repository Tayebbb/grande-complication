"""Compare normalized mask row-spans between reference and render."""
import sys
from pathlib import Path

SK = Path(r"c:\Users\moham\.copilot\skills\img2threejs\forge")
sys.path.insert(0, str(SK / "stage1_intake"))
sys.path.insert(0, str(SK / "_shared"))

from extract_pbr_evidence import build_foreground_mask, load_image  # noqa: E402


def spans(path):
    w, h, pixels, _ = load_image(Path(path))
    mask, _, _ = build_foreground_mask(w, h, pixels)
    ys = [i // w for i, v in enumerate(mask) if v]
    y0, y1 = min(ys), max(ys)
    out = {}
    for k in range(41):
        fy = k / 40
        y = int(y0 + fy * (y1 - y0))
        xs = [x for x in range(w) if mask[y * w + x]]
        if xs:
            cx = (min(xs) + max(xs)) / 2
            out[fy] = ((max(xs) - min(xs) + 1) / w, (cx - w / 2) / w)
        else:
            out[fy] = (0.0, 0.0)
    return out


ref = spans(sys.argv[1])
ren = spans(sys.argv[2])
print(f"{'fy':>5} {'refW':>7} {'renW':>7} {'dW':>7}")
for fy in sorted(ref):
    rw, _ = ref[fy]
    nw, _ = ren[fy]
    flag = ' <<<' if abs(rw - nw) > 0.04 else ''
    print(f"{fy:5.2f} {rw:7.3f} {nw:7.3f} {nw-rw:+7.3f}{flag}")
