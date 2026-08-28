/**
 * Geometry builders for every spec component. Watch-local frame: dial faces +Z,
 * +Y toward 12 o'clock, +X toward the crown (3 o'clock). 1 unit = 10 mm, D = 4.10.
 * All revolved profiles are authored as (radius, z) pairs and rotated so the
 * revolution axis is +Z.
 */
import * as THREE from 'three';
import { braidHeight } from './textures';

const TAU = Math.PI * 2;

/** LatheGeometry around +Z from (r, z) profile points. */
function latheZ(points: Array<[number, number]>, segments = 96): THREE.BufferGeometry {
  const pts = points.map(([r, z]) => new THREE.Vector2(Math.max(r, 0.0001), z));
  const geo = new THREE.LatheGeometry(pts, segments);
  geo.rotateX(Math.PI / 2); // lathe axis +Y -> +Z
  geo.scale(1, -1, 1); // mirror restores outward winding for our profile direction
  geo.computeVertexNormals();
  return geo;
}

function cylinderZ(rTop: number, rBottom: number, height: number, radial = 64, open = false): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(rTop, rBottom, height, radial, 1, open);
  g.rotateX(Math.PI / 2);
  return g;
}

/* ------------------------- case ------------------------- */

/** Main case band: convex polished flank (lathe). z -0.42 .. 0.34. */
export function buildCaseMain(): THREE.BufferGeometry {
  return latheZ([
    [1.58, -0.42],
    [1.86, -0.415],
    [1.98, -0.30],
    [2.04, -0.10],
    [2.05, 0.02],
    [2.03, 0.16],
    [1.97, 0.30],
    [1.94, 0.34],
    [1.72, 0.345],
    [1.70, 0.30],
    [1.70, -0.30],
    [1.58, -0.42],
  ], 128);
}

/** Bezel: concave polished slope from case rim to crystal bore. z 0.30 .. 0.575. */
export function buildBezel(): THREE.BufferGeometry {
  return latheZ([
    [1.72, 0.30],
    [1.99, 0.30],
    [2.03, 0.38],
    [2.0, 0.45],
    [1.9, 0.52],
    [1.79, 0.56],
    [1.745, 0.575],
    [1.72, 0.55],
    [1.72, 0.30],
  ], 128);
}

/** Domed sapphire crystal: wall + shallow dome, apex z 0.86. */
export function buildCrystal(): THREE.BufferGeometry {
  const profile: Array<[number, number]> = [
    [1.66, 0.50],
    [1.71, 0.52],
    [1.715, 0.64],
  ];
  // dome arc from (1.715, 0.64) to (0, 0.86)
  const steps = 14;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const r = 1.715 * Math.cos(t * Math.PI * 0.5);
    const z = 0.64 + 0.22 * Math.sin(t * Math.PI * 0.5);
    profile.push([r, z]);
  }
  return latheZ(profile, 96);
}

/** Case back (hidden in reference — inferred screw-down disc). */
export function buildCaseBack(): THREE.BufferGeometry {
  return latheZ([
    [0.0, -0.60],
    [1.30, -0.595],
    [1.72, -0.55],
    [1.90, -0.50],
    [1.92, -0.44],
    [1.60, -0.42],
    [0.0, -0.42],
  ], 96);
}

/** Inferred movement plate: brushed dark disc with stepped bridges hint. */
export function buildMovementPlate(): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];
  const disc = cylinderZ(1.58, 1.58, 0.30);
  disc.translate(0, 0, -0.215);
  geos.push(disc);
  const ring = cylinderZ(1.30, 1.30, 0.05);
  ring.translate(0, 0, -0.045);
  geos.push(ring);
  const hub = cylinderZ(0.32, 0.32, 0.06, 32);
  hub.translate(0, 0, -0.03);
  geos.push(hub);
  return mergeGeometries(geos);
}

/* ------------------------- lugs ------------------------- */

