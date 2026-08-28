/**
 * createObjectModel.ts — Perpetual Calendar Chronograph procedural factory.
 *
 * Hand-authored implementation of object-sculpt-spec.json (img2threejs pipeline).
 * Every spec component id maps to a named Object3D pivot node; assembled transforms
 * are immutable; explosion metadata mirrors spec.runtimeExplosion. The factory builds
 * four fidelity tiers so each locked build pass has a reviewable artifact:
 *   blockout   — assembly massing volumes only
 *   structural — all 30 components as simple primitives
 *   form       — refined profiles (lathe case, leaf hands, flutes, braid, bevels)
 *   full       — + generated canvas print systems and final PBR response
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  createDialTextures,
  createSubdialTexture,
  createMoonTexture,
  createApertureDiscTexture,
  createStrapTextures,
  createBrushedRoughness,
} from './model/textures';
import {
  buildCaseMain,
  buildBezel,
  buildCrystal,
  buildCaseBack,
  buildLug,
  LUG_PLACEMENTS,
  buildCrownGroup,
  buildPusherGeometries,
  buildDialPlate,
  buildRehaut,
  buildMarkerGeometry,
  markerTransforms,
  buildLeafHand,
  buildChronoHand,
  buildHub,
  buildStrap,
  buildStitchInstances,
  buildApertureFrame,
  buildRoundWindowFrame,
  buildSubdialWell,
  mergeGeometries,
} from './model/parts';
import { buildMovement } from './model/movement';
import { buildCalendarWorks } from './model/calendar';

export type Fidelity = 'blockout' | 'structural' | 'form' | 'full';

export interface ProceduralModelOptions {
  fidelity?: Fidelity;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export interface ExplodeMeta {
  axis: [number, number, number];
  distance: number;
  order: number;
  label: string;
  description: string;
}

export interface ProceduralModelRuntime {
  nodes: Record<string, THREE.Object3D>;
  meshes: Record<string, THREE.Mesh | THREE.InstancedMesh>;
  sockets: Record<string, THREE.Object3D>;
  colliders: Record<string, unknown>;
  destructionGroups: Record<string, THREE.Object3D[]>;
}

/* ------------------------------------------------------------------ */
/* Explosion metadata (mirrors spec.runtimeExplosion; child offsets   */
/* are relative to their parent's motion)                             */
/* ------------------------------------------------------------------ */

export const EXPLOSION: Record<string, ExplodeMeta> = {
  // front glazing stack lifts diagonally up-left so it clears the dial sightline
  crystal:              { axis: [-0.22, 0.55, 0.80], distance: 2.75, order: 1,  label: 'CRYSTAL',       description: 'Domed sapphire glazing' },
  bezel:                { axis: [-0.18, 0.16, 0.97], distance: 2.3,  order: 2,  label: 'BEZEL',         description: 'Concave polished front ring' },
  'rehaut-ring':        { axis: [0, 0.02, 1],  distance: 1.95,  order: 3,  label: 'REHAUT',        description: 'Inner trim ring' },
  'pinion-cap':         { axis: [0, 0, 1],  distance: 1.72, order: 4,  label: '',              description: 'Center cap' },
  'hand-chrono':        { axis: [0.24, 0.12, 0.96], distance: 1.62, order: 5,  label: 'SECONDS',  description: 'Chronograph seconds needle' },
  'hand-minute':        { axis: [-0.22, 0.16, 0.96], distance: 1.48, order: 6,  label: 'MINUTE',   description: 'Leaf minute hand' },
  'hand-hour':          { axis: [0.18, -0.22, 0.96], distance: 1.32, order: 7,  label: 'HOUR',     description: 'Leaf hour hand' },
  'subhand-left':       { axis: [0, 0, 1],  distance: 1.18, order: 8,  label: '',              description: 'Small seconds hand' },
  'subhand-right':      { axis: [0, 0, 1],  distance: 1.18, order: 8,  label: '',              description: '30-min counter hand' },
  'hand-date':          { axis: [0, 0, 1],  distance: 1.18, order: 8,  label: '',              description: 'Date hand' },
  'hour-markers':       { axis: [0, 0, 1],  distance: 1.05, order: 9,  label: 'MARKERS',       description: 'Applied baton indexes' },
  'dial-apertures':     { axis: [0, 0, 1],  distance: 0.85, order: 10, label: 'DAY / MONTH',   description: 'Calendar aperture set' },
  'dial-round-windows': { axis: [0, 0, 1],  distance: 0.92, order: 10, label: '',              description: 'Day/night + leap year' },
  subdials:             { axis: [0, 0, 1],  distance: 0.72, order: 11, label: 'SUBDIAL',       description: 'Recessed counter wells' },
  'date-subdial':       { axis: [0, -0.45, 0.89], distance: 0.7,  order: 11, label: 'DATE RING',     description: 'Perpetual date arc' },
  // moon disc is sandwiched behind the dial — it exits with the rear cluster once the back is open
  moonphase:            { axis: [0.35, -0.15, -0.925], distance: 2.3, order: 12, label: 'MOONPHASE',     description: 'Navy lacquer moon disc' },
  'dial-plate':         { axis: [0, 0, 1],  distance: 0.4,  order: 13, label: 'DIAL',          description: 'Sunburst gradient plate' },
  // calibre drops down-right into open space (clear of the strap column), internals fan off it
  'movement-plate':     { axis: [0.25, -0.23, -0.94], distance: 3.6, order: 14, label: 'MOVEMENT', description: 'Mechanical calibre' },
  'gear-train':         { axis: [0.22, 0.14, 0.96], distance: 0.62, order: 19, label: 'GEAR TRAIN', description: 'Going train, cut teeth' },
  'balance-wheel':      { axis: [0.05, -0.35, 0.94], distance: 0.7, order: 19, label: 'BALANCE',   description: 'Balance wheel + hairspring' },
  'mainspring-barrel':  { axis: [0.35, -0.12, 0.93], distance: 0.55, order: 19, label: 'BARREL',    description: 'Mainspring barrel' },
  'chrono-works':       { axis: [-0.12, 0.38, 0.92], distance: 1.1, order: 19, label: 'COLUMN WHEEL', description: 'Chronograph command layer' },
  'movement-screws':    { axis: [0.15, -0.3, -0.94], distance: 0.7, order: 20, label: '',           description: 'Bridge screws' },
  // calendar module exits through the opened case back (front lane is walled by the case band)
  'calendar-works':     { axis: [0.27, 0.32, -0.91], distance: 2.3, order: 21, label: 'CALENDAR WORKS', description: 'Perpetual calendar module' },
  'case-back':          { axis: [0.72, -0.5, -0.48], distance: 5.4, order: 15, label: 'CASE BACK', description: 'Screw-down rear cover' },
  crown:                { axis: [0.97, 0.24, 0],  distance: 1.6,  order: 16, label: 'CROWN',         description: 'Fluted winding crown' },
  'pusher-upper':       { axis: [0.866, 0.5, 0],  distance: 0.75, order: 17, label: 'UPPER PUSHER', description: 'Chronograph start/stop' },
  'pusher-lower':       { axis: [0.866, -0.5, 0], distance: 0.55, order: 17, label: 'LOWER PUSHER', description: 'Chronograph reset' },
  'strap-upper':        { axis: [0, 1, 0],  distance: 1.0,  order: 18, label: 'STRAP',         description: 'Braided calfskin, upper' },
  'strap-lower':        { axis: [0, -1, 0], distance: 1.0,  order: 18, label: '',              description: 'Braided calfskin, lower' },
};

