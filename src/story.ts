/** Story configuration — the single source of narrative truth.
 *  All ranges are master story progress p in 0..1 across the pinned sequence. */

export interface LabelSpec {
  /** component node id in the model runtime */
  component: string;
  text: string;
  sub?: string;
  /** world-space offset from the component anchor */
  offset: [number, number, number];
  /** show only when the component's own explode displacement exceeds this (0 = always) */
  minSeparation?: number;
}

export interface StoryStage {
  start: number;
  end: number;
  eyebrow: string;
  title: string;
  description: string;
  focus: string;
  labels: LabelSpec[];
}

export const STORY: StoryStage[] = [
  {
    start: 0.0, end: 0.05,
    eyebrow: 'PRECISION / 01',
    title: 'TIME, AT REST.',
    description: 'A mechanical instrument, motionless under a single light.',
    focus: 'watch',
    labels: [],
  },
  {
    start: 0.05, end: 0.48,
    eyebrow: 'CASE / 02',
    title: 'BUILT IN LAYERS.',
    description: 'It rises to meet you. Every surface is shaped to control light and depth.',
    focus: 'case',
    labels: [
      { component: 'crystal', text: 'CRYSTAL', sub: 'DOMED SAPPHIRE', offset: [0.9, 0.9, 0.4], minSeparation: 0.12 },
      { component: 'bezel', text: 'BEZEL', sub: 'CONCAVE POLISH', offset: [-1.3, 0.7, 0.3], minSeparation: 0.1 },
      { component: 'case-main', text: 'CASE', sub: 'PLATINUM BAND', offset: [-1.6, -0.5, 0.4] },
    ],
  },
  {
    start: 0.48, end: 0.6,
    eyebrow: 'DIAL / 03',
    title: 'EVERY DETAIL HAS A PLACE.',
    description: 'Concentric scales, subdials and markers compose a precise visual hierarchy.',
    focus: 'dial',
    labels: [
      { component: 'dial-plate', text: 'DIAL', sub: 'SUNBURST GRADIENT', offset: [-1.4, -0.2, 0.5] },
      { component: 'rehaut-ring', text: 'CHAPTER RING', sub: 'POLISHED REHAUT', offset: [1.35, 0.9, 0.3] },
      { component: 'subdials', text: 'SUBDIAL', sub: 'AZURAGE WELLS', offset: [1.5, -0.35, 0.4] },
      { component: 'moonphase', text: 'MOONPHASE', sub: 'NAVY LACQUER', offset: [-0.9, -1.3, 0.3] },
    ],
  },
  {
    start: 0.6, end: 0.7,
    eyebrow: 'INDICATION / 04',
    title: 'PRECISION IN MOTION.',
    description: 'Each hand is independently constructed around a precise central axis.',
    focus: 'hands',
    labels: [
      { component: 'hand-hour', text: 'HOUR', sub: 'LEAF PROFILE', offset: [-1.3, 0.6, 0.4], minSeparation: 0.08 },
      { component: 'hand-minute', text: 'MINUTE', sub: 'LEAF PROFILE', offset: [1.35, 0.75, 0.4], minSeparation: 0.08 },
      { component: 'hand-chrono', text: 'SECONDS', sub: 'FROSTED NEEDLE', offset: [1.1, -1.0, 0.4], minSeparation: 0.08 },
    ],
  },
  {
    start: 0.7, end: 0.78,
    eyebrow: 'CONTROL / 05',
    title: 'EVERY MOVEMENT HAS PURPOSE.',
    description: 'Controls are positioned around the case with mechanical intent.',
    focus: 'controls',
    labels: [
      { component: 'crown', text: 'CROWN', sub: 'TWENTY FLUTES', offset: [1.0, 0.2, 0.5], minSeparation: 0.12 },
      { component: 'pusher-upper', text: 'UPPER PUSHER', sub: 'START / STOP', offset: [0.9, 0.85, 0.3], minSeparation: 0.1 },
      { component: 'pusher-lower', text: 'LOWER PUSHER', sub: 'RESET', offset: [0.95, -0.8, 0.3], minSeparation: 0.1 },
    ],
  },
  {
    start: 0.78, end: 0.92,
    eyebrow: 'ARCHITECTURE / 06',
    title: 'ONE SYSTEM. MANY PARTS.',
    description: 'Precision emerges from the relationship between every layer.',
    focus: 'assembly',
    labels: [
      { component: 'movement-plate', text: 'MOVEMENT', sub: 'MECHANICAL CALIBRE', offset: [-1.7, -0.6, 0], minSeparation: 0.2 },
      { component: 'calendar-works', text: 'CALENDAR WORKS', sub: 'PERPETUAL MODULE', offset: [-1.35, 0.9, 0.3], minSeparation: 0.15 },
      { component: 'case-back', text: 'CASE BACK', sub: 'SCREW-DOWN', offset: [1.5, -1.0, -0.3], minSeparation: 0.3 },
      { component: 'gear-train', text: 'GEAR TRAIN', sub: 'CUT TEETH', offset: [1.6, 0.75, 0.2], minSeparation: 0.12 },
    ],
  },
  {
    start: 0.92, end: 1.0,
    eyebrow: 'THE ASSEMBLY / 07',
    title: 'PRECISION, DECONSTRUCTED.',
    description: "A complete view of the watch's layered construction.",
    focus: 'whole',
    labels: [
      { component: 'crystal', text: 'CRYSTAL', offset: [0.9, 1.0, 0.5], minSeparation: 0.4 },
      { component: 'chrono-works', text: 'COLUMN WHEEL', sub: 'CHRONOGRAPH COMMAND', offset: [1.2, 1.05, 0.3], minSeparation: 0.15 },
      { component: 'balance-wheel', text: 'BALANCE', sub: 'OSCILLATOR', offset: [-1.3, -1.15, 0.3], minSeparation: 0.15 },
      { component: 'mainspring-barrel', text: 'BARREL', sub: 'MAINSPRING', offset: [1.55, -0.35, 0.2], minSeparation: 0.1 },
      { component: 'strap-upper', text: 'STRAP', sub: 'BRAIDED CALFSKIN', offset: [-1.4, 1.2, 0.2], minSeparation: 0.3 },
    ],
  },
];

