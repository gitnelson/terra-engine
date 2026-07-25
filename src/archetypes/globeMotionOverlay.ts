import * as THREE from 'three';
import type { Archetype, ModuleContext, ArchetypeHandle } from './types';
import type { ModuleInstance, LonLat, Hex } from '../config/schema';
import { CrossSectionDeck } from './crossSection';
import { renderContext, renderAssist, renderControls } from './panels';

// Globe overlays with plate/climate motion. Covers hs-01 module 0 (Restless Earth)
// AND module 1 (Climate Engine) via params only — the abstraction's acid test.
// The actions (seismic/circulate/insol) are IMPERATIVE registered handlers keyed by
// data-act, not pure data (honest scope: config selects+parameterizes them).
export interface MarkerLayer { key: string; pts: LonLat[]; color: Hex; size?: number; pulse?: boolean }
export interface GlobeMotionParams {
  boundaries?: { pts: LonLat[]; type: string }[];
  markerLayers?: MarkerLayer[];
  bands?: number[];                              // e.g. [30,-30]
  equatorHadley?: boolean;                       // build equator highlight + hadley arcs
  seismic?: LonLat[];                            // 'seismic' action scans these
  crossSection?: { scenes: string[]; default: string };
  // Explicit section->marker-layer map: when the cross-section switches to section
  // key K, marker layer sectionMarkers[K] is shown and the others hidden. Replaces
  // fragile substring key-matching (keeps the config-only contract honest).
  sectionMarkers?: Record<string, string>;
  insolation?: boolean;
  glow?: Hex;
  circulateNarration?: string;                   // narration key for 'circulate'
  circulateFallback?: string;
  // Ordered eras fired by the 'migrate' action — each era pulses its own points in
  // sequence, staggered era-to-era (advanced-03-united-states: the five Moving West
  // waves). Same pulse+ping+timer mechanic as 'seismic' — no new per-frame system.
  migrationWaves?: MigrationWave[];
}

export interface MigrationWave {
  label: string;
  pts: LonLat[];
  // Pulse color for this era. Without it every wave pulses the engine default, so a
  // lesson legend that gives each era its own swatch shows students colors that
  // appear nowhere on the globe.
  color?: Hex;
}

interface Handle extends ArchetypeHandle {
  boundaries: THREE.Line[];
  markerGroups: Record<string, THREE.Group>;
  hadleyKey: string | null;
  hadleyGroup: THREE.Group | null;
  deck: CrossSectionDeck | null;
  hadleyActive: boolean;
  hadleyPhase: number;
  active: boolean;         // gates the per-frame loop to the active module only
  timers: number[];        // seismic setTimeout ids, cleared on exit
  migrateTimers: number[]; // migrate ids, kept apart so a re-press can cancel its own run
  insolIv: number | null;  // runInsolation interval id, cleared on exit
  frameUnsub: (() => void) | null;
}

