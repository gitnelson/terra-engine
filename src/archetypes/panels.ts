import type { ModuleContext } from './types';
import type { ModuleInstance, Hex } from '../config/schema';

// Shared panel rendering (ported from renderModule 744-770's DOM half). Every
// archetype fills the same #ctx/#assist DOM; the if(m===…) branches are gone —
// each archetype calls these with its own config slice.
export function hexCss(n: Hex): string {
  return '#' + (n >>> 0).toString(16).padStart(6, '0').slice(-6);
}

export interface ContextOpts {
  onLegendClick?: (rowKey: string, index: number, el: HTMLElement) => void;
  activeLegendKey?: string;
}

export function renderContext(ctx: ModuleContext, module: ModuleInstance, opts: ContextOpts = {}): void {
  const p = ctx.panels.ctx;
  p.idx.textContent = module.meta.idx;
  p.name.textContent = module.meta.name;
  p.desc.textContent = module.meta.desc;
  p.legend.innerHTML = '';
  module.legend.forEach((L, i) => {
    const row = document.createElement('div');
    const active = opts.activeLegendKey != null && L.t === opts.activeLegendKey;
    row.className = 'leg-row row' + (active ? ' on' : '');
    const c = hexCss(L.c);
    row.innerHTML = `<span class="sw" style="background:${c};color:${c}"></span><span class="txt"><b>${L.b}</b><span>${L.s}</span></span>`;
    if (opts.onLegendClick) {
      row.onclick = () => {
        [...p.legend.children].forEach((cc) => cc.classList.remove('on'));
        row.classList.add('on');
        opts.onLegendClick!(L.t, i, row);
      };
    }
    p.legend.appendChild(row);
  });
}

export function renderAssist(ctx: ModuleContext, module: ModuleInstance): void {
  ctx.panels.assist.say.innerHTML = module.question.html;
  const ins = ctx.panels.assist.ins;
  ins.innerHTML = '';
  module.question.ins.forEach((c, i) => {
    ins.innerHTML += `<div class="cell${i ? ' am' : ''}"><div class="k">${c[0]}</div><div class="v">${c[1]}</div></div>`;
  });
}

const NARRATE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15 9a3 3 0 010 6M18 6a7 7 0 010 12"/></svg>`;

// Builds control buttons from config + auto-appends NARRATE when the module has a
// narration clip. onAct routes data-act to the archetype's onAction; 'speak' is
// handled here (spoiler-gated: fires only on this explicit press).
export function renderControls(ctx: ModuleContext, module: ModuleInstance, onAct: (act: string) => void): void {
  const ctl = ctx.panels.assist.ctl;
  let html = '';
  module.controls.forEach((b) => {
    const cls = b.style === 'solid' ? 'cbtn solid' : b.style === 'am' ? 'cbtn am' : 'cbtn';
    html += `<button class="${cls}" data-act="${b.act}">${b.icon || ''}${b.label}</button>`;
  });
  if (module.question.narrationKey) {
    html += `<button class="cbtn" data-act="speak">${NARRATE_ICON}NARRATE</button>`;
  }
  ctl.innerHTML = html;
  ctl.onclick = (e) => {
    const b = (e.target as HTMLElement).closest('.cbtn') as HTMLElement | null;
    if (!b) return;
    ctx.sfx.initAudio();
    const a = b.dataset.act!;
    if (a === 'speak') {
      ctx.voice.play(module.question.narrationKey);
    } else {
      onAct(a);
    }
  };
}
