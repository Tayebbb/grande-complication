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
  /** per-frame driver: rotates gear/click-wheel meshes about their own +Z, oscillates the balance */
  spin: (elapsedSeconds: number) => void;
  /** named sub-groups the caller re-parents as explodable components */
  parts: {
    gearTrain: THREE.Group;
    balance: THREE.Group;
    barrel: THREE.Group;
    screws: THREE.Group;
    plate: THREE.Group;
  };
}

/* ------------------------- local helpers ------------------------- */

/** CylinderGeometry re-axed so height runs along +Z. */
function cylinderZ(rTop: number, rBottom: number, height: number, radial = 32): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(rTop, rBottom, height, radial);
  g.rotateX(Math.PI / 2);
  return g;
}

/** merge helper (positions+uvs, non-indexed) — mirrors parts.ts mergeGeometries. */
function mergeGeos(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
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

/** Smooth organic outline through control points (quadratic curves via midpoints). */
function roundedOutline(pts: Array<[number, number]>): THREE.Shape {
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

/** Spur gear: N trapezoidal teeth around the rim, center bore, extruded along +Z (centered). */
function gearGeometry(outerR: number, teeth: number, depth = 0.03): THREE.BufferGeometry {
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
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 8 });
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

function shadowed<T extends THREE.Mesh | THREE.InstancedMesh>(mesh: T, name: string): T {
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

  const group = new THREE.Group();
  group.name = 'movement-parts';

  /* ---- 1. main plate + bridges + jewels ('movement-base') ---- */

  const plate = new THREE.Group();
  plate.name = 'movement-base';
  group.add(plate);

  plate.add(shadowed(new THREE.Mesh(cylinderZ(1.52, 1.52, 0.06, 96).translate(0, 0, -0.3), mats.plateBrushed), 'main-plate'));

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
    plate.add(shadowed(new THREE.Mesh(geo, mats.plateBrushed), bridgeNames[i]));
  });

  // ruby jewels sunk at the pivot points (4 train pivots on plate, balance + barrel on bridges)
  const jewelGeo = cylinderZ(0.035, 0.035, 0.02, 16);
  const jewelSpots: Array<[number, number, number]> = [
    [0.45, 0.35, -0.268],
    [-0.35, 0.55, -0.268],
    [-0.55, -0.15, -0.268],
    [0.15, -0.5, -0.268],
    [-0.7, -0.62, -0.192],
    [0.55, -0.05, -0.192],
  ];
  const jewelGeos: THREE.BufferGeometry[] = jewelSpots.map(([x, y, z]) => {
    const g = jewelGeo.clone();
    g.translate(x, y, z);
    return g;
  });
  plate.add(shadowed(new THREE.Mesh(mergeGeos(jewelGeos), ruby), 'movement-jewels'));

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
    { r: 0.24, teeth: 18, pos: [-0.55, -0.15, -0.16], mat: mats.polished, speed: 1.1 },
    { r: 0.34, teeth: 24, pos: [0.15, -0.5, -0.14], mat: gold, speed: -0.6 },
  ];
  const spinningGears: Array<{ mesh: THREE.Mesh; speed: number; phase: number }> = [];
  const arborGeos: THREE.BufferGeometry[] = [];
  gearSpecs.forEach((spec, i) => {
    const mesh = shadowed(new THREE.Mesh(gearGeometry(spec.r, spec.teeth), spec.mat), `gear-${i + 1}`);
    mesh.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
    gearTrain.add(mesh);
    spinningGears.push({ mesh, speed: spec.speed, phase: (i * TAU) / 7 });
    const arbor = cylinderZ(0.02, 0.02, 0.12, 12);
    arbor.translate(spec.pos[0], spec.pos[1], spec.pos[2]);
    arborGeos.push(arbor);
  });
  gearTrain.add(shadowed(new THREE.Mesh(mergeGeos(arborGeos), mats.polished), 'gear-arbors'));

  /* ---- 3. balance wheel + hairspring ('balance-wheel') ---- */

  const balance = new THREE.Group();
  balance.name = 'balance-wheel';
  balance.position.set(-0.7, -0.62, -0.12);
  group.add(balance);

  const rotorGeos: THREE.BufferGeometry[] = [new THREE.TorusGeometry(0.3, 0.035, 12, 48)];
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
  hairspring.position.z = 0.05;
  balance.add(hairspring);

  /* ---- 4. mainspring barrel ('mainspring-barrel') ---- */

  const barrel = new THREE.Group();
  barrel.name = 'mainspring-barrel';
  barrel.position.set(0.55, -0.05, -0.2);
  group.add(barrel);

  barrel.add(shadowed(new THREE.Mesh(cylinderZ(0.38, 0.38, 0.12, 64), mats.plateBrushed), 'barrel-drum'));

  const grooveGeo = new THREE.TubeGeometry(new SpiralCurve(2.5, 0.08, 0.34), 160, 0.006, 6, false);
  const groove = shadowed(new THREE.Mesh(grooveGeo, gold), 'barrel-spring-groove');
  groove.position.z = 0.062; // resting on the drum top face
  barrel.add(groove);

  const clickWheel = shadowed(new THREE.Mesh(gearGeometry(0.14, 14), gold), 'barrel-click-wheel');
  clickWheel.position.z = 0.08;
  barrel.add(clickWheel);

  /* ---- 5. screws ('movement-screws') ---- */

  const screws = new THREE.Group();
  screws.name = 'movement-screws';
  group.add(screws);

  const screwGeo = cylinderZ(0.03, 0.03, 0.035, 6);
  const screwSpots: Array<[number, number, number]> = [
    [Math.cos(0.35) * 1.35, Math.sin(0.35) * 1.35, -0.2525],
    [Math.cos(1.55) * 1.35, Math.sin(1.55) * 1.35, -0.2525],
    [Math.cos(2.75) * 1.35, Math.sin(2.75) * 1.35, -0.2525],
    [Math.cos(4.05) * 1.35, Math.sin(4.05) * 1.35, -0.2525],
    [Math.cos(5.3) * 1.35, Math.sin(5.3) * 1.35, -0.2525],
    [0.9, 0.15, -0.1775],
    [-0.6, 0.7, -0.1775],
    [-1.05, -0.65, -0.1775],
  ];
  const screwMesh = shadowed(new THREE.InstancedMesh(screwGeo, mats.polished, screwSpots.length), 'movement-screws-inst');
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const one = new THREE.Vector3(1, 1, 1);
  const p = new THREE.Vector3();
  screwSpots.forEach(([x, y, z], i) => {
    p.set(x, y, z);
    q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), i * 0.7); // varied hex clocking
    m.compose(p, q, one);
    screwMesh.setMatrixAt(i, m);
  });
  screwMesh.instanceMatrix.needsUpdate = true;
  screws.add(screwMesh);

  /* ---- 6. spin driver ---- */

  const spin = (elapsedSeconds: number): void => {
    for (const g of spinningGears) {
      g.mesh.rotation.z = g.phase + g.speed * elapsedSeconds;
    }
    clickWheel.rotation.z = 0.9 * elapsedSeconds;
    balanceRotor.rotation.z = Math.sin(elapsedSeconds * 5) * 0.7;
  };

  return {
    group,
    spin,
    parts: { gearTrain, balance, barrel, screws, plate },
  };
}