/** Hand angles (clock reading ~10:09, chrono over the date arc; refined during form review). */
const HAND_ANGLES = {
  hour: THREE.MathUtils.degToRad(55.5),
  minute: THREE.MathUtils.degToRad(-54),
  chrono: THREE.MathUtils.degToRad(172),
  subLeft: THREE.MathUtils.degToRad(38),
  subRight: THREE.MathUtils.degToRad(-32),
  date: THREE.MathUtils.degToRad(138),
};

/* ------------------------------------------------------------------ */
/* Materials                                                          */
/* ------------------------------------------------------------------ */

interface MaterialSet {
  casePolished: THREE.MeshPhysicalMaterial;
  caseBrushed: THREE.MeshPhysicalMaterial;
  dial: THREE.MeshPhysicalMaterial;
  handsPolished: THREE.MeshPhysicalMaterial;
  chronoFrosted: THREE.MeshPhysicalMaterial;
  crystal: THREE.MeshPhysicalMaterial;
  moon: THREE.MeshPhysicalMaterial;
  strap: THREE.MeshPhysicalMaterial;
  stitch: THREE.MeshPhysicalMaterial;
  subdialFace: (kind: 'seconds' | 'minutes' | 'date') => THREE.MeshPhysicalMaterial;
  apertureDisc: (text: string, opts?: { round?: boolean; dayNight?: boolean }) => THREE.MeshPhysicalMaterial;
}

function createMaterials(fidelity: Fidelity): MaterialSet {
  const full = fidelity === 'full';

  const casePolished = new THREE.MeshPhysicalMaterial({
    color: 0xe8e9eb, metalness: 1.0, roughness: full ? 0.14 : 0.2, envMapIntensity: 1.15,
  });
  const caseBrushed = new THREE.MeshPhysicalMaterial({
    color: 0xd6d8db, metalness: 1.0, roughness: 0.34, envMapIntensity: 0.9,
    roughnessMap: full ? createBrushedRoughness(256, false) : null,
  });

  const dial = new THREE.MeshPhysicalMaterial({
    color: full ? 0xffffff : 0x4a423c, metalness: 0.06, roughness: 0.62, envMapIntensity: 0.22,
  });
  if (full) {
    const { map, roughnessMap } = createDialTextures();
    dial.map = map;
    dial.roughnessMap = roughnessMap;
  }

  const handsPolished = new THREE.MeshPhysicalMaterial({
    color: 0xedeef0, metalness: 1.0, roughness: 0.1, envMapIntensity: 1.25,
  });
  const chronoFrosted = new THREE.MeshPhysicalMaterial({
    color: 0xd9dbdd, metalness: 1.0, roughness: 0.46, envMapIntensity: 0.8,
  });

  const crystal = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.02,
    transmission: 1.0, ior: 1.76, thickness: 0.05,
    clearcoat: 0.15, clearcoatRoughness: 0.03,
    envMapIntensity: 0.18,
    specularIntensity: 0.55,
  });

  const moon = new THREE.MeshPhysicalMaterial({
    color: full ? 0xffffff : 0x1b2447, metalness: 0.3, roughness: 0.3,
    clearcoat: 0.4, envMapIntensity: 0.4,
    map: full ? createMoonTexture() : null,
    emissive: new THREE.Color(0x1c2a58), emissiveIntensity: 0.5,
    emissiveMap: full ? createMoonTexture() : null,
  });

  const strap = new THREE.MeshPhysicalMaterial({
    color: full ? 0xffffff : 0x23262a, metalness: 0.0, roughness: 0.8,
    sheen: 0.35, sheenColor: new THREE.Color(0x3a3e45), envMapIntensity: 0.4,
  });
  if (full) {
    const { map, normalMap, roughnessMap } = createStrapTextures();
    strap.map = map;
    strap.normalMap = normalMap;
    strap.normalScale = new THREE.Vector2(0.7, 0.7);
    strap.roughnessMap = roughnessMap;
  }

  const stitch = new THREE.MeshPhysicalMaterial({
    color: 0xe8e2d4, metalness: 0, roughness: 0.62, sheen: 0.4,
    sheenColor: new THREE.Color(0xf4efe3), envMapIntensity: 0.5,
  });

  const subdialFace = (kind: 'seconds' | 'minutes' | 'date') =>
    new THREE.MeshPhysicalMaterial({
      color: full ? 0xffffff : 0x362f29, metalness: 0.05, roughness: 0.66, envMapIntensity: 0.18,
      map: full ? createSubdialTexture(kind) : null,
    });

  const apertureDisc = (text: string, opts: { round?: boolean; dayNight?: boolean } = {}) =>
    new THREE.MeshPhysicalMaterial({
      color: full ? 0xffffff : 0xf2f0ea, metalness: 0, roughness: 0.6, envMapIntensity: 0.2,
      map: full ? createApertureDiscTexture(text, opts) : null,
    });

  return {
    casePolished, caseBrushed, dial, handsPolished, chronoFrosted,
    crystal, moon, strap, stitch, subdialFace, apertureDisc,
  };
}

