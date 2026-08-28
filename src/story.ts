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
    start: 0.0, end: 0.15,
    eyebrow: 'PRECISION / 01',
    title: 'TIME, REFINED.',
    description: 'A study in proportion, precision and mechanical detail.',
    focus: 'watch',
    labels: [],
  },
  {
    start: 0.15, end: 0.3,
    eyebrow: 'CASE / 02',
    title: 'BUILT IN LAYERS.',
    description: 'Every surface is shaped to control light, depth and proportion.',
    focus: 'case',
    labels: [
      { component: 'crystal', text: 'CRYSTAL', sub: 'DOMED SAPPHIRE', offset: [0.9, 0.9, 0.4], minSeparation: 0.12 },
      { component: 'bezel', text: 'BEZEL', sub: 'CONCAVE POLISH', offset: [-1.3, 0.7, 0.3], minSeparation: 0.1 },
      { component: 'case-main', text: 'CASE', sub: 'PLATINUM BAND', offset: [-1.6, -0.5, 0.4] },
    ],
  },
  {
    start: 0.3, end: 0.5,
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
    start: 0.5, end: 0.65,
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
    start: 0.65, end: 0.78,
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
  { p: 0.0, az: 0, el: 5, dist: 12.4, target: [0, -0.1, 0.2] },
  { p: 0.15, az: -5, el: 5, dist: 11.0, target: [0, 0, 0.3] },
  { p: 0.3, az: -11, el: 11, dist: 9.8, target: [0, 0.15, 0.5] },
  { p: 0.5, az: -2, el: 3, dist: 9.6, target: [0, 0.1, 0.8] },
  { p: 0.65, az: 38, el: 7, dist: 10.2, target: [0.6, 0, 0.6] },
  { p: 0.78, az: 21, el: 12, dist: 13.6, target: [0.3, -0.3, 0.7] },
  { p: 0.92, az: 38, el: 13, dist: 22.0, target: [0.5, -0.55, -0.2] },
  { p: 1.0, az: 55, el: 14, dist: 26.0, target: [0.55, -0.55, -0.5] },
];

/** Explosion master ramp: assembled until 0.16, fully exploded by 0.96. */
export function explosionFromStory(p: number): number {
  const t = (p - 0.16) / (0.96 - 0.16);
  return Math.min(1, Math.max(0, t));
}