export const globeMotionOverlay: Archetype<GlobeMotionParams> = {
  key: 'globe-motion-overlay',

  buildVisuals(ctx: ModuleContext, params: GlobeMotionParams): Handle {
    const { globe, ll, layers } = ctx;
    const layerKeys: string[] = [];
    const handle: Handle = {
      layerKeys, boundaries: [], markerGroups: {}, hadleyKey: null, hadleyGroup: null,
      deck: null, hadleyActive: false, hadleyPhase: 0,
      active: false, timers: [], migrateTimers: [], insolIv: null, frameUnsub: null,
    };

    // boundary lines
    if (params.boundaries) {
      const boundColor = (t: string): number => t === 'spread' ? 0x4fe3d0 : t === 'sub' ? 0xffb454 : 0xff5b6e;
      params.boundaries.forEach((b) => {
        const p = b.pts.map((c) => ll(c[0], c[1], 1.012));
        const g = new THREE.BufferGeometry().setFromPoints(p);
        const m = new THREE.LineBasicMaterial({ color: boundColor(b.type), transparent: true, opacity: 0.28 });
        const line = new THREE.Line(g, m);
        line.userData = { type: b.type, base: 0.28 };
        globe.add(line); handle.boundaries.push(line);
      });
      layers.register('boundaries', handle.boundaries);
      layerKeys.push('boundaries');
    }

    // marker layers
    (params.markerLayers || []).forEach((ml) => {
      const grp = new THREE.Group();
      const size = ml.size ?? 0.02;
      ml.pts.forEach((v) => {
        const mk = new THREE.Mesh(
          new THREE.SphereGeometry(size, 12, 12),
          new THREE.MeshBasicMaterial({ color: ml.color, transparent: true, opacity: 0.95 }),
        );
        mk.position.copy(ll(v[0], v[1], 1.02));
        mk.userData = { pulse: !!ml.pulse };
        grp.add(mk);
      });
      globe.add(grp);
      const key = 'mk:' + ml.key;
      handle.markerGroups[key] = grp;
      layers.register(key, grp);
      layerKeys.push(key);
    });

    // 30° bands
    if (params.bands) {
      const grp = new THREE.Group();
      params.bands.forEach((lat) => {
        const p: THREE.Vector3[] = [];
        for (let lon = -180; lon <= 180; lon += 4) p.push(ll(lon, lat, 1.014));
        grp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), new THREE.LineBasicMaterial({ color: 0xff9e5b, transparent: true, opacity: 0.8 })));
      });
      globe.add(grp);
      layers.register('bands', grp);
      layerKeys.push('bands');
    }

    // equator highlight + hadley arcs (hidden until 'circulate')
    if (params.equatorHadley) {
      const grp = new THREE.Group();
      { const p: THREE.Vector3[] = []; for (let lon = -180; lon <= 180; lon += 4) p.push(ll(lon, 0, 1.014));
        grp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), new THREE.LineBasicMaterial({ color: 0x4fe3d0, transparent: true, opacity: 0.7 }))); }
      const arc = (lon: number, dir: 1 | -1): THREE.Line => {
        const p: THREE.Vector3[] = [];
        for (let lat = 0; dir > 0 ? lat <= 30 : lat >= -30; lat += dir * 2) {
          const rr = 1.02 + 0.12 * Math.sin((Math.abs(lat) / 30) * Math.PI);
          p.push(ll(lon, lat, rr));
        }
        return new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), new THREE.LineBasicMaterial({ color: 0x59e0d4, transparent: true, opacity: 0.6 }));
      };
      [-150, -90, -30, 30, 90, 150].forEach((lon) => { grp.add(arc(lon, 1)); grp.add(arc(lon, -1)); });
      globe.add(grp);
      handle.hadleyKey = 'hadley';
      handle.hadleyGroup = grp;
      layers.register('hadley', grp);
      // NOT in layerKeys — shown only on 'circulate'
    }

    // linked cross-section deck
    if (params.crossSection) {
      handle.deck = new CrossSectionDeck(ctx, params.crossSection.default);
    }

    // per-frame: marker pulse + boundary shimmer + hadley wave (the animate() rewrite).
    // Gated on handle.active so only the on-screen module does per-frame work.
    handle.frameUnsub = ctx.onFrame((tt) => {
      if (!handle.active) return;
      Object.values(handle.markerGroups).forEach((grp) => {
        grp.children.forEach((mk, i) => {
          if (!(mk as THREE.Mesh).userData.pulse) return;
          const s = 1 + 0.35 * Math.sin(tt * 3 + i);
          mk.scale.setScalar(s);
          ((mk as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.6 + 0.35 * (0.5 + 0.5 * Math.sin(tt * 3 + i));
        });
      });
      handle.boundaries.forEach((l) => {
        const mat = l.material as THREE.LineBasicMaterial;
        const base = l.userData.base as number;
        if (mat.opacity < base) mat.opacity += (base - mat.opacity) * 0.1;
      });
      if (handle.hadleyActive && handle.hadleyGroup) {
        handle.hadleyPhase += 0.02;
        handle.hadleyGroup.children.forEach((a, i) => {
          ((a as THREE.Line).material as THREE.LineBasicMaterial).opacity = 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(handle.hadleyPhase * 2 - i * 0.4));
        });
      }
    });

    return handle;
  },

  buildPanel(ctx, module: ModuleInstance<GlobeMotionParams>, handle: Handle): void {
    const linked = handle.deck;
    renderContext(ctx, module, linked ? {
      activeLegendKey: linked.secType,
      onLegendClick: (key) => { setSection(ctx, handle, module.params, key); },
    } : {});
    renderAssist(ctx, module);
  },

  buildControls(ctx, module: ModuleInstance<GlobeMotionParams>, handle: Handle): void {
    renderControls(ctx, module, (act) => { this.onAction(ctx, act, handle, module.params); });
  },

  onEnter(ctx, handle: Handle, params: GlobeMotionParams): void {
    handle.active = true;
    ctx.setGlow(params.glow ?? 0x39d6cf);
    handle.hadleyActive = false;
    if (handle.hadleyKey) ctx.layers.setVisible(handle.hadleyKey, false);
    if (handle.deck) {
      ctx.panels.deck.root.classList.add('show');
      setSection(ctx, handle, params, params.crossSection!.default);
      handle.deck.start();
    } else {
      ctx.panels.deck.root.classList.remove('show');
    }
  },

  onExit(ctx, handle: Handle): void {
    handle.active = false;
    handle.timers.forEach((id) => clearTimeout(id));
    handle.timers = [];
    handle.migrateTimers.forEach((id) => clearTimeout(id));
    handle.migrateTimers = [];
    if (handle.insolIv !== null) { clearInterval(handle.insolIv); handle.insolIv = null; ctx.dir.position.set(-3, 1.5, 2.2); }
    if (handle.deck) { handle.deck.stop(); ctx.panels.deck.root.classList.remove('show'); }
    if (handle.hadleyKey) ctx.layers.setVisible(handle.hadleyKey, false);
    handle.hadleyActive = false;
  },

  onAction(ctx, act: string, handle: Handle, params: GlobeMotionParams): void {
    if (act === 'seismic' && params.seismic) {
      params.seismic.forEach((v, i) => handle.timers.push(window.setTimeout(() => {
        ctx.pulses.spawn(ctx.ll(v[0], v[1], 1)); ctx.sfx.ping(300 + i * 20, 'sine', 0.12, 0.18);
      }, i * 110)));
      handle.timers.push(window.setTimeout(() => ctx.sfx.rumble(), 200));
      ctx.flashStatus('◉ SEISMIC SCAN · RING OF FIRE');
    } else if (act === 'circulate') {
      handle.hadleyActive = true;
      if (handle.hadleyKey) ctx.layers.setVisible(handle.hadleyKey, true);
      ctx.sfx.whoosh();
      ctx.flashStatus('◍ HADLEY CIRCULATION ACTIVE');
      if (params.circulateNarration) ctx.voice.play(params.circulateNarration, params.circulateFallback);
    } else if (act === 'insol' && params.insolation) {
      runInsolation(ctx, handle);
    } else if (act === 'migrate' && params.migrationWaves) {
      // one era every 1.5s; inside an era, one point every 90ms. The whole run is
      // ~7s, and the first 1.5s are silent after the whoosh — which reads as "it
      // didn't work", so a second press is likely. Cancel our own pending timers
      // first: a re-press restarts cleanly instead of interleaving two runs' era
      // captions and doubling the pings over Zoom audio. Kept in a separate list
      // from handle.timers so restarting migrate never cancels a seismic scan.
      handle.migrateTimers.forEach(clearTimeout);
      handle.migrateTimers = [];
      const after = (ms: number, fn: () => void): void => { handle.migrateTimers.push(window.setTimeout(fn, ms)); };
      params.migrationWaves.forEach((wave, wi) => after(wi * 1500, () => {
        ctx.flashStatus(`◉ ${wave.label}`);
        wave.pts.forEach((v, i) => after(i * 90, () => {
          ctx.pulses.spawn(ctx.ll(v[0], v[1], 1), wave.color);
          ctx.sfx.ping(320 + i * 15, 'sine', 0.1, 0.15);
        }));
      }));
      ctx.sfx.whoosh();
    }
  },
};