/** Camera keyframes along master progress. az/el degrees, dist in watch units. */
export interface CameraKey {
  p: number;
  az: number;
  el: number;
  dist: number;
  target: [number, number, number];
}

export const CAMERA_KEYS: CameraKey[] = [
  { p: 0.0, az: 14, el: 30, dist: 14.4, target: [0, -2.0, 0.1] },
  { p: 0.02, az: 14, el: 30, dist: 14.4, target: [0, -2.0, 0.1] }, // dead-stop landing on reverse
  { p: 0.1, az: 10, el: 24, dist: 13.6, target: [0, -1.7, 0.2] },
  { p: 0.24, az: -2, el: 15, dist: 10.8, target: [0, -0.2, 1.0] },
  { p: 0.36, az: -6, el: 6, dist: 9.9, target: [0, 0.1, 2.0] },
  { p: 0.4, az: -6, el: 6, dist: 9.9, target: [0, 0.1, 2.0] }, // held beat: watch pauses at inspection distance
  { p: 0.44, az: -11, el: 8, dist: 10.9, target: [0, 0.15, 2.6] },
  { p: 0.58, az: -2, el: 3, dist: 11.2, target: [0, 0.1, 3.0] },
  { p: 0.7, az: 38, el: 7, dist: 11.4, target: [0.6, 0, 2.9] },
  { p: 0.8, az: 21, el: 12, dist: 14.2, target: [0.3, -0.3, 2.6] },
  { p: 0.92, az: 38, el: 13, dist: 22.5, target: [0.5, -0.55, 2.1] },
  { p: 1.0, az: 55, el: 14, dist: 26.5, target: [0.55, -0.55, 1.8] },
];

/** Explosion master ramp: assembled through table/lift/approach, a held beat
    at the inspection distance, fully exploded by 0.96. The tail decelerates to
    zero slope so entering/leaving the fully exploded state is gentle — scrubbing
    back from the end un-explodes gradually instead of snapping into reassembly. */
export function explosionFromStory(p: number): number {
  const raw = Math.min(1, Math.max(0, (p - 0.4) / (0.96 - 0.4)));
  if (raw <= 0.78) return raw;
  const u = (raw - 0.78) / 0.22;
  return 0.78 + 0.22 * (1 - Math.pow(1 - u, 1.7));
}

/* ---- physical rig choreography (table → lift → approach), all pure f(p) ---- */

export const RIG = {
  tableY: -2.92,   // world y of the table surface
  restLift: 0.66,  // case-back-to-centre offset when lying flat
  approachZ: 2.8,  // how far the watch travels toward the viewer
} as const;

const ss = (t: number) => t * t * (3 - 2 * t);
const phase = (p: number, a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)));

export interface RigPose {
  y: number;
  z: number;
  tilt: number;  // 0 = lying flat on the table, 1 = facing the viewer (single geodesic pivot)
  lift: number;  // 0 = on table, 1 = fully lifted (drives shadow + table)
  approach: number;
}