/* ------------------------------------------------------------------ */
/* Assembly                                                           */
/* ------------------------------------------------------------------ */

export function createPerpetualCalendarChronographModel(
  options: ProceduralModelOptions = {},
): THREE.Group {
  const fidelity = options.fidelity ?? 'full';
  const mats = createMaterials(fidelity);

  const nodes: Record<string, THREE.Object3D> = {};
  const meshes: Record<string, THREE.Mesh | THREE.InstancedMesh> = {};
  const sockets: Record<string, THREE.Object3D> = {};
  const colliders: Record<string, unknown> = {};
  const destructionGroups: Record<string, THREE.Object3D[]> = {};

  const root = new THREE.Group();
  root.name = 'root';
  nodes.root = root;

  function node(id: string, label: string, parent: THREE.Object3D, position: THREE.Vector3): THREE.Group {
    const g = new THREE.Group();
    g.name = id;
    g.position.copy(position);
    parent.add(g);
    nodes[id] = g;
    const exp = EXPLOSION[id];
    g.userData.componentId = id;
    g.userData.label = exp?.label ?? label;
    g.userData.description = exp?.description ?? '';
    if (exp) g.userData.explode = exp;
    return g;
  }

  function registerMesh(id: string, mesh: THREE.Mesh | THREE.InstancedMesh, shadows = true) {
    mesh.castShadow = options.castShadow ?? shadows;
    mesh.receiveShadow = options.receiveShadow ?? shadows;
    meshes[id] = mesh;
  }

  /* ---- macro assemblies ---- */
  const strapAssembly = node('strap-assembly', 'STRAP ASSEMBLY', root, new THREE.Vector3());
  const caseAssembly = node('case-assembly', 'CASE ASSEMBLY', root, new THREE.Vector3());
  const dialAssembly = node('dial-assembly', 'DIAL ASSEMBLY', root, new THREE.Vector3());
  const handAssembly = node('hand-assembly', 'HAND ASSEMBLY', root, new THREE.Vector3());

  if (fidelity === 'blockout') {
    const caseVol = new THREE.Mesh(
      new THREE.CylinderGeometry(2.05, 2.05, 0.9, 64).rotateX(Math.PI / 2), mats.casePolished);
    caseVol.position.z = -0.05;
    caseVol.name = 'case-massing';
    caseAssembly.add(caseVol);
    registerMesh('case-assembly', caseVol);

    const bezelVol = new THREE.Mesh(
      new THREE.CylinderGeometry(1.95, 2.0, 0.3, 64).rotateX(Math.PI / 2), mats.casePolished);
    bezelVol.position.z = 0.48;
    bezelVol.name = 'bezel-massing';
    caseAssembly.add(bezelVol);

    const dialVol = new THREE.Mesh(
      new THREE.CylinderGeometry(1.7, 1.7, 0.06, 64).rotateX(Math.PI / 2), mats.dial);
    dialVol.position.z = 0.28;
    dialVol.name = 'dial-massing';
    dialAssembly.add(dialVol);
    registerMesh('dial-assembly', dialVol);

    for (const sgn of [1, -1]) {
      const strapLen = sgn > 0 ? 1.15 : 3.0;
      const strapVol = new THREE.Mesh(new THREE.BoxGeometry(2.12, strapLen, 0.3), mats.strap);
      strapVol.position.set(0, sgn * (1.86 + strapLen / 2), -0.18);
      strapVol.rotation.x = sgn * -0.1;
      strapVol.name = sgn > 0 ? 'strap-upper-massing' : 'strap-lower-massing';
      strapAssembly.add(strapVol);
      if (sgn > 0) registerMesh('strap-assembly', strapVol);
    }
    const crownVol = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.34, 0.45, 24).rotateZ(Math.PI / 2), mats.casePolished);
    crownVol.position.set(2.3, 0, -0.02);
    crownVol.name = 'crown-massing';
    caseAssembly.add(crownVol);

    // lug massing (visible in the reference silhouette at the case corners)
    for (const [lx, ly, lr] of LUG_PLACEMENTS) {
      const lug = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.85, 0.42), mats.casePolished);
      lug.position.set(lx * 1.12, ly * 1.16, -0.05);
      lug.rotation.z = lr;
      lug.name = 'lug-massing';
      caseAssembly.add(lug);
    }

    for (const sgn of [1, -1]) {
      const pv = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.34), mats.casePolished);
      pv.position.set(1.95, sgn * 1.12, -0.02);
      pv.rotation.z = sgn * 0.5236;
      pv.name = sgn > 0 ? 'pusher-upper-massing' : 'pusher-lower-massing';
      caseAssembly.add(pv);
    }
    const handsVol = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.6, 0.05), mats.handsPolished);
    handsVol.position.z = 0.42;
    handsVol.rotation.z = HAND_ANGLES.hour;
    handsVol.name = 'hands-massing';
    handAssembly.add(handsVol);
    registerMesh('hand-assembly', handsVol);

    finalize(root, nodes, meshes, sockets, colliders, destructionGroups);
    return root;
  }

  const refined = fidelity === 'form' || fidelity === 'full';

  /* ---- case assembly ---- */
  const caseMain = node('case-main', 'CASE', caseAssembly, new THREE.Vector3());
  {
    const geo = buildCaseMain(); // lathe at all tiers (a capped cylinder proxy hides the dial)
    const mesh = new THREE.Mesh(geo, mats.casePolished);
    mesh.name = 'case-main-mesh';
    caseMain.add(mesh);
    registerMesh('case-main', mesh);
    for (const [sid, sx, sy, sz] of [
      ['crown-socket', 2.05, 0, -0.02],
      ['pusher-socket-upper', 1.78, 1.02, -0.02],
      ['pusher-socket-lower', 1.78, -1.02, -0.02],
      ['case-front-rim', 0, 0, 0.34],
      ['case-back-rim', 0, 0, -0.42],
    ] as const) {
      const s = new THREE.Object3D();
      s.name = String(sid);
      s.position.set(Number(sx), Number(sy), Number(sz));
      caseMain.add(s);
      sockets[String(sid)] = s;
    }
  }

  const bezel = node('bezel', 'BEZEL', caseAssembly, new THREE.Vector3());
  {
    const geo = refined
      ? buildBezel()
      : new THREE.CylinderGeometry(1.95, 2.0, 0.27, 64, 1, true).rotateX(Math.PI / 2).translate(0, 0, 0.44);
    const mesh = new THREE.Mesh(geo, mats.casePolished);
    mesh.name = 'bezel-mesh';
    bezel.add(mesh);
    registerMesh('bezel', mesh);
  }

  const crystalNode = node('crystal', 'CRYSTAL', caseAssembly, new THREE.Vector3());
  {
    const geo = buildCrystal(); // lathe dome at all tiers (sphere proxy floated off the bezel)
    const mesh = new THREE.Mesh(geo, mats.crystal);
    mesh.name = 'crystal-mesh';
    mesh.renderOrder = 10;
    crystalNode.add(mesh);
    registerMesh('crystal', mesh, false);
  }

  const caseBack = node('case-back', 'CASE BACK', caseAssembly, new THREE.Vector3());
  {
    const geo = refined
      ? buildCaseBack()
      : new THREE.CylinderGeometry(1.92, 1.6, 0.2, 64).rotateX(Math.PI / 2).translate(0, 0, -0.52);
    const mesh = new THREE.Mesh(geo, mats.casePolished);
    mesh.name = 'case-back-mesh';
    caseBack.add(mesh);
    registerMesh('case-back', mesh);

    // engraved rear medallion: concentric grooves + center boss so the back reads finished when it departs
    const medallion: THREE.BufferGeometry[] = [
      new THREE.TorusGeometry(1.42, 0.022, 8, 72),
      new THREE.TorusGeometry(1.05, 0.018, 8, 64),
      new THREE.TorusGeometry(0.62, 0.018, 8, 56),
      new THREE.CylinderGeometry(0.3, 0.34, 0.03, 48).rotateX(Math.PI / 2),
    ];
    const medGeo = mergeGeometries(medallion.map((g, i) => g.translate(0, 0, i === 3 ? -0.63 : -0.62)));
    const med = new THREE.Mesh(medGeo, mats.caseBrushed);
    med.name = 'case-back-medallion';
    med.userData.explodeWithParent = true;
    med.castShadow = false;
    caseBack.add(med);
  }

  const movement = node('movement-plate', 'MOVEMENT', caseAssembly, new THREE.Vector3());
  {
    const calibre = buildMovement({ plateBrushed: mats.caseBrushed, polished: mats.casePolished });
    const sub: Array<[string, THREE.Group]> = [
      ['movement-base', calibre.parts.plate],
      ['gear-train', calibre.parts.gearTrain],
      ['balance-wheel', calibre.parts.balance],
      ['mainspring-barrel', calibre.parts.barrel],
      ['movement-screws', calibre.parts.screws],
      ['chrono-works', calibre.parts.chrono],
    ];
    for (const [id, grp] of sub) {
      if (id === 'movement-base') {
        grp.name = 'movement-base';
        movement.add(grp);
        const first = grp.children.find((c) => (c as THREE.Mesh).isMesh) as THREE.Mesh | undefined;
        if (first) registerMesh('movement-plate', first);
        continue;
      }
      const n = node(id, id.toUpperCase(), movement, new THREE.Vector3());
      grp.name = `${id}-parts`; // avoid colliding with the component node name
      n.add(grp);
      const first = grp.children.find((c) => (c as THREE.Mesh).isMesh || (c as THREE.InstancedMesh).isInstancedMesh) as THREE.Mesh | undefined;
      if (first) registerMesh(id, first);
    }

    // perpetual calendar works live under the dial, revealed when the dial rises
    const calendar = buildCalendarWorks({ brushed: mats.caseBrushed, polished: mats.casePolished });
    const calNode = node('calendar-works', 'CALENDAR WORKS', dialAssembly, new THREE.Vector3());
    calendar.parts.works.name = 'calendar-works-parts';
    calNode.add(calendar.parts.works);
    const calMesh = calendar.parts.works.children.find((c) => (c as THREE.Mesh).isMesh) as THREE.Mesh | undefined;
    if (calMesh) registerMesh('calendar-works', calMesh);

    root.userData.spinMechanism = (t: number) => {
      calibre.spin(t);
      calendar.spin(t);
    };

    // shadow-pass economy: the calibre + calendar micro-parts read by direct light,
    // their shadow contribution is invisible at story scale — halve their draw cost.
    for (const grp of [movement, calNode]) {
      grp.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) m.castShadow = false;
      });
    }
  }

  const lugs = node('lugs', 'LUGS', caseAssembly, new THREE.Vector3());
  {
    const lugGeo = buildLug();
    const merged: THREE.BufferGeometry[] = [];
    for (const [x, y, rz] of LUG_PLACEMENTS) {
      const g = lugGeo.clone();
      g.rotateZ(rz);
      g.translate(x, y, -0.02);
      merged.push(g);
    }
    const mesh = new THREE.Mesh(mergeGeometries(merged), mats.casePolished);
    mesh.name = 'lugs-mesh';
    lugs.add(mesh);
    registerMesh('lugs', mesh);
    // spring-bar pins between each lug pair — revealed when the straps depart
    const pinGeos: THREE.BufferGeometry[] = [];
    for (const sy of [1, -1]) {
      const pin = new THREE.CylinderGeometry(0.032, 0.032, 1.9, 12).rotateZ(Math.PI / 2);
      pin.translate(0, sy * 1.78, -0.08);
      pinGeos.push(pin);
      for (const sx of [-1, 1]) {
        const collar = new THREE.CylinderGeometry(0.05, 0.05, 0.08, 10).rotateZ(Math.PI / 2);
        collar.translate(sx * 0.82, sy * 1.78, -0.08);
        pinGeos.push(collar);
      }
    }
    const pins = new THREE.Mesh(mergeGeometries(pinGeos), mats.casePolished);
    pins.name = 'spring-bar-pins';
    pins.userData.explodeWithParent = true;
    lugs.add(pins);
  }

  const crown = node('crown', 'CROWN', caseAssembly, new THREE.Vector3());
  if (refined) {
    const g = buildCrownGroup(mats.casePolished);
    g.name = 'crown-parts';
    crown.add(g);
    registerMesh('crown', g.children.find((c) => c.name === 'crown-body') as THREE.Mesh);
  } else {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.44, 24).rotateZ(Math.PI / 2).translate(2.33, 0, 0), mats.casePolished);
    mesh.name = 'crown-mesh';
    crown.add(mesh);
    registerMesh('crown', mesh);
  }

  for (const [pid, sgn] of [['pusher-upper', 1], ['pusher-lower', -1]] as const) {
    const p = node(pid, pid.toUpperCase(), caseAssembly, new THREE.Vector3());
    const ang = (sgn as number) * 0.3665; // measured ±21° from +X
    if (refined) {
      const { block } = buildPusherGeometries();
      const mesh = new THREE.Mesh(block, mats.casePolished);
      mesh.rotateZ(ang);
      mesh.rotateY(Math.PI / 2);
      mesh.position.set(Math.cos(ang) * 1.98, Math.sin(ang) * 1.98, -0.02);
      mesh.name = `${pid}-mesh`;
      p.add(mesh);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.30, 0.32), mats.caseBrushed);
      cap.position.set(Math.cos(ang) * 2.39, Math.sin(ang) * 2.39, -0.02);
      cap.rotation.z = ang;
      cap.name = `${pid}-cap`;
      cap.userData.explodeWithParent = true;
      p.add(cap);
      registerMesh(pid, mesh);
    } else {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.32, 0.34), mats.casePolished);
      mesh.position.set(Math.cos(ang) * 2.12, Math.sin(ang) * 2.12, -0.02);
      mesh.rotation.z = ang;
      mesh.name = `${pid}-mesh`;
      p.add(mesh);
      registerMesh(pid, mesh);
    }
  }

  /* ---- dial assembly ---- */
  const dialPlate = node('dial-plate', 'DIAL', dialAssembly, new THREE.Vector3());
  {
    const geo = refined
      ? buildDialPlate()
      : new THREE.CylinderGeometry(1.7, 1.7, 0.05, 64).rotateX(Math.PI / 2).translate(0, 0, 0.275);
    const mesh = new THREE.Mesh(geo, mats.dial);
    mesh.name = 'dial-plate-mesh';
    dialPlate.add(mesh);
    registerMesh('dial-plate', mesh);
    const pinion = new THREE.Object3D();
    pinion.name = 'dial-center-pinion';
    pinion.position.set(0, 0, 0.34);
    dialPlate.add(pinion);
    sockets['dial-center-pinion'] = pinion;
  }

  const rehaut = node('rehaut-ring', 'REHAUT', dialAssembly, new THREE.Vector3());
  {
    const geo = refined
      ? buildRehaut()
      : new THREE.CylinderGeometry(1.72, 1.72, 0.14, 64, 1, true).rotateX(Math.PI / 2).translate(0, 0, 0.37);
    const mesh = new THREE.Mesh(geo, mats.casePolished);
    mesh.name = 'rehaut-mesh';
    rehaut.add(mesh);
    registerMesh('rehaut-ring', mesh);
  }

  const markers = node('hour-markers', 'MARKERS', dialAssembly, new THREE.Vector3());
  {
    const geo = refined ? buildMarkerGeometry() : new THREE.BoxGeometry(0.062, 0.28, 0.04);
    const transforms = markerTransforms();
    const inst = new THREE.InstancedMesh(geo, mats.handsPolished, transforms.length);
    transforms.forEach((m, i) => inst.setMatrixAt(i, m));
    inst.name = 'hour-markers-mesh';
    markers.add(inst);
    registerMesh('hour-markers', inst);
  }

  const apertures = node('dial-apertures', 'DAY / MONTH', dialAssembly, new THREE.Vector3());
  {
    const frameGeo = refined ? buildApertureFrame() : new THREE.BoxGeometry(0.54, 0.34, 0.03);
    const g: THREE.BufferGeometry[] = [];
    for (const sx of [-1, 1]) {
      const f = frameGeo.clone();
      f.translate(sx * 0.30, 0.86, 0.295);
      g.push(f);
    }
    const frames = new THREE.Mesh(mergeGeometries(g), mats.handsPolished);
    frames.name = 'aperture-frames';
    apertures.add(frames);
    registerMesh('dial-apertures', frames);
    const dayDisc = new THREE.Mesh(new THREE.PlaneGeometry(0.39, 0.21), mats.apertureDisc('SAT'));
    dayDisc.position.set(-0.30, 0.86, 0.303);
    dayDisc.name = 'aperture-disc-day';
    dayDisc.userData.explodeWithParent = true;
    apertures.add(dayDisc);
    const monthDisc = new THREE.Mesh(new THREE.PlaneGeometry(0.39, 0.21), mats.apertureDisc('MAR'));
    monthDisc.position.set(0.30, 0.86, 0.303);
    monthDisc.name = 'aperture-disc-month';
    monthDisc.userData.explodeWithParent = true;
    apertures.add(monthDisc);
  }

  const roundWindows = node('dial-round-windows', 'WINDOWS', dialAssembly, new THREE.Vector3());
  {
    const geos: THREE.BufferGeometry[] = [];
    for (const sx of [-1, 1]) {
      const f = (refined ? buildRoundWindowFrame() : new THREE.TorusGeometry(0.095, 0.016, 8, 24)).clone();
      f.translate(sx * 0.78, -0.78, 0.30);
      geos.push(f);
    }
    const framesMesh = new THREE.Mesh(mergeGeometries(geos), mats.handsPolished);
    framesMesh.name = 'round-window-frames';
    roundWindows.add(framesMesh);
    registerMesh('dial-round-windows', framesMesh);
    const dn = new THREE.Mesh(new THREE.CircleGeometry(0.088, 32), mats.apertureDisc('', { dayNight: true }));
    dn.position.set(-0.78, -0.78, 0.303);
    dn.name = 'daynight-disc';
    dn.userData.explodeWithParent = true;
    roundWindows.add(dn);
    const leap = new THREE.Mesh(new THREE.CircleGeometry(0.088, 32), mats.apertureDisc('3', { round: true }));
    leap.position.set(0.78, -0.78, 0.303);
    leap.name = 'leap-disc';
    leap.userData.explodeWithParent = true;
    roundWindows.add(leap);
  }

  const subdials = node('subdials', 'SUBDIAL', dialAssembly, new THREE.Vector3());
  for (const [sid, sx, kind] of [
    ['subdial-left', -0.92, 'seconds'],
    ['subdial-right', 0.92, 'minutes'],
  ] as const) {
    const sd = node(sid, sid.toUpperCase(), subdials, new THREE.Vector3());
    const { lip } = buildSubdialWell(0.52);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.52, 64), mats.subdialFace(kind));
    face.position.set(sx as number, 0, 0.302);
    face.name = `${sid}-face`;
    sd.add(face);
    registerMesh(sid, face);
    if (refined) {
      const lipMesh = new THREE.Mesh(lip, mats.casePolished);
      lipMesh.position.set(sx as number, 0, 0.305);
      lipMesh.scale.set(1, 1, 0.35);
      lipMesh.name = `${sid}-lip`;
      lipMesh.userData.explodeWithParent = true;
      sd.add(lipMesh);
    }
  }

  const dateSubdial = node('date-subdial', 'DATE RING', dialAssembly, new THREE.Vector3());
  {
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.55, 64), mats.subdialFace('date'));
    face.position.set(0, -0.86, 0.302);
    face.name = 'date-subdial-face';
    dateSubdial.add(face);
    registerMesh('date-subdial', face);
  }

  const moonphase = node('moonphase', 'MOONPHASE', dialAssembly, new THREE.Vector3());
  {
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(0.34, 48), mats.moon);
    mesh.position.set(0, -0.74, 0.304);
    mesh.name = 'moonphase-mesh';
    moonphase.add(mesh);
    registerMesh('moonphase', mesh);
  }

  /* ---- hand assembly ---- */
  const mkHand = (
    id: string, geo: THREE.BufferGeometry, mat: THREE.Material,
    pos: THREE.Vector3, angle: number, hubR: number,
  ) => {
    const h = node(id, id.toUpperCase(), handAssembly, pos);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.z = angle;
    mesh.name = `${id}-mesh`;
    h.add(mesh);
    if (hubR > 0) {
      const hub = new THREE.Mesh(buildHub(hubR, 0.03), mat);
      hub.name = `${id}-hub`;
      hub.userData.explodeWithParent = true;
      h.add(hub);
    }
    registerMesh(id, mesh);
    return h;
  };

  mkHand('hand-hour',
    refined ? buildLeafHand(1.02, 0.145) : new THREE.BoxGeometry(0.14, 1.02, 0.02).translate(0, 0.51, 0),
    mats.handsPolished, new THREE.Vector3(0, 0, 0.365), HAND_ANGLES.hour, 0.09);
  mkHand('hand-minute',
    refined ? buildLeafHand(1.50, 0.12) : new THREE.BoxGeometry(0.11, 1.5, 0.018).translate(0, 0.75, 0),
    mats.handsPolished, new THREE.Vector3(0, 0, 0.405), HAND_ANGLES.minute, 0.075);
  mkHand('hand-chrono',
    refined ? buildChronoHand() : new THREE.BoxGeometry(0.03, 1.9, 0.012).translate(0, 0.6, 0),
    mats.chronoFrosted, new THREE.Vector3(0, 0, 0.445), HAND_ANGLES.chrono, 0);

  mkHand('subhand-left',
    refined ? buildLeafHand(0.50, 0.05, 0.01, 0.008) : new THREE.BoxGeometry(0.045, 0.5, 0.01).translate(0, 0.25, 0),
    mats.handsPolished, new THREE.Vector3(-0.92, 0, 0.298), HAND_ANGLES.subLeft, 0.05);
  mkHand('subhand-right',
    refined ? buildLeafHand(0.50, 0.05, 0.01, 0.008) : new THREE.BoxGeometry(0.045, 0.5, 0.01).translate(0, 0.25, 0),
    mats.handsPolished, new THREE.Vector3(0.92, 0, 0.298), HAND_ANGLES.subRight, 0.05);
  mkHand('hand-date',
    refined ? buildLeafHand(0.38, 0.045, 0.01, 0.008) : new THREE.BoxGeometry(0.04, 0.38, 0.01).translate(0, 0.19, 0),
    mats.handsPolished, new THREE.Vector3(0, -0.88, 0.298), HAND_ANGLES.date, 0.045);

  const pinionCap = node('pinion-cap', 'CAP', handAssembly, new THREE.Vector3(0, 0, 0.468));
  {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.048, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2),
      mats.handsPolished);
    mesh.name = 'pinion-cap-mesh';
    pinionCap.add(mesh);
    registerMesh('pinion-cap', mesh);
  }

  /* ---- strap assembly ---- */
  for (const [sid, upper] of [['strap-upper', true], ['strap-lower', false]] as const) {
    const s = node(sid, 'STRAP', strapAssembly, new THREE.Vector3());
    // curve-sweep at structural too: the reference strap is visibly curved and end-rounded
    const build = buildStrap(upper as boolean);
    const mesh = new THREE.Mesh(build.geometry, mats.strap);
    mesh.name = `${sid}-mesh`;
    s.add(mesh);
    registerMesh(sid, mesh);
    const stitchId = upper ? 'stitch-upper' : 'stitch-lower';
    const st = node(stitchId, 'STITCHING', s, new THREE.Vector3());
    if (refined) {
      const nSt = upper ? 8 : 12;
      const left = buildStitchInstances(build, 0.055, nSt, mats.stitch);
      left.name = `${stitchId}-left`;
      const right = buildStitchInstances(build, 0.945, nSt, mats.stitch);
      right.name = `${stitchId}-right`;
      st.add(left, right);
      registerMesh(stitchId, left);
    } else {
      st.visible = false;
    }
  }

  finalize(root, nodes, meshes, sockets, colliders, destructionGroups);
  return root;
}

