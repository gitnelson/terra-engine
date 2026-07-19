import type { LessonConfig } from '../../src/config/schema';
import type { GlobeMotionParams } from '../../src/archetypes/globeMotionOverlay';
import type { ScrubTimelineParams } from '../../src/archetypes/scrubTimeline';
import { BOUNDS, ROF, SPREADPTS, DESERTS, POP, CN, IN } from './data';
import mod0 from './audio/mod0.mp3';
import mod1 from './audio/mod1.mp3';
import mod2 from './audio/mod2.mp3';
import circulate from './audio/circulate.mp3';
import insol from './audio/insol.mp3';

// Nav + control icons (verbatim from the console).
const NAV = {
  m0: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>`,
  m1: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="8" r="4"/><path d="M2 15h6M16 15h6M4 19h7M13 19h7M9 15h4"/></svg>`,
  m2: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 20c2-6 4-9 5-9s2 2 3 2 2-6 3-6 2 8 3 9 2 2 4 4"/><path d="M3 20h18"/></svg>`,
};
const IC = {
  seismic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 12h4l2-7 4 14 2-9 2 4h6"/></svg>`,
  circulate: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 12a8 8 0 018-8 8 8 0 018 8M20 12a8 8 0 01-8 8 8 8 0 01-8-8"/><path d="M12 4v4M12 16v4"/></svg>`,
  insol: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>`,
  play: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
};

const CIRCULATE_FALLBACK = 'Air rises wet at the equator, and comes back down dry at thirty degrees. That is why the deserts line up.';
const INSOL_FALLBACK = 'Same Sun. At the equator the rays hit straight on, concentrated. At the poles the same energy is smeared over a bigger area. That is the whole reason it is hot at the equator and cold at the poles.';

const module0Params: GlobeMotionParams = {
  boundaries: BOUNDS,
  markerLayers: [
    { key: 'rof', pts: ROF, color: 0xffb454, pulse: true },
    { key: 'spread', pts: SPREADPTS, color: 0x4fe3d0, size: 0.018 },
  ],
  seismic: ROF,
  crossSection: { scenes: ['spread', 'sub', 'trans'], default: 'sub' },
  sectionMarkers: { spread: 'spread', sub: 'rof' }, // section 'spread' shows SPREADPTS, 'sub' shows ROF
  glow: 0x39d6cf,
};

const module1Params: GlobeMotionParams = {
  markerLayers: [{ key: 'deserts', pts: DESERTS, color: 0xff9e5b }],
  bands: [30, -30],
  equatorHadley: true,
  insolation: true,
  glow: 0xffb07a,
  circulateNarration: 'circulate',
  circulateFallback: CIRCULATE_FALLBACK,
};

const module2Params: ScrubTimelineParams = {
  range: [1800, 2100],
  start: 1999,
  primary: POP,
  curveMax: 11,
  bookLine: [[1999, 6], [2020, 7.5], [2050, 9.2], [2100, 11.5]],
  curveMarks: [[1999, 6, '6B (book)', '#ff5b6e', 'start'], [2022, 8, '8B · 2022', '#4fe3d0', 'start'], [2086, 10.3, 'peak 10.3B', '#ffb454', 'end']],
  bookClaimTag: '▲ TEXTBOOK SAYS “IN EXCESS OF 6 BILLION” — AUDIT IT',
  unit: 'BILLION',
  bars: { list: [{ key: 'cn', label: 'China', color: 'china', points: CN }, { key: 'in', label: 'India', color: 'india', points: IN }], max: 1.7 },
  glow: 0x59a9ff,
  crossover: { year: 2023, text: '◆ 2023 — INDIA OVERTAKES CHINA. China now shrinking.' },
  miniStats: [
    { k: 'Global fertility', v: '4.7<span class="ar">→</span>2.3', sub: 'births per woman · replacement 2.1' },
    { k: 'Rwanda', v: '8.3<span class="ar">→</span>3.7', sub: 'book figure → today' },
    { k: 'Africa’s share', v: '13%<span class="ar">→</span>19%', sub: 'of world pop · →38% by 2100' },
  ],
  events: [
    { from: 1800, text: 'pre-textbook era' },
    { from: 1999, text: 'the world the book was written in' },
    { from: 2011, text: '7 billion crossed (2011)' },
    { from: 2022, text: '8 billion crossed — Nov 2022' },
    { from: 2023, text: 'India now #1 · China shrinking' },
    { from: 2086, text: 'PEAK — growth ends near 10.3B' },
    { from: 2098, text: 'decline begins — first time in modern history' },
  ],
  playEvents: [
    { year: 2022, freq: 523, type: 'triangle', p: 0.25, d: 0.3 },
    { year: 2023, freq: 784, type: 'triangle', p: 0.28, d: 0.35, status: '◆ 2023 · INDIA OVERTAKES CHINA' },
    { year: 2086, freq: 1046, type: 'sine', p: 0.3, d: 0.6, status: '▲ PROJECTED PEAK · 10.3B' },
  ],
};

export const hs01Config: LessonConfig = {
  id: 'hs-01-physical-world',
  subject: 'geography',
  slug: 'hs-01-physical-world',
  title: 'TERRA · Physical Systems Console',
  brandSub: 'Physical Systems Console · DK Geo L1',
  poSub: 'Physical Systems Console',
  accent: { cy: 0x4fe3d0, am: 0xffb454, red: 0xff5b6e },
  boot: { landTraceMs: 1700, ignitionPulses: [[138, 35], [-72, -30], [122, 12]], autoSpin: { standby: 0.0006, boot: 0.006, idle: 0.0016 } },
  narration: [
    { key: 'mod0', src: mod0, fallbackText: "In one sentence — what is the connection between an earthquake in Japan, and a volcano in the Andes? Wait for it. It's the same system of plates." },
    { key: 'mod1', src: mod1, fallbackText: 'The Sahara, the Arabian, the Kalahari, the Australian deserts — they all sit near thirty degrees. That is not a coincidence. Why?' },
    { key: 'mod2', src: mod2, fallbackText: 'Your textbook says the world has, in excess of, six billion people. What is the number today? It\'s eight point two billion. And India passed China in twenty twenty-three.' },
    { key: 'circulate', src: circulate, fallbackText: CIRCULATE_FALLBACK },
    { key: 'insol', src: insol, fallbackText: INSOL_FALLBACK },
  ],
  modules: [
    {
      archetype: 'globe-motion-overlay',
      navIcon: NAV.m0,
      meta: { idx: 'MODULE 01 / 03', name: 'Restless Earth', desc: 'Plates do three things — and each motion builds a different landform. Trace the Ring of Fire and prove the link between a quake in Japan and a volcano in the Andes.' },
      legend: [
        { t: 'spread', c: 0x4fe3d0, b: 'Spreading', s: 'Ridges & rifts — new crust' },
        { t: 'sub', c: 0xffb454, b: 'Subduction', s: 'Volcanoes + mountains' },
        { t: 'trans', c: 0xff5b6e, b: 'Transform', s: 'Earthquakes — San Andreas' },
      ],
      question: {
        html: `<span class="q">“In one sentence — what connects an earthquake in Japan and a volcano in the Andes?”</span>`,
        ins: [['BOUNDARIES', '6 major'], ['THE ASK', 'one link?']],
        narrationKey: 'mod0',
      },
      controls: [{ act: 'seismic', label: 'SEISMIC SCAN', icon: IC.seismic, style: 'solid' }],
      params: module0Params,
    },
    {
      archetype: 'globe-motion-overlay',
      navIcon: NAV.m1,
      meta: { idx: 'MODULE 02 / 03', name: 'Climate Engine', desc: 'Same Sun, different world. Why is it hot at the equator? And why do the great deserts all line up near 30°? One hidden circulation rule sits behind the map.' },
      legend: [
        { t: 'insol', c: 0xffb454, b: '30° belt', s: 'the desert latitudes' },
        { t: 'hadley', c: 0x4fe3d0, b: 'Equator', s: '0° — hit ▶ circulation' },
        { t: 'desert', c: 0xff9e5b, b: 'Deserts', s: 'Sahara · Arabian · Kalahari · Outback' },
      ],
      question: {
        html: `<span class="q">“The Sahara, Arabian, Kalahari and Australian deserts all sit near 30°. That’s not a coincidence — why?”</span>`,
        ins: [['DESERT BELT', '≈30° N/S'], ['THE ASK', 'why 30°?']],
        narrationKey: 'mod1',
      },
      controls: [
        { act: 'circulate', label: 'RUN CIRCULATION', icon: IC.circulate, style: 'solid' },
        { act: 'insol', label: 'INSOLATION', icon: IC.insol, style: 'am' },
      ],
      params: module1Params,
    },
    {
      archetype: 'scrub-timeline',
      navIcon: NAV.m2,
      meta: { idx: 'MODULE 03 / 03', name: 'Human Tide', desc: 'The book says the world holds “in excess of 6 billion”. Scrub the timeline and track the real story — the number today, who’s now the most populous, and where it’s all heading.' },
      legend: [
        { t: 'now', c: 0x4fe3d0, b: 'The number', s: 'today = ?' },
        { t: 'cross', c: 0xffb454, b: 'Most people', s: 'still China?' },
        { t: 'peak', c: 0xff9e5b, b: 'The trend', s: 'up forever?' },
      ],
      question: {
        html: `<span class="q">“Your book says the world has ‘in excess of 6 billion’ people. What’s the number today — and which country has the most?”</span>`,
        ins: [['BOOK SAYS', '>6B'], ['TODAY', '?']],
        narrationKey: 'mod2',
      },
      controls: [{ act: 'play', label: 'PLAY TIMELINE', icon: IC.play, style: 'solid' }],
      params: module2Params,
    },
  ],
};

export default hs01Config;