/** One lug: short tapered faceted prism hugging the case corner (det-18). */
export function buildLug(): THREE.BufferGeometry {
  // profile in XY (front view), root at origin pointing +Y, tip slightly narrowed
  const s = new THREE.Shape();
  s.moveTo(-0.27, 0);
  s.lineTo(-0.24, 0.42);
  s.quadraticCurveTo(-0.22, 0.57, -0.16, 0.62);
  s.lineTo(0.16, 0.62);
  s.quadraticCurveTo(0.22, 0.57, 0.24, 0.42);
  s.lineTo(0.27, 0);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {
    depth: 0.34,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 3,
  });
  g.translate(0, 0, -0.26);
  return g;
}

/** Lug placements: [x, y, rotZ] for the 4 corners (flared ~28deg outward). */
export const LUG_PLACEMENTS: Array<[number, number, number]> = [
  [1.18, 1.42, -0.5],
  [-1.18, 1.42, 0.5],
  [1.18, -1.42, Math.PI + 0.5],
  [-1.18, -1.42, Math.PI - 0.5],
];

/* ------------------------- crown + pushers ------------------------- */

/** Fluted crown w/ stem collar + end medallion (det-11). Axis +X at x 2.05.. */
export function buildCrownGroup(matPolished: THREE.Material): THREE.Group {
  const group = new THREE.Group();

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.16, 24), matPolished);
  collar.rotation.z = Math.PI / 2;
  collar.position.x = 2.13;
  collar.name = 'crown-collar';
  group.add(collar);

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.385, 0.32, 40), matPolished);
  body.rotation.z = Math.PI / 2;
  body.position.x = 2.37;
  body.name = 'crown-body';
  group.add(body);

  // 20 axial flutes (rep-crown-flutes) — instanced ribs riding the crown
  const ribGeo = new THREE.BoxGeometry(0.32, 0.055, 0.075);
  const flutes = new THREE.InstancedMesh(ribGeo, matPolished as THREE.MeshStandardMaterial, 20);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * TAU;
    pos.set(2.37, Math.cos(a) * 0.385, Math.sin(a) * 0.385);
    q.setFromEuler(new THREE.Euler(-a, 0, 0));
    m.compose(pos, q, new THREE.Vector3(1, 1, 1));
    flutes.setMatrixAt(i, m);
  }
  flutes.name = 'crown-flutes';
  flutes.userData.explodeWithParent = true;
  group.add(flutes);

  const medallion = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.035, 32), matPolished);
  medallion.rotation.z = Math.PI / 2;
  medallion.position.x = 2.545;
  medallion.name = 'crown-medallion';
  medallion.userData.explodeWithParent = true;
  group.add(medallion);

  const emboss = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.02, 8, 24), matPolished);
  emboss.rotation.y = Math.PI / 2;
  emboss.position.x = 2.565;
  emboss.name = 'crown-emboss';
  emboss.userData.explodeWithParent = true;
  group.add(emboss);

  return group;
}

/** Pusher: rounded trapezoid block, radial insertion axis (det-12). */
export function buildPusherGeometries(): { block: THREE.BufferGeometry; cap: THREE.BufferGeometry } {
  // profile in (tangential=x, depth=z) plane, extruded radially (+y before orient)
  const s = new THREE.Shape();
  const w = 0.20, d = 0.17, r = 0.07;
  s.moveTo(-w + r, -d);
  s.lineTo(w - r, -d);
  s.quadraticCurveTo(w, -d, w, -d + r);
  s.lineTo(w, d - r);
  s.quadraticCurveTo(w, d, w - r, d);
  s.lineTo(-w + r, d);
  s.quadraticCurveTo(-w, d, -w, d - r);
  s.lineTo(-w, -d + r);
  s.quadraticCurveTo(-w, -d, -w + r, -d);
  s.closePath();
  const block = new THREE.ExtrudeGeometry(s, {
    depth: 0.40,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.025,
    bevelSegments: 3,
  });
  // extrusion axis +Z -> radial; rotate later. center on radial mid
  block.translate(0, 0, 0);
  const cap = new THREE.CylinderGeometry(0.0001, 0.0001, 0.0001); // placeholder unused
  return { block, cap };
}

/* ------------------------- dial ------------------------- */

