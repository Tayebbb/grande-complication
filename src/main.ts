/**
 * Grande Complication — cinematic scroll experience.
 * ONE master story progress (GSAP ScrollTrigger scrub on the pinned section)
 * drives the physical journey (table → lift → approach → exploded view),
 * camera, lighting, text, labels, chapter UI and progress bar. Scrolling up
 * scrubs the same timeline backward — the reverse is inherent, not a second
 * animation. No competing timelines.
 */
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  createPerpetualCalendarChronographModel,
  createPerpetualCalendarChronographEnvironment,
  disposePerpetualCalendarChronographModel,
  setExplosionProgress,
  type ProceduralModelRuntime,
} from './createObjectModel';
import { STORY, CAMERA_KEYS, DOSSIER, DOSSIER_KEYS, explosionFromStory, reassemblyFromTour, rigPoseFromStory, RIG, type StoryStage, type CameraKey } from './story';

gsap.registerPlugin(ScrollTrigger);
// phone URL-bar show/hide fires resize storms mid-scroll — don't rebuild pins for them
ScrollTrigger.config({ ignoreMobileResize: true });

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(pointer: coarse)').matches;

/* ------------------------------------------------------------------ */
/* Renderer / scene                                                    */
/* ------------------------------------------------------------------ */

const stage = document.getElementById('stage')!;
const qaMode = new URLSearchParams(location.search).get('qa') === '1';
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: qaMode, // QA captures only; off in normal viewing
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0b0d);
scene.environment = createPerpetualCalendarChronographEnvironment(renderer);

const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.1, 80);

// responsive projection: guarantee narrow viewports see (most of) the desktop's
// horizontal span at every beat. Vertical FOV widens (capped at 56° to avoid
// distortion); anything beyond the cap pulls the camera back.
const REF_WIDTH = 1.25; // fraction of a 1.5-aspect desktop's width to preserve
const BASE_FOV = 32;
const FOV_CAP = 56;
let distScale = 1;
function updateProjection() {
  const aspect = window.innerWidth / window.innerHeight;
  camera.aspect = aspect;
  if (aspect >= REF_WIDTH) {
    camera.fov = BASE_FOV;
    distScale = 1;
  } else {
    const halfH = Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2)) * (REF_WIDTH / aspect);
    const wanted = 2 * THREE.MathUtils.radToDeg(Math.atan(halfH));
    if (wanted <= FOV_CAP) {
      camera.fov = wanted;
      distScale = 1;
    } else {
      camera.fov = FOV_CAP;
      distScale = halfH / Math.tan(THREE.MathUtils.degToRad(FOV_CAP / 2));
    }
  }
  camera.updateProjectionMatrix();
}
updateProjection();

/* ---- premium dark-studio lighting (lighting-pass rig) ---- */
// The studio rig is dimmed while the watch rests under the spotlight and
// ramps to its verified full state as the exploded inspection begins.
const key = new THREE.DirectionalLight(0xfff2e2, 2.0);
key.position.set(-5.5, 7, 7.5);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.bias = -0.0003;
key.shadow.normalBias = 0.02;
key.shadow.camera.left = key.shadow.camera.bottom = -8;
key.shadow.camera.right = key.shadow.camera.top = 8;
scene.add(key);
// cool low fill keeps print readable without flattening
const fill = new THREE.DirectionalLight(0x9db4d8, 0.24);
fill.position.set(4.5, -1.5, 6.0);
scene.add(fill);
// warm rim separates the case flank from the dark backdrop
const rim = new THREE.DirectionalLight(0xffe9c2, 0.9);
rim.position.set(3.5, 4.0, -7.0);
scene.add(rim);
const hemi = new THREE.HemisphereLight(0xdfe6f0, 0x17151a, 0.22);
scene.add(hemi);