// cross-section switch: set deck scene + highlight matching boundaries + toggle the
// section's marker layer (via explicit params.sectionMarkers) + sound.
function setSection(ctx: ModuleContext, handle: Handle, params: GlobeMotionParams, t: string): void {
  if (handle.deck) handle.deck.setScene(t);
  handle.boundaries.forEach((l) => {
    const base = l.userData.type === t ? 0.95 : 0.12;
    l.userData.base = base;
    (l.material as THREE.LineBasicMaterial).opacity = base;
  });
  const map = params.sectionMarkers;
  if (map) {
    for (const [section, mk] of Object.entries(map)) {
      ctx.layers.setVisible('mk:' + mk, t === section);
    }
  }
  if (t === 'sub') ctx.sfx.rumble();
  else if (t === 'trans') ctx.sfx.ping(200, 'sawtooth', 0.2, 0.4);
  else ctx.sfx.whoosh();
}

// swing the sun + narrate (ported from runInsolation 803-806). The interval id is
// stored on the handle so onExit can cancel it (no stale mutation of shared light).
function runInsolation(ctx: ModuleContext, handle: Handle): void {
  if (handle.insolIv !== null) return; // already swinging
  ctx.sfx.ping(520, 'sine', 0.12, 0.2);
  ctx.flashStatus('☀ INSOLATION · DIRECT AT EQUATOR');
  const dir = ctx.dir;
  const from = dir.position.clone();
  let t = 0;
  handle.insolIv = window.setInterval(() => {
    t += 0.05;
    dir.position.set(-3 * Math.cos(t), 1.5 * Math.sin(t * 0.6), 2.2);
    if (t > Math.PI) { if (handle.insolIv !== null) clearInterval(handle.insolIv); handle.insolIv = null; dir.position.copy(from); }
  }, 33);
  ctx.voice.play('insol', 'Same Sun. At the equator the rays hit straight on, concentrated. At the poles the same energy is smeared over a bigger area. That is the whole reason it is hot at the equator and cold at the poles.');
}
