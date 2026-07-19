import type { Archetype, ModuleContext, ArchetypeHandle } from './types';
import type { ModuleInstance, Pt, Hex } from '../config/schema';
import type { Seal } from '../engine/spoiler';
import { renderContext, renderAssist, renderControls } from './panels';

// Scrub a curve across time and audit a dated textbook claim (ported from console
// MODULE 3 665-740 + the #pop overlay DOM 319-350). Owns a bespoke DOM template
// (config supplies the data, the archetype owns the markup — accepted asymmetry,
// plan Risk 3). SPOILER INVARIANT: the future/peak of the curve is SEALED on entry
// and only revealed when the teacher scrubs or plays; RE-SEALS on every re-entry.
export interface BarSeries { key: string; label: string; color: 'china' | 'india'; points: Pt[]; }
export interface ScrubTimelineParams {
  range: Pt;                 // [1800, 2100]
  start: number;             // 1999
  primary: Pt[];             // POP
  curveMax: number;          // 11 (y-scale)
  bookLine: Pt[];            // naive book projection (dashed)
  curveMarks: [number, number, string, string, 'start' | 'end'][];
  bookClaimTag: string;      // "▲ TEXTBOOK SAYS “IN EXCESS OF 6 BILLION” — AUDIT IT"
  unit: string;              // "BILLION"
  midLabel?: string;         // center label under the scrubber (default "NOW")
  yLabel?: string;           // optional right-column heading (default population bars)
  bars?: { list: BarSeries[]; max: number };  // optional dual-bar comparison
  crossover?: { year: number; text: string }; // optional crossover annotation
  miniStats?: { k: string; v: string; sub: string }[]; // optional stat grid
  events: { from: number; text: string }[];
  playEvents: { year: number; freq: number; type: OscillatorType; p: number; d: number; status?: string }[];
  glow?: Hex;
}

interface Handle extends ArchetypeHandle {
  seal: Seal;
  playing: boolean;
  playRAF: number | null;
  lastEventYear: number;
  built: boolean;
}

function interp(arr: Pt[], y: number): number {
  if (y <= arr[0][0]) return arr[0][1];
  if (y >= arr[arr.length - 1][0]) return arr[arr.length - 1][1];
  for (let i = 0; i < arr.length - 1; i++) {
    if (y >= arr[i][0] && y <= arr[i + 1][0]) {
      const f = (y - arr[i][0]) / (arr[i + 1][0] - arr[i][0]);
      return arr[i][1] + f * (arr[i + 1][1] - arr[i][1]);
    }
  }
  return arr[arr.length - 1][1];
}

function popTemplate(p: ScrubTimelineParams): string {
  const bars = p.bars ? p.bars.list.map((b) => `<div class="bar-row"><div class="lab">${b.label}<b id="bar_${b.key}Num">—</b></div><div class="track"><div class="fill ${b.color}" id="bar_${b.key}" style="width:50%"></div></div></div>`).join('') : '';
  const mini = p.miniStats ? p.miniStats.map((m) => `<div class="mstat"><div class="k">${m.k}</div><div class="v">${m.v}</div><div class="sub">${m.sub}</div></div>`).join('') : '';
  const miniBlock = mini ? `<div class="mini-stats">${mini}</div>` : '';
  const yHead = `<div class="tag mono up" style="color:var(--txt-faint);font-size:9px">${p.yLabel ?? 'MOST-POPULOUS NATION'}</div>`;
  const barsBlock = bars ? `${yHead}<div class="bars">${bars}</div>` : '';
  // crossover text is an ANSWER — leave the node empty until reveal (spoiler safety);
  // updatePop injects the text only when unsealed.
  const crossBlock = p.crossover ? `<div class="cross-tag" id="crossTag"></div>` : '';
  return `<div class="panel">
    <span class="brk tl"></span><span class="brk tr"></span><span class="brk bl"></span><span class="brk br"></span>
    <div class="p-body"><div class="pop-grid">
      <div>
        <span class="badbook">${p.bookClaimTag}</span>
        <div class="big-counter" style="margin-top:12px"><span id="popNum">${p.primary[0][1].toFixed(2)}</span><small> ${p.unit}</small></div>
        <div class="yr-line"><span class="yr mono" id="popYr">${p.start}</span><span class="ev" id="popEv"></span></div>
        <div class="time-wrap">
          <div class="time-head"><span>${p.range[0]}</span><span>${p.midLabel ?? 'NOW'}</span><span>${p.range[1]}</span></div>
          <input type="range" id="scrub" min="${p.range[0]}" max="${p.range[1]}" value="${p.start}" step="1" />
        </div>
        ${miniBlock}
      </div>
      <div>
        ${barsBlock}
        ${crossBlock}
        <svg class="curve" id="curve" viewBox="0 0 520 210" preserveAspectRatio="none"></svg>
      </div>
    </div></div>
  </div>`;
}

