// Builds/wires the static console frame. The frame DOM lives in index.html
// (verbatim from the console); chrome fills the config-driven slots (title,
// subtitles, rail nav) and exposes typed panel mount points that archetypes
// render into via ModuleContext.panels. The if(m===…) DOM branches of the
// original renderModule are gone — each archetype fills its own panels.
export interface NavItem { icon: string; label: string; }

export interface ChromeInit {
  title: string;
  brandSub: string;
  poSub: string;
  nav: NavItem[];
  onNav(index: number): void;
  onToggleAudio(on: boolean): void;
}

export interface PanelMounts {
  ctx: { idx: HTMLElement; name: HTMLElement; desc: HTMLElement; legend: HTMLElement };
  assist: { say: HTMLElement; ins: HTMLElement; ctl: HTMLElement };
  deck: { root: HTMLElement; canvas: HTMLCanvasElement; ttl: HTMLElement; sub: HTMLElement };
  pop: HTMLElement;
  hint: HTMLElement;
}

export interface Chrome {
  panels: PanelMounts;
  setActiveNav(i: number): void;
  flashStatus(txt: string): void;
}

function must<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`chrome: missing #${id}`);
  return el as T;
}

export function buildChrome(init: ChromeInit): Chrome {
  document.title = init.title;
  must('brandSub').textContent = init.brandSub;
  must('poSub').textContent = init.poSub;

  // rail nav from config.modules
  const railNav = must('railNav');
  railNav.innerHTML = '';
  const navEls: HTMLElement[] = [];
  init.nav.forEach((item, i) => {
    const d = document.createElement('div');
    d.className = 'nav' + (i === 0 ? ' on' : '');
    d.dataset.mod = String(i);
    d.innerHTML = `${item.icon}<span class="n">${item.label}</span>`;
    d.addEventListener('click', () => init.onNav(i));
    railNav.appendChild(d);
    navEls.push(d);
  });

  // audio toggle
  const audioBtn = must('audioBtn');
  let audioOn = true;
  audioBtn.addEventListener('click', () => {
    audioOn = !audioOn;
    audioBtn.classList.toggle('on', audioOn);
    audioBtn.textContent = audioOn ? '◍ AUDIO ON' : '◌ AUDIO OFF';
    init.onToggleAudio(audioOn);
  });

  const statusTxt = must('statusTxt');
  let statusTimer: number | undefined;
  function flashStatus(txt: string): void {
    statusTxt.textContent = txt;
    if (statusTimer) clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => { statusTxt.textContent = 'SYSTEM NOMINAL'; }, 2600);
  }

  const panels: PanelMounts = {
    ctx: { idx: must('mIdx'), name: must('mName'), desc: must('mDesc'), legend: must('legend') },
    assist: { say: must('say'), ins: must('ins'), ctl: must('ctl') },
    deck: { root: must('deck'), canvas: must<HTMLCanvasElement>('secCanvas'), ttl: must('deckTtl'), sub: must('deckSub') },
    pop: must('pop'),
    hint: must('hint'),
  };

  return {
    panels,
    setActiveNav(i) { navEls.forEach((el, j) => el.classList.toggle('on', i === j)); },
    flashStatus,
  };
}
