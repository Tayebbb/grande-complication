/**
 * Grande Complication — cinematic scroll experience.
 * ONE master story progress (GSAP ScrollTrigger scrub on the pinned section)
 * drives camera, watch rotation, explosion, text, labels, chapter UI and progress
 * bar. The outro drives a single reassembly value. No competing timelines.
 */
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  createPerpetualCalendarChronographModel,
  createPerpetualCalendarChronographEnvironment,
  disposePerpetualCalendarChronographModel,
  setExplosionProgress,
  type ProceduralModelRuntime,
} from './createObjectModel';
import { STORY, CAMERA_KEYS, explosionFromStory, type StoryStage } from './story';

gsap.registerPlugin(ScrollTrigger);

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
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

/* ---- premium dark-studio lighting (lighting-pass rig) ---- */
// large soft key, upper-left-front — reveals case curvature and dial gradient
const key = new THREE.DirectionalLight(0xfff2e2, 2.0);
key.position.set(-5.5, 7, 7.5);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
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
  reassembly: 0, // outro progress (1 = fully reassembled hero)
  heroIn: 0,     // intro fade-in 0..1
  mouseX: 0,
  mouseY: 0,
  smX: 0,
  smY: 0,
};

const tmpTarget = new THREE.Vector3();
const tmpPos = new THREE.Vector3();
const heroPosTmp = new THREE.Vector3();
const heroTargetTmp = new THREE.Vector3();

function cameraAt(p: number, outPos: THREE.Vector3, outTarget: THREE.Vector3) {
  const keys = CAMERA_KEYS;
  let i = 0;
  while (i < keys.length - 2 && p > keys[i + 1].p) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const span = Math.max(1e-5, b.p - a.p);
  let t = THREE.MathUtils.clamp((p - a.p) / span, 0, 1);
  t = t * t * (3 - 2 * t); // smooth each segment
  const az = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(a.az, b.az, t));
  const el = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(a.el, b.el, t));
  const dist = THREE.MathUtils.lerp(a.dist, b.dist, t);
  outTarget.set(
    THREE.MathUtils.lerp(a.target[0], b.target[0], t),
    THREE.MathUtils.lerp(a.target[1], b.target[1], t),
    THREE.MathUtils.lerp(a.target[2], b.target[2], t),
  );
  outPos.set(
    outTarget.x + Math.sin(az) * Math.cos(el) * dist,
    outTarget.y + Math.sin(el) * dist,
    outTarget.z + Math.cos(az) * Math.cos(el) * dist,
  );
}

let clockTime = 0;

function applyState() {
  const p = state.story;
  // reassembly rewinds the explosion and returns the camera to the hero framing
  const r = state.reassembly;
  const rEase = r * r * (3 - 2 * r);

  // hero entrance fade
  stage.style.opacity = state.heroIn.toFixed(3);

  // explosion — one master value (spec runtimeExplosion staggering inside)
  const explode = explosionFromStory(p) * (1 - rEase);
  setExplosionProgress(watch, explode);

  // camera along keyframes; reassembly returns toward the hero key
  cameraAt(p, tmpPos, tmpTarget);
  if (r > 0) {
    cameraAt(0, heroPosTmp, heroTargetTmp);
    heroPosTmp.z += 0.6; // slightly wider final hero
    tmpPos.lerp(heroPosTmp, rEase);
    tmpTarget.lerp(heroTargetTmp, rEase);
  }

  // subtle mouse parallax (desktop, motion allowed)
  if (!reducedMotion && !isTouch) {
    tmpPos.x += state.smX * 0.28;
    tmpPos.y += state.smY * 0.2;
  }
  camera.position.copy(tmpPos);
  camera.lookAt(tmpTarget);

  // watch: subtle idle float in the hero, decaying as the story advances
  const float = 1 - THREE.MathUtils.clamp(p * 6, 0, 1);
  const drift = reducedMotion ? 0 : 1;
  watchRig.position.y = Math.sin(clockTime * 0.8) * 0.045 * float * drift;
  watchRig.rotation.z = Math.sin(clockTime * 0.5) * 0.008 * float * drift;
  // slow purposeful yaw that peaks at the control chapter (reveals flank), settles after
  const yaw =
    THREE.MathUtils.degToRad(-6) * chapterWindow(p, 0.15, 0.3) +
    THREE.MathUtils.degToRad(4) * chapterWindow(p, 0.3, 0.5) +
    THREE.MathUtils.degToRad(-3) * chapterWindow(p, 0.5, 0.65);
  watchRig.rotation.y = yaw * (1 - rEase);

  // key light drifts slightly with the story so metal highlights travel
  key.position.x = -5.5 + Math.sin(p * Math.PI) * 2.2;
  key.position.y = 7 - p * 1.5;
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

function updateLabels() {
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
    l.el.style.opacity = String(cur + (target - cur) * 0.12);
  }
}

/* ------------------------------------------------------------------ */
/* Scroll wiring — GSAP ScrollTrigger, one scrubbed master value       */
/* ------------------------------------------------------------------ */

const progressFill = document.getElementById('progress-fill')!;
const progressBar = document.querySelector('.progress') as HTMLElement | null;
const hint = document.getElementById('scroll-hint')!;
let hintHidden = false;

const ctx = gsap.context(() => {
  // master pinned sequence
  ScrollTrigger.create({
    trigger: '#story',
    start: 'top top',
    end: '+=7200',
    pin: true,
    scrub: reducedMotion ? true : 0.8,
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

  // outro reassembly
  ScrollTrigger.create({
    trigger: '.outro',
    start: 'top bottom',
    end: 'center center',
    scrub: reducedMotion ? true : 0.6,
    onUpdate(self) {
      state.reassembly = self.progress;
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
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
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

let fpsAccum = 0;
let fpsFrames = 0;
let fpsValue = 0;

window.__perf = () => ({
  calls: renderer.info.render.calls,
  triangles: renderer.info.render.triangles,
  fps: fpsValue,
});

let frames = 0;
function tick() {
  const dt = clock.getDelta();
  clockTime += dt;
  fpsAccum += dt;
  fpsFrames += 1;
  if (fpsAccum >= 1) {
    fpsValue = fpsFrames / fpsAccum;
    fpsAccum = 0;
    fpsFrames = 0;
  }
  // smooth the parallax input
  state.smX += (state.mouseX - state.smX) * 0.06;
  state.smY += (state.mouseY - state.smY) * 0.06;
  applyState();
  updateLabels();
  renderer.render(scene, camera);
  frames += 1;
  if (frames === 10) window.__expReady = true;
  requestAnimationFrame(tick);
}
setStage(0);
tick();

// cleanup on page exit + Vite HMR (beforeunload does not fire on HMR)
function teardown() {
  ctx.revert();
  ScrollTrigger.killAll();
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
