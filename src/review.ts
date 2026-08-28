/**
 * Review harness for the img2threejs pass gates.
 * URL params:
 *   ?view=front|three-quarter|right-side|top-oblique|rear|left   (default front)
 *   &mode=neutral|grazing|reference                              (default neutral)
 *   &fidelity=blockout|structural|form|full                     (default full)
 *   &explode=0..1                                                (default 0)
 *   &bg=dark|grey                                                (default grey)
 * Sets window.__captureReady = true after the first settled frame.
 */
import * as THREE from 'three';
import {
  createPerpetualCalendarChronographModel,
  createPerpetualCalendarChronographLookDevLights,
  createPerpetualCalendarChronographEnvironment,
  framePerpetualCalendarChronographCamera,
  setExplosionProgress,
  type Fidelity,
} from './createObjectModel';

declare global {
  interface Window {
    __captureReady?: boolean;
    __setExplode?: (t: number) => void;
  }
}

const params = new URLSearchParams(location.search);
const view = params.get('view') ?? 'front';
const mode = (params.get('mode') ?? 'neutral') as 'neutral' | 'grazing' | 'reference';
const fidelity = (params.get('fidelity') ?? 'full') as Fidelity;
const explode = Number(params.get('explode') ?? '0');
const bg = params.get('bg') ?? 'grey';
const stripped = params.get('stripped') === '1';
const frame = params.get('frame') ?? (view === 'front' ? 'reference' : 'fit');
const fixedW = Number(params.get('w') ?? '0');
const fixedH = Number(params.get('h') ?? '0');
const W = fixedW > 0 ? fixedW : window.innerWidth;
const H = fixedH > 0 ? fixedH : window.innerHeight;

const container = document.getElementById('app')!;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.domElement.style.width = `${W}px`;
renderer.domElement.style.height = `${H}px`;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(
  bg === 'dark' ? 0x0b0b0d : bg === 'light' ? 0xf2f2f4 : 0x1a1b1e,
);

// reference-presentation soft shadow halo (the product photo bakes an opaque
// soft shadow around the lower watch; reproduce it so mask comparisons are fair)
if (bg === 'light') {
  const sc = document.createElement('canvas');
  sc.width = sc.height = 512;
  const sctx = sc.getContext('2d')!;
  const g = sctx.createRadialGradient(256, 256, 40, 256, 256, 250);
  g.addColorStop(0, 'rgba(150,143,137,0.55)');
  g.addColorStop(0.55, 'rgba(160,152,146,0.34)');
  g.addColorStop(1, 'rgba(170,164,158,0)');
  sctx.fillStyle = g;
  sctx.fillRect(0, 0, 512, 512);
  const st = new THREE.CanvasTexture(sc);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(6.4, 6.6),
    new THREE.MeshBasicMaterial({ map: st, transparent: true, depthWrite: false }),
  );
  shadow.position.set(-0.35, -1.35, -1.5);
  shadow.name = 'reference-shadow-halo';
  scene.add(shadow);
}
scene.environment = createPerpetualCalendarChronographEnvironment(renderer);

const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);

const model = createPerpetualCalendarChronographModel({ fidelity });
scene.add(model);
scene.add(createPerpetualCalendarChronographLookDevLights(mode));
if (stripped) {
  const grey = new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.7, metalness: 0 });
  model.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) m.material = grey;
  });
}
const hide = params.get('hide');
if (hide) {
  const runtime = model.userData.sculptRuntime;
  for (const id of hide.split(',')) {
    const n = runtime?.nodes?.[id];
    if (n) n.visible = false;
  }
}

// review viewpoints (azimuth/elevation in degrees)
const VIEWS: Record<string, { az: number; el: number; margin?: number }> = {
  front: { az: 0, el: 0 },
  'three-quarter': { az: 35, el: 18 },
  'right-side': { az: 90, el: 0 },
  left: { az: 270, el: 0 },
  rear: { az: 180, el: 0 },
  'top-oblique': { az: 12, el: 55 },
};
const v = VIEWS[view] ?? VIEWS.front;
const azP = params.get('az');
if (azP !== null) {
  // custom close-up camera: ?az=&el=&dist=&tx=&ty=&tz=
  const az = (Number(azP) * Math.PI) / 180;
  const el = (Number(params.get('el') ?? '0') * Math.PI) / 180;
  const dist = Number(params.get('dist') ?? '6');
  const t = new THREE.Vector3(
    Number(params.get('tx') ?? '0'),
    Number(params.get('ty') ?? '0'),
    Number(params.get('tz') ?? '0'),
  );
  camera.position.set(
    t.x + Math.sin(az) * Math.cos(el) * dist,
    t.y + Math.sin(el) * dist,
    t.z + Math.cos(az) * Math.cos(el) * dist,
  );
  camera.near = 0.05;
  camera.far = dist + 20;
  camera.lookAt(t);
  camera.updateProjectionMatrix();
} else if (frame === 'reference' && view === 'front') {
  // measured reference framing: case D = 62% of frame width (D=4.1 -> frame width 6.61),
  // case center 5.6% above frame middle
  const frameHeight = 6.61 / (W / H);
  const dist = frameHeight / 2 / Math.tan(((camera.fov / 2) * Math.PI) / 180);
  camera.position.set(0, -0.52, dist);
  camera.near = Math.max(0.1, dist - 8);
  camera.far = dist + 12;
  camera.lookAt(0, -0.52, 0);
  camera.updateProjectionMatrix();
} else {
  framePerpetualCalendarChronographCamera(camera, model, {
    azimuthDeg: v.az,
    elevationDeg: v.el,
    margin: v.margin ?? 1.18,
  });
}

// explosion preview via the factory's master-progress driver
window.__setExplode = (t: number) => setExplosionProgress(model, t);
if (explode > 0) window.__setExplode(explode);
(window as unknown as Record<string, unknown>).__model = model;
(window as unknown as Record<string, unknown>).__scene = scene;

let frames = 0;
const saveName = params.get('save');
function tick() {
  renderer.render(scene, camera);
  frames += 1;
  if (frames === 8) {
    window.__captureReady = true;
    if (saveName) {
      fetch('/__save', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: saveName, dataUrl: renderer.domElement.toDataURL('image/png') }),
      }).then(() => {
        (window as any).__saved = true;
      });
    }
  }
  requestAnimationFrame(tick);
}
tick();

window.addEventListener('resize', () => {
  if (fixedW > 0) return; // fixed capture size: ignore window resizes
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  framePerpetualCalendarChronographCamera(camera, model, {
    azimuthDeg: v.az,
    elevationDeg: v.el,
    margin: v.margin ?? 1.18,
  });
});