// one physical spotlight — the only strong source while the watch is on the table
const spot = new THREE.SpotLight(0xfff0dc, 340, 0, 0.37, 0.85, 1.7);
spot.position.set(1.9, 6.8, 3.1);
spot.castShadow = true;
spot.shadow.mapSize.set(1024, 1024);
spot.shadow.bias = -0.0004;
spot.shadow.normalBias = 0.02;
spot.shadow.camera.near = 2;
spot.shadow.camera.far = 20;
scene.add(spot);
scene.add(spot.target);

// isolation spot: lights ONLY layer-1 (featured dossier part); crossfades in per stop
const isoSpot = new THREE.SpotLight(0xfff0dc, 0, 0, 0.3, 0.75, 1.6);
isoSpot.layers.set(1);
scene.add(isoSpot);
scene.add(isoSpot.target);

/* ---- backdrop: restrained radial falloff + faint atmosphere ---- */
function makeBackdrop(): THREE.Mesh {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(512, 470, 60, 512, 512, 760);
  g.addColorStop(0, '#1d1c20');
  g.addColorStop(0.45, '#121114');
  g.addColorStop(1, '#0b0b0d');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 1024);
  // extremely subtle deterministic noise
  const img = ctx.getImageData(0, 0, 1024, 1024);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = ((i * 2654435761) >>> 24) / 255 - 0.5;
    img.data[i] += n * 6; img.data[i + 1] += n * 6; img.data[i + 2] += n * 6;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 90),
    new THREE.MeshBasicMaterial({ map: tex, depthWrite: false }),
  );
  m.position.set(0, 0, -16);
  m.renderOrder = -10;
  return m;
}
scene.add(makeBackdrop());

/* ---- the table: a dark physical surface that dissolves into the room ---- */
function makeRadialTexture(stops: Array<[number, string]>): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(256, 256, 10, 256, 256, 256);
  for (const [o, col] of stops) g.addColorStop(o, col);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const tableMat = new THREE.MeshStandardMaterial({
  color: 0x131418,
  roughness: 0.34,
  metalness: 0.0,
  envMapIntensity: 0.05,
  transparent: true,
  alphaMap: makeRadialTexture([[0, '#ffffff'], [0.4, '#a8a8a8'], [1, '#000000']]),
});
const table = new THREE.Mesh(new THREE.CircleGeometry(15, 48), tableMat);
table.rotation.x = -Math.PI / 2;
table.position.y = RIG.tableY;
table.receiveShadow = true;
scene.add(table);

// soft AO-style contact disc under the watch (real spot shadow sits on top of it)
const contactMat = new THREE.MeshBasicMaterial({
  map: makeRadialTexture([[0, 'rgba(0,0,0,0.9)'], [0.55, 'rgba(0,0,0,0.5)'], [1, 'rgba(0,0,0,0)']]),
  transparent: true,
  depthWrite: false,
  color: 0x000000,
});
contactMat.map!.premultiplyAlpha = false;
const contact = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), contactMat);
contact.rotation.x = -Math.PI / 2;
contact.position.y = RIG.tableY + 0.01;
contact.scale.set(14, 4.8, 1);
contact.renderOrder = -5;
scene.add(contact);

/* ---- model ---- */
const watch = createPerpetualCalendarChronographModel({ fidelity: 'full' });
const watchRig = new THREE.Group();
watchRig.name = 'watch-rig';
watchRig.add(watch);
scene.add(watchRig);

const runtime = watch.userData.sculptRuntime as ProceduralModelRuntime;

/* ------------------------------------------------------------------ */
/* Master state application — the ONLY place scene state is written    */
/* ------------------------------------------------------------------ */

const state = {
  story: 0,      // master progress across the pinned sequence
  tour: 0,       // component-dossier progress (second pinned act)
  reassembly: 0, // retained for the QA driver signature
  heroIn: 0,     // intro fade-in 0..1
  mouseX: 0,
  mouseY: 0,
  smX: 0,
  smY: 0,
};

const tmpTarget = new THREE.Vector3();
const tmpPos = new THREE.Vector3();
const blendPos = new THREE.Vector3();
const blendTarget = new THREE.Vector3();

