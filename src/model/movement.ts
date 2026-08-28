/**
 * movement.ts — procedural mechanical calibre for the exploded technical view.
 * Watch-local frame: dial faces +Z, +Y = 12 o'clock, 1 unit = 10 mm. The calibre
 * occupies the case bore (r 1.58) between z -0.38 and -0.05, behind the dial.
 * All geometry is authored with its rotation axis on +Z (cylinders via
 * rotateX(Math.PI / 2), extrusions natively) to match parts.ts conventions.
 */
import * as THREE from 'three';

const TAU = Math.PI * 2;

export interface MovementMaterials {
  plateBrushed: THREE.MeshPhysicalMaterial;
  polished: THREE.MeshPhysicalMaterial;
  gold: THREE.MeshPhysicalMaterial;
}

export interface MovementBuild {
  /** container group named 'movement-parts', positioned so the calibre sits in the case bore (z -0.38..-0.05) */
  group: THREE.Group;
  /** per-frame driver: rotates gear/click-wheel meshes about their own +Z, oscillates the balance, ticks the escape wheel */
  spin: (elapsedSeconds: number) => void;
  /** named sub-groups the caller re-parents as explodable components */
  parts: {
    gearTrain: THREE.Group;
    balance: THREE.Group;
    barrel: THREE.Group;
    screws: THREE.Group;
    plate: THREE.Group;
    /** chronograph layer (column wheel, levers, hammer, clutch bridge) at z -0.13..-0.05 */
    chrono: THREE.Group;
  };
}

/* ------------------------- local helpers ------------------------- */

/** CylinderGeometry re-axed so height runs along +Z. (shared with calendar.ts) */
export function cylinderZ(rTop: number, rBottom: number, height: number, radial = 32): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(rTop, rBottom, height, radial);
  g.rotateX(Math.PI / 2);
  return g;
}

/** merge helper (positions+uvs, non-indexed) — mirrors parts.ts mergeGeometries. (shared with calendar.ts) */
export function mergeGeos(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = new THREE.BufferGeometry();
  const pos: number[] = [];
  const uv: number[] = [];
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

/** Smooth organic outline through control points (quadratic curves via midpoints). (shared with calendar.ts) */
export function roundedOutline(pts: Array<[number, number]>): THREE.Shape {
  const s = new THREE.Shape();
  const n = pts.length;
  const mid = (a: [number, number], b: [number, number]): [number, number] => [
    (a[0] + b[0]) / 2,
    (a[1] + b[1]) / 2,
  ];
  const start = mid(pts[n - 1], pts[0]);
  s.moveTo(start[0], start[1]);
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const next = mid(p, pts[(i + 1) % n]);
    s.quadraticCurveTo(p[0], p[1], next[0], next[1]);
  }
  s.closePath();
  return s;
}

/**
 * Spur gear: N trapezoidal teeth around the rim, center bore, extruded along +Z (centered).
 * `spokeWindows` > 0 cuts that many pie windows between bore and root, leaving crossing spokes.
 * (shared with calendar.ts)
 */
