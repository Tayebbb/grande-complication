/**
 * calendar.ts — procedural under-dial perpetual-calendar works.
 * Watch-local frame: dial faces +Z, +Y = 12 o'clock, 1 unit = 10 mm. The calendar
 * layer occupies z +0.08..+0.20, between the movement top (-0.05) and the dial (+0.25).
 * Conventions mirror movement.ts: rotation axes on +Z, extrusions native, no assets,
 * fully deterministic. Positions are authored in watch space; the caller parents the
 * group under the dial-side assembly.
 */
import * as THREE from 'three';
import { cylinderZ, gearGeometry, mergeGeos, roundedOutline, shadowed } from './movement';

const TAU = Math.PI * 2;

export interface CalendarBuild {
  group: THREE.Group;
  parts: { works: THREE.Group };
  spin: (t: number) => void;
}

/** Flat date ring: fine external teeth on the outer rim, open bore for the movement center. */
function dateRingGeometry(outerR: number, innerR: number, teeth: number, depth: number): THREE.BufferGeometry {
  const rootR = outerR - 0.055;
  const pitch = TAU / teeth;
  const s = new THREE.Shape();
  for (let i = 0; i < teeth; i++) {
    const c = i * pitch;
    const a0 = c - pitch * 0.3;
    const a1 = c - pitch * 0.12;
    const a2 = c + pitch * 0.12;
    const a3 = c + pitch * 0.3;
    if (i === 0) s.moveTo(Math.cos(a0) * rootR, Math.sin(a0) * rootR);
    else s.lineTo(Math.cos(a0) * rootR, Math.sin(a0) * rootR);
    s.lineTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR);
    s.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR);
    s.lineTo(Math.cos(a3) * rootR, Math.sin(a3) * rootR);
  }
  s.closePath();
  const bore = new THREE.Path();
  bore.absarc(0, 0, innerR, 0, TAU, true);
  s.holes.push(bore);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 24 });
  g.translate(0, 0, -depth / 2);
  return g;
}

/** 12-lobe rounded star cam (month cam), sampled polar outline with center bore. */
function monthCamGeometry(r: number, depth: number): THREE.BufferGeometry {
  const s = new THREE.Shape();
  const n = 120;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const rad = r * (0.84 + 0.16 * Math.cos(a * 12));
    if (i === 0) s.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
    else s.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  s.closePath();
  const bore = new THREE.Path();
  bore.absarc(0, 0, r * 0.12, 0, TAU, true);
  s.holes.push(bore);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 4 });
  g.translate(0, 0, -depth / 2);
  return g;
}

export function buildCalendarWorks(mats: {
  brushed: THREE.MeshPhysicalMaterial;
  polished: THREE.MeshPhysicalMaterial;
}): CalendarBuild {
  // brushed champagne derived from the case-brushed material so env settings carry over
  const champagne = mats.brushed.clone();
  champagne.color = new THREE.Color(0xc9b88f);
  champagne.metalness = 0.9;
  champagne.roughness = 0.35;
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

  const group = new THREE.Group();
  group.name = 'calendar-works';
  const works = new THREE.Group();
  works.name = 'calendar-works-assembly';
  group.add(works);

  /* ---- date wheel: 31-tooth ring r 1.05..1.30, z 0.085..0.115 ---- */
  const dateWheel = shadowed(new THREE.Mesh(dateRingGeometry(1.3, 1.05, 31, 0.03), champagne), 'calendar-date-wheel');
  dateWheel.position.z = 0.1;
  works.add(dateWheel);

  /* ---- month cam: 12-lobe star, z 0.1075..0.1325 ---- */
  const monthCam = shadowed(new THREE.Mesh(monthCamGeometry(0.28, 0.025), gold), 'calendar-month-cam');
  monthCam.position.set(-0.55, 0.35, 0.12);
  works.add(monthCam);

  /* ---- program wheel: 48 fine teeth, z 0.109..0.131 ---- */
  const programWheel = shadowed(new THREE.Mesh(gearGeometry(0.34, 48, 0.022), gold), 'calendar-program-wheel');
  programWheel.position.set(0.5, 0.42, 0.12);
  works.add(programWheel);

  /* ---- two flat organic levers, layer z 0.145..0.165 ---- */
  const lever1 = new THREE.ExtrudeGeometry(
    // cam -> date-wheel area
    roundedOutline([[-0.5, 0.42], [-0.72, 0.3], [-0.9, 0.1], [-1.0, -0.12], [-0.95, -0.18], [-0.82, 0.02], [-0.62, 0.22], [-0.45, 0.34]]),
    { depth: 0.02, bevelEnabled: false, curveSegments: 8 },
  );
  const lever2 = new THREE.ExtrudeGeometry(
    // program wheel -> month cam
    roundedOutline([[0.45, 0.5], [0.1, 0.56], [-0.25, 0.5], [-0.5, 0.42], [-0.52, 0.36], [-0.2, 0.42], [0.15, 0.46], [0.44, 0.42]]),
    { depth: 0.02, bevelEnabled: false, curveSegments: 8 },
  );
  lever1.translate(0, 0, 0.145);
  lever2.translate(0, 0, 0.145);
  works.add(shadowed(new THREE.Mesh(mergeGeos([lever1, lever2]), mats.polished), 'calendar-levers'));

  /* ---- 4 jewels + 4 screws on the works ---- */
  const jewelGeo = cylinderZ(0.028, 0.028, 0.016, 12);
  const jewelSpots: Array<[number, number, number]> = [
    [-0.55, 0.35, 0.141], // cam pivot
    [0.5, 0.42, 0.139], // program-wheel pivot
    [-0.97, -0.14, 0.173], // date-lever tip
    [0.02, 0.5, 0.173], // month-lever middle
  ];
  works.add(shadowed(
    new THREE.Mesh(mergeGeos(jewelSpots.map(([x, y, z]) => {
      const g = jewelGeo.clone();
      g.translate(x, y, z);
      return g;
    })), ruby),
    'calendar-jewels',
  ));

  const screwGeo = cylinderZ(0.024, 0.024, 0.022, 6);
  const screwSpots: Array<[number, number, number]> = [
    [-0.48, 0.38, 0.176],
    [0.42, 0.46, 0.176],
    [-0.86, 0.04, 0.176],
    [0.14, 0.51, 0.176],
  ];
  works.add(shadowed(
    new THREE.Mesh(mergeGeos(screwSpots.map(([x, y, z], i) => {
      const g = screwGeo.clone();
      g.rotateZ(i * 0.9); // varied hex clocking
      g.translate(x, y, z);
      return g;
    })), mats.polished),
    'calendar-screws',
  ));

  /* ---- spin driver: slow date advance, counter-rotating program wheel, static cam ---- */
  const spin = (t: number): void => {
    dateWheel.rotation.z = 0.05 * t;
    programWheel.rotation.z = -0.12 * t;
  };

  return { group, parts: { works }, spin };
}