/* ------------------------------------------------------------------ */
/* Spotlight isolation — during each dossier stop the featured part    */
/* keeps its light while every other component falls into shadow.      */
/* Materials are un-shared per component so dimming is independent;    */
/* dimming scales color/env/emissive (no transparency sorting risks).  */
/* ------------------------------------------------------------------ */

interface DimmableMat {
  mat: THREE.MeshPhysicalMaterial;
  color0: THREE.Color;
  env0: number;
  emissive0: number;
}
const componentMats = new Map<string, DimmableMat[]>();
const componentMeshes = new Map<string, THREE.Mesh[]>();
{
  const componentIds = new Set(Object.keys(runtime.nodes));
  for (const [id, node] of Object.entries(runtime.nodes)) {
    const mats: DimmableMat[] = [];
    const meshes: THREE.Mesh[] = [];
    const clones = new Map<THREE.Material, THREE.MeshPhysicalMaterial>();
    const walk = (o: THREE.Object3D) => {
      if (o !== node && componentIds.has(o.name)) return; // nested component boundary
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        meshes.push(mesh);
        const src = mesh.material as THREE.MeshPhysicalMaterial;
        let clone = clones.get(src);
        if (!clone) {
          clone = src.clone();
          clones.set(src, clone);
          mats.push({
            mat: clone,
            color0: clone.color.clone(),
            env0: clone.envMapIntensity ?? 1,
            emissive0: clone.emissiveIntensity ?? 1,
          });
        }
        mesh.material = clone;
      }
      for (const c of o.children) walk(c);
    };
    walk(node);
    if (mats.length) componentMats.set(id, mats);
    if (meshes.length) componentMeshes.set(id, meshes);
  }
}

const focusScratch = new Map<string, number>();
const spotFocus = new THREE.Vector3();

/** Continuous, scrub-deterministic focus field over the dossier tour. */
function applySpotIsolation(q: number) {
  const n = DOSSIER.length;
  const halfW = 1 / (n + 2);
  let globalDim = 0;
  focusScratch.clear();
  spotFocus.set(0, 0, 0);
  let wSum = 0;
  for (let i = 0; i < n; i++) {
    const c = (i + 0.72) / (n + 2);
    const w = Math.max(0, 1 - Math.abs(q - c) / halfW); // triangular falloff per stop
    if (w <= 0) continue;
    globalDim = Math.max(globalDim, w);
    for (const id of DOSSIER[i].feature) {
      focusScratch.set(id, Math.max(focusScratch.get(id) ?? 0, w));
    }
    spotFocus.addScaledVector(new THREE.Vector3(...DOSSIER[i].anchor), w);
    wSum += w;
  }
  if (wSum > 0) spotFocus.divideScalar(wSum);
  const shadowFloor = 1 - 0.9 * globalDim; // non-featured parts sink to 10 %
  for (const [id, mats] of componentMats) {
    const feature = focusScratch.get(id) ?? 0;
    const f = shadowFloor + (1 - shadowFloor) * feature;
    for (const d of mats) {
      d.mat.color.copy(d.color0).multiplyScalar(f);
      d.mat.envMapIntensity = d.env0 * f;
      if (d.mat.emissiveIntensity !== undefined) d.mat.emissiveIntensity = d.emissive0 * f;
    }
  }
  // the isolation spot literally lights only the featured part: featured meshes
  // join layer 1 while their weight is meaningful (isoSpot is dim when they join,
  // so membership changes are invisible — the effect itself stays continuous)
  for (const [id, meshes] of componentMeshes) {
    const on = (focusScratch.get(id) ?? 0) > 0.05;
    for (const m of meshes) {
      if (on) m.layers.enable(1);
      else m.layers.disable(1);
    }
  }
  return { globalDim, wSum };
}

/* C1-continuous camera path: cubic Hermite with Catmull-Rom tangents over
   non-uniform knots — removes the per-segment ease pumping (velocity no
   longer hits zero at every keyframe). */