export function gearGeometry(outerR: number, teeth: number, depth = 0.03, spokeWindows = 0): THREE.BufferGeometry {
  const rootR = outerR * 0.84;
  const pitch = TAU / teeth;
  const s = new THREE.Shape();
  for (let i = 0; i < teeth; i++) {
    const c = i * pitch;
    const a0 = c - pitch * 0.24;
    const a1 = c - pitch * 0.13;
    const a2 = c + pitch * 0.13;
    const a3 = c + pitch * 0.24;
    if (i === 0) s.moveTo(Math.cos(a0) * rootR, Math.sin(a0) * rootR);
    else s.lineTo(Math.cos(a0) * rootR, Math.sin(a0) * rootR);
    s.lineTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR);
    s.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR);
    s.lineTo(Math.cos(a3) * rootR, Math.sin(a3) * rootR);
  }
  s.closePath();
  const bore = new THREE.Path();
  bore.absarc(0, 0, outerR * 0.12, 0, TAU, true);
  s.holes.push(bore);
  if (spokeWindows > 0) {
    const rIn = outerR * 0.26;
    const rOut = rootR * 0.78;
    const span = (TAU / spokeWindows) * 0.68;
    for (let k = 0; k < spokeWindows; k++) {
      const mid = (k / spokeWindows) * TAU + TAU / (spokeWindows * 2);
      const w = new THREE.Path();
      w.absarc(0, 0, rIn, mid - span / 2, mid + span / 2, false);
      w.absarc(0, 0, rOut, mid + span / 2, mid - span / 2, true);
      w.closePath();
      s.holes.push(w);
    }
  }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 8 });
  g.translate(0, 0, -depth / 2);
  return g;
}

/** Escape wheel: N hooked saw teeth — long sloped leading flank to a sharp tip, steep radial drop. */
function escapeWheelGeometry(outerR: number, teeth: number, depth = 0.02): THREE.BufferGeometry {
  const rootR = outerR * 0.72;
  const s = new THREE.Shape();
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * TAU;
    const aTip = a0 + (0.58 * TAU) / teeth;
    const aDrop = a0 + (0.66 * TAU) / teeth;
    if (i === 0) s.moveTo(Math.cos(a0) * rootR, Math.sin(a0) * rootR);
    else s.lineTo(Math.cos(a0) * rootR, Math.sin(a0) * rootR);
    s.lineTo(Math.cos(aTip) * outerR, Math.sin(aTip) * outerR);
    s.lineTo(Math.cos(aDrop) * rootR, Math.sin(aDrop) * rootR);
  }
  s.closePath();
  const bore = new THREE.Path();
  bore.absarc(0, 0, outerR * 0.14, 0, TAU, true);
  s.holes.push(bore);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 4 });
  g.translate(0, 0, -depth / 2);
  return g;
}

/** Flat Archimedean spiral in the XY plane, radius r0 -> r1 over `turns`. */
class SpiralCurve extends THREE.Curve<THREE.Vector3> {
  constructor(
    private readonly turns: number,
    private readonly r0: number,
    private readonly r1: number,
  ) {
    super();
  }
  override getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
    const a = t * this.turns * TAU;
    const r = this.r0 + (this.r1 - this.r0) * t;
    return target.set(Math.cos(a) * r, Math.sin(a) * r, 0);
  }
}

