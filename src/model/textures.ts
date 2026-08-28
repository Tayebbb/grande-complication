/**
 * Generated canvas textures for the chronograph — all print/graphic systems live here
 * (spec: mat-dial-plate localOverrides, mat-moonphase mat-moon-art, mat-aperture-disc,
 * rep-print-ticks, rep-azurage-rings, mat-strap-weave normal map).
 * Deterministic: no Math.random — seeded/analytic drawing only.
 */
import * as THREE from 'three';

const TAU = Math.PI * 2;

function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  return [c, ctx];
}

function tex(canvas: HTMLCanvasElement, srgb = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* ------------------------------------------------------------------ */
/* Dial plate — sunburst gradient + tachymeter + railway + brand text */
/* ------------------------------------------------------------------ */

export interface DialTextures {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

/** Dial disc canvas. UV space: dial radius 1.70 maps to canvas radius*0.985. */
export function createDialTextures(size = 2048): DialTextures {
  const [c, ctx] = makeCanvas(size);
  const cx = size / 2;
  const R = size / 2; // uv radius 0.5 → dial r 1.70

  // -- sunburst radial gradient (spec mat-dial-sunburst stops) --
  const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, R);
  g.addColorStop(0.0, '#6E6259');
  g.addColorStop(0.45, '#4A423C');
  g.addColorStop(0.72, '#2A241F');
  g.addColorStop(1.0, '#191410');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // radial sunburst hairlines (det-17)
  ctx.save();
  ctx.translate(cx, cx);
  for (let i = 0; i < 720; i++) {
    const a = (i / 720) * TAU;
    const bright = i % 2 === 0;
    ctx.strokeStyle = bright ? 'rgba(255,244,230,0.045)' : 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * R * 0.06, Math.sin(a) * R * 0.06);
    ctx.lineTo(Math.cos(a) * R * 1.0, Math.sin(a) * R * 1.0);
    ctx.stroke();
  }
  ctx.restore();

  // -- tachymeter band (det-05): annulus r 0.86..0.985 --
  const tachyIn = R * 0.86;
  const tachyOut = R * 0.985;
  ctx.save();
  ctx.translate(cx, cx);
  ctx.fillStyle = '#14120F';
  ctx.beginPath();
  ctx.arc(0, 0, tachyOut, 0, TAU);
  ctx.arc(0, 0, tachyIn, 0, TAU, true);
  ctx.fill();
  // border rings
  ctx.strokeStyle = 'rgba(239,237,230,0.95)';
  ctx.lineWidth = size * 0.0016;
  ctx.beginPath(); ctx.arc(0, 0, tachyOut - ctx.lineWidth, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, tachyIn + ctx.lineWidth, 0, TAU); ctx.stroke();

  // tachymeter numerals at true tachymetric angles (v = 3600/t)
  const tachyVals = [500, 450, 400, 350, 300, 275, 250, 225, 200, 190, 180, 170, 160, 150, 140, 130, 120, 110, 105, 100, 95, 90, 85, 80, 75, 70, 65, 60];
  ctx.fillStyle = '#EFEDE6';
  const tachyFont = Math.round(size * 0.0195);
  ctx.font = `${tachyFont}px "Arial Narrow", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const v of tachyVals) {
    const t = 3600 / v; // seconds
    const aDeg = t * 6; // 6°/sec
    if (aDeg > 352) continue;
    const a = (aDeg - 90) * (Math.PI / 180); // 12 o'clock = -90°
    const rr = (tachyIn + tachyOut) / 2 + R * 0.004;
    ctx.save();
    ctx.translate(Math.cos(a) * rr, Math.sin(a) * rr);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(String(v), 0, 0);
    ctx.restore();
    // tick
    ctx.strokeStyle = '#EFEDE6';
    ctx.lineWidth = size * 0.0011;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (tachyIn + R * 0.005), Math.sin(a) * (tachyIn + R * 0.005));
    ctx.lineTo(Math.cos(a) * (tachyIn + R * 0.022), Math.sin(a) * (tachyIn + R * 0.022));
    ctx.stroke();
  }
  // BASE 1000 under 12
  ctx.font = `${Math.round(size * 0.0155)}px "Arial Narrow", Arial, sans-serif`;
  ctx.save();
  ctx.translate(0, -(tachyIn + tachyOut) / 2);
  ctx.fillText('BASE 1000', 0, R * 0.033);
  ctx.restore();
  // SWISS MADE split at 6
  ctx.font = `${Math.round(size * 0.0165)}px "Arial Narrow", Arial, sans-serif`;
  ctx.save();
  const swissR = (tachyIn + tachyOut) / 2;
  ctx.translate(-R * 0.128, swissR * 0.995);
  ctx.fillText('SWISS', 0, 0);
  ctx.restore();
  ctx.save();
  ctx.translate(R * 0.128, swissR * 0.995);
  ctx.fillText('MADE', 0, 0);
  ctx.restore();

  // -- railway minute/seconds track (det-06): r 0.79..0.845 --
  const railIn = R * 0.79;
  const railOut = R * 0.845;
  ctx.strokeStyle = 'rgba(239,237,230,0.9)';
  ctx.lineWidth = size * 0.0011;
  ctx.beginPath(); ctx.arc(0, 0, railIn, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, railOut, 0, TAU); ctx.stroke();
  for (let i = 0; i < 300; i++) {
    const a = (i / 300) * TAU - Math.PI / 2;
    const major = i % 5 === 0;
    ctx.lineWidth = major ? size * 0.0016 : size * 0.0008;
    const r0 = major ? railIn : railIn + (railOut - railIn) * 0.28;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
    ctx.lineTo(Math.cos(a) * railOut, Math.sin(a) * railOut);
    ctx.stroke();
  }
  // boxed 5-minute numerals (skip 12/3/6/9 zones covered by furniture)
  ctx.font = `${Math.round(size * 0.0145)}px "Arial Narrow", Arial, sans-serif`;
  for (let m = 5; m <= 55; m += 5) {
    if (m === 15 || m === 30 || m === 45) continue; // subdial / moon zones
    const a = (m / 60) * TAU - Math.PI / 2;
    const rr = R * 0.762;
    ctx.save();
    ctx.translate(Math.cos(a) * rr, Math.sin(a) * rr);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(String(m), 0, 0);
    ctx.restore();
  }

  // -- brand text (det-16) --
  ctx.fillStyle = '#EFEDE6';
  ctx.font = `${Math.round(size * 0.026)}px Georgia, "Times New Roman", serif`;
  ctx.fillText('PATEK PHILIPPE', 0, -R * 0.30);
  ctx.font = `${Math.round(size * 0.02)}px Georgia, "Times New Roman", serif`;
  ctx.fillText('GENEVE', 0, -R * 0.255);
  ctx.restore();

  // -- roughness canvas: print & tachy band glossier (darker = smoother) --
  const [rc, rctx] = makeCanvas(size / 2);
  rctx.fillStyle = '#8C8C8C'; // dial satin base rough ~0.55
  rctx.fillRect(0, 0, size / 2, size / 2);
  rctx.save();
  rctx.translate(size / 4, size / 4);
  rctx.fillStyle = '#5A5A5A'; // lacquered tachy band smoother
  rctx.beginPath();
  rctx.arc(0, 0, (size / 4) * 0.985, 0, TAU);
  rctx.arc(0, 0, (size / 4) * 0.86, 0, TAU, true);
  rctx.fill();
  rctx.restore();

  const map = tex(c);
  const roughnessMap = tex(rc, false);
  return { map, roughnessMap };
}

/* --------------------------------------------------- */
/* Subdial faces — azurage rings + printed scales      */
/* --------------------------------------------------- */

export type SubdialKind = 'seconds' | 'minutes' | 'date';

export function createSubdialTexture(kind: SubdialKind, size = 512): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(size);
  const cx = size / 2;
  const R = size / 2;

  // recessed well base — slightly darker than dial mid tone
  const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, R);
  g.addColorStop(0, '#3A332D');
  g.addColorStop(1, '#221D18');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.translate(cx, cx);

  // azurage concentric grooves (det-08 / rep-azurage-rings)
  const rings = 26;
  const azMax = kind === 'date' ? 0.52 : 0.74;
  for (let i = 1; i <= rings; i++) {
    const rr = (i / rings) * R * azMax;
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(0,0,0,0.16)' : 'rgba(255,240,225,0.05)';
    ctx.lineWidth = (R * azMax) / rings;
    ctx.beginPath();
    ctx.arc(0, 0, rr, 0, TAU);
    ctx.stroke();
  }

  ctx.fillStyle = '#EFEDE6';
  ctx.strokeStyle = '#EFEDE6';

  if (kind !== 'date') {
    // double ring border print
    ctx.lineWidth = size * 0.006;
    ctx.beginPath(); ctx.arc(0, 0, R * 0.9, 0, TAU); ctx.stroke();
    ctx.lineWidth = size * 0.0022;
    ctx.beginPath(); ctx.arc(0, 0, R * 0.82, 0, TAU); ctx.stroke();

    // ticks
    const divisions = kind === 'seconds' ? 60 : 30;
    for (let i = 0; i < divisions; i++) {
      const a = (i / divisions) * TAU - Math.PI / 2;
      const major = kind === 'seconds' ? i % 10 === 0 : i % 5 === 0;
      ctx.lineWidth = major ? size * 0.006 : size * 0.0028;
      const r0 = major ? R * 0.72 : R * 0.765;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      ctx.lineTo(Math.cos(a) * R * 0.81, Math.sin(a) * R * 0.81);
      ctx.stroke();
    }
    // numerals
    ctx.font = `${Math.round(size * 0.085)}px "Arial Narrow", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (kind === 'seconds') {
      for (let v = 20; v <= 60; v += 20) {
        const a = (v / 60) * TAU - Math.PI / 2;
        ctx.fillText(String(v), Math.cos(a) * R * 0.58, Math.sin(a) * R * 0.58);
      }
    } else {
      for (const v of [10, 20, 30]) {
        const a = (v / 30) * TAU - Math.PI / 2;
        ctx.fillText(String(v), Math.cos(a) * R * 0.58, Math.sin(a) * R * 0.58);
      }
    }
  } else {
    // date arc 1..31 (det-03) — reference starts '1' at ~1:00 and runs clockwise
    const dateStart = -Math.PI / 2 + 0.62;
    ctx.font = `${Math.round(size * 0.058)}px "Arial Narrow", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let d = 1; d <= 31; d += 2) {
      const a = ((d - 1) / 31) * TAU + dateStart;
      const rr = R * 0.87;
      ctx.save();
      ctx.translate(Math.cos(a) * rr, Math.sin(a) * rr);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillText(String(d), 0, 0);
      ctx.restore();
    }
    for (let d = 2; d <= 31; d += 2) {
      const a = ((d - 1) / 31) * TAU + dateStart;
      const rr = R * 0.87;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr, size * 0.006, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
  return tex(c);
}

/* ------------------------------------------ */
/* Moonphase disc — navy, stars, gold moon    */
/* ------------------------------------------ */

export function createMoonTexture(size = 512): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(size);
  const cx = size / 2;

  const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  g.addColorStop(0, '#2A3155');
  g.addColorStop(1, '#1E1A29'); // measured reference moon-zone dominant
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // deterministic star field (det-02)
  const stars: Array<[number, number, number]> = [
    [0.22, 0.28, 0.035], [0.5, 0.16, 0.026], [0.72, 0.3, 0.032],
    [0.33, 0.52, 0.028], [0.58, 0.56, 0.038], [0.17, 0.7, 0.026],
    [0.78, 0.68, 0.024], [0.44, 0.78, 0.032], [0.64, 0.12, 0.02],
    [0.3, 0.88, 0.022], [0.55, 0.34, 0.02], [0.12, 0.48, 0.024],
  ];
  ctx.fillStyle = '#E8DCB8';
  for (const [sx, sy, sr] of stars) drawStar(ctx, sx * size, sy * size, sr * size);

  // moon disc at window left (reference position)
  const mx = size * 0.38;
  const my = size * 0.44;
  const mr = size * 0.16;
  const mg = ctx.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.1, mx, my, mr);
  mg.addColorStop(0, '#F2E8C8');
  mg.addColorStop(1, '#D8C89A');
  ctx.fillStyle = mg;
  ctx.beginPath();
  ctx.arc(mx, my, mr, 0, TAU);
  ctx.fill();
  // craters
  ctx.fillStyle = 'rgba(160,140,95,0.5)';
  for (const [dx, dy, dr] of [[-0.3, -0.2, 0.12], [0.15, 0.3, 0.09], [0.3, -0.35, 0.07], [-0.1, 0.1, 0.05]] as const) {
    ctx.beginPath();
    ctx.arc(mx + dx * mr, my + dy * mr, dr * mr, 0, TAU);
    ctx.fill();
  }
  return tex(c);
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.42;
    if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/* -------------------------------------------------- */
/* Aperture discs — SAT / MAR / leap "3" / day-night  */
/* -------------------------------------------------- */

export function createApertureDiscTexture(
  text: string,
  opts: { round?: boolean; dayNight?: boolean } = {},
  size = 256,
): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(size);
  ctx.fillStyle = '#F2F0EA';
  ctx.fillRect(0, 0, size, size);
  if (opts.dayNight) {
    const g = ctx.createLinearGradient(0, 0, size, size);
    g.addColorStop(0, '#F5F2E8');
    g.addColorStop(1, '#E9E4D4');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  } else {
    ctx.fillStyle = '#111111';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.round(size * (opts.round ? 0.52 : 0.42))}px "Arial Narrow", Arial, sans-serif`;
    ctx.fillText(text, size / 2, size * 0.54);
  }
  return tex(c);
}