function buildCurve(ctx: ModuleContext, p: ScrubTimelineParams, sealed: boolean): void {
  const svg = document.getElementById('curve');
  if (!svg) return;
  const x0 = 8, x1 = 512, y0 = 14, y1 = 182;
  const [r0, r1] = p.range;
  const xs = (y: number): number => x0 + ((y - r0) / (r1 - r0)) * (x1 - x0);
  const ys = (v: number): number => y1 - (v / p.curveMax) * (y1 - y0);
  if (sealed) {
    let hist = '';
    p.primary.filter((pt) => pt[0] <= p.start).forEach((pt, i) => { hist += (i ? 'L' : 'M') + xs(pt[0]).toFixed(1) + ' ' + ys(pt[1]).toFixed(1) + ' '; });
    svg.innerHTML = `<line x1="8" y1="182" x2="512" y2="182" stroke="#1c3a3e"/>`
      + `<path d="${hist}" stroke="#4fe3d0" stroke-width="2.2" fill="none" opacity=".85"/>`
      + `<circle id="curDot" r="5" fill="#fff" opacity="0"/>`
      + `<text x="264" y="150" text-anchor="middle" fill="#3d5254" font-size="9" font-family="Space Mono">◂ scrub to reveal ▸</text>`;
    return;
  }
  let real = '', book = '';
  p.primary.forEach((pt, i) => { real += (i ? 'L' : 'M') + xs(pt[0]).toFixed(1) + ' ' + ys(pt[1]).toFixed(1) + ' '; });
  p.bookLine.forEach((pt, i) => { book += (i ? 'L' : 'M') + xs(pt[0]).toFixed(1) + ' ' + ys(pt[1]).toFixed(1) + ' '; });
  let dots = '', txt = '';
  p.curveMarks.forEach((m) => {
    const cx = xs(m[0]), cy = ys(m[1]);
    dots += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3.4" fill="${m[3]}"/>`;
    const tx = m[4] === 'end' ? cx - 7 : cx + 6;
    txt += `<text x="${tx.toFixed(1)}" y="${(cy - 7).toFixed(1)}" text-anchor="${m[4]}" fill="${m[3]}" font-size="9" font-family="Space Mono">${m[2]}</text>`;
  });
  svg.innerHTML = `
    <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fe3d0" stop-opacity=".35"/><stop offset="1" stop-color="#4fe3d0" stop-opacity="0"/></linearGradient></defs>
    <line x1="8" y1="182" x2="512" y2="182" stroke="#1c3a3e"/>
    <path d="${real} L512 182 L8 182 Z" fill="url(#cg)"/>
    <path d="${book}" stroke="#ff5b6e" stroke-width="1.3" fill="none" stroke-dasharray="4 4" opacity=".6"/>
    <path d="${real}" stroke="#4fe3d0" stroke-width="2.2" fill="none"/>
    ${dots}${txt}
    <circle id="curDot" r="5" fill="#fff" opacity="0"/>
    <text x="196" y="150" fill="#ff8f9c" font-size="8.5" font-family="Space Mono">book line: endless growth</text>`;
}

