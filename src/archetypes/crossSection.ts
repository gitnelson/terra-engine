import type { ModuleContext } from './types';
import type { SfxApi } from '../engine/audio/sfx';

// Named 2D cross-section scene renderers (ported verbatim from console drawSection
// 615-662). Each scene is a draw(sx,w,h,secT,sfx) function keyed by type. Shared
// by module-0's linked deck AND the standalone animated-cross-section archetype;
// a new lesson adds a NEW named renderer here + data, not a new archetype.
export interface SectionRenderer {
  title: string;
  // Set when draw() ignores secT and paints an identical image every tick. The deck
  // then paints such a scene once per setScene instead of 30x/second — the console
  // shares a machine with Zoom's encoder, so an idle repaint loop is not free.
  static?: true;
  draw(sx: CanvasRenderingContext2D, w: number, h: number, secT: number, sfx: SfxApi): void;
}

const LABEL_FONT = '600 13px Rajdhani';

function arrow(sx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, col: string): void {
  sx.strokeStyle = col; sx.fillStyle = col; sx.lineWidth = 2;
  sx.beginPath(); sx.moveTo(x, y); sx.lineTo(x + dx, y + dy); sx.stroke();
  const a = Math.atan2(dy, dx);
  sx.beginPath(); sx.moveTo(x + dx, y + dy);
  sx.lineTo(x + dx - 8 * Math.cos(a - 0.4), y + dy - 8 * Math.sin(a - 0.4));
  sx.lineTo(x + dx - 8 * Math.cos(a + 0.4), y + dy - 8 * Math.sin(a + 0.4));
  sx.closePath(); sx.fill();
}
function label(sx: CanvasRenderingContext2D, x: number, y: number, t: string, c: string): void {
  sx.fillStyle = c; sx.font = LABEL_FONT; sx.fillText(t, x, y);
}
function fillUnder(sx: CanvasRenderingContext2D, pts: [number, number][], base: number, fill: string | CanvasGradient): void {
  sx.beginPath(); sx.moveTo(pts[0][0], base);
  pts.forEach((p) => sx.lineTo(p[0], p[1]));
  sx.lineTo(pts[pts.length - 1][0], base); sx.closePath();
  sx.fillStyle = fill; sx.fill();
}

// ---- advanced-03-united-states elevation profile (drawn by the usa* renderers) ----
// [label, elevation_m] west->east at ~39N (Whitney 4,421 / Elbert 4,399 — the two
// "walls" round to the same height; Great Plains slopes 1,500 -> 500 west->east).
const USA_PROFILE: [string, number][] = [
  ['PACIFIC OCEAN', 0], ['COAST RANGES', 1000], ['CENTRAL VALLEY', 50],
  ['SIERRA NEVADA', 4400], ['GREAT BASIN', 1500], ['ROCKY MOUNTAINS', 4400],
  ['GREAT PLAINS', 1500], ['GREAT PLAINS', 500], ['MISSISSIPPI RIVER', 120],
  ['INTERIOR LOWLANDS', 200], ['APPALACHIANS', 2037], ['COASTAL PLAIN', 50],
  ['ATLANTIC OCEAN', 0],
];
const USA_MAXELEV = 4400;
// How far each legend scene reveals (indices into USA_PROFILE, west->east).
const UPTO_SIERRA = 3, UPTO_ROCKIES = 5, UPTO_LOWLANDS = 9, UPTO_ATLANTIC = USA_PROFILE.length - 1;
// index range of the "flat middle" (GREAT PLAINS x2, MISSISSIPPI RIVER, INTERIOR
// LOWLANDS) — the farmland tint applies over exactly this span.
const USA_PLAINS_START = 6, USA_PLAINS_END = 9;

