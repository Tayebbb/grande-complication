# MASTER PROMPT — Cinematic Scroll-Driven Product Experience

> Replace `{PRODUCT}` (e.g. "a mechanical watch", "a running shoe", "an espresso machine") and `{REFERENCE}` (image/photos of the real product). Everything else applies to any product.

---

Build a high-fidelity, procedural, animation-ready 3D model of `{PRODUCT}` from `{REFERENCE}`, then wrap it in one continuous, cinematic, scroll-driven product story. Use multi-agent orchestration for both building and verification. Deploy the result and verify it live.

## 1. Model reconstruction

- Reconstruct the product **procedurally in code** (Three.js) from the reference — no downloaded models. Inspect the reference first; identify every real, meaningful component and its actual construction hierarchy.
- Match proportions, silhouette, materials, colors, and printed/engraved details against the reference with measurable gates (mask IoU, aspect, per-part color ΔE). Ground color recipes in measured crops of the reference, not global averages.
- Model the invisible interior authentically: **research the product's real internal architecture online** (how it is actually built — mechanisms, fasteners, sub-assemblies, materials) and reproduce every important pin, screw, spring, gear, module, and moving mechanism. Do not invent parts that couldn't exist; do not skip parts that must.
- Every component keeps its own named node, immutable assembled transform, and clean boundaries so it can be animated independently and re-derived (component → triangle coverage must reconcile 1:1 with the spec).
- Respect performance budgets (draw calls, triangles, fps ≥ 60 on integrated GPU at 1.75 dpr). Instance repeated small parts; merge static clusters; disable shadow casting on micro-parts.

## 2. The complete motion story (one scrubbed timeline)

The entire sequence is **one physical event scrubbed by scroll** — scroll down plays it, scroll up plays the exact reverse, stopping mid-scroll freezes the exact frame. Never implement the reverse as a separate animation. No animation may play independently of scroll (ambient mechanism motion must be a pure function of scroll progress too).

```
0%  RESTING  — product sits on a physical surface, completely still,
              dark room, one physical spotlight, real contact shadow
    LIFT     — it overcomes its weight and rises (double-eased, zero-slope
              start); shadow softens → spreads → separates; no stray rotation
    ORIENT   — a single geodesic pivot (quaternion slerp) turns it to face
              the viewer — never a multi-axis Euler corkscrew
    APPROACH — the PRODUCT travels toward the camera (real Z motion,
              not a camera zoom); the surface dissolves into darkness
    HELD BEAT— a true camera plateau at inspection distance (duplicate keys)
    EXPLODE  — precision mechanical disassembly, component by component
100% EXPLODED HERO — full assembly readable, breathes; ramp tail decelerates
              to zero slope so reversing out of it is gentle
THEN DOSSIER — a second scrubbed act: per-component close-up tour (see §4)
SCROLL UP    — same timeline backward: reassemble in exact reverse order →
              retreat → soft landing (zero-slope settle, shadow returns) →
              final frame ≡ opening frame, verified pixel-identical
```

## 3. Exploded view rules

- Separate along **the product's real construction axes** (how it would actually be disassembled), staggered in physically honest order (outer → inner; covers open **before** the parts behind them exit).
- Components must never intersect at rest, at full explosion, **or during any transit frame**. Do the collision math: check every lane against every wall/aperture it crosses (radial + depth at crossing time), keep engineering margins, and route parts through real openings (e.g. rear parts exit through the opened back, never through solid walls).
- Preserve orientation and spatial relationships; no random scattering. The final state must read like a professional exploded engineering visualization with clear z-slices (≥0.1–0.2 unit separation between adjacent layers as seen from the finale camera).
- Choreograph in per-component windows on one master progress; sync chapter text, callout labels (anchored to live geometry, minSeparation-gated), a chapter rail, and a progress bar to the same value. Labels must answer "what am I looking at right now and why does it matter."
- Camera: monotone C1 Hermite over keyframes (no overshoot, no ease-pumping); wide opening → stable lift → subtle reframes → finale swings to read the full corridor. No spins, snap zooms, or shakes.

