import { freezeTime, unfreezeTime } from './time';
import type { CameraController } from './scene/camera';
import type { BootMachine } from './boot';
import type { VoicePlayer } from './audio/voice';
import { LAND } from '../data/world/land';

// window.__terra — the verification harness (plan §Verification). Drives/asserts
// state deterministically from Playwright. Grows across steps; state/snap/faceLon/
// freezeTime (step 2) + simBoot/voice (step 3).
export interface DebugDeps {
  cam: CameraController;
  getMod: () => number;
  boot?: BootMachine;
  voice?: VoicePlayer;
}

export function installDebugHooks(deps: DebugDeps): void {
  (window as unknown as { __terra: unknown }).__terra = {
    state: () => ({ mod: deps.getMod(), ...deps.cam.state(), land: true, landSubpaths: LAND.length }),
    snap: (y: number, x?: number, z?: number) => deps.cam.snap(y, x, z),
    faceLon: (lon: number, lat: number, z?: number) => deps.cam.faceLon(lon, lat, z),
    freezeTime: (t: number) => freezeTime(t),
    unfreezeTime: () => unfreezeTime(),
    simBoot: (k: number) => deps.boot?.simBoot(k),
    voice: () => deps.voice?.current() ?? null,
  };
}