/** Dial plate with aperture cutouts (det-01/02/04 geometry half). */
export function buildDialPlate(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 1.70, 0, TAU, false);

  // twin day/month rectangles under 12
  for (const sx of [-1, 1]) {
    const hole = new THREE.Path();
    const cx = sx * 0.30, cy = 0.86, hw = 0.195, hh = 0.105;
    hole.moveTo(cx - hw, cy - hh);
    hole.lineTo(cx + hw, cy - hh);
    hole.lineTo(cx + hw, cy + hh);
    hole.lineTo(cx - hw, cy + hh);
    hole.closePath();
    shape.holes.push(hole);
  }
  // round windows at ~7:30 and ~4:30
  for (const sx of [-1, 1]) {
    const hole = new THREE.Path();
    hole.absarc(sx * 0.78, -0.78, 0.085, 0, TAU, true);
    shape.holes.push(hole);
  }
  // moonphase fan cutout at 6 (approximated as circle; disc behind)
  const moon = new THREE.Path();
  moon.absarc(0, -0.76, 0.33, 0, TAU, true);
  shape.holes.push(moon);

  // subdial wells: dial keeps surface (wells are recessed discs above) — no holes.
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false, curveSegments: 96 });
  geo.translate(0, 0, 0.25);

  // planar UVs for the dial canvas (r1.70 disc -> uv 0..1; CanvasTexture flipY handles orientation)
  const posAttr = geo.getAttribute('position');
  const uv = new Float32Array(posAttr.count * 2);
  for (let i = 0; i < posAttr.count; i++) {
    uv[i * 2] = posAttr.getX(i) / 3.4 + 0.5;
    uv[i * 2 + 1] = posAttr.getY(i) / 3.4 + 0.5;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

/** Thin polished rehaut ring between dial edge and bezel bore (det-13). */
export function buildRehaut(): THREE.BufferGeometry {
  return latheZ([
    [1.70, 0.30],
    [1.74, 0.31],
    [1.74, 0.44],
    [1.705, 0.44],
    [1.70, 0.30],
  ], 96);
}

/** One faceted baton marker with pyramidal ridge crease (det-07). */
export function buildMarkerGeometry(length = 0.32, width = 0.055, thick = 0.038): THREE.BufferGeometry {
  // house-profile cross-section extruded along Y (radial placement later)
  const hw = width / 2;
  const positions: number[] = [];
  const section = [
    [-hw, 0], [hw, 0], [hw, thick * 0.55], [0, thick], [-hw, thick * 0.55],
  ];
  const y0 = -length / 2, y1 = length / 2;
  const quad = (a: number[], b: number[], c: number[], d: number[]) => {
    positions.push(...a, ...b, ...c, ...a, ...c, ...d);
  };
  for (let i = 0; i < section.length; i++) {
    const [x0, z0] = section[i];
    const [x1, z1] = section[(i + 1) % section.length];
    quad([x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0]);
  }
  // end caps (fan)
  for (const [y, flip] of [[y0, 1], [y1, -1]] as const) {
    for (let i = 1; i < section.length - 1; i++) {
      const a = [section[0][0], y, section[0][1]];
      const b = [section[i][0], y, section[i][1]];
      const c = [section[i + 1][0], y, section[i + 1][1]];
      if (flip > 0) positions.push(...a, ...c, ...b);
      else positions.push(...a, ...b, ...c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geo.computeVertexNormals();
  return geo;
}

/** Marker instance transforms: 8 singles + double at 12 (rep-hour-markers). */
export function markerTransforms(): THREE.Matrix4[] {
  const out: THREE.Matrix4[] = [];
  const rMid = 1.36;
  const z = 0.32;
  const singles = [1, 2, 4, 5, 7, 8, 10, 11];
  for (const h of singles) {
    const a = ((h % 12) / 12) * TAU; // clock angle from 12, clockwise
    const dir = new THREE.Vector3(Math.sin(a), Math.cos(a), 0);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -a);
    m.compose(dir.clone().multiplyScalar(rMid).setZ(z), q, new THREE.Vector3(1, 1, 1));
    out.push(m);
  }
  // double baton at 12
  for (const off of [-0.055, 0.055]) {
    const m = new THREE.Matrix4();
    m.compose(new THREE.Vector3(off, rMid, z), new THREE.Quaternion(), new THREE.Vector3(0.86, 1, 1));
    out.push(m);
  }
  return out;
}

/* ------------------------- hands ------------------------- */

/** Leaf (feuille) hand with real two-facet ridge (det-09). Points +Y from pivot. */
export function buildLeafHand(length: number, maxWidth: number, thickness = 0.016, ridge = 0.014): THREE.BufferGeometry {
  const N = 48;
  const positions: number[] = [];
  const half = (t: number) => {
    // leaf outline: widest ~38% along, tapering to a point
    const w = Math.sin(Math.PI * Math.min(1, t * 0.94 + 0.03) ** 0.78);
    return (maxWidth / 2) * Math.pow(w, 0.9);
  };
  const tri = (a: number[], b: number[], c: number[]) => positions.push(...a, ...b, ...c);
  for (let i = 0; i < N; i++) {
    const t0 = i / N, t1 = (i + 1) / N;
    const y0 = t0 * length, y1 = t1 * length;
    const w0 = half(t0), w1 = half(t1);
    const zt = thickness, zr = thickness + ridge;
    // top facets (left + right of spine)
    tri([-w0, y0, zt], [0, y0, zr], [0, y1, zr]);
    tri([-w0, y0, zt], [0, y1, zr], [-w1, y1, zt]);
    tri([0, y0, zr], [w0, y0, zt], [w1, y1, zt]);
    tri([0, y0, zr], [w1, y1, zt], [0, y1, zr]);
    // underside
    tri([-w0, y0, 0], [w1, y1, 0], [w0, y0, 0]);
    tri([-w0, y0, 0], [-w1, y1, 0], [w1, y1, 0]);
    // side walls
    tri([-w0, y0, 0], [-w0, y0, zt], [-w1, y1, zt]);
    tri([-w0, y0, 0], [-w1, y1, zt], [-w1, y1, 0]);
    tri([w0, y0, 0], [w1, y1, zt], [w0, y0, zt]);
    tri([w0, y0, 0], [w1, y1, 0], [w1, y1, zt]);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geo.computeVertexNormals();
  return geo;
}

/** Slender frosted chrono needle with counterweight tail (det-10). */
export function buildChronoHand(): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];
  const needle = new THREE.BoxGeometry(0.026, 1.58, 0.012);
  needle.translate(0, 0.79, 0.006);
  // taper the needle toward the tip
  const p = needle.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const k = 1 - (y / 1.58) * 0.72;
    p.setX(i, p.getX(i) * k);
  }
  needle.computeVertexNormals();
  geos.push(needle);
  const tail = new THREE.BoxGeometry(0.05, 0.35, 0.012);
  tail.translate(0, -0.175, 0.006);
  geos.push(tail);
  const weight = new THREE.CylinderGeometry(0.055, 0.055, 0.014, 20);
  weight.rotateX(Math.PI / 2);
  weight.translate(0, -0.30, 0.007);
  geos.push(weight);
  const hub = new THREE.CylinderGeometry(0.05, 0.05, 0.03, 20);
  hub.rotateX(Math.PI / 2);
  geos.push(hub);
  return mergeGeometries(geos);
}

/** Small hub disc for hands. */
export function buildHub(r: number, h: number): THREE.BufferGeometry {
  return cylinderZ(r, r, h, 24);
}

/* ------------------------- straps ------------------------- */

export interface StrapBuild {
  geometry: THREE.BufferGeometry;
  /** sample a point on the strap top surface at (u along, v across 0..1) */
  surfacePoint: (u: number, v: number) => THREE.Vector3;
  frameAt: (u: number) => { p: THREE.Vector3; up: THREE.Vector3 };
}

/**
 * Curved braided strap ribbon (curve-sweep, det-14). upper=true is the 12 o'clock half.
 * Path curves away from camera (-Z) as it leaves the lugs. Braid ridges are REAL geometry
 * (silhouette-visible ripple, per spec displacement band).
 */
export function buildStrap(upper: boolean): StrapBuild {
  const sgn = upper ? 1 : -1;
  // measured from reference mask: upper visible ~0.72 D from center (tip y=2.95),
  // lower ~1.17 D (tip y=-4.81); width 0.52 D tapering; rounded visible ends
  const len = upper ? 1.15 : 3.0;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, sgn * 1.86, -0.04),
    new THREE.Vector3(0, sgn * (1.86 + len * 0.45), -0.1),
    new THREE.Vector3(0, sgn * (1.86 + len * 0.8), -0.2),
    new THREE.Vector3(0, sgn * (1.86 + len), -0.3),
  ]);
  const U = 56, V = 26;
  const thick = 0.16;
  const amp = 0.026;
  const baseWidth = (u: number) => {
    let w = 2.16 - 0.14 * u;
    // lower strap tail flares slightly before the rounded end (measured 0.62D at fy0.95)
    if (!upper && u > 0.72) w *= 1 + 0.18 * ((u - 0.72) / 0.28);
    return w;
  };
  // rounded end cap: width collapses on a circular arc over the last 12%
  const width = (u: number) => {
    const w = baseWidth(u);
    if (u <= 0.88) return w;
    const k = (u - 0.88) / 0.12;
    return w * Math.sqrt(Math.max(0, 1 - k * k));
  };

  const top: THREE.Vector3[][] = [];
  const bottom: THREE.Vector3[][] = [];
  const texU = len * 0.62; // braid repeats scale with strap length so cords stay square
  const pt = new THREE.Vector3();
  const tan = new THREE.Vector3();
  for (let i = 0; i <= U; i++) {
    const u = i / U;
    curve.getPoint(u, pt);
    curve.getTangent(u, tan);
    // side = +X; up = tangent x side (facing +Z-ish)
    const side = new THREE.Vector3(1, 0, 0);
    const up = new THREE.Vector3().crossVectors(side, tan).normalize();
    if (up.z < 0) up.negate();
    const rowT: THREE.Vector3[] = [];
    const rowB: THREE.Vector3[] = [];
    for (let j = 0; j <= V; j++) {
      const v = j / V;
      const x = (v - 0.5) * width(u);
      const h = braidHeight(u * texU, v) * amp;
      rowT.push(new THREE.Vector3().copy(pt).addScaledVector(side, x).addScaledVector(up, thick / 2 + h));
      rowB.push(new THREE.Vector3().copy(pt).addScaledVector(side, x).addScaledVector(up, -thick / 2));
    }
    top.push(rowT);
    bottom.push(rowB);
  }

  const positions: number[] = [];
  const uvs: number[] = [];
  const quad = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3,
                ua: number[], ub: number[], uc: number[], ud: number[]) => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    positions.push(a.x, a.y, a.z, c.x, c.y, c.z, d.x, d.y, d.z);
    uvs.push(...ua, ...ub, ...uc, ...ua, ...uc, ...ud);
  };
  for (let i = 0; i < U; i++) {
    for (let j = 0; j < V; j++) {
      const u0 = i / U, u1 = (i + 1) / U, v0 = j / V, v1 = (j + 1) / V;
      const tu0 = u0 * texU, tu1 = u1 * texU;
      // top (braid)
      quad(top[i][j], top[i][j + 1], top[i + 1][j + 1], top[i + 1][j],
           [v0, tu0], [v1, tu0], [v1, tu1], [v0, tu1]);
      // bottom
      quad(bottom[i][j + 1], bottom[i][j], bottom[i + 1][j], bottom[i + 1][j + 1],
           [v1, tu0], [v0, tu0], [v0, tu1], [v1, tu1]);
    }
    // side walls
    const u0 = i / U, u1 = (i + 1) / U;
    quad(bottom[i][0], top[i][0], top[i + 1][0], bottom[i + 1][0],
         [0, u0 * texU], [0.04, u0 * texU], [0.04, u1 * texU], [0, u1 * texU]);
    quad(top[i][V], bottom[i][V], bottom[i + 1][V], top[i + 1][V],
         [0.96, u0 * texU], [1, u0 * texU], [1, u1 * texU], [0.96, u1 * texU]);
  }
  // end cap (far end)
  const last = U;
  for (let j = 0; j < V; j++) {
    positions.push(
      top[last][j].x, top[last][j].y, top[last][j].z,
      bottom[last][j].x, bottom[last][j].y, bottom[last][j].z,
      top[last][j + 1].x, top[last][j + 1].y, top[last][j + 1].z,
      top[last][j + 1].x, top[last][j + 1].y, top[last][j + 1].z,
      bottom[last][j].x, bottom[last][j].y, bottom[last][j].z,
      bottom[last][j + 1].x, bottom[last][j + 1].y, bottom[last][j + 1].z,
    );
    uvs.push(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
  geo.computeVertexNormals();

  const surfacePoint = (u: number, v: number) => {
    const p = new THREE.Vector3();
    curve.getPoint(u, p);
    const t = new THREE.Vector3();
    curve.getTangent(u, t);
    const side = new THREE.Vector3(1, 0, 0);
    const up = new THREE.Vector3().crossVectors(side, t).normalize();
    if (up.z < 0) up.negate();
    return p.addScaledVector(side, (v - 0.5) * width(u)).addScaledVector(up, thick / 2);
  };
  const frameAt = (u: number) => {
    const p = new THREE.Vector3();
    curve.getPoint(u, p);
    const t = new THREE.Vector3();
    curve.getTangent(u, t);
    const up = new THREE.Vector3().crossVectors(new THREE.Vector3(1, 0, 0), t).normalize();
    if (up.z < 0) up.negate();
    return { p, up };
  };
  return { geometry: geo, surfacePoint, frameAt };
}

/** Twisted rope stitch run along one strap edge (det-15, rep-stitch-run). */
export function buildStitchInstances(
  strap: StrapBuild,
  edgeV: number,
  count: number,
  material: THREE.Material,
): THREE.InstancedMesh {
  const seg = new THREE.CapsuleGeometry(0.02, 0.085, 4, 10);
  const mesh = new THREE.InstancedMesh(seg, material as THREE.MeshStandardMaterial, count);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  for (let i = 0; i < count; i++) {
    const u = 0.06 + (i / (count - 1)) * 0.88;
    const p = strap.surfacePoint(u, edgeV);
    const { up } = strap.frameAt(u);
    p.addScaledVector(up, 0.003);
    // alternate rope twist angle
    const lean = (i % 2 === 0 ? 1 : -1) * 0.4;
    q.setFromEuler(new THREE.Euler(0.1, 0, lean));
    m.compose(p, q, new THREE.Vector3(1, 1, 1));
    mesh.setMatrixAt(i, m);
  }
  mesh.userData.explodeWithParent = true;
  return mesh;
}

/* ------------------------- misc ------------------------- */

export function buildApertureFrame(): THREE.BufferGeometry {
  const s = new THREE.Shape();
  const ow = 0.235, oh = 0.145;
  s.moveTo(-ow, -oh); s.lineTo(ow, -oh); s.lineTo(ow, oh); s.lineTo(-ow, oh); s.closePath();
  const hole = new THREE.Path();
  const iw = 0.195, ih = 0.105;
  hole.moveTo(-iw, -ih); hole.lineTo(iw, -ih); hole.lineTo(iw, ih); hole.lineTo(-iw, ih); hole.closePath();
  s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: 0.03, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2,
  });
  return g;
}

export function buildRoundWindowFrame(): THREE.BufferGeometry {
  const g = new THREE.TorusGeometry(0.095, 0.016, 10, 32);
  return g;
}

export function buildSubdialWell(r: number): { disc: THREE.BufferGeometry; lip: THREE.BufferGeometry } {
  const disc = cylinderZ(r, r, 0.02, 64);
  const lip = new THREE.TorusGeometry(r, 0.014, 8, 64);
  return { disc, lip };
}

/** merge helper (positions+normals+uvs only, non-indexed) */
export function mergeGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = new THREE.BufferGeometry();
  let pos: number[] = [];
  let uv: number[] = [];
  for (const g of geos) {
    const ng = g.index ? g.toNonIndexed() : g;
    const p = ng.getAttribute('position');
    for (let i = 0; i < p.count; i++) pos.push(p.getX(i), p.getY(i), p.getZ(i));
    const u = ng.getAttribute('uv');
    if (u) for (let i = 0; i < u.count; i++) uv.push(u.getX(i), u.getY(i));
    else for (let i = 0; i < p.count; i++) uv.push(0, 0);
  }
  merged.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
  merged.computeVertexNormals();
  return merged;
}
