import type { LessonConfig } from '../../src/config/schema';
import type { GlobeMotionParams } from '../../src/archetypes/globeMotionOverlay';
import type { CrossSectionParams } from '../../src/archetypes/animatedCrossSection';
import type { ScrubTimelineParams } from '../../src/archetypes/scrubTimeline';
import { MOUNTAINS, VOLCANIC, RIVERS, ICE_COAST, DESERTS_LF, CANYON_AGE, CANYON_BOOK } from './data';

// The config-only proof lesson: authored purely from schema + data + the 3 shared
// archetypes. New named cross-section renderers (us/glacial/rift) were added to
// crossSection.ts, but NO new archetype module — registry keys are unchanged.
// Narration ships as browser-TTS fallback (src:'') — ElevenLabs bake is deferred.

const NAV = {
  m0: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 20l6-11 4 7 3-5 5 9z"/></svg>`,
  m1: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 12l9 5 9-5M3 16l9 5 9-5"/></svg>`,
  m2: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 7h18M3 12h18M3 17h18"/></svg>`,
};
const IC_PLAY = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;

const globeParams: GlobeMotionParams = {
  markerLayers: [
    { key: 'mountains', pts: MOUNTAINS, color: 0xffb454, pulse: true },
    { key: 'volcanic', pts: VOLCANIC, color: 0xff5b6e, pulse: true },
    { key: 'rivers', pts: RIVERS, color: 0x4fe3d0 },
    { key: 'ice', pts: ICE_COAST, color: 0xbfe9ff },
    { key: 'deserts', pts: DESERTS_LF, color: 0xff9e5b },
  ],
  glow: 0x39d6cf,
};

const sectionParams: CrossSectionParams = { scenes: ['us', 'glacial', 'rift'], default: 'us' };

const canyonParams: ScrubTimelineParams = {
  range: [0, 1600],
  start: 0,
  primary: CANYON_AGE,
  curveMax: 2100,
  bookLine: CANYON_BOOK,
  curveMarks: [[1600, 1750, '~1.75 Gyr real', '#4fe3d0', 'end'], [1600, 2000, '2 Gyr book', '#ff5b6e', 'end']],
  bookClaimTag: '▲ BOOK: BOTTOM ROCK IS 2,000 MILLION YRS — AUDIT IT',
  unit: 'Myr old',
  midLabel: '↓ DEEPER',
  events: [
    { from: 0, text: 'canyon rim — youngest layers' },
    { from: 760, text: 'halfway down · rocks ~0.75 Gyr' },
    { from: 1400, text: 'near the Colorado River' },
    { from: 1590, text: 'Vishnu basement — oldest exposed rock' },
  ],
  playEvents: [
    { year: 760, freq: 523, type: 'triangle', p: 0.25, d: 0.3 },
    { year: 1600, freq: 784, type: 'sine', p: 0.3, d: 0.5, status: '◆ VISHNU ROCK ~1.75 Gyr — book rounds up to 2' },
  ],
  glow: 0xff9e5b,
};

export const landformsConfig: LessonConfig = {
  id: 'landforms-shaping-the-land',
  subject: 'geography',
  slug: 'landforms-shaping-the-land',
  title: 'TERRA · Shaping the Land',
  brandSub: 'Landforms Console · DK Geo',
  poSub: 'Landforms Console',
  accent: { cy: 0x4fe3d0, am: 0xffb454, red: 0xff5b6e },
  boot: { landTraceMs: 1700, ignitionPulses: [[-112, 36], [86, 28], [37, -3]], autoSpin: { standby: 0.0006, boot: 0.006, idle: 0.0016 } },
  narration: [
    { key: 'lf0', src: '', fallbackText: 'Two forces shape every landscape. Building forces push land up — colliding plates fold mountains, hot spots build volcanoes. Wearing forces grind it down — rivers carve, glaciers gouge, wind scours. The young Rockies are still jagged; the ancient Appalachians have been worn low.' },
    { key: 'lf1', src: '', fallbackText: 'A cross-section is a slice through the land. The US section shows a young jagged west and a worn rounded east. A glacier turns a narrow V-shaped river valley into a wide U-shaped trough. And where the crust stretches, blocks drop between faults to make a rift valley.' },
    { key: 'lf2', src: '', fallbackText: 'Your textbook says the rock at the bottom of the Grand Canyon is two billion years old. The real oldest exposed rock, the Vishnu basement, is about one point seven-five billion years. The book rounds up. The canyon is a mile deep, and the river is still cutting.' },
  ],
  modules: [
    {
      archetype: 'globe-motion-overlay',
      navIcon: NAV.m0,
      meta: { idx: 'MODULE 01 / 03', name: 'Building & Wearing', desc: 'Every landscape is a tug-of-war. Forces from inside the Earth build the land up; water, ice, and wind wear it back down. Find where each force wins on the map.' },
      legend: [
        { t: 'build', c: 0xffb454, b: 'Building', s: 'mountains & volcanoes lift up' },
        { t: 'wear', c: 0x4fe3d0, b: 'Wearing', s: 'rivers & ice grind down' },
        { t: 'desert', c: 0xff9e5b, b: 'Deserts', s: 'wind & drought shape sand' },
      ],
      question: {
        html: `<span class="q">“The Rockies are jagged and young; the Appalachians are low and old — same continent. What wore one down?”</span>`,
        ins: [['FEATURES', '30+'], ['THE ASK', 'build or wear?']],
        narrationKey: 'lf0',
      },
      controls: [],
      params: globeParams,
    },
    {
      archetype: 'animated-cross-section',
      navIcon: NAV.m1,
      meta: { idx: 'MODULE 02 / 03', name: 'Read the Land', desc: 'A cross-section is a slice through the ground. Switch between three real profiles from the book and read what built the highs and what carved the lows.' },
      legend: [
        { t: 'us', c: 0x8fefe4, b: 'Across the US', s: 'young west, old east' },
        { t: 'glacial', c: 0xbfe9ff, b: 'Glacial valley', s: 'V carved into U' },
        { t: 'rift', c: 0xffb454, b: 'Rift valley', s: 'blocks drop between faults' },
      ],
      question: {
        html: `<span class="q">“This is a slice through the land. What lifted the highs — and what carved the lows?”</span>`,
        ins: [['PROFILES', '3'], ['THE ASK', 'lift or carve?']],
        narrationKey: 'lf1',
      },
      controls: [],
      params: sectionParams,
    },
    {
      archetype: 'scrub-timeline',
      navIcon: NAV.m2,
      meta: { idx: 'MODULE 03 / 03', name: 'Deep Time', desc: 'The Grand Canyon cuts down through rock that gets older the deeper you go. The book says the bottom is 2 billion years old. Descend the timeline and audit it.' },
      legend: [
        { t: 'young', c: 0x4fe3d0, b: 'Rim', s: 'youngest rock' },
        { t: 'mid', c: 0xffb454, b: 'Mid-wall', s: 'deeper = older' },
        { t: 'old', c: 0xff9e5b, b: 'The river', s: 'oldest exposed' },
      ],
      question: {
        html: `<span class="q">“Your book says the canyon cuts rock 2 billion years old. Descend to the river — how old, really?”</span>`,
        ins: [['BOOK SAYS', '2.0 Gyr'], ['REAL', '?']],
        narrationKey: 'lf2',
      },
      controls: [{ act: 'play', label: 'DESCEND', icon: IC_PLAY, style: 'solid' }],
      params: canyonParams,
    },
  ],
};

export default landformsConfig;