// Draws USA_PROFILE up through index `uptoIdx` only — the band-by-band reveal. The
// unrevealed tail is left blank (dashed baseline hint), never labeled or shaped, so
// nothing downstream of the current band leaks before the teacher advances the legend.
function drawUsaProfile(sx: CanvasRenderingContext2D, w: number, h: number, uptoIdx: number): void {
  const base = h * 0.86, top = h * 0.14;
  const n = USA_PROFILE.length;
  const revealN = Math.max(0, Math.min(uptoIdx, n - 1));
  // only the revealed bands are ever turned into geometry
  const pts: [number, number][] = [];
  for (let i = 0; i <= revealN; i++) {
    pts.push([(i / (n - 1)) * w, base - (USA_PROFILE[i][1] / USA_MAXELEV) * (base - top)]);
  }

  const grd = sx.createLinearGradient(0, top, 0, base);
  grd.addColorStop(0, 'rgba(255,180,84,.16)'); grd.addColorStop(1, 'rgba(89,197,140,.14)');
  fillUnder(sx, pts, base, grd);

  // The flat middle gets a distinct cultivated-green tint over the generic terrain
  // gradient — the visual half of the "farmland, not empty" repair (the verbal half
  // is the narration). Color only, no label; the slice stops at the revealed band.
  if (revealN >= USA_PLAINS_START) {
    fillUnder(sx, pts.slice(USA_PLAINS_START, USA_PLAINS_END + 1), base, 'rgba(96,189,116,.4)');
  }

  sx.strokeStyle = '#8fefe4'; sx.lineWidth = 2; sx.beginPath();
  pts.forEach((p, i) => i ? sx.lineTo(p[0], p[1]) : sx.moveTo(p[0], p[1]));
  sx.stroke();

  sx.strokeStyle = 'rgba(89,169,255,.4)'; sx.lineWidth = 1;
  sx.beginPath(); sx.moveTo(0, base); sx.lineTo(w, base); sx.stroke();

  // Measure and lay the labels out rather than clamping to a guessed right margin.
  // At the deck's fixed 1080x230 bitmap a `w - 140` clamp collapsed the last two
  // names onto the same x (COASTAL PLAIN overprinting ATLANTIC OCEAN, 2px apart, in
  // the final frame of the module) and ran MISSISSIPPI RIVER through INTERIOR
  // LOWLANDS. Centre on the point, keep inside the canvas, lift on collision.
  sx.font = LABEL_FONT;
  const placed: { x: number; y: number; w: number }[] = [];
  let lastLabel = '';
  pts.forEach(([x, y], i) => {
    const [name, elev] = USA_PROFILE[i];
    if (name === lastLabel) return;
    lastLabel = name;
    const tw = sx.measureText(name).width;
    const lx = Math.min(Math.max(x - tw / 2, 4), Math.max(w - tw - 4, 4));
    const hits = (ly: number): boolean =>
      placed.some((p) => lx < p.x + p.w + 6 && p.x < lx + tw + 6 && Math.abs(p.y - ly) < 14);
    let ly = Math.max(y - 10, 16);
    for (let lift = 0; lift < 3 && hits(ly); lift++) ly -= 14;
    placed.push({ x: lx, y: ly, w: tw });
    label(sx, lx, Math.max(ly, 12), name, elev >= 3000 ? '#ffb454' : '#8fefe4');
  });

  if (revealN < n - 1) {
    sx.strokeStyle = 'rgba(255,255,255,.22)'; sx.lineWidth = 1; sx.setLineDash([4, 4]);
    sx.beginPath(); sx.moveTo(pts[revealN][0], base); sx.lineTo(w, base); sx.stroke(); sx.setLineDash([]);
  }
}