function buildChannels(keys: CameraKey[]) {
  return {
    knots: keys.map((k) => k.p),
    channels: [
      keys.map((k) => k.az),
      keys.map((k) => k.el),
      keys.map((k) => k.dist),
      keys.map((k) => k.target[0]),
      keys.map((k) => k.target[1]),
      keys.map((k) => k.target[2]),
    ] as number[][],
  };
}
const STORY_CAM = buildChannels(CAMERA_KEYS);
const DOSSIER_CAM = buildChannels(DOSSIER_KEYS);

function hermiteChannel(knots: number[], values: number[], i: number, t: number): number {
  const n = values.length;
  const t0 = knots[i];
  const t1 = knots[i + 1];
  const h = t1 - t0;
  const v0 = values[i];
  const v1 = values[i + 1];
  const d = (v1 - v0) / h; // segment slope
  const dPrev = i > 0 ? (v0 - values[i - 1]) / (t0 - knots[i - 1]) : d;
  const dNext = i < n - 2 ? (values[i + 2] - v1) / (knots[i + 2] - t1) : d;
  // Fritsch–Carlson monotone limiter: keeps C1 continuity, prevents overshoot
  const limit = (a: number, b: number) => (a * b <= 0 ? 0 : (2 * a * b) / (a + b));
  const m0 = limit(dPrev, d);
  const m1 = limit(d, dNext);
  const s = (t - t0) / h;
  const s2 = s * s;
  const s3 = s2 * s;
  return (
    (2 * s3 - 3 * s2 + 1) * v0 +
    (s3 - 2 * s2 + s) * h * m0 +
    (-2 * s3 + 3 * s2) * v1 +
    (s3 - s2) * h * m1
  );
}

function cameraAt(
  cam: { knots: number[]; channels: number[][] },
  p: number,
  outPos: THREE.Vector3,
  outTarget: THREE.Vector3,
) {
  const clamped = THREE.MathUtils.clamp(p, 0, 1);
  let i = 0;
  while (i < cam.knots.length - 2 && clamped > cam.knots[i + 1]) i++;
  const az = THREE.MathUtils.degToRad(hermiteChannel(cam.knots, cam.channels[0], i, clamped));
  const el = THREE.MathUtils.degToRad(hermiteChannel(cam.knots, cam.channels[1], i, clamped));
  const dist = hermiteChannel(cam.knots, cam.channels[2], i, clamped) * distScale;
  outTarget.set(
    hermiteChannel(cam.knots, cam.channels[3], i, clamped),
    hermiteChannel(cam.knots, cam.channels[4], i, clamped),
    hermiteChannel(cam.knots, cam.channels[5], i, clamped),
  );
  outPos.set(
    outTarget.x + Math.sin(az) * Math.cos(el) * dist,
    outTarget.y + Math.sin(el) * dist,
    outTarget.z + Math.cos(az) * Math.cos(el) * dist,
  );
}

// single geodesic pivot: lying flat (dial up, straps screen-x) → facing the viewer
const REST_QUAT = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, Math.PI / 2));
const UPRIGHT_QUAT = new THREE.Quaternion();

