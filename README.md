# Terra - Modular Teaching-Console Engine

Terra turns interactive, screen-shared teaching consoles (a Three.js globe + glass
HUD panels + audio + narration) into **config-driven lessons**. You author a new
console by writing a typed config + supplying data and reusing a small library of
**archetypes** - not by hand-coding a new app each time.

Each lesson builds to **one self-contained `index.html`** (Three.js, fonts, world
data, and any audio all inlined) that the teacher opens locally and screen-shares
over Zoom. No server, no network at runtime, offline-safe.

---

## Quick start

```bash
cd terra
npm install

# DEV — hot-reload while authoring. Open the printed localhost URL.
npm run dev
#   ?lesson=hs-01-physical-world        (default)
#   ?lesson=landforms-shaping-the-land
#   ?lesson=advanced-03-united-states

# BUILD — one self-contained console per lesson, copied next to each lesson folder
npm run build:all
#   (or a subset:  npm run build:all -- landforms-shaping-the-land)

npm run typecheck   # tsc --noEmit
```

**Built consoles land at** `../lessons/<subject>/<slug>/console/<copyBack>` — see
`lessons/lessons.json` for the per-lesson `subject` / `slug` / `copyBack` name.

### Teaching use (open a console)
Double-click the built `index.html` in Chrome (`file://` works — everything is
inlined). It starts **powered-off**; click **INITIALIZE TERRA** to boot. Left rail
switches modules. It's built to be screen-shared — see **Spoiler safety** below.

---

## Repository layout

```
terra/
  index.html               # the static chrome (topbar / rail / panels); config fills the slots
  vite.config.ts           # single-file build (base:'./', assets inlined)
  lessons/
    lessons.json           # build manifest: {id, subject, slug, copyBack}
    registry.ts            # declared id -> config index (no importers today — see TD-002)
    <lesson-id>/
      config.ts            # THE lesson: LessonConfig (exports named + default)
      data.ts              # lesson data (marker coords, series, etc.)
      audio/*.mp3          # baked narration (optional; TTS fallback otherwise)
  src/
    main.ts                # entry: selects lesson, calls startLesson()
    bootstrap.ts           # imports fonts+css, registers the archetype library, boots engine
    config/schema.ts       # LessonConfig + ModuleInstance + all field types
    engine/
      TerraEngine.ts       # assembles globe+services+chrome+boot; drives module activation
      scene/               # globe.ts, camera.ts (rAF loop + onFrame), pulses.ts, layers.ts, projection.ts
      audio/               # sfx.ts (synth), voice.ts (narration + TTS fallback)
      ui/                  # chrome.ts (frame + panel mounts), clock.ts
      boot.ts spoiler.ts debug.ts time.ts
    archetypes/
      types.ts             # ModuleContext + Archetype interface
      registry.ts          # key -> Archetype
      panels.ts            # shared legend/assist/controls rendering
      globeMotionOverlay.ts    # archetype: globe markers/boundaries/motion + linked deck
      animatedCrossSection.ts  # archetype: 2D cross-section deck
      scrubTimeline.ts         # archetype: scrub-a-curve + audit-a-claim + seal
      crossSection.ts          # SECTION_RENDERERS (named 2D scenes) + CrossSectionDeck
    data/world/            # land.ts (coastlines), antarctica.ts
    styles/console.css     # the console aesthetic (ported verbatim)
  scripts/build-all.ts     # build each lesson, copy artifact back
```

---

## Core concepts

- **LessonConfig** (`config/schema.ts`) — the typed contract you author. One config
  → one console. It lists `modules[]`; each module names an **archetype** by key and
  supplies its `params`, `legend`, `question`, `controls`, and `meta`.
- **`cameraAim`** (optional, on `LessonConfig`) — for a lesson about ONE region rather
  than a whole-Earth survey. The engine points the globe here on boot and on every nav
  click (including re-clicking the current module, which is the teacher's recenter
  gesture), and suppresses idle auto-spin so the region can't drift off-screen. **The
  values are not real coordinates** — calibrate them empirically in the dev harness and
  set `boot.autoSpin.idle: 0` in the lesson too. See TD-001.
- **Archetype** (`archetypes/types.ts`) — a reusable module *kind*. Given a shared
  `ModuleContext` (the globe scene + services), it builds visuals once, renders its
  panels, and handles enter/exit/actions. Three exist today (below).
- **ModuleContext** — what every archetype receives: `{THREE, scene, globe, camera,
  dir, ll, layers, setGlow, sfx, voice, pulses, seal, panels, onFrame, flashStatus}`.
  Archetypes attach to the shared `globe` group; they never build their own scene.
