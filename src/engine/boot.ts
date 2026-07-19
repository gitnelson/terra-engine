import type { GlobeContext } from './scene/globe';
import type { CameraController } from './scene/camera';
import type { SfxApi } from './audio/sfx';
import type { Pulses } from './scene/pulses';
import { ll } from './scene/projection';

// Powered-off standby -> INITIALIZE -> staged boot (ported from console 816-864).
// Decoupled from modules via hooks: the engine supplies activateHome (renderModule
// 0 with panel stagger), hideModuleLayers (powerOff), and flashStatus. The scene
// choreography (atmosphere ub 0->1, coastline setDrawRange trace, ignition flash,
// seismic pulses) lives here.
export interface BootConfig {
  landTraceMs: number;                 // durA (1700)
  ignitionPulses: [number, number][];  // [[138,35],[-72,-30],[122,12]]
  autoSpin: { standby: number; boot: number; idle: number }; // 0.0006 / 0.006 / 0.0016
}
export const DEFAULT_BOOT: BootConfig = {
  landTraceMs: 1700,
  ignitionPulses: [[138, 35], [-72, -30], [122, 12]],
  autoSpin: { standby: 0.0006, boot: 0.006, idle: 0.0016 },
};

export interface BootHooks {
  activateHome(stagger: boolean): void; // engine: activate module 0
  hideModuleLayers(): void;             // engine: hide all archetype layers
  flashStatus(txt: string): void;
}

export interface BootMachine {
  powerOff(): void;
  boot(): void;
  skipBoot(): void;
  simBoot(k: number): void;
  isBooted(): boolean;
}

export function createBoot(
  globe: GlobeContext, cam: CameraController, sfx: SfxApi, pulses: Pulses,
  hooks: BootHooks, cfg: BootConfig = DEFAULT_BOOT,
): BootMachine {
  const { atmo, landMesh } = globe;
  const atmoU = (atmo.material as import('three').ShaderMaterial).uniforms;
  let booted = false, booting = false;
  const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

  const el = (id: string): HTMLElement | null => document.getElementById(id);

  function bootFlash(): void {
    const f = el('bootflash'); if (!f) return;
    f.style.transition = 'none'; f.style.opacity = '0.42';
    requestAnimationFrame(() => { f.style.transition = 'opacity .55s ease'; f.style.opacity = '0'; });
  }
  function landFull(): void {
    if (landMesh) landMesh.geometry.setDrawRange(0, landMesh.geometry.attributes.position.count);
  }

  function powerOff(): void {
    booted = false;
    atmo.visible = false;
    if (landMesh) landMesh.visible = false;
    hooks.hideModuleLayers();
    cam.setAuto(cfg.autoSpin.standby);
    const app = el('app'); if (app) app.style.opacity = '0';
    el('poweroff')?.classList.remove('gone');
  }

  function phaseB(): void {
    if (!booting) return;
    atmoU.ub.value = 1; landFull();
    bootFlash();
    hooks.activateHome(true); // stagger panels in
    const app = el('app'); if (app) app.style.opacity = '1';
    cfg.ignitionPulses.forEach((v, i) => setTimeout(() => {
      if (booting || booted) { pulses.spawn(ll(v[0], v[1], 1)); sfx.ping(360 + i * 130, 'sine', 0.12, 0.2); }
    }, 130 + i * 130));
    hooks.flashStatus('◉ SYSTEMS ONLINE');
    setTimeout(() => sfx.ping(660, 'triangle', 0.2, 0.25), 200);
    setTimeout(() => sfx.ping(880, 'triangle', 0.22, 0.32), 380);
    setTimeout(() => { cam.setAuto(cfg.autoSpin.idle); booted = true; booting = false; removeEventListener('pointerdown', skipBoot); }, 950);
  }

  function boot(): void {
    if (booted || booting) return;
    booting = true;
    sfx.initAudio(); sfx.bootSound();
    el('poweroff')?.classList.add('gone');
    cam.setAuto(cfg.autoSpin.boot);
    atmo.visible = true; atmoU.ub.value = 0;
    if (landMesh) { landMesh.visible = true; landMesh.geometry.setDrawRange(0, 0); }
    const total = landMesh ? landMesh.geometry.attributes.position.count : 0;
    addEventListener('pointerdown', skipBoot);
    const t0 = performance.now();
    (function phaseA(): void {
      const e = Math.min(1, (performance.now() - t0) / cfg.landTraceMs);
      const k = easeOut(e);
      atmoU.ub.value = k;
      if (landMesh) landMesh.geometry.setDrawRange(0, Math.floor(total * k / 2) * 2);
      if (e < 1 && booting) requestAnimationFrame(phaseA);
      else if (booting) phaseB();
    })();
  }

  function skipBoot(): void {
    if (!booting) return;
    booting = false; removeEventListener('pointerdown', skipBoot);
    atmo.visible = true; atmoU.ub.value = 1;
    if (landMesh) { landMesh.visible = true; }
    landFull();
    hooks.activateHome(false);
    const app = el('app'); if (app) app.style.opacity = '1';
    cam.setAuto(cfg.autoSpin.idle); booted = true;
    el('poweroff')?.classList.add('gone');
  }

  function simBoot(k: number): void {
    el('poweroff')?.classList.add('gone');
    const app = el('app'); if (app) app.style.opacity = '0';
    atmo.visible = true; atmoU.ub.value = k;
    if (landMesh) {
      landMesh.visible = true;
      const tot = landMesh.geometry.attributes.position.count;
      landMesh.geometry.setDrawRange(0, Math.floor(tot * k / 2) * 2);
    }
    hooks.hideModuleLayers();
  }

  return { powerOff, boot, skipBoot, simBoot, isBooted: () => booted };
}