/** Store immutable assembled transforms + runtime registry on the root. */
function finalize(
  root: THREE.Group,
  nodes: Record<string, THREE.Object3D>,
  meshes: Record<string, THREE.Mesh | THREE.InstancedMesh>,
  sockets: Record<string, THREE.Object3D>,
  colliders: Record<string, unknown>,
  destructionGroups: Record<string, THREE.Object3D[]>,
) {
  for (const [id, n] of Object.entries(nodes)) {
    n.userData.assembledPosition = n.position.clone();
    n.userData.assembledRotation = n.rotation.clone();
    const exp = EXPLOSION[id];
    if (exp) {
      n.userData.explodedPosition = n.position.clone().add(
        new THREE.Vector3(...exp.axis).multiplyScalar(exp.distance));
    }
    destructionGroups[id] = [n];
  }
  root.userData.sculptRuntime = { nodes, meshes, sockets, colliders, destructionGroups } satisfies ProceduralModelRuntime;
}

/* ------------------------------------------------------------------ */
/* Explosion driver — ONE master progress, staggered by order         */
/* ------------------------------------------------------------------ */

const ORDER_MAX = 18;

/** Chapter-aligned departure windows per explosion order: [start, span] in master t.
 *  Aligned so each layer separates inside its narrative chapter
 *  (glazing→CASE, dial furniture→DIAL, hands→INDICATION, controls→CONTROL, rear→ARCHITECTURE). */