function applyState() {
  const p = state.story;

  // hero entrance fade
  stage.style.opacity = state.heroIn.toFixed(3);

  // explosion — one master value (spec runtimeExplosion staggering inside);
  // the dossier tail rewinds it so the journey closes on the complete watch
  let explodeT = explosionFromStory(p);
  if (state.tour > 0) explodeT *= 1 - reassemblyFromTour(state.tour);
  setExplosionProgress(watch, explodeT);
  // mechanism pose is a pure function of progress — scrub-locked, inherently reversible
  if (!reducedMotion) spinFn()?.(explodeT * 9);

  // physical rig: table → lift → tilt-to-viewer → approach (all pure f(p))
  const pose = rigPoseFromStory(p);
  watchRig.position.set(0, pose.y, pose.z);
  watchRig.quaternion.slerpQuaternions(REST_QUAT, UPRIGHT_QUAT, pose.tilt);
  // slow purposeful yaw inside the inspection chapters (after the tilt has completed)
  const yaw =
    THREE.MathUtils.degToRad(-6) * chapterWindow(p, 0.44, 0.6) +
    THREE.MathUtils.degToRad(4) * chapterWindow(p, 0.6, 0.7) +
    THREE.MathUtils.degToRad(-3) * chapterWindow(p, 0.7, 0.78);
  watch.rotation.y = yaw;

  // table interaction: contact shadow softens, spreads and dies as the watch rises;
  // the table itself dissolves as the watch travels toward the viewer
  const lift = pose.lift;
  contactMat.opacity = Math.pow(1 - lift, 1.6) * (1 - pose.approach);
  const spread = 1 + lift * 0.55;
  contact.scale.set(14 * spread, 4.8 * spread, 1);
  tableMat.opacity = 1 - pose.approach;
  table.visible = tableMat.opacity > 0.01;
  contact.visible = contactMat.opacity > 0.01;

  // spotlight physically tracks the watch; the studio rig fades in for inspection
  spot.target.position.set(0, pose.y * 0.9, pose.z * 0.9);
  spot.position.set(1.9, 6.8 + pose.y * 0.35, 3.1 + pose.z * 0.55);
  const inspect = smooth01((p - 0.34) / 0.16); // studio ramp as disassembly begins
  spot.angle = 0.37 + inspect * 0.22;
  spot.intensity = 340 * (1 - inspect * 0.45);
  key.intensity = 2.0 * (0.2 + 0.8 * inspect);
  rim.intensity = 0.9 * (0.15 + 0.85 * inspect);
  fill.intensity = 0.24 * (0.2 + 0.8 * inspect);
  hemi.intensity = 0.22 * (0.25 + 0.75 * inspect);
  scene.environmentIntensity = 0.38 + 0.62 * inspect;

  // dossier spotlight isolation: featured part stays lit, the rest sinks into
  // shadow, and the physical spot swings onto the subject — all pure f(scroll)
  const { globalDim } = applySpotIsolation(state.tour);
  if (globalDim > 0) {
    const studio = 1 - 0.62 * globalDim;
    key.intensity *= studio;
    rim.intensity *= studio;
    fill.intensity *= studio;
    hemi.intensity *= studio;
    scene.environmentIntensity *= 1 - 0.5 * globalDim;
    // scene spot hands over to the isolation spot aimed at the subject
    spot.intensity *= 1 - 0.85 * globalDim;
    isoSpot.position.set(spotFocus.x + 1.4, spotFocus.y + 4.6, spotFocus.z + 2.4);
    isoSpot.target.position.copy(spotFocus);
    isoSpot.target.updateMatrixWorld();
    isoSpot.intensity = 620 * globalDim;
  } else {
    isoSpot.intensity = 0;
  }
  spot.target.updateMatrixWorld();

  // camera: the dossier tour takes over past the story's end. Blend over the
  // first 3% of the tour — identical keys make it invisible on slow scrolls,
  // and it absorbs the story-scrub lag on fast upward flings (no azimuth pop).
  if (state.tour > 0) {
    cameraAt(DOSSIER_CAM, state.tour, tmpPos, tmpTarget);
    if (state.tour < 0.03 && p < 0.9999) {
      cameraAt(STORY_CAM, p, blendPos, blendTarget);
      const bt = state.tour / 0.03;
      tmpPos.lerpVectors(blendPos, tmpPos, bt);
      tmpTarget.lerpVectors(blendTarget, tmpTarget, bt);
    }
  } else {
    cameraAt(STORY_CAM, p, tmpPos, tmpTarget);
  }

  // subtle mouse parallax (desktop, motion allowed)
  if (!reducedMotion && !isTouch) {
    tmpPos.x += state.smX * 0.28;
    tmpPos.y += state.smY * 0.2;
  }
  camera.position.copy(tmpPos);
  camera.lookAt(tmpTarget);
  updateDossier(state.tour); // after the camera writes, so the ring projects lag-free

  // key light drifts slightly with the story so metal highlights travel
  key.position.x = -5.5 + Math.sin(p * Math.PI) * 2.2;
  key.position.y = 7 - p * 1.5;
}

function smooth01(t: number): number {
  const c = THREE.MathUtils.clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
}