## 4. Component dossier (post-exploded marketing tour)

After the exploded hero, a second pinned scrub visits **every marketable component** one at a time:

- **Research each material/mechanism online first** and write editorial copy with real facts (alloy compositions, processes, temperatures, hardness scales, historical process names). Fact-check every number — density ratios, dates, cycle lengths. No invented claims; soften puffery.
- Each stop: component name, material chip (accent color), 2–3 sentence story, spec rows, and a target ring tracking the part's live position.
- Camera close-ups must be **ray-verified against the exploded occlusion field** (anchor on measured sub-mesh world centers, sightlines through real apertures, no photobombing neighbors).
- **Spotlight isolation:** while a stop is active, only the featured component group stays lit — everything else sinks into shadow (~10%, by darkening color/env/emissive on un-shared per-component materials — never transparency), the studio rig dims, and a dedicated isolation light on its own render layer illuminates the featured meshes only. All of it a continuous function of scroll (triangular per-stop weights) so transitions crossfade and reverse perfectly.
- Entry and exit camera keys equal the surrounding acts' keys so the handoff is seamless in both directions; blend over the first ~3% to absorb scrub lag on fast flings.

## 5. Lighting & physicality

- Opening/closing: one concentrated physical spotlight (penumbra, decay, cast shadow) + minimal ambient; the environment falls to black; contact shadow disc + real shadow under the product.
- The spotlight physically tracks the product through lift and approach. The full studio rig (key/fill/rim/env) ramps in only for the exploded inspection, and back out. Begin and end lighting states must match exactly.
- Smoothness: input smoothing (Lenis or equivalent) + scrub damping (~1s) + enough scroll length per phase that nothing ever snaps; frame-rate-independent lerps (`1-(1-k)^(dt·60)`).

## 6. Craft & platform bar

- Quality target: **luxury product film + mechanical engineering visualization** — not a spinning viewer, not a generic demo. 10/10 UX: premium dark theme, serif display + tracked micro-type, restrained copy, aria-live chapter announcements, keyboard-safe, reduced-motion support (instant fades, scrub still works), responsive (aspect-ratio breakpoint stacks copy), zero console errors.
- Clean teardown (HMR + beforeunload): kill triggers, tickers, renderer, dispose geometry/materials.
- Legal: never ship a real third-party trademark on the product — swap to a neutral marque.

## 7. Multi-agent verification protocol (mandatory, iterative)

Dispatch separate agents and iterate until honest scores ≥ 9/10:

1. **Builder agents** for heavy construction (detail modules, sub-assemblies) with explicit part lists and tri budgets.
2. **Research agents** for real-world architecture and material facts before modeling/writing.
3. **Critic agents (read-only)** each round, scoring 1–10 with evidence: reference fidelity, exploded-view quality/detail, motion integrity (they must do the transit collision math from the code), fact accuracy of all copy, shot quality of every dossier frame, scroll discipline (single state writer, everything f(scroll)). Fix every blocker and re-verify; never inflate scores; report remaining limitations honestly.
4. **QA matrix:** capture real rendered frames at 0/10/…/100% forward, revisit beats scrolling upward, prove **forward/reverse pixel parity** and bit-identical pose determinism at the same progress; test rapid flings, slow scrolls, arbitrary stops; verify text sync, no clipping, no lighting/camera jumps, budgets met.

## 8. Ship & live-verify

- Typecheck clean, production build, commit with descriptive messages, push to a **private GitHub repo**, deploy via GitHub Pages Actions, watch the run to success.
- Verify the **live** site end-to-end in a real browser: zero console errors, chapters/labels/dossier firing, fps healthy, full round trip 0 → 100 → 0 restores the exact opening state.
- Final report: what shipped, verification scores per round, measured performance, and an honest list of remaining limitations.