- **LayerRegistry** — every visual registers under a string key; the active module
  declares `layerKeys` and the engine shows exactly those (replaces per-module
  visibility switches).
- **Seal** (`spoiler.ts`) — the spoiler invariant made testable: answer content stays
  hidden until the teacher reveals, and **re-seals** when a module is re-entered.

---

## Author a NEW lesson (the common case — no code)

If your lesson is globe / cross-section / timeline-shaped, you only write config +
data. Steps:

1. **Extract the content** (if from a textbook): run the `textbook-extract` skill →
   a fact-checked bedrock markdown under `docs/textbooks/<subject>/extracted/`.
2. **Create** `terra/lessons/<id>/data.ts` — the coordinates/series/etc. from the
   bedrock.
3. **Create** `terra/lessons/<id>/config.ts` — a `LessonConfig` composing modules
   from the archetypes (copy `landforms-shaping-the-land/config.ts` as a template).
   Export it **named and default**: `export const xConfig … ; export default xConfig;`
4. **Register it** in three places (yes, three — see TD-002):
   - `terra/lessons/lessons.json` — add `{id, subject, slug, copyBack}` (build+copy).
   - `terra/src/main.ts` — add one line to the static ternaries (both the DEV and the
     build branch) so the lesson is selectable and tree-shakeable. **This** is what
     drives dev `?lesson=`, not `registry.ts`.
   - `terra/lessons/registry.ts` — add the import + map entry. Nothing reads this
     today; keep it accurate anyway, it is the declared index of buildable lessons.

   The browser-tab title needs no registration — `config.title` drives it at runtime.
5. **Narration** — either bake mp3s (see below) or ship TTS fallback: give each
   `narration` entry `src: ''` + a `fallbackText`.
6. **Build + verify**: `npm run build:all -- <id>`, open the built console, walk the
   modules (see **Verification**).

### The 3 archetypes (params reference)

**`globe-motion-overlay`** — globe markers/lines with motion + an optional linked
cross-section deck. Covers point features, boundary lines, latitude bands, and
imperative actions.
```ts
{
  boundaries?: {pts: LonLat[]; type: string}[];        // lines, highlighted per section
  markerLayers?: {key; pts: LonLat[]; color: Hex; size?; pulse?}[];
  bands?: number[];                                     // e.g. [30,-30]
  equatorHadley?: boolean;                              // equator + hadley arcs (shown on 'circulate')
  seismic?: LonLat[];                                   // 'seismic' action scans these
  crossSection?: {scenes: string[]; default: string};  // links a deck (SECTION_RENDERERS)
  sectionMarkers?: Record<string,string>;              // section key -> marker layer to show
  insolation?: boolean;                                // enables the 'insol' action
  migrationWaves?: {label; pts: LonLat[]; color?: Hex}[]; // 'migrate' action: eras pulsed in
                                                       //   sequence, 1.5s apart, each in its
                                                       //   own color (give the legend the
                                                       //   SAME colors or it lies)
  glow?: Hex; circulateNarration?: string; circulateFallback?: string;
}
```
Actions (wired via `controls[].act`): `seismic`, `circulate`, `insol`, `migrate`, `speak`.

**`animated-cross-section`** — a standalone 2D cross-section deck; the legend switches
named scenes.
```ts
{ scenes: string[]; default: string }   // scene keys must exist in SECTION_RENDERERS
```

**`scrub-timeline`** — scrub a curve across a range and audit a dated claim; sealed
until scrubbed/played. Population-specific panels are optional.
```ts
{
  range: [number,number]; start: number; primary: Pt[]; curveMax: number;
  bookLine: Pt[]; curveMarks: [x,y,label,color,'start'|'end'][];
  bookClaimTag: string; unit: string; midLabel?: string; yLabel?: string;
  bars?: {list: BarSeries[]; max};      // optional dual-bar comparison
  crossover?: {year; text};             // optional (text is an ANSWER — injected only on reveal)
  miniStats?: {k;v;sub}[];              // optional stat grid
  events: {from; text}[]; playEvents: {year;freq;type;p;d;status?}[]; glow?: Hex;
}
```
Action: `play`, plus the scrub input reveals.

---

## Augmenting the app

### Add a new 2D cross-section scene (still no new archetype)
Add a named renderer to `SECTION_RENDERERS` in `archetypes/crossSection.ts`:
```ts
myScene: {
  title: 'My Section — …',
  draw(sx, w, h, secT, sfx) { /* 2D canvas drawing; use the arrow()/label() helpers */ },
},
```
Then reference `'myScene'` in a lesson's `crossSection.scenes` (globe deck) or an
`animated-cross-section` module's `scenes`. **This is not a new archetype** — the
registry key set stays the same.