function chapterWindow(p: number, a: number, b: number): number {
  const t = THREE.MathUtils.clamp((p - a) / (b - a), 0, 1);
  return Math.sin(t * Math.PI); // rises and settles inside the chapter
}

/* ------------------------------------------------------------------ */
/* Story text — retargeted single block, editorial transitions         */
/* ------------------------------------------------------------------ */

const copyEl = document.getElementById('copy')!;
let currentStage = -1;

function stageIndexFor(p: number): number {
  for (let i = STORY.length - 1; i >= 0; i--) {
    if (p >= STORY[i].start) return i;
  }
  return 0;
}

function renderStage(stageDef: StoryStage) {
  copyEl.innerHTML = `
    <p class="eyebrow">${stageDef.eyebrow}</p>
    <h2>${stageDef.title}</h2>
    <p class="desc">${stageDef.description}</p>`;
}

function setStage(i: number) {
  if (i === currentStage) return;
  const first = currentStage === -1;
  currentStage = i;
  const stageDef = STORY[i];
  const els = () => copyEl.children;
  if (reducedMotion || first || copyEl.children.length === 0) {
    renderStage(stageDef);
    gsap.set(els(), { opacity: 1, y: 0 });
  } else {
    gsap.killTweensOf(copyEl.children);
    gsap.to(copyEl.children, {
      opacity: 0,
      y: -18,
      duration: 0.28,
      stagger: 0.04,
      ease: 'power2.in',
      onComplete: () => {
        renderStage(stageDef);
        gsap.fromTo(
          copyEl.children,
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: 'power3.out' },
        );
      },
    });
  }
  // chapter rail
  document.querySelectorAll('#chapter-list li').forEach((li, idx) => {
    li.classList.toggle('active', idx === i);
  });
  const live = document.getElementById('chapter-live');
  if (live) live.textContent = `${stageDef.eyebrow}: ${stageDef.title}`;
  refreshLabels(stageDef);
}

/* ------------------------------------------------------------------ */
/* Component labels — anchored to real geometry, depth-aware           */
/* ------------------------------------------------------------------ */

interface LiveLabel {
  el: HTMLDivElement;
  node: THREE.Object3D;
  offset: THREE.Vector3;
  minSeparation: number;
}

const labelLayer = document.getElementById('labels')!;
let liveLabels: LiveLabel[] = [];

function refreshLabels(stageDef: StoryStage) {
  if (!reducedMotion) {
    for (const l of liveLabels) {
      gsap.to(l.el, { opacity: 0, duration: 0.25, onComplete: () => l.el.remove() });
    }
  } else {
    liveLabels.forEach((l) => l.el.remove());
  }
  liveLabels = [];
  for (const spec of stageDef.labels) {
    const node = runtime.nodes[spec.component];
    if (!node) continue;
    const el = document.createElement('div');
    el.className = 'lbl';
    el.innerHTML = `${spec.text}${spec.sub ? `<i>${spec.sub}</i>` : ''}`;
    labelLayer.appendChild(el);
    liveLabels.push({
      el,
      node,
      offset: new THREE.Vector3(...spec.offset),
      minSeparation: spec.minSeparation ?? 0,
    });
  }
}

const projV = new THREE.Vector3();

/* ------------------------------------------------------------------ */
/* Component dossier — material tour panel + target ring               */
/* ------------------------------------------------------------------ */

const dossierPanel = document.getElementById('dossier-panel')!;
const dossierRing = document.getElementById('dossier-ring')!;
let dossierIdx = -1;
const ringAnchor = new THREE.Vector3();

