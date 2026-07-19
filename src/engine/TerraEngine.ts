import * as THREE from 'three';
import type { LessonConfig } from '../config/schema';
import type { ModuleContext, ArchetypeHandle, Archetype } from '../archetypes/types';
import { buildGlobe } from './scene/globe';
import { createCamera } from './scene/camera';
import { createPulses } from './scene/pulses';
import { createSfx } from './audio/sfx';
import { createVoice } from './audio/voice';
import { createSealFactory } from './spoiler';
import { LayerRegistry } from './scene/layers';
import { buildChrome } from './ui/chrome';
import { startClock } from './ui/clock';
import { createBoot } from './boot';
import { installDebugHooks } from './debug';
import { ll } from './scene/projection';
import { getArchetype } from '../archetypes/registry';

interface BuiltModule {
  arch: Archetype;
  handle: ArchetypeHandle;
}

// Assembles a lesson: globe + services + chrome + boot, builds each module from its
// archetype, and drives activation (the LayerRegistry showOnly + panel re-render +
// onEnter/onExit swap that replaces the console's renderModule/if-chains).
export class TerraEngine {
  private cam: ReturnType<typeof createCamera>;
  private boot: ReturnType<typeof createBoot>;
  private voice: ReturnType<typeof createVoice>;
  private chrome: ReturnType<typeof buildChrome>;
  private modules: BuiltModule[] = [];
  private curMod = -1;

  constructor(private config: LessonConfig, canvas: HTMLCanvasElement) {
    const globe = buildGlobe(canvas);
    this.cam = createCamera(globe);
    const pulses = createPulses(globe, this.cam);
    const sfx = createSfx();
    this.voice = createVoice(config.narration, () => sfx.isEnabled());
    const layers = new LayerRegistry();
    const sealFactory = createSealFactory();

    this.chrome = buildChrome({
      title: config.title,
      brandSub: config.brandSub,
      poSub: config.poSub,
      nav: config.modules.map((m) => ({ icon: m.navIcon, label: m.meta.idx.replace(/MODULE\s*(\d+).*/i, '$1').trim() || '' })),
      onNav: (i) => this.activate(i),
      onToggleAudio: (on) => { sfx.setEnabled(on); if (!on) this.voice.stop(); },
    });

    const ctx: ModuleContext = {
      THREE, scene: globe.scene, globe: globe.globe, camera: globe.camera, dir: globe.dir,
      ll, layers, setGlow: globe.setGlow, sfx, voice: this.voice, pulses, seal: sealFactory,
      panels: this.chrome.panels, onFrame: this.cam.onFrame, flashStatus: this.chrome.flashStatus,
    };
    this.ctx = ctx;

    // build every module's persistent visuals once
    this.modules = config.modules.map((m) => {
      const arch = getArchetype(m.archetype);
      const handle = arch.buildVisuals(ctx, m.params);
      return { arch, handle };
    });

    startClock();

    this.boot = createBoot(globe, this.cam, sfx, pulses, {
      activateHome: (stagger) => this.activate(0, stagger),
      hideModuleLayers: () => layers.hideAll(),
      flashStatus: (t) => this.chrome.flashStatus(t),
    }, config.boot);

    document.getElementById('initBtn')?.addEventListener('click', () => this.boot.boot());
    addEventListener('pointerdown', () => sfx.initAudio(), { once: true });
  }

  private ctx!: ModuleContext;

  activate(i: number, stagger = false): void {
    if (i === this.curMod) return;
    if (this.curMod >= 0) {
      const prev = this.modules[this.curMod];
      prev.arch.onExit(this.ctx, prev.handle);
    }
    this.curMod = i;
    const { arch, handle } = this.modules[i];
    const m = this.config.modules[i];
    this.ctx.layers.showOnly(handle.layerKeys);
    arch.buildPanel(this.ctx, m, handle);
    arch.buildControls(this.ctx, m, handle);
    arch.onEnter(this.ctx, handle, m.params);
    this.chrome.setActiveNav(i);

    // staggered fade (ported from renderModule 775)
    ['ctx', 'assist', 'deck', 'pop'].forEach((id, k) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('in'); el.classList.add('fade');
      el.style.transitionDelay = (stagger ? 130 * k : 0) + 'ms';
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
    });
  }

  start(): void {
    // __terra harness is a dev/verification affordance — keep it out of the shipped
    // single-file build (it exposes camera/time control, though no answer content).
    if (import.meta.env.DEV) {
      installDebugHooks({ cam: this.cam, getMod: () => this.curMod, boot: this.boot, voice: this.voice });
    }
    this.boot.powerOff();
    this.cam.start();
  }
}