function updatePop(ctx: ModuleContext, p: ScrubTimelineParams, sealed: boolean, year: number, playing: boolean): void {
  const val = interp(p.primary, year);
  const setTxt = (id: string, t: string): void => { const e = document.getElementById(id); if (e) e.textContent = t; };
  setTxt('popNum', val.toFixed(2));
  setTxt('popYr', String(Math.round(year)));
  if (p.bars) {
    const barsMax = p.bars.max;
    const ratio = (v: number): number => Math.max(4, (v / barsMax) * 100);
    p.bars.list.forEach((b) => {
      const v = interp(b.points, year);
      const bar = document.getElementById('bar_' + b.key);
      if (bar) bar.style.width = ratio(v) + '%';
      setTxt('bar_' + b.key + 'Num', v.toFixed(2) + 'B');
    });
  }
  if (p.crossover) {
    const cross = document.getElementById('crossTag');
    if (cross) {
      if (sealed) { cross.textContent = ''; cross.classList.remove('on'); }
      else { cross.textContent = p.crossover.text; cross.classList.toggle('on', year >= p.crossover.year); }
    }
  }
  let ev = '—';
  for (const e of p.events) if (year >= e.from) ev = e.text;
  setTxt('popEv', ev);
  const x0 = 8, x1 = 512, y0 = 14, y1 = 182, [r0, r1] = p.range;
  const xs = (y: number): number => x0 + ((y - r0) / (r1 - r0)) * (x1 - x0);
  const ys = (v: number): number => y1 - (v / p.curveMax) * (y1 - y0);
  const dot = document.getElementById('curDot');
  if (dot) { dot.setAttribute('cx', xs(year).toFixed(1)); dot.setAttribute('cy', ys(val).toFixed(1)); dot.setAttribute('opacity', sealed ? '0' : '1'); }
  if (playing) ctx.sfx.toneSet(180 + (val / p.curveMax) * 560);
}

export const scrubTimeline: Archetype<ScrubTimelineParams> = {
  key: 'scrub-timeline',

  buildVisuals(_ctx: ModuleContext, _params: ScrubTimelineParams): Handle {
    return { layerKeys: [], seal: undefined as unknown as Seal, playing: false, playRAF: null, lastEventYear: 0, built: false };
  },

  buildPanel(ctx, module: ModuleInstance<ScrubTimelineParams>, _handle: Handle): void {
    renderContext(ctx, module, {});
    renderAssist(ctx, module);
  },

  buildControls(ctx, module: ModuleInstance<ScrubTimelineParams>, handle: Handle): void {
    renderControls(ctx, module, (act) => { this.onAction(ctx, act, handle, module.params); });
  },

  onEnter(ctx, handle: Handle, params: ScrubTimelineParams): void {
    ctx.setGlow(params.glow ?? 0x59a9ff);
    // build the #pop template once, then wire the scrub input
    ctx.panels.pop.innerHTML = popTemplate(params);
    ctx.panels.pop.classList.add('show');
    ctx.panels.deck.root.classList.remove('show');

    handle.seal = ctx.seal.create(true); // RE-SEAL on every entry (spoiler invariant)
    handle.playing = false;

    const scrub = document.getElementById('scrub') as HTMLInputElement | null;
    if (scrub) {
      scrub.value = String(params.start);
      scrub.addEventListener('input', () => {
        handle.playing = false; ctx.sfx.toneStop();
        if (handle.seal.sealed) { handle.seal.reveal(); buildCurve(ctx, params, false); }
        updatePop(ctx, params, handle.seal.sealed, +scrub.value, false);
        ctx.sfx.ping(660, 'sine', 0.1, 0.12);
      });
    }
    buildCurve(ctx, params, true);
    updatePop(ctx, params, true, params.start, false);
  },

  onExit(ctx, handle: Handle): void {
    handle.playing = false;
    if (handle.playRAF) { cancelAnimationFrame(handle.playRAF); handle.playRAF = null; }
    ctx.sfx.toneStop();
    ctx.panels.pop.classList.remove('show');
  },

  onAction(ctx, act: string, handle: Handle, params: ScrubTimelineParams): void {
    if (act !== 'play') return;
    if (handle.playing) { handle.playing = false; ctx.sfx.toneStop(); return; }
    ctx.sfx.initAudio();
    handle.playing = true;
    handle.seal.reveal();
    buildCurve(ctx, params, false);
    ctx.sfx.toneStart();
    let y = params.range[0];
    handle.lastEventYear = 0;
    const scrub = document.getElementById('scrub') as HTMLInputElement | null;
    if (scrub) scrub.value = String(params.range[0]);
    const step = (): void => {
      if (!handle.playing) return;
      y += 1.35;
      if (y >= params.range[1]) { y = params.range[1]; handle.playing = false; ctx.sfx.toneStop(); ctx.sfx.ping(320, 'sine', 0.2, 0.5); }
      if (scrub) scrub.value = String(y);
      updatePop(ctx, params, false, y, true);
      for (const e of params.playEvents) {
        if (y >= e.year && handle.lastEventYear < e.year) {
          handle.lastEventYear = e.year;
          ctx.sfx.ping(e.freq, e.type, e.p, e.d);
          if (e.status) ctx.flashStatus(e.status);
        }
      }
      if (handle.playing) handle.playRAF = requestAnimationFrame(step);
    };
    step();
  },
};