/** Deterministic rig pose — scrubbing backward retraces the identical path. */
export function rigPoseFromStory(p: number): RigPose {
  const lift = ss(ss(phase(p, 0.05, 0.26)));      // overcomes weight, then eases out
  const tilt = ss(phase(p, 0.14, 0.32));          // pivots up to face the viewer
  const approach = ss(phase(p, 0.24, 0.36));      // travels toward the camera, then holds
  const restY = RIG.tableY + RIG.restLift;
  return {
    y: restY + (0 - restY) * lift,
    z: RIG.approachZ * approach,
    tilt,
    lift,
    approach,
  };
}

/* ------------------------------------------------------------------ */
/* Component dossier — the post-exploded material tour. Anchors are    */
/* measured world positions of each part in the fully exploded state.  */
/* Material facts researched: sapphire = synthetic corundum, Verneuil  */
/* 1911, Mohs 9; nitre bluing 290–310°C -> magnetite "peacock blue";   */
/* maillechort (German silver) ~60% Cu / 20% Ni / 20% Zn.              */
/* ------------------------------------------------------------------ */

export interface DossierStop {
  id: string;
  index: string;
  name: string;
  material: string;
  accent: string;
  body: string;
  specs: Array<[string, string]>;
  anchor: [number, number, number];
  az: number;
  el: number;
  dist: number;
  /** component ids that stay lit while everything else falls into shadow */
  feature: string[];
}