const EXPLODE_WINDOWS: Record<number, [number, number]> = {
  1: [0.0, 0.16],   // crystal — THE CASE
  2: [0.05, 0.16],  // bezel — THE CASE
  3: [0.12, 0.15],  // rehaut — CASE→DIAL edge
  9: [0.2, 0.15],   // markers — THE DIAL
  10: [0.25, 0.15], // apertures/windows — THE DIAL
  11: [0.3, 0.15],  // subdials/date — THE DIAL
  4: [0.42, 0.1],   // pinion cap — THE HANDS
  5: [0.44, 0.12],  // chrono — THE HANDS
  6: [0.46, 0.12],  // minute — THE HANDS
  7: [0.49, 0.12],  // hour — THE HANDS
  8: [0.5, 0.1],    // small hands — leave with the dial so the rising plate never swallows them
  13: [0.5, 0.15],  // dial plate rises after the hand stack has cleared
  16: [0.62, 0.13], // crown — THE CONTROL
  17: [0.66, 0.13], // pushers — THE CONTROL
  15: [0.74, 0.13], // case back unscrews FIRST — ARCHITECTURE
  14: [0.82, 0.14], // movement drops out through the opened back — ARCHITECTURE
  12: [0.85, 0.12], // moon disc slides out of the rear opening onto the plate
  21: [0.87, 0.11], // calendar module follows through the rear corridor
  18: [0.86, 0.12], // straps — ARCHITECTURE→WHOLE
  19: [0.88, 0.11], // calibre internals lift off the plate — THE WHOLE
  20: [0.92, 0.08], // bridge screws extract — THE WHOLE
};

