import type { LessonConfig } from '../../src/config/schema';
import type { GlobeMotionParams } from '../../src/archetypes/globeMotionOverlay';
import type { CrossSectionParams } from '../../src/archetypes/animatedCrossSection';
import type { ScrubTimelineParams } from '../../src/archetypes/scrubTimeline';
import {
  CITIES, WAVE_EAST_ARRIVAL, WAVE_GOLD_RAIL, WAVE_INDUSTRY_LAKES, WAVE_AIRCRAFT_FILM,
  WAVE_SUN_BELT, US_POP, US_POP_BOOK,
} from './data';

// advanced-03-united-states (Lesson 3 · basic level). Config-only build against the
// three shared archetypes — see teacher-key.md "Terra console — SPEC". New named
// cross-section renderers (usaWest/usaBasin/usaPlains/usaEast) were added to
// crossSection.ts, and a 'migrate' action was added to globeMotionOverlay.ts
// (documented augmentation path — README "Add a new action button"). NO new
// archetype. Narration ships as browser-TTS fallback (src:'') — ElevenLabs bake
// deferred, per the build brief.

const NAV = {
  m0: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 20l5-13 4 6 3-9 3 10 3-3 3 9z"/></svg>`,
  m1: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 12h13M11 7l5 5-5 5"/><circle cx="19" cy="12" r="2"/></svg>`,
  m2: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="8" r="4"/><path d="M2 15h6M16 15h6M4 19h7M13 19h7M9 15h4"/></svg>`,
};
const IC_MIGRATE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 12h11M9 7l5 5-5 5"/><circle cx="19" cy="12" r="2.4"/></svg>`;
const IC_PLAY = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;

const sectionParams: CrossSectionParams = {
  scenes: ['usaWest', 'usaBasin', 'usaPlains', 'usaEast'],
  default: 'usaWest',
};

const migrationParams: GlobeMotionParams = {
  markerLayers: [{ key: 'cities', pts: CITIES, color: 0x4fe3d0, size: 0.016, pulse: false }],
  migrationWaves: [
    { label: '1600–1820 · EAST COAST ARRIVAL', pts: WAVE_EAST_ARRIVAL },
    { label: 'MID-1800s · GOLD & RAIL WEST', pts: WAVE_GOLD_RAIL },
    { label: 'BY 1870 · INDUSTRY & THE GREAT LAKES', pts: WAVE_INDUSTRY_LAKES },
    { label: 'BY 1920 · AIRCRAFT & FILM WEST', pts: WAVE_AIRCRAFT_FILM },
    { label: '1970 → TODAY · THE SUN BELT', pts: WAVE_SUN_BELT },
  ],
  glow: 0xffb454,
};

const popParams: ScrubTimelineParams = {
  range: [1800, 2026],
  start: 2004,
  primary: US_POP,
  curveMax: 360,
  bookLine: US_POP_BOOK,
  curveMarks: [
    [2004, 294, '294M (book)', '#ff5b6e', 'start'],
    [2026, 342, '~342M today', '#4fe3d0', 'end'],
  ],
  bookClaimTag: '▲ TEXTBOOK SAYS “294 MILLION” — AUDIT IT',
  unit: 'MILLION',
  midLabel: 'BOOK’S YEAR',
  events: [
    { from: 1800, text: 'a young republic — 5.3 million' },
    { from: 1850, text: 'expanding west' },
    { from: 1900, text: 'the industrial boom' },
    { from: 1950, text: 'post-war growth' },
    { from: 1970, text: 'entering the modern era' },
    { from: 2000, text: 'the new millennium' },
    { from: 2004, text: 'the textbook’s own year' },
    { from: 2010, text: 'a new decade' },
    { from: 2020, text: 'today’s baseline' },
    { from: 2026, text: 'now' },
  ],
  playEvents: [
    { year: 2004, freq: 523, type: 'triangle', p: 0.25, d: 0.3, status: '▲ 2004 · THE BOOK’S NUMBER' },
    { year: 2026, freq: 880, type: 'sine', p: 0.3, d: 0.5, status: '◆ TODAY — SCRUB CONFIRMED' },
  ],
  glow: 0x59a9ff,
};

export const advanced03UsaConfig: LessonConfig = {
  id: 'advanced-03-united-states',
  subject: 'geography',
  slug: 'advanced-03-united-states',
  title: 'TERRA · United States Console',
  brandSub: 'United States Console · DK Geo L3',
  poSub: 'United States Console',
  accent: { cy: 0x4fe3d0, am: 0xffb454, red: 0xff5b6e },
  boot: { landTraceMs: 1700, ignitionPulses: [[-98, 39], [-122, 47], [-77, 39]], autoSpin: { standby: 0.0006, boot: 0.006, idle: 0.0016 } },
  // Camera aim for the US — anchors the globe here on boot and on every module
  // switch (see TerraEngine.ts); idle auto-spin is suppressed so the Moving West
  // module never drifts the US off-screen mid-class.
  // NOTE: lat is a CALIBRATED AIM VALUE, not the geographic centre's real latitude
  // (~39N). camera.ts's faceLon() has a pre-existing centering bug — it only maps
  // its target to true screen-center for points near lon=-90 AND doesn't account
  // for the camera's fixed y=0.3 offset (no compensating lookAt()), so oblique
  // targets land well off-center (confirmed empirically: faceLon(-98,39) centers
  // on Greenland/the Arctic, not the US). lat=-8 was found by bisecting screenshots
  // in the dev harness (__terra.faceLon) until the CONUS actually centers. Flagging
  // for an eventual camera.ts fix — out of scope here per the "don't refactor the
  // camera system" constraint on this build.
  home: { lon: -98, lat: -8 },
  narration: [
    {
      key: 'mod0', src: '',
      fallbackText: 'The country sits between two walls of mountains. The young Sierra Nevada and Rocky Mountains both rise over four thousand meters. In between is the Great Plains — flat, but not empty. It is farmland. Your book says America grows the most wheat and corn on Earth. Corn, yes. Wheat, no — China grows more than twice as much wheat today.',
    },
    {
      key: 'mod1', src: '',
      fallbackText: 'The country started as thirteen small colonies on the east coast. Then people kept moving. Gold and the railroads pulled them west in the eighteen-hundreds. Factories pulled people to the northeast and the Great Lakes by eighteen-seventy. Aircraft and film drew people to Seattle and Los Angeles by nineteen-twenty. And from nineteen-seventy to today, the Sun Belt — California, Arizona, Texas, Florida — has pulled people toward the warmth. Climate decides where people live. Same rule as Canada.',
    },
    {
      key: 'mod2', src: '',
      fallbackText: 'Your textbook says the United States has two hundred ninety-four million people. That was about right in two thousand four, when the book was written. Today the real number is about three hundred forty-two million — and still growing.',
    },
  ],
  modules: [
    {
      archetype: 'animated-cross-section',
      navIcon: NAV.m0,
      meta: {
        idx: 'MODULE 01 / 03',
        name: 'The Shape of America',
        desc: 'A slice across the country at about 39° north. Two mountain walls, and something in between — reveal it band by band, west to east.',
      },
      legend: [
        { t: 'usaWest', c: 0x8fefe4, b: 'Pacific → Sierra', s: 'the western wall' },
        { t: 'usaBasin', c: 0xffb454, b: 'Basin & Rockies', s: 'the second wall' },
        { t: 'usaPlains', c: 0x4fe3d0, b: 'The Great Plains', s: 'the flat middle' },
        { t: 'usaEast', c: 0xff9e5b, b: 'Appalachians → Atlantic', s: 'the eastern wall' },
      ],
      question: {
        html: `<span class="q">“Two walls of mountains, west and east. What’s in the flat middle — empty land, or something else?”</span>`,
        ins: [['PROFILE', '≈39°N'], ['THE ASK', 'flat = empty?']],
        narrationKey: 'mod0',
      },
      controls: [],
      params: sectionParams,
    },
    {
      archetype: 'globe-motion-overlay',
      navIcon: NAV.m1,
      meta: {
        idx: 'MODULE 02 / 03',
        name: 'Moving West',
        desc: 'The country began as small colonies on the east coast. Run the migration and watch five waves pull people west and south, era by era.',
      },
      legend: [
        { t: 'cities', c: 0x4fe3d0, b: 'Cities', s: 'named urban centers' },
        { t: 'early', c: 0xffb454, b: '1600–1820', s: 'first arrivals' },
        { t: 'west', c: 0xff9e5b, b: 'Gold & rail', s: 'mid-1800s push west' },
        { t: 'sunbelt', c: 0xff5b6e, b: 'Sun Belt', s: '1970 → today' },
      ],
      question: {
        html: `<span class="q">“The country started on the east coast. Why did people keep moving west and south?”</span>`,
        ins: [['WAVES', '5'], ['THE ASK', 'why move?']],
        narrationKey: 'mod1',
      },
      controls: [{ act: 'migrate', label: 'RUN MIGRATION', icon: IC_MIGRATE, style: 'solid' }],
      params: migrationParams,
    },
    {
      archetype: 'scrub-timeline',
      navIcon: NAV.m2,
      meta: {
        idx: 'MODULE 03 / 03',
        name: 'Who Lives Here',
        desc: 'Your book says the United States has 294 million people. Scrub the timeline forward from the book’s own year and audit it.',
      },
      legend: [
        { t: '1800s', c: 0x4fe3d0, b: '1800s', s: 'a young nation' },
        { t: 'book', c: 0xff5b6e, b: 'The book’s year', s: '2004' },
        { t: 'today', c: 0xffb454, b: 'Today', s: 'still climbing?' },
      ],
      question: {
        html: `<span class="q">“Your book says 294 million people. Scrub the timeline — what’s the real number today?”</span>`,
        ins: [['BOOK SAYS', '294M'], ['TODAY', '?']],
        narrationKey: 'mod2',
      },
      controls: [{ act: 'play', label: 'PLAY TIMELINE', icon: IC_PLAY, style: 'solid' }],
      params: popParams,
    },
  ],
};

export default advanced03UsaConfig;