export const SECTION_RENDERERS: Record<string, SectionRenderer> = {
  spread: {
    title: 'Spreading Boundary — new crust',
    draw(sx, w, h, secT) {
      const midY = h * 0.52, cx = w / 2;
      sx.fillStyle = 'rgba(79,227,208,.14)'; sx.fillRect(0, midY, cx - 30, h - midY); sx.fillRect(cx + 30, midY, cx - 30, h - midY);
      sx.strokeStyle = '#4fe3d0'; sx.lineWidth = 2; sx.strokeRect(0, midY, cx - 30, h - midY); sx.strokeRect(cx + 30, midY, cx - 30, h - midY);
      const grd = sx.createLinearGradient(0, h, 0, midY - 20); grd.addColorStop(0, '#ff7a3c'); grd.addColorStop(1, 'rgba(255,180,84,.1)');
      sx.fillStyle = grd; sx.beginPath(); sx.moveTo(cx - 30, h); sx.lineTo(cx, midY - 18 - 6 * Math.sin(secT * 0.1)); sx.lineTo(cx + 30, h); sx.closePath(); sx.fill();
      arrow(sx, cx - 70, midY - 30, -40, 0, '#4fe3d0'); arrow(sx, cx + 70, midY - 30, 40, 0, '#4fe3d0');
      label(sx, cx - 150, midY - 42, '← PLATE MOVES AWAY', '#8fefe4'); label(sx, cx + 40, midY - 42, 'PLATE MOVES AWAY →', '#8fefe4');
      label(sx, cx - 58, h - 14, 'NEW CRUST · RIDGE', '#ffb454');
    },
  },
  sub: {
    title: 'Subduction — volcano + mountain',
    draw(sx, w, h, secT) {
      const midY = h * 0.52, cx = w / 2;
      sx.fillStyle = 'rgba(89,169,255,.12)'; sx.beginPath(); sx.moveTo(0, midY); sx.lineTo(cx - 10, midY); sx.lineTo(cx + 120, h); sx.lineTo(0, h); sx.closePath(); sx.fill();
      sx.strokeStyle = '#59a9ff'; sx.lineWidth = 2; sx.stroke();
      sx.fillStyle = 'rgba(255,180,84,.10)'; sx.beginPath(); sx.moveTo(cx + 10, midY); sx.lineTo(w, midY); sx.lineTo(w, h); sx.lineTo(cx + 130, h); sx.closePath(); sx.fill();
      sx.strokeStyle = '#ffb454'; sx.stroke();
      sx.fillStyle = '#0a1a20'; sx.beginPath(); sx.arc(cx, midY, 10, 0, 7); sx.fill();
      sx.fillStyle = '#3a2a20'; sx.beginPath(); sx.moveTo(cx + 160, midY); sx.lineTo(cx + 185, midY - 46); sx.lineTo(cx + 210, midY); sx.closePath(); sx.fill();
      if ((secT % 60) < 30) { sx.fillStyle = '#ff7a3c'; sx.beginPath(); sx.moveTo(cx + 180, midY - 40); sx.lineTo(cx + 185, midY - 58); sx.lineTo(cx + 190, midY - 40); sx.closePath(); sx.fill(); }
      arrow(sx, cx - 120, midY - 22, 60, 26, '#59a9ff');
      label(sx, cx - 210, midY - 30, 'OCEANIC PLATE DIVES', '#8fc4ff'); label(sx, cx + 150, midY - 56, 'VOLCANO (Japan)', '#ffb454');
      label(sx, cx - 6, h - 14, 'TRENCH', '#8fc4ff'); label(sx, cx + 220, midY - 20, 'MOUNTAINS (Andes)', '#ff9e5b');
    },
  },
  trans: {
    title: 'Transform — earthquake',
    draw(sx, w, h, secT, sfx) {
      const midY = h * 0.52, cx = w / 2;
      sx.fillStyle = 'rgba(255,91,110,.10)'; sx.fillRect(0, midY, w, (h - midY) / 2); sx.fillStyle = 'rgba(255,91,110,.05)'; sx.fillRect(0, midY + (h - midY) / 2, w, (h - midY) / 2);
      sx.strokeStyle = '#ff5b6e'; sx.lineWidth = 2; sx.beginPath(); sx.moveTo(0, midY + (h - midY) / 2); sx.lineTo(w, midY + (h - midY) / 2); sx.stroke();
      if ((secT % 50) < 8) {
        sx.strokeStyle = '#fff'; sx.lineWidth = 2; sx.beginPath();
        for (let x = cx - 60; x < cx + 60; x += 12) { sx.lineTo(x, midY + (h - midY) / 2 + (Math.random() * 16 - 8)); }
        sx.stroke(); sfx.ping(1400, 'square', 0.12, 0.08);
      }
      arrow(sx, cx - 90, midY + 24, 60, 0, '#ff5b6e'); arrow(sx, cx + 90, midY + (h - midY) - 24, -60, 0, '#ff5b6e');
      label(sx, cx - 120, midY + 14, '← GRINDING PAST', '#ff8f9c'); label(sx, cx + 30, midY + (h - midY) - 8, 'GRINDING PAST →', '#ff8f9c');
      label(sx, cx - 40, midY - 14, 'SUDDEN SLIP = QUAKE', '#ff5b6e');
    },
  },

  // ---- landforms lesson renderers (new named scenes; NO new archetype) ----
  // "Section across the US" (DK p.20): west->east transcontinental profile.
  us: {
    title: 'Section across the US — young west, old east',
    draw(sx, w, h) {
      const base = h * 0.82, sea = h * 0.6;
      // terrain profile: SF coast -> Rockies -> Great Plains -> Great Lakes -> Appalachians -> DC
      const pts: [number, number][] = [
        [0, sea], [w * 0.08, sea], [w * 0.14, sea - 8],
        [w * 0.2, base - (base - sea) * 1.55], [w * 0.24, base - (base - sea) * 1.9], [w * 0.28, base - (base - sea) * 1.5],
        [w * 0.34, sea - 18], [w * 0.5, sea - 14], [w * 0.6, sea - 6], // Great Plains (flat)
        [w * 0.66, sea - 24], [w * 0.7, sea + 6], [w * 0.74, sea - 20], // Great Lakes basins
        [w * 0.82, base - (base - sea) * 0.7], [w * 0.86, base - (base - sea) * 0.85], [w * 0.9, base - (base - sea) * 0.6], // old Appalachians (low, rounded)
        [w * 0.96, sea], [w, sea],
      ];
      const grd = sx.createLinearGradient(0, sea - 90, 0, base); grd.addColorStop(0, 'rgba(255,180,84,.18)'); grd.addColorStop(1, 'rgba(89,169,255,.05)');
      sx.fillStyle = grd; sx.beginPath(); sx.moveTo(0, base);
      pts.forEach((p) => sx.lineTo(p[0], p[1])); sx.lineTo(w, base); sx.closePath(); sx.fill();
      sx.strokeStyle = '#8fefe4'; sx.lineWidth = 2; sx.beginPath(); pts.forEach((p, i) => i ? sx.lineTo(p[0], p[1]) : sx.moveTo(p[0], p[1])); sx.stroke();
      // ocean lines
      sx.strokeStyle = 'rgba(89,169,255,.5)'; sx.lineWidth = 1;
      sx.beginPath(); sx.moveTo(0, sea); sx.lineTo(w * 0.08, sea); sx.moveTo(w * 0.96, sea); sx.lineTo(w, sea); sx.stroke();
      label(sx, 4, sea - 6, 'SAN FRANCISCO', '#8fc4ff');
      label(sx, w * 0.2, base - (base - sea) * 2.0, 'ROCKIES · young, jagged', '#ffb454');
      label(sx, w * 0.4, sea - 24, 'GREAT PLAINS', '#8fefe4');
      label(sx, w * 0.64, sea + 22, 'GREAT LAKES', '#8fc4ff');
      label(sx, w * 0.8, base - (base - sea) * 0.95, 'APPALACHIANS · old, worn', '#ff9e5b');
      label(sx, w * 0.9, sea - 6, 'WASHINGTON DC', '#8fc4ff');
    },
  },
  // Glacial valley V -> U (DK p.79): before/after the Ice Age.
  glacial: {
    title: 'Glacial valley — V carved into U',
    draw(sx, w, h, secT) {
      const base = h * 0.86, top = h * 0.16, midX = w / 2;
      sx.strokeStyle = 'rgba(120,220,220,.2)'; sx.lineWidth = 1; sx.beginPath(); sx.moveTo(midX, top - 6); sx.lineTo(midX, base); sx.stroke();
      // LEFT: V-shaped river valley (before)
      sx.fillStyle = 'rgba(79,227,208,.10)'; sx.strokeStyle = '#4fe3d0'; sx.lineWidth = 2;
      sx.beginPath(); sx.moveTo(20, top); sx.lineTo(midX * 0.62, base); sx.lineTo(midX * 0.62 + 30, base); sx.lineTo(midX - 20, top); sx.stroke();
      // little river at V bottom
      sx.fillStyle = '#59a9ff'; sx.beginPath(); sx.arc(midX * 0.62 + 15, base - 4, 4, 0, 7); sx.fill();
      label(sx, 24, top + 14, 'BEFORE — V-shaped river valley', '#8fefe4');
      label(sx, midX * 0.5, base - 12, 'river', '#8fc4ff');
      // RIGHT: U-shaped glaciated valley (after) + hanging valley + moraine lake
      const ux0 = midX + 30, ux1 = w - 24;
      sx.strokeStyle = '#bfe9ff'; sx.lineWidth = 2; sx.beginPath();
      sx.moveTo(ux0, top); sx.lineTo(ux0 + 24, base - 30);
      sx.quadraticCurveTo((ux0 + ux1) / 2, base + 4, ux1 - 24, base - 30); sx.lineTo(ux1, top); sx.stroke();
      // moraine-dammed lake on flat floor
      sx.fillStyle = 'rgba(89,169,255,.4)'; sx.fillRect(ux0 + 30, base - 26, (ux1 - ux0) - 60, 12);
      // hanging valley + waterfall on side
      sx.strokeStyle = '#8fefe4'; sx.lineWidth = 1.4; sx.beginPath(); sx.moveTo(ux1 - 6, top + 30); sx.lineTo(ux1 - 30, top + 40); sx.stroke();
      if ((secT % 40) < 24) { sx.strokeStyle = '#bfe9ff'; sx.beginPath(); sx.moveTo(ux1 - 30, top + 40); sx.lineTo(ux1 - 34, base - 34); sx.stroke(); }
      label(sx, ux0, top + 14, 'AFTER — U-shaped glaciated valley', '#bfe9ff');
      label(sx, ux0 + 34, base - 30, 'moraine-dammed lake', '#8fc4ff');
      label(sx, ux1 - 96, top + 30, 'hanging valley', '#8fefe4');
    },
  },
  // Rift valley formation (DK p.204): blocks slip down between faults.
  rift: {
    title: 'Rift valley — blocks drop between faults',
    draw(sx, w, h, secT) {
      const top = h * 0.3, base = h * 0.9, drop = (base - top) * 0.5;
      const a = w * 0.34, b = w * 0.66; // fault positions
      const crust = (x0: number, x1: number, y: number, col: string): void => {
        sx.fillStyle = col; sx.beginPath(); sx.moveTo(x0, y); sx.lineTo(x1, y); sx.lineTo(x1, base); sx.lineTo(x0, base); sx.closePath(); sx.fill();
        sx.strokeStyle = 'rgba(255,180,84,.35)'; sx.lineWidth = 1; sx.strokeRect(x0, y, x1 - x0, base - y);
      };
      // shoulders (block mountains, up) + dropped central block
      crust(0, a, top, 'rgba(255,158,91,.16)');
      crust(a, b, top + drop, 'rgba(89,169,255,.10)');
      crust(b, w, top, 'rgba(255,158,91,.16)');
      // faults
      sx.strokeStyle = '#ffb454'; sx.lineWidth = 2;
      sx.beginPath(); sx.moveTo(a, top); sx.lineTo(a, base); sx.moveTo(b, top + drop); sx.lineTo(b, base); sx.stroke();
      // lake on sunken floor
      sx.fillStyle = 'rgba(89,169,255,.5)'; sx.fillRect(a + 12, top + drop + 4, (b - a) - 24, 12);
      // volcano on the floor
      sx.fillStyle = '#3a2a20'; sx.beginPath(); sx.moveTo((a + b) / 2 - 22, base); sx.lineTo((a + b) / 2, top + drop + 18); sx.lineTo((a + b) / 2 + 22, base); sx.closePath(); sx.fill();
      if ((secT % 60) < 30) { sx.fillStyle = '#ff7a3c'; sx.beginPath(); sx.moveTo((a + b) / 2 - 5, top + drop + 22); sx.lineTo((a + b) / 2, top + drop + 6); sx.lineTo((a + b) / 2 + 5, top + drop + 22); sx.closePath(); sx.fill(); }
      arrow(sx, a - 34, top + 20, 22, 0, '#ffb454'); arrow(sx, b + 34, top + 20, -22, 0, '#ffb454');
      label(sx, 12, top - 8, 'BLOCK MOUNTAINS (shoulders lift)', '#ff9e5b');
      label(sx, a + 14, top + drop - 8, 'RIFT FLOOR drops · lake + volcano', '#8fc4ff');
      label(sx, b + 6, base - 8, 'fault', '#ffb454');
    },
  },

  // ---- advanced-03-united-states lesson renderers (new named scenes; NO new
  // archetype) — one west->east elevation profile (~39N, metres) from the teacher-key
  // Terra spec, revealed band by band via the legend. The Great Plains segment is the
  // point of the module: it draws as farmland, not the "empty middle" misconception.
  usaWest: {
    title: 'The Shape of America — Pacific to the Sierra',
    static: true,
    draw(sx, w, h) { drawUsaProfile(sx, w, h, UPTO_SIERRA); },
  },
  usaBasin: {
    title: 'The Shape of America — the Great Basin & Rockies',
    static: true,
    draw(sx, w, h) { drawUsaProfile(sx, w, h, UPTO_ROCKIES); },
  },
  usaPlains: {
    title: 'The Shape of America — the Great Plains',
    static: true,
    draw(sx, w, h) { drawUsaProfile(sx, w, h, UPTO_LOWLANDS); },
  },
  usaEast: {
    title: 'The Shape of America — to the Atlantic',
    static: true,
    draw(sx, w, h) { drawUsaProfile(sx, w, h, UPTO_ATLANTIC); },
  },
};