### Add a NEW archetype (when config can't express the module)
Needed only for a genuinely different interaction (e.g. a mind-map builder, a
drag-to-match). Steps:
1. Create `archetypes/<name>.ts` implementing the `Archetype` interface
   (`buildVisuals` once; `buildPanel`/`buildControls` per activate; `onEnter`/
   `onExit`/`onAction`). Attach visuals to `ctx.globe`, register `layerKeys`, and —
   critically — **clean up in `onExit`**: cancel any `setInterval`/`setTimeout`/rAF,
   stop audio, `reseal()`. Gate per-frame work on an `active` flag (see
   `globeMotionOverlay` for the pattern).
2. Register it in `src/bootstrap.ts` (`registerArchetype(...)`).
3. Use its key in a lesson `module.archetype`.

### Add a new action button
Add to a module's `controls[]` (`{act, label, icon?, style?}`) and handle the `act`
in the archetype's `onAction`. `speak` (NARRATE) is auto-appended whenever the module
has a `question.narrationKey`.

---

## Spoiler safety (non-negotiable — the screen is shared to students)

Answers must never render into on-screen DOM until the teacher reveals them. When
authoring:
- Keep `question.html`, `legend`, and `question.ins` **question-only** — no answers.
- Answers live in **narration** (fires only on the explicit NARRATE press) and in the
  sibling `teacher-key.md`.
- The `scrub-timeline` curve is **sealed** on entry (only history shown) and reveals
  on scrub/play; the `crossover` answer text is injected into the DOM **only on
  reveal** and cleared on re-entry. If you add answer-bearing fields to an archetype,
  gate them on `ctx.seal` the same way.

---

## Narration

- **Baked (preferred for delivery):** ElevenLabs mp3s in `lessons/<id>/audio/`,
  referenced by `narration[].src` (imported so Vite inlines them as data-URIs). Voice
  used to date: RZL (`pZpEXW0HrmifJKHIYzZb`, `eleven_multilingual_v2`). A
  `scripts/bake-narration.ts` is stubbed in `package.json` (`npm run bake`) but **not
  yet written** — the bake is currently manual, and the key must come from `process.env`.
- **TTS fallback (no bake):** set `narration[].src: ''` + a `fallbackText`. The
  browser speaks the fallback on NARRATE. Landforms ships this way.

---

## Build details

- One self-contained HTML per lesson via `vite-plugin-singlefile` (`assetsInlineLimit`
  forces everything inline). `base: './'` so `file://` works.
- **Per-lesson isolation:** `main.ts` selects the lesson with a build-time static
  ternary on `VITE_TERRA_LESSON`, and the dev-only `?lesson=` path is behind
  `import.meta.env.DEV`. In a production build Rollup tree-shakes the *other* lessons'
  configs and audio out — each console contains only its own lesson (no cross-lesson
  answer strings or mp3s). **Preserve this** when editing `main.ts`: keep the two
  branches static, don't reintroduce a runtime registry lookup in the shipped path.

---

## Verification (how to check a console works)

Playwright can't open `file://` → serve the built dir over http (`python3 -m
http.server`) and drive it. In **dev**, `window.__terra` is exposed (gated to DEV
builds, so it's absent from shipped consoles):
- `__terra.state()` — current module, camera, land subpath count.
- `__terra.freezeTime(t)` — pin the clock so time-based animations diff
  deterministically across screenshots.
- `__terra.faceLon(lon,lat,z)` / `snap()` — face known geography for a stable shot.
- `__terra.simBoot(k)` — freeze the boot animation at fraction `k`.
- `__terra.voice()` — which narration clip is playing / its error.

Sanity checklist for a new lesson: boots to SYSTEMS ONLINE; each module renders; the
scrub-timeline **seals on entry and re-seals on re-entry**; no answer strings in the
DOM while sealed; `browser_console_messages(error)` empty; the built file loads
offline (devtools → offline) with zero network requests.

Golden reference screenshots from development live in `../screenshots/`.

---

## Known gaps / tech debt

See **`docs/tech-debt.md`** in this repo — TD-001 (the `faceLon()` centering bug that makes
`cameraAim` a hand-calibrated value rather than real coordinates) and everything after it.

Older Terra entries from the 2026-07-18 review-team pass (GPU disposal, dead
code/scaffold leftovers, small duplication, the unwritten `bake-narration.ts`) still sit
in the private teaching repo's `docs/tech-debt.md` under a "Terra engine" heading, with
`terra/`-prefixed paths that no longer resolve from there — they want migrating here.
Nothing in either list blocks authoring or shipping a lesson.
```