/** Per-component eased local progress for master progress t (0..1). */
export function componentExplodeProgress(order: number, t: number): number {
  if (order <= 0) return 0;
  const [start, span] = EXPLODE_WINDOWS[order] ?? [((order - 1) / ORDER_MAX) * 0.62, 0.34];
  const local = THREE.MathUtils.clamp((t - start) / span, 0, 1);
  return local * local * (3 - 2 * local);
}

/** Apply master explosion progress. Fully reversible; t=0 restores assembled state exactly. */
export function setExplosionProgress(model: THREE.Object3D, t: number): void {
  const runtime = model.userData.sculptRuntime as ProceduralModelRuntime | undefined;
  if (!runtime) return;
  for (const n of Object.values(runtime.nodes)) {
    const exp = n.userData.explode as ExplodeMeta | undefined;
    const home = n.userData.assembledPosition as THREE.Vector3 | undefined;
    if (!exp || !home) continue;
    const k = componentExplodeProgress(exp.order, t) * exp.distance;
    n.position.set(home.x + exp.axis[0] * k, home.y + exp.axis[1] * k, home.z + exp.axis[2] * k);
  }
}

/* ------------------------------------------------------------------ */
/* Look-dev lights / environment / framing (review harness contract)  */
/* ------------------------------------------------------------------ */