/** name + enable shadows on a mesh. (shared with calendar.ts) */
export function shadowed<T extends THREE.Mesh | THREE.InstancedMesh>(mesh: T, name: string): T {
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/* ------------------------- build ------------------------- */

export function buildMovement(mats: {
  plateBrushed: THREE.MeshPhysicalMaterial;
  polished: THREE.MeshPhysicalMaterial;
}): MovementBuild {
  const gold = new THREE.MeshPhysicalMaterial({
    color: 0xd4b46a,
    metalness: 1.0,
    roughness: 0.28,
    envMapIntensity: 1.0,
  });
  const ruby = new THREE.MeshPhysicalMaterial({
    color: 0x7a0d1e,
    metalness: 0.1,
    roughness: 0.18,
    clearcoat: 0.6,
    envMapIntensity: 0.9,
  });
  const bluedSteel = new THREE.MeshPhysicalMaterial({
    color: 0x3a5a8c,
    metalness: 0.9,
    roughness: 0.25,
    envMapIntensity: 1.0,
  });
  const columnSteel = new THREE.MeshPhysicalMaterial({
    color: 0x5a74b8,
    metalness: 0.95,
    roughness: 0.16,
    clearcoat: 0.5,
    envMapIntensity: 1.35,
  });

  const group = new THREE.Group();
  group.name = 'movement-parts';

  // côtes de Genève: subtle diagonal stripe map so plate + bridges read as finished German silver
  const stripes = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#b9bdc6';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = -8; i < 20; i++) {
      const g = ctx.createLinearGradient(i * 26, 0, i * 26 + 26, 26);
      g.addColorStop(0, 'rgba(255,255,255,0.44)');
      g.addColorStop(0.55, 'rgba(104,108,122,0.22)');
      g.addColorStop(1, 'rgba(56,60,72,0.5)');
      ctx.fillStyle = g;
      ctx.save();
      ctx.translate(128, 128);
      ctx.rotate(-Math.PI / 7);
      ctx.fillRect(i * 26 - 200, -220, 26, 440);
      ctx.restore();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1.6, 1.6);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })();
  const plateFinished = mats.plateBrushed.clone();
  plateFinished.map = stripes;
  plateFinished.color = new THREE.Color(0xffffff);
  plateFinished.envMapIntensity = 0.55;
  plateFinished.roughness = 0.52;

  /* ---- 1. main plate + bridges + jewels ('movement-base') ---- */

  const plate = new THREE.Group();
  plate.name = 'movement-base';
  group.add(plate);

  plate.add(shadowed(new THREE.Mesh(cylinderZ(1.52, 1.52, 0.06, 96).translate(0, 0, -0.3), plateFinished), 'main-plate'));

  // three cocks/bridges: barrel bridge (right), train bridge (upper left), balance cock (lower-left arm)
  const bridgeOutlines: Array<Array<[number, number]>> = [
    [[0.15, 0.45], [0.95, 0.55], [1.3, 0.0], [1.05, -0.6], [0.45, -0.75], [0.1, -0.25]],
    [[-0.9, 0.2], [-0.15, 0.15], [0.15, 0.6], [-0.1, 1.05], [-0.85, 0.95], [-1.15, 0.55]],
    [[-1.35, -0.3], [-0.95, -0.3], [-0.5, -0.4], [-0.4, -0.75], [-0.75, -1.0], [-1.1, -0.8]],
  ];
  const bridgeNames = ['bridge-barrel', 'bridge-train', 'bridge-balance-cock'];
  bridgeOutlines.forEach((outline, i) => {
    const geo = new THREE.ExtrudeGeometry(roundedOutline(outline), {
      depth: 0.05,
      bevelEnabled: false,
      curveSegments: 10,
    });
    geo.translate(0, 0, -0.245); // slab spans z -0.245..-0.195, centered on -0.22
    plate.add(shadowed(new THREE.Mesh(geo, plateFinished), bridgeNames[i]));
  });

  // balance cock: slim curved finger bridge from the plate edge, round boss over the balance pivot
  const cockOutline: Array<[number, number]> = [
    [-1.45, -0.5], [-1.2, -0.44], [-0.95, -0.48], [-0.78, -0.5],
    [-0.7, -0.48], [-0.56, -0.62], [-0.7, -0.76],
    [-0.95, -0.76], [-1.2, -0.84], [-1.46, -0.88],
  ];
  const cockGeo = new THREE.ExtrudeGeometry(roundedOutline(cockOutline), {
    depth: 0.024,
    bevelEnabled: false,
    curveSegments: 10,
  });
  cockGeo.translate(0, 0, -0.082); // slab z -0.082..-0.058, above the balance rim
  plate.add(shadowed(new THREE.Mesh(cockGeo, plateFinished), 'balance-cock'));

  // regulator on the cock boss: polished lever + micro index arc
  const regLever = new THREE.BoxGeometry(0.16, 0.022, 0.008);
  regLever.rotateZ(0.55);
  regLever.translate(-0.63, -0.55, -0.055);
  const regArc = new THREE.TorusGeometry(0.085, 0.0045, 6, 20, 0.9);
  regArc.rotateZ(2.4);
  regArc.translate(-0.7, -0.62, -0.055);
  plate.add(shadowed(new THREE.Mesh(mergeGeos([regLever, regArc]), mats.polished), 'balance-regulator'));

  // ruby jewels sunk at the pivot points (4 train pivots on plate, balance + barrel on bridges)
  const jewelGeo = cylinderZ(0.035, 0.035, 0.02, 16);
  const jewelSpots: Array<[number, number, number]> = [
    [0.45, 0.35, -0.268],
    [-0.35, 0.55, -0.268],
    [-0.5, 0.02, -0.268],
    [0.15, -0.5, -0.268],
    [-0.7, -0.62, -0.192],
    [0.55, -0.05, -0.192],
    [-0.62, -0.35, -0.268], // escape-wheel pivot
    [-0.665, -0.5, -0.268], // pallet-lever pivot
    [-0.7, -0.62, -0.062], // balance endstone in the cock boss
  ];
  const jewelGeos: THREE.BufferGeometry[] = jewelSpots.map(([x, y, z]) => {
    const g = jewelGeo.clone();
    g.translate(x, y, z);
    return g;
  });
  plate.add(shadowed(new THREE.Mesh(mergeGeos(jewelGeos), ruby), 'movement-jewels'));

  // steady pins: two beside each bridge screw hole
  const pinGeo = cylinderZ(0.012, 0.012, 0.03, 8);
  const bridgeScrewXY: Array<[number, number]> = [[0.9, 0.15], [-0.6, 0.7], [-1.05, -0.65]];
  const pinGeos: THREE.BufferGeometry[] = [];
  for (const [px, py] of bridgeScrewXY) {
    for (const side of [1, -1] as const) {
      const g = pinGeo.clone();
      g.translate(px + side * 0.075, py - side * 0.045, -0.18);
      pinGeos.push(g);
    }
  }
  plate.add(shadowed(new THREE.Mesh(mergeGeos(pinGeos), mats.polished), 'steady-pins'));

  // keyless works: winding stem toward the crown (+X) — square inner end + castle-wheel hint
  const stemShaft = new THREE.CylinderGeometry(0.045, 0.045, 0.52, 20);
  stemShaft.rotateZ(Math.PI / 2); // axis +X
  stemShaft.translate(1.36, 0, -0.12);
  const stemSquare = new THREE.BoxGeometry(0.07, 0.07, 0.07);
  stemSquare.translate(1.115, 0, -0.12);
  const castleA = new THREE.CylinderGeometry(0.07, 0.07, 0.035, 16);
  castleA.rotateZ(Math.PI / 2);
  castleA.translate(1.2, 0, -0.12);
  const castleB = castleA.clone();
  castleB.translate(0.07, 0, 0);
  plate.add(shadowed(new THREE.Mesh(mergeGeos([stemShaft, stemSquare, castleA, castleB]), mats.polished), 'winding-stem'));

  /* ---- 2. gear train ('gear-train') ---- */

  const gearTrain = new THREE.Group();
  gearTrain.name = 'gear-train';
  group.add(gearTrain);

  interface GearSpec {
    r: number;
    teeth: number;
    pos: [number, number, number];
    mat: THREE.MeshPhysicalMaterial;
    speed: number;
  }
  const gearSpecs: GearSpec[] = [
    { r: 0.42, teeth: 28, pos: [0.45, 0.35, -0.16], mat: gold, speed: 0.5 },
    { r: 0.3, teeth: 22, pos: [-0.35, 0.55, -0.14], mat: gold, speed: -0.75 },
    { r: 0.24, teeth: 18, pos: [-0.5, 0.02, -0.16], mat: mats.polished, speed: 1.1 },
    { r: 0.34, teeth: 24, pos: [0.15, -0.5, -0.14], mat: gold, speed: -0.6 },
  ];
  const spinningGears: Array<{ mesh: THREE.Mesh; speed: number; phase: number }> = [];
  const arborGeos: THREE.BufferGeometry[] = [];
  gearSpecs.forEach((spec, i) => {
    const mesh = shadowed(new THREE.Mesh(gearGeometry(spec.r, spec.teeth, 0.03, 3), spec.mat), `gear-${i + 1}`);
    mesh.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
    gearTrain.add(mesh);
    spinningGears.push({ mesh, speed: spec.speed, phase: (i * TAU) / 7 });
    const arbor = cylinderZ(0.02, 0.02, 0.12, 12);
    arbor.translate(spec.pos[0], spec.pos[1], spec.pos[2]);
    arborGeos.push(arbor);
  });
  gearTrain.add(shadowed(new THREE.Mesh(mergeGeos(arborGeos), mats.polished), 'gear-arbors'));

  // escapement: 15-tooth hooked escape wheel meshing toward the balance, stepped in spin()
  const escapeWheel = shadowed(new THREE.Mesh(escapeWheelGeometry(0.18, 15), mats.polished), 'escape-wheel');
  escapeWheel.position.set(-0.62, -0.35, -0.19);
  gearTrain.add(escapeWheel);

  // pallet lever: small Y-shaped fork between escape wheel and balance, total length 0.22
  const palletPts: Array<[number, number]> = [
    [-0.022, -0.02], [0.022, -0.02], [0.022, 0.11], [0.05, 0.165], [0.03, 0.2],
    [0, 0.14], [-0.03, 0.2], [-0.05, 0.165], [-0.022, 0.11],
  ];
  const palletShape = new THREE.Shape();
  palletShape.moveTo(palletPts[0][0], palletPts[0][1]);
  for (let i = 1; i < palletPts.length; i++) palletShape.lineTo(palletPts[i][0], palletPts[i][1]);
  palletShape.closePath();
  const palletGeo = new THREE.ExtrudeGeometry(palletShape, { depth: 0.02, bevelEnabled: false });
  palletGeo.translate(0, 0, -0.01);
  const pallet = shadowed(new THREE.Mesh(palletGeo, mats.polished), 'pallet-lever');
  pallet.position.set(-0.665, -0.5, -0.168);
  pallet.rotation.z = Math.atan2(-0.12, -0.035) - Math.PI / 2; // fork points at the balance pivot
  gearTrain.add(pallet);

  /* ---- 3. balance wheel + hairspring ('balance-wheel') ---- */

  const balance = new THREE.Group();
  balance.name = 'balance-wheel';
  balance.position.set(-0.7, -0.62, -0.12);
  group.add(balance);

  const rotorGeos: THREE.BufferGeometry[] = [new THREE.TorusGeometry(0.3, 0.035, 20, 96)];
  for (let i = 0; i < 3; i++) {
    const spoke = new THREE.BoxGeometry(0.56, 0.03, 0.024);
    spoke.rotateZ((i * TAU) / 3);
    rotorGeos.push(spoke);
  }
  rotorGeos.push(cylinderZ(0.025, 0.025, 0.14, 12));
  const balanceRotor = shadowed(new THREE.Mesh(mergeGeos(rotorGeos), mats.polished), 'balance-rotor');
  balance.add(balanceRotor);

  const hairspringGeo = new THREE.TubeGeometry(new SpiralCurve(3.5, 0.04, 0.22), 220, 0.008, 6, false);
  const hairspring = shadowed(new THREE.Mesh(hairspringGeo, bluedSteel), 'balance-hairspring');
  hairspring.position.z = 0.02; // tucked under the balance cock
  balance.add(hairspring);

  /* ---- 4. mainspring barrel ('mainspring-barrel') ---- */

  const barrel = new THREE.Group();
  barrel.name = 'mainspring-barrel';
  barrel.position.set(0.55, -0.05, -0.2);
  group.add(barrel);

  barrel.add(shadowed(new THREE.Mesh(cylinderZ(0.38, 0.38, 0.12, 64), mats.plateBrushed), 'barrel-drum'));

  const grooveGeo = new THREE.TubeGeometry(new SpiralCurve(2.5, 0.08, 0.34), 160, 0.006, 6, false);
  const groove = shadowed(new THREE.Mesh(grooveGeo, gold), 'barrel-spring-groove');
  groove.position.z = 0.054; // recessed into the drum top, under the ratchet wheel
  barrel.add(groove);

  // ratchet wheel stacked on the drum, crown wheel meshing toward +X, click pawl on the teeth
  const ratchetWheel = shadowed(new THREE.Mesh(gearGeometry(0.3, 40, 0.025), gold), 'barrel-ratchet-wheel');
  ratchetWheel.position.z = 0.075;
  barrel.add(ratchetWheel);

  const crownWheel = shadowed(new THREE.Mesh(gearGeometry(0.22, 30, 0.025), mats.polished), 'barrel-crown-wheel');
  crownWheel.position.set(0.5, 0, 0.075);
  barrel.add(crownWheel);

  const clickGeo = new THREE.ExtrudeGeometry(
    roundedOutline([[0.16, 0.4], [0.24, 0.37], [0.26, 0.33], [0.1, 0.285], [0.02, 0.295], [0.06, 0.36]]),
    { depth: 0.02, bevelEnabled: false, curveSegments: 8 },
  );
  clickGeo.translate(0, 0, 0.065); // nose buried in the ratchet teeth
  barrel.add(shadowed(new THREE.Mesh(clickGeo, mats.polished), 'barrel-click-pawl'));

  const clickWheel = shadowed(new THREE.Mesh(gearGeometry(0.14, 14), gold), 'barrel-click-wheel');
  clickWheel.position.z = 0.105;
  barrel.add(clickWheel);

  /* ---- 5. screws ('movement-screws') ---- */

  const screws = new THREE.Group();
  screws.name = 'movement-screws';
  group.add(screws);

  const screwGeo = mergeGeos([
    cylinderZ(0.03, 0.03, 0.028, 18),                                  // round slotted head
    new THREE.BoxGeometry(0.052, 0.008, 0.006).translate(0, 0, 0.017), // screwdriver slot
  ]);
  const screwSpots: Array<[number, number, number]> = [
    [Math.cos(0.35) * 1.35, Math.sin(0.35) * 1.35, -0.2525],
    [Math.cos(1.55) * 1.35, Math.sin(1.55) * 1.35, -0.2525],
    [Math.cos(2.75) * 1.35, Math.sin(2.75) * 1.35, -0.2525],
    [Math.cos(4.05) * 1.35, Math.sin(4.05) * 1.35, -0.2525],
    [Math.cos(5.3) * 1.35, Math.sin(5.3) * 1.35, -0.2525],
    [0.9, 0.15, -0.1775],
    [-0.6, 0.7, -0.1775],
    [-1.05, -0.65, -0.1775],
    [-1.34, -0.56, -0.0675], // balance-cock foot
    [-1.34, -0.8, -0.0675],
    [0.24, -0.42, -0.1775], // beside the ratchet on the barrel bridge
    [0.95, 0.28, -0.1775],
  ];
  const screwMesh = shadowed(new THREE.InstancedMesh(screwGeo, mats.polished, screwSpots.length), 'movement-screws-inst');
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const one = new THREE.Vector3(1, 1, 1);
  const p = new THREE.Vector3();
  screwSpots.forEach(([x, y, z], i) => {
    p.set(x, y, z);
    q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), i * 0.7); // varied slot clocking
    m.compose(p, q, one);
    screwMesh.setMatrixAt(i, m);
  });
  screwMesh.instanceMatrix.needsUpdate = true;
  screws.add(screwMesh);

  /* ---- 6. chronograph works ('chrono-works'), layer z -0.13..-0.05 ---- */

  const chrono = new THREE.Group();
  chrono.name = 'chrono-works';
  group.add(chrono);

  // column wheel: 16-tooth base + 8 upright columns (signature part, deliberately static)
  const columnBase = gearGeometry(0.14, 16, 0.022);
  columnBase.translate(0, 0, -0.121); // base z -0.132..-0.110
  const columnGeos: THREE.BufferGeometry[] = [columnBase];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    const post = cylinderZ(0.019, 0.019, 0.06, 8);
    post.translate(Math.cos(a) * 0.088, Math.sin(a) * 0.088, -0.08); // posts z -0.110..-0.050
    columnGeos.push(post);
  }
  const columnWheel = shadowed(new THREE.Mesh(mergeGeos(columnGeos), columnSteel), 'chrono-column-wheel');
  columnWheel.position.set(0.95, 0.75, 0);
  chrono.add(columnWheel);

  // two S-curved operating levers reaching from the pusher interiors toward the column wheel
  const leverA = new THREE.ExtrudeGeometry(
    roundedOutline([[1.34, 0.5], [1.28, 0.62], [1.12, 0.7], [1.02, 0.72], [0.99, 0.68], [1.1, 0.62], [1.22, 0.52], [1.3, 0.44]]),
    { depth: 0.02, bevelEnabled: false, curveSegments: 8 },
  );
  const leverB = new THREE.ExtrudeGeometry(
    roundedOutline([[1.3, -0.58], [1.4, -0.3], [1.38, 0], [1.25, 0.35], [1.06, 0.6], [0.98, 0.66], [1.0, 0.58], [1.16, 0.38], [1.3, 0.05], [1.33, -0.28], [1.24, -0.56]]),
    { depth: 0.02, bevelEnabled: false, curveSegments: 8 },
  );
  leverA.translate(0, 0, -0.09);
  leverB.translate(0, 0, -0.09);
  chrono.add(shadowed(new THREE.Mesh(mergeGeos([leverA, leverB]), mats.polished), 'chrono-levers'));

  // L-shaped hammer
  const hammerGeo = new THREE.ExtrudeGeometry(
    roundedOutline([[0.3, 0.96], [0.55, 0.98], [0.62, 0.9], [0.56, 0.84], [0.42, 0.86], [0.4, 0.74], [0.32, 0.72], [0.28, 0.8]]),
    { depth: 0.02, bevelEnabled: false, curveSegments: 8 },
  );
  hammerGeo.translate(0, 0, -0.09);
  chrono.add(shadowed(new THREE.Mesh(hammerGeo, mats.polished), 'chrono-hammer'));

  // horizontal clutch bridge-let spanning hammer to column wheel
  const clutchGeo = new THREE.ExtrudeGeometry(
    roundedOutline([[0.55, 0.88], [0.75, 0.84], [0.93, 0.79], [0.94, 0.71], [0.75, 0.74], [0.55, 0.79]]),
    { depth: 0.022, bevelEnabled: false, curveSegments: 8 },
  );
  clutchGeo.translate(0, 0, -0.072); // z -0.072..-0.050
  chrono.add(shadowed(new THREE.Mesh(clutchGeo, mats.plateBrushed), 'chrono-clutch-bridge'));

  /* ---- 7. spin driver ---- */

  const spin = (elapsedSeconds: number): void => {
    for (const g of spinningGears) {
      g.mesh.rotation.z = g.phase + g.speed * elapsedSeconds;
    }
    clickWheel.rotation.z = 0.9 * elapsedSeconds;
    balanceRotor.rotation.z = Math.sin(elapsedSeconds * 5) * 0.7;
    // escape wheel advances in 15 discrete ticks per turn — mechanical tick feel
    escapeWheel.rotation.z = -((Math.floor(elapsedSeconds * 6) % 15) * (TAU / 15));
    // column wheel intentionally static
  };

  return {
    group,
    spin,
    parts: { gearTrain, balance, barrel, screws, plate, chrono },
  };
}