export const DOSSIER: DossierStop[] = [
  {
    id: 'crystal', index: '01', name: 'THE CRYSTAL', material: 'SYNTHETIC SAPPHIRE', accent: '#b9d4e8',
    body: 'Grown, then cut and polished. A domed disc of pure corundum — Al₂O₃ — flame-grown by the fusion process Auguste Verneuil developed in 1902. At 9 on the Mohs scale, only diamond and moissanite sit above it; scratches that would erase glass never register.',
    specs: [['MATERIAL', 'Sapphire (synthetic corundum)'], ['HARDNESS', '9 Mohs · melts at 2,030 °C']],
    anchor: [-0.6, 1.45, 4.75], az: -18, el: 6, dist: 3.4,
    feature: ['crystal'],
  },
  {
    id: 'hand-minute', index: '02', name: 'THE HANDS', material: 'MIRROR-POLISHED STEEL', accent: '#e8e8ee',
    body: 'Leaf-profile hands, milled thin and polished to a mirror so they read by reflection alone. The chronograph needle is counterweighted to spin dead-true around the central axis.',
    specs: [['PROFILE', 'Feuille (leaf), diamond-milled'], ['FINISH', 'Black-polished steel']],
    anchor: [-0.15, 0.25, 4.5], az: -18, el: 10, dist: 3.0,
    feature: ['hand-minute', 'hand-hour', 'hand-chrono', 'subhand-left', 'subhand-right', 'hand-date', 'pinion-cap'],
  },
  {
    id: 'dial-plate', index: '03', name: 'THE DIAL', material: 'GALVANIC SMOKED SUNBURST', accent: '#8f8f98',
    body: 'Brushed from the centre outward, then graduated to black at the rim — a galvanic smoked finish. The counters are ringed with azurage, concentric grooves cut to trap and return light.',
    specs: [['FINISH', 'Sunburst, smoked gradient'], ['DETAIL', 'Azurage counters, printed scales']],
    anchor: [0, 0, 3.2], az: -4, el: 4, dist: 4.6,
    feature: ['dial-plate', 'subdials', 'date-subdial', 'hour-markers', 'dial-apertures', 'dial-round-windows'],
  },
  {
    id: 'case-main', index: '04', name: 'THE CASE', material: '950 PLATINUM', accent: '#d4d6db',
    body: 'Cold-forged 950 platinum — 95 % pure, nearly three times the density of steel, hypoallergenic. The white luster is the metal itself, not a plating: it can be polished forever and never wear through.',
    specs: [['ALLOY', 'Pt 950 (95 % platinum)'], ['FINISH', 'Polished band, brushed flanks']],
    anchor: [1.3, 0, 2.8], az: 55, el: 14, dist: 5.0,
    feature: ['case-main', 'lugs'],
  },
  {
    id: 'strap-upper', index: '05', name: 'THE STRAP', material: 'HAND-BRAIDED CALFSKIN', accent: '#b08a5a',
    body: 'Graphite-dyed, vegetable-tanned calfskin, plaited strand over strand across a supple core and closed with saddle stitching. Leather is the one component that records its wearer — it softens and takes a patina no two owners share.',
    specs: [['LEATHER', 'Vegetable-tanned calfskin'], ['CONSTRUCTION', 'Hand-braided, saddle-stitched']],
    anchor: [0, 3.6, 2.75], az: 26, el: 6, dist: 5.0,
    feature: ['strap-upper', 'stitch-upper'],
  },
  {
    id: 'calendar-works', index: '06', name: 'THE CALENDAR WORKS', material: 'CHAMPAGNE-GILDED BRASS', accent: '#cbb68a',
    body: 'A 31-tooth date ring and its program wheel, gilded champagne. Once a night it advances the date — and by the shape of its cam it already knows the length of every month.',
    specs: [['WHEEL', '31-tooth date ring + program wheel'], ['FINISH', 'Champagne gilding']],
    anchor: [0.62, 0.74, 0.81], az: 14, el: 4, dist: 2.3,
    feature: ['calendar-works'],
  },
  {
    id: 'moonphase', index: '07', name: 'THE MOONPHASE', material: 'NAVY LACQUER', accent: '#5a6db8',
    body: 'A deep navy lacquer sky carrying a silvered moon and a field of stars. It turns once every 29.53 days — the length of a lunation — so the little sky keeps step with the real one.',
    specs: [['DISC', 'Layered navy lacquer'], ['CYCLE', 'One lunation = 29.53 days']],
    anchor: [0.8, -1.08, 0.98], az: 8, el: -4, dist: 1.7,
    feature: ['moonphase'],
  },
  {
    id: 'chrono-works', index: '08', name: 'THE COLUMN WHEEL', material: 'NITRE-BLUED STEEL', accent: '#4a6fb8',
    body: 'The chronograph\u2019s command turret: a castellated wheel whose pillars decide start, stop and return in one crisp click. Its blue is not paint — the steel is heated near 300 °C until a magnetite skin blooms peacock blue.',
    specs: [['COMMAND', 'Castellated column wheel'], ['FINISH', 'Thermally blued (~300 °C)']],
    anchor: [1.72, 0.34, 0.34], az: 30, el: 12, dist: 1.6,
    feature: ['chrono-works'],
  },
  {
    id: 'balance-wheel', index: '09', name: 'THE BALANCE', material: 'BLUED HAIRSPRING · RUBY JEWELS', accent: '#7a4a5a',
    body: 'The regulating organ. A weighted wheel breathing against a hairspring blued the classical way — nitre-heated until it turns peacock. It pivots in synthetic ruby jewels: the same corundum as the crystal, grown into bearings that barely wear across a lifetime.',
    specs: [['OSCILLATOR', 'Balance + blued hairspring'], ['BEARINGS', 'Synthetic ruby (corundum)']],
    anchor: [0.24, -1.69, -0.05], az: 18, el: 10, dist: 2.0,
    feature: ['balance-wheel'],
  },
  {
    id: 'movement-plate', index: '10', name: 'THE MAIN PLATE', material: 'MAILLECHORT · CÔTES DE GENÈVE', accent: '#9aa2b0',
    body: 'The chassis every wheel answers to, machined from maillechort — German silver, roughly 60 % copper, 20 % nickel, 20 % zinc — prized because it needs no plating and ages into a warm golden patina. Its bridges are striped with côtes de Genève and fixed by hand-slotted screws.',
    specs: [['ALLOY', 'Maillechort (Cu-Ni-Zn)'], ['DECORATION', 'Côtes de Genève bridges, slotted screws']],
    anchor: [0.7, -1.35, -0.45], az: 5, el: -12, dist: 2.0,
    feature: ['movement-plate', 'movement-screws'],
  },
];

/** Dossier camera keys: q in 0..1 across the tour pin. Entry matches the
    story's final corridor key; the tail watches the watch reassemble and
    settles on the closing beauty angle of the complete piece. */
export const DOSSIER_KEYS: CameraKey[] = [
  { p: 0.0, az: 55, el: 14, dist: 26.5, target: [0.55, -0.55, 1.8] },
  ...DOSSIER.map((s, i) => ({
    p: (i + 0.72) / (DOSSIER.length + 2),
    az: s.az, el: s.el, dist: s.dist,
    target: s.anchor as [number, number, number],
  })),
  // pull back to watch every component fly home
  { p: 0.9, az: 38, el: 10, dist: 13.5, target: [0.2, 0, 2.8] },
  // the closing hero: complete watch, classic three-quarter beauty angle
  { p: 1.0, az: 26, el: 11, dist: 8.6, target: [0, 0.05, 2.8] },
];

/** Reassembly ramp inside the dossier act: 0 = fully exploded, 1 = complete.
    Zero-slope at both ends so entering/leaving the beauty shot is gentle. */
export function reassemblyFromTour(q: number): number {
  const t = Math.min(1, Math.max(0, (q - 0.84) / (0.985 - 0.84)));
  return t * t * (3 - 2 * t);
}