function renderDossierStop(i: number) {
  const s = DOSSIER[i];
  dossierPanel.innerHTML = `
    <p class="d-index">${s.index} / ${String(DOSSIER.length).padStart(2, '0')} — COMPONENT DOSSIER</p>
    <span class="d-material" style="color:${s.accent}">${s.material}</span>
    <h3>${s.name}</h3>
    <p class="d-body">${s.body}</p>
    <dl class="d-specs">${s.specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
  dossierPanel.style.borderLeftColor = s.accent;
  dossierRing.style.borderColor = s.accent;
}

function updateDossier(q: number) {
  const n = DOSSIER.length;
  const raw = Math.round(q * (n + 2) - 0.72);
  const idx = q > 0.001 && raw >= 0 && raw < n ? raw : -1;
  if (idx !== dossierIdx) {
    dossierIdx = idx;
    if (idx >= 0) {
      renderDossierStop(idx);
      if (reducedMotion) {
        gsap.set(dossierPanel, { opacity: 1, y: 0 });
      } else {
        gsap.killTweensOf(dossierPanel);
        gsap.fromTo(dossierPanel, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' });
      }
    } else {
      gsap.killTweensOf(dossierPanel);
      gsap.to(dossierPanel, { opacity: 0, duration: reducedMotion ? 0 : 0.25 });
    }
  }
  // target ring tracks the featured component
  if (idx >= 0) {
    ringAnchor.set(...DOSSIER[idx].anchor).project(camera);
    const behind = ringAnchor.z > 1;
    dossierRing.style.left = `${((ringAnchor.x * 0.5 + 0.5) * 100).toFixed(2)}%`;
    dossierRing.style.top = `${((-ringAnchor.y * 0.5 + 0.5) * 100).toFixed(2)}%`;
    dossierRing.style.opacity = behind ? '0' : '0.9';
  } else {
    dossierRing.style.opacity = '0';
  }
}

function updateLabels(k = 0.12) {
  for (const l of liveLabels) {
    const exp = l.node.userData.explode as { distance: number } | undefined;
    const home = l.node.userData.assembledPosition as THREE.Vector3 | undefined;
    let sep = 1;
    if (l.minSeparation > 0 && exp && home) {
      sep = l.node.position.distanceTo(home) >= l.minSeparation ? 1 : 0;
    }
    l.node.getWorldPosition(projV).add(l.offset);
    projV.project(camera);
    const behind = projV.z > 1;
    const x = THREE.MathUtils.clamp((projV.x * 0.5 + 0.5) * window.innerWidth, window.innerWidth * 0.05, window.innerWidth * 0.95);
    const y = THREE.MathUtils.clamp((-projV.y * 0.5 + 0.5) * window.innerHeight, window.innerHeight * 0.06, window.innerHeight * 0.9);
    l.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%,-50%)`;
    const target = behind || sep === 0 ? 0 : 1;
    const cur = Number(l.el.style.opacity || 0);
    l.el.style.opacity = String(cur + (target - cur) * k);
  }
}

/* ------------------------------------------------------------------ */
/* Scroll wiring — GSAP ScrollTrigger, one scrubbed master value       */
/* ------------------------------------------------------------------ */

const progressFill = document.getElementById('progress-fill')!;
const progressBar = document.querySelector('.progress') as HTMLElement | null;
const hint = document.getElementById('scroll-hint')!;
let hintHidden = false;

// buttery input: Lenis smooths the raw wheel/touch delta, ScrollTrigger scrubs on top
let lenis: Lenis | null = null;
let lenisTick: ((time: number) => void) | null = null;
if (!reducedMotion) {
  lenis = new Lenis({ duration: 1.35, smoothWheel: true, wheelMultiplier: 0.9, touchMultiplier: 1.35 });
  lenis.on('scroll', ScrollTrigger.update);
  lenisTick = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(lenisTick);
  gsap.ticker.lagSmoothing(0);
}