export function createPerpetualCalendarChronographLookDevLights(
  mode: 'neutral' | 'grazing' | 'reference' = 'neutral',
): THREE.Group {
  const lights = new THREE.Group();
  lights.name = 'lookdev-lights';
  const hemi = new THREE.HemisphereLight(0xf2f4ff, 0x363b42, mode === 'grazing' ? 0.15 : 0.3);
  lights.add(hemi);
  const key = new THREE.DirectionalLight(0xfff4e8, mode === 'grazing' ? 3.2 : 1.8);
  if (mode === 'grazing') key.position.set(7.5, 1.1, 4.0);
  else key.position.set(-4.0, 6.0, 7.0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.02;
  lights.add(key);
  const fill = new THREE.DirectionalLight(0xa8c4ff, 0.28);
  fill.position.set(4.0, 1.0, 6.5);
  lights.add(fill);
  const rim = new THREE.DirectionalLight(0xfff1c4, mode === 'grazing' ? 0.25 : 0.55);
  rim.position.set(2.5, 4.5, -6.0);
  lights.add(rim);
  lights.userData.reviewMode = mode;
  return lights;
}

export function createPerpetualCalendarChronographEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new RoomEnvironment();
  const texture = pmrem.fromScene(envScene, 0.04).texture;
  pmrem.dispose();
  return texture;
}