// A cross-section deck: owns the #deck canvas draw loop, gated on the owning module
// being active (start/stop from onEnter/onExit). Used by module-0's linked deck and
// the standalone animated-cross-section archetype.
export class CrossSectionDeck {
  secType: string;
  private secT = 0;
  private dirty = true;
  private timer: number | undefined;
  private sfx: SfxApi;
  constructor(private ctx: ModuleContext, defaultScene: string) {
    this.secType = defaultScene;
    this.sfx = ctx.sfx;
  }
  setScene(t: string): void {
    this.secType = t;
    this.dirty = true;
    const r = SECTION_RENDERERS[t];
    this.ctx.panels.deck.ttl.textContent = r ? r.title : t;
    this.ctx.panels.deck.sub.textContent = t.toUpperCase();
  }
  private draw(): void {
    // A static scene paints identically every tick, so paint it once per scene change
    // and let the interval idle. Animated scenes are unaffected.
    if (SECTION_RENDERERS[this.secType]?.static && !this.dirty) return;
    this.dirty = false;
    const canvas = this.ctx.panels.deck.canvas;
    const sx = canvas.getContext('2d');
    if (!sx) return;
    this.secT += 1;
    const w = canvas.width, h = canvas.height;
    sx.clearRect(0, 0, w, h);
    sx.fillStyle = 'rgba(5,12,18,.4)'; sx.fillRect(0, 0, w, h);
    sx.save();
    const r = SECTION_RENDERERS[this.secType];
    if (r) r.draw(sx, w, h, this.secT, this.sfx);
    sx.restore();
  }
  start(): void {
    this.stop();
    this.dirty = true;
    this.timer = window.setInterval(() => this.draw(), 33);
  }
  stop(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = undefined; }
  }
}
