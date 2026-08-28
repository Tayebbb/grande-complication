# Image Analysis — reference-watch (Patek Philippe 5270-class perpetual calendar chronograph)

Reference: `public/reference/reference-watch.png` (3840×5381, front-facing studio product shot, white background)

## Layer 1 — Identification & classification
- Work type: **wristwatch — mechanical perpetual-calendar chronograph** (Patek Philippe Grande
  Complication 5270 family styling). Front elevation, dial facing camera.
- Broad classification: precision mechanical instrument / timepiece.
- `primaryDomain`: `object`. Confidence: **0.97**.
- Observation: full physical inventory below precedes any purpose claims.

## Layer 2 — Overall form & silhouette
- Bounding volume: vertically elongated stack — central **short cylinder** (case, axis +Z toward
  camera) with 4 tapered prism lugs; two **curved, tapered extruded slabs** (strap halves) leaving
  the lug pairs at top/bottom and curving away from camera.
- Symmetry: bilateral about vertical (Y) axis, EXCEPT crown + 2 pushers on the wearer-right flank
  (3 o'clock side, +X). Dial internals radially arranged.
- Proportions (reference dimension = case outer diameter D):
  - strap width ≈ 0.55 D; visible strap length each side ≈ 1.1 D
  - bezel outer ≈ 0.98 D; dial opening ≈ 0.82 D
  - case thickness (inferred from flank highlight): ≈ 0.30 D
  - crown diameter ≈ 0.17 D; pusher width ≈ 0.14 D
  - lug span ≈ 1.05 D, lugs taper from case band to strap anchor

## Layer 3 — Macro → meso → micro
- MACRO: StrapAssembly (upper, lower) · CaseAssembly · DialAssembly · HandAssembly
- MESO:
  - Case: main case band (polished), bezel (concave sloped polished ring), domed crystal,
    case back (hidden), 4 faceted lugs, fluted crown (3:00), rectangular upper pusher (~2:00),
    rectangular lower pusher (~4:00)
  - Dial: gradient dial plate; black tachymeter band ("BASE 1000", white print) at perimeter;
    fine minute/chapter ring; applied faceted baton hour markers (double baton at 12);
    twin rectangular apertures side-by-side under 12 (day "SAT" | month "MAR");
    left subdial at 9 (small seconds, 10–60 scale); right subdial at 3 (30-minute counter);
    lower complication at 6 = moonphase aperture (navy disc, stars + moon) wrapped by
    date arc 1–31; two small round windows flanking at ~7:30 (day/night) and ~4:30 (leap year, "3");
    text "PATEK PHILIPPE / GENEVE" beneath apertures, "SWISS MADE" at 6 edge
  - Hands: leaf hour hand, leaf minute hand, slender central chrono-seconds hand,
    2 subdial hands, short date hand at the 6 o'clock complication
- MICRO (zone-crop verified): crown with ~20 axial flutes + embossed round end medallion;
  pushers with BRUSHED satin tops and polished flanks; bezel rim highlight; marker facets
  (pyramidal ridge crease down each baton); crystal reflection streaks; braided textile strap
  weave (diagonal chevron); twisted ivory edge stitching; printed tick systems (tachymeter
  "500…160" numerals, boxed 5-min numbers, railway minute track); subdial azurage concentric
  grooves; moonphase navy disc with textured stars + moon; thin polished rehaut ring between
  dial edge and bezel; leaf hands with center ridge (two facets); frosted slender chrono hand;
  polished aperture frames (day/month rectangles, 2 round windows).

## Layer 4 — Spatial relationships (scene-graph triplets)
- <bezel, attached-to (flush overlap), case front rim>
- <crystal, embedded-in (socket), bezel inner bore; domed, slightly proud>
- <dial, inside, case bore, behind crystal>
- <tachymeter band, flush-with, dial perimeter>
- <markers, applied-on, dial surface>
- <center hands, socketed-on, central pinion stack above dial (order: hour, minute, chrono)>
- <subdial hands, socketed-on, subdial pivots at 3:00 / 9:00 / 6:00 positions>
- <crown, socketed-into, case flank at 3:00; insertion axis local +X>
- <upper pusher, socketed-into, case flank at 2:00; radial insertion axis>
- <lower pusher, socketed-into, case flank at 4:00; radial insertion axis>
- <lugs, integral-with, case band at 4 corners>
- <strap ends, attached-to (spring-bar between lug pair), lug pairs; contact: socket>
- <moonphase disc, behind, dial aperture at 6:00>
- <case back, attached-to (screw-down), case rear; hidden in view>

## Layer 5 — Materials & surface (PBR)
| Component | Albedo | Metalness | Roughness | Notes |
|---|---|---|---|---|
| Case/bezel/lugs/crown/pushers | neutral silver-white | 1.0 | 0.10–0.22 | polished platinum; soft wrap highlights; micro-bevel edge glints |
| Dial plate | warm charcoal gradient (center ~#6E6259 → edge ~#191410) | 0.15 | 0.45–0.6 | radial sunburst satin sheen |
| Tachymeter band | near-black #121110, white print | 0.0 | 0.6 | matte print band |
| Markers/hands | silver-white | 1.0 | 0.08–0.16 | faceted, high edge specular |
| Moonphase disc | deep navy #1B2447, pale-gold stars | 0.6 | 0.25 | lacquer gloss |
| Strap | charcoal #23262A | 0.0 | 0.8–0.9 | CORRECTED (zone r2c1): chunky braided textile, diagonal chevron weave ~9 braid columns, strong normal relief, rolled raised edges |
| Stitching | ivory #E8E2D4 | 0.0 | 0.65 | CORRECTED: large twisted rope-style stitches (~7 per visible edge), recessed groove near edge |
| Crystal | transparent | 0.0 | ~0.03 | sapphire, IOR ≈ 1.76, transmission ~1 |

## Layer 6 — Color & finish
- Case metals: high value, near-zero saturation, gloss metallic finish.
- Dial gradient (radial, ordered stops): 0.0 → #6E6259 (warm gray-brown, satin), 0.55 → #4A423C,
  0.8 → #2A241F, 1.0 → #191410 near-black. Highlight bias toward upper-left in photo = lighting,
  NOT albedo (excluded from albedo claims).
- Print: off-white #EFEDE6. Strap: very dark desaturated blue-charcoal, matte. Stitch: ivory satin.

## Layer 7 — Identity-defining features
1. Twin side-by-side rectangular day/month apertures beneath 12 — signature of this reference.
2. Moonphase aperture + surrounding 1–31 date arc + two flanking round windows at 6.
3. Black tachymeter ring with "BASE 1000" white print.
4. Two symmetric subdials at 3:00 and 9:00 with white concentric-ring borders.
5. Leaf-profile hour/minute hands + slender chrono hand with counterweight.
6. Applied faceted baton markers, doubled baton at 12.
7. Fabric-weave embossed strap with ivory contrast stitching.
8. Fluted crown flanked by two rectangular chrono pushers.
9. Concave polished bezel + domed crystal (edge reflections).
10. "PATEK PHILIPPE GENEVE" printed arc under the apertures.

## Layer 8 — Uncertainty & single-image limits
- HIDDEN: case back (assume polished screw-down disc; modeled conservatively, labeled inferred).
- HIDDEN: strap underside, buckle/clasp (out of frame; buckle omitted from hero, conservative).
- OCCLUDED: lug underside, spring bars (modeled as simple cylinders; inferred).
- UNCERTAIN: exact crystal dome height (inferred ~0.05 D from reflection streaks).
- UNCERTAIN: case flank profile between bezel and back (single highlight band → assume gently
  convex polished band, per 5270 conventions).
- NOT MODELED: internal movement train (invisible). Exploded view uses a thin inferred
  "movement plate" layer clearly derived from convention, not observation.
- Perspective: essentially orthographic front view; no significant distortion to compensate.