/** Dispose every geometry, material and texture under the model. */
export function disposePerpetualCalendarChronographModel(root: THREE.Object3D): void {
  const disposedMaterials = new Set<THREE.Material>();
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      if (!m || disposedMaterials.has(m)) continue;
      disposedMaterials.add(m);
      for (const key of ['map', 'normalMap', 'roughnessMap'] as const) {
        const tex = (m as unknown as Record<string, THREE.Texture | null>)[key];
        tex?.dispose();
      }
      m.dispose();
    }
  });
}

export function framePerpetualCalendarChronographCamera(
  camera: THREE.PerspectiveCamera,
  object: THREE.Object3D,
  options: { margin?: number; azimuthDeg?: number; elevationDeg?: number } = {},
): void {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const margin = options.margin ?? 1.15;
  const maxDim = Math.max(size.x, size.y, size.z) * margin;
  const fov = (camera.fov * Math.PI) / 180;
  const distance = maxDim / 2 / Math.tan(fov / 2);
  const az = ((options.azimuthDeg ?? 0) * Math.PI) / 180;
  const el = ((options.elevationDeg ?? 0) * Math.PI) / 180;
  const dir = new THREE.Vector3(
    Math.sin(az) * Math.cos(el),
    Math.sin(el),
    Math.cos(az) * Math.cos(el),
  );
  camera.position.copy(center).addScaledVector(dir, distance);
  camera.near = Math.max(0.01, distance - maxDim);
  camera.far = distance + maxDim * 2;
  camera.lookAt(center);
  camera.updateProjectionMatrix();
}