/* ----------------------------------------------------- */
/* Strap braid — height field → albedo/normal/roughness  */
/* ----------------------------------------------------- */

/** Chevron braid height at (u along strap, v across width) in 0..1. */
export function braidHeight(u: number, v: number): number {
  const cols = 10.0;
  const freq = 13.0;
  const a = Math.sin(TAU * (v * cols + u * freq));
  const b = Math.sin(TAU * (v * cols - u * freq));
  const weave = Math.max(a, b); // interleaved diagonal cords
  const h = Math.pow(Math.max(0, weave * 0.5 + 0.5), 1.6); // fat cords, small voids
  // rolled raised edges (det-14)
  const edge = Math.max(0, 1 - Math.min(v, 1 - v) / 0.06);
  return Math.min(1, h * 0.72 + edge * edge * 0.5);
}

export interface StrapTextures {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

export function createStrapTextures(size = 1024): StrapTextures {
  // height field
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // u along strap = y, v across = x
      h[y * size + x] = braidHeight(y / size, x / size);
    }
  }

  // albedo: charcoal with height-correlated sheen + fiber micro-stripes
  const [ac, actx] = makeCanvas(size);
  const aimg = actx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const hv = h[y * size + x];
      const fiber = 0.5 + 0.5 * Math.sin(x * 1.7 + y * 11.3) * Math.sin(y * 0.9);
      const base = 30 + hv * 26 + fiber * 6;
      aimg.data[i] = Math.round(base * 1.0);
      aimg.data[i + 1] = Math.round(base * 1.06);
      aimg.data[i + 2] = Math.round(base * 1.16);
      aimg.data[i + 3] = 255;
    }
  }
  actx.putImageData(aimg, 0, 0);

  // normal from height (Sobel)
  const [nc, nctx] = makeCanvas(size);
  const nimg = nctx.createImageData(size, size);
  const strength = 2.4;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const xm = (x - 1 + size) % size, xp = (x + 1) % size;
      const ym = (y - 1 + size) % size, yp = (y + 1) % size;
      const dx = (h[y * size + xp] - h[y * size + xm]) * strength;
      const dy = (h[yp * size + x] - h[ym * size + x]) * strength;
      const inv = 1 / Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      nimg.data[i] = Math.round((-dx * inv * 0.5 + 0.5) * 255);
      nimg.data[i + 1] = Math.round((-dy * inv * 0.5 + 0.5) * 255);
      nimg.data[i + 2] = Math.round((inv * 0.5 + 0.5) * 255);
      nimg.data[i + 3] = 255;
    }
  }
  nctx.putImageData(nimg, 0, 0);

  // roughness: cord crowns slightly less rough (sheen along crowns)
  const [rc, rctx] = makeCanvas(size);
  const rimg = rctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const hv = h[y * size + x];
      const rough = 225 - hv * 55;
      rimg.data[i] = rimg.data[i + 1] = rimg.data[i + 2] = Math.round(rough);
      rimg.data[i + 3] = 255;
    }
  }
  rctx.putImageData(rimg, 0, 0);

  const map = tex(ac);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  const normalMap = tex(nc, false);
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  const roughnessMap = tex(rc, false);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  return { map, normalMap, roughnessMap };
}

/* -------------------------------------------------- */
/* Brushed metal roughness streaks (pusher tops etc.) */
/* -------------------------------------------------- */

export function createBrushedRoughness(size = 256, vertical = false): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(size);
  ctx.fillStyle = '#6E6E6E';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < size; i++) {
    const v = 0.5 + 0.5 * Math.sin(i * 12.9898) * Math.sin(i * 78.233);
    ctx.strokeStyle = `rgba(${v > 0.5 ? 255 : 0},${v > 0.5 ? 255 : 0},${v > 0.5 ? 255 : 0},${0.05 + v * 0.06})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (vertical) { ctx.moveTo(i, 0); ctx.lineTo(i, size); }
    else { ctx.moveTo(0, i); ctx.lineTo(size, i); }
    ctx.stroke();
  }
  const t = tex(c, false);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