const ctx = gsap.context(() => {
  // master pinned sequence
  ScrollTrigger.create({
    trigger: '#story',
    start: 'top top',
    end: '+=10400',
    pin: true,
    scrub: reducedMotion ? true : 1,
    onUpdate(self) {
      state.story = self.progress;
      progressFill.style.transform = `scaleX(${self.progress.toFixed(4)})`;
      progressBar?.setAttribute('aria-valuenow', String(Math.round(self.progress * 100)));
      setStage(stageIndexFor(self.progress));
      const shouldHide = self.progress > 0.02;
      if (shouldHide !== hintHidden) {
        hintHidden = shouldHide;
        gsap.set(hint, { opacity: shouldHide ? 0 : 1 });
      }
    },
  });

  // the journey is inherently reversible: scrolling up scrubs the same timeline
  // backward (reassembly → retreat → landing). No separate reassembly animation.

  // component dossier — the post-exploded material tour, its own pinned scrub
  ScrollTrigger.create({
    trigger: '#dossier',
    start: 'top top',
    end: '+=9600',
    pin: true,
    scrub: reducedMotion ? true : 1,
    onUpdate(self) {
      state.tour = self.progress;
    },
  });

  gsap.to('.outro-copy', {
    opacity: 1,
    y: 0,
    duration: reducedMotion ? 0 : 1,
    ease: 'power2.out',
    scrollTrigger: { trigger: '.outro', start: 'center 65%' },
  });

  // hero entrance
  gsap.fromTo(
    state,
    { heroIn: 0 },
    { heroIn: 1, duration: reducedMotion ? 0 : 1.6, ease: 'power2.out' },
  );
});

/* ------------------------------------------------------------------ */
/* Input, resize, loop                                                 */
/* ------------------------------------------------------------------ */

window.addEventListener('pointermove', (e) => {
  state.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  state.mouseY = -((e.clientY / window.innerHeight) * 2 - 1);
});

window.addEventListener('resize', () => {
  updateProjection();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
});

const clock = new THREE.Clock();

declare global {
  interface Window {
    __expReady?: boolean;
    __setStory?: (p: number, r?: number) => void;
    __perf?: () => { calls: number; triangles: number; fps: number };
  }
}

// deterministic external driver for QA captures
window.__setStory = (p: number, r = 0) => {
  state.story = p;
  state.reassembly = r;
  setStage(stageIndexFor(p));
  progressFill.style.transform = `scaleX(${p.toFixed(4)})`;
};
(window as unknown as Record<string, unknown>).__setTour = (q: number) => {
  state.tour = q;
};
(window as unknown as Record<string, unknown>).__frame = () => {
  applyState();
  updateLabels(1);
  renderer.render(scene, camera);
};
(window as unknown as Record<string, unknown>).__model = watch;
(window as unknown as Record<string, unknown>).__scene = scene;

let fpsAccum = 0;
let fpsFrames = 0;
let fpsValue = 0;

window.__perf = () => ({
  calls: renderer.info.render.calls,
  triangles: renderer.info.render.triangles,
  fps: fpsValue,
});

let frames = 0;
let rafId = 0;
const spinFn = () => watch.userData.spinMechanism as ((t: number) => void) | undefined;
function tick() {
  const dt = clock.getDelta();
  fpsAccum += dt;
  fpsFrames += 1;
  if (fpsAccum >= 1) {
    fpsValue = fpsFrames / fpsAccum;
    fpsAccum = 0;
    fpsFrames = 0;
  }
  // smooth the parallax input (frame-rate independent)
  const kParallax = 1 - Math.pow(1 - 0.06, dt * 60);
  state.smX += (state.mouseX - state.smX) * kParallax;
  state.smY += (state.mouseY - state.smY) * kParallax;
  applyState();
  updateLabels(1 - Math.pow(1 - 0.12, dt * 60));
  renderer.render(scene, camera);
  frames += 1;
  if (frames === 10) window.__expReady = true;
  rafId = requestAnimationFrame(tick);
}
setStage(0);
tick();

// cleanup on page exit + Vite HMR (beforeunload does not fire on HMR)
function teardown() {
  cancelAnimationFrame(rafId);
  ctx.revert();
  ScrollTrigger.killAll();
  if (lenisTick) gsap.ticker.remove(lenisTick);
  lenis?.destroy();
  lenis = null;
  disposePerpetualCalendarChronographModel(watch);
  scene.environment?.dispose();
  renderer.dispose();
}
window.addEventListener('beforeunload', teardown);
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    teardown();
    renderer.domElement.remove();
  });
}
