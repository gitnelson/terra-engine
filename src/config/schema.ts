import type { BootConfig } from '../engine/boot';

// The typed contract a lesson author writes. One LessonConfig -> one console. The
// engine reads it; archetypes read their slice of it. This is the seam that makes
// a new lesson "write a config + data", not "hand-code a console".

export type LonLat = [number, number];
export type Pt = [number, number]; // generic [x, y] datum (e.g. [year, value])
export type Hex = number; // 0x4fe3d0 — matches the console's color literals

export interface NarrationClip {
  key: string;          // 'mod0', 'circulate' …
  src: string;          // 'audio/mod0.mp3' (build inlines to a data-URI)
  fallbackText: string; // TTS fallback — the RZL reveal line
}

// One legend row. STUDENT-FACING (the console is screen-shared) — keep `s` vague;
// the answer never appears here.
export interface LegendRow {
  t: string;            // toggle/section key ('spread','sub','desert' …)
  c: Hex;               // swatch color
  b: string;            // bold label
  s: string;            // sub label (keep neutral)
}

// The #assist content — the SPOILER-SAFE contract. Question only, never the answer.
export interface QuestionPanel {
  html: string;               // question-only markup
  ins: [string, string][];    // insight cells, neutralized ('THE ASK', '?')
  narrationKey: string;       // clip fired ONLY on explicit NARRATE press
}

export interface ControlButton {
  act: string;                // data-act routed to archetype.onAction
  label: string;
  icon?: string;              // optional inline SVG/markup
  style?: 'solid' | 'am' | 'default';
  narrationKey?: string;      // optional clip on press
}

export interface ModuleMeta {
  idx: string;   // 'MODULE 01 / 03'
  name: string;  // 'Restless Earth'
  desc: string;
}

export interface ModuleInstance<P = unknown> {
  archetype: string;   // registry key: 'globe-motion-overlay' | …
  navIcon: string;     // inline SVG for the left rail
  meta: ModuleMeta;
  legend: LegendRow[];
  question: QuestionPanel;
  controls: ControlButton[];
  params: P;           // archetype-specific (typed per archetype)
}

export interface AccentColors { cy: Hex; am: Hex; red: Hex }

export interface LessonConfig {
  id: string;          // 'hs-01-physical-world'
  subject: string;     // 'geography' — copy-back path segment
  slug: string;        // '<slug>' -> lessons/<subject>/<slug>/console/
  title: string;       // window/topbar title
  brandSub: string;    // topbar subtitle ('Physical Systems Console · DK Geo L1')
  poSub: string;       // powered-off subtitle
  accent: AccentColors;
  boot: BootConfig;
  narration: NarrationClip[];
  modules: ModuleInstance[];
  // Optional camera anchor for lessons about ONE region (vs. a whole-Earth survey,
  // where any orientation is fine). When set: the engine faces it on boot completion
  // and re-faces it on every module activation, and idle auto-spin is suppressed
  // (boot/standby spin rates are untouched — only the ongoing drift that would carry
  // the region off-screen is disabled). Omitting it preserves today's behavior
  // exactly for lessons that don't need it.
  //
  // ⚠️ These are NOT geographic coordinates, which is why the field is not called
  // `home`. faceLon() only centers correctly near lon ≈ -90 and never compensates for
  // the camera's fixed y offset, so passing a region's true lat/lon aims the globe
  // somewhere else entirely. Calibrate empirically in the dev harness
  // (__terra.faceLon) until the region actually centers, and expect the value to look
  // wrong. TD-001 in docs/tech-debt.md tracks the underlying fix; when it lands,
  // every calibrated value here has to be migrated to real coordinates.
  cameraAim?: { lon: number; lat: number; z?: number };
}
