import type * as THREE from 'three';
import type { LayerRegistry } from '../engine/scene/layers';
import type { SfxApi } from '../engine/audio/sfx';
import type { VoicePlayer } from '../engine/audio/voice';
import type { Pulses } from '../engine/scene/pulses';
import type { SealFactory } from '../engine/spoiler';
import type { PanelMounts } from '../engine/ui/chrome';
import type { FrameHook } from '../engine/scene/camera';
import type { ModuleInstance } from '../config/schema';

// Built ONCE by TerraEngine and handed to every archetype. Archetypes never
// create a scene — they attach to the shared `globe` group and register named
// layers. This is the seam that lets one archetype serve many lessons/modules.
export interface ModuleContext {
  THREE: typeof THREE;
  scene: THREE.Scene;
  globe: THREE.Group;
  camera: THREE.PerspectiveCamera;
  dir: THREE.DirectionalLight;
  ll: (lon: number, lat: number, r?: number) => THREE.Vector3;
  layers: LayerRegistry;
  setGlow: (hex: number) => void;
  sfx: SfxApi;
  voice: VoicePlayer;
  pulses: Pulses;
  seal: SealFactory;
  panels: PanelMounts;
  onFrame: (cb: FrameHook) => () => void;
  flashStatus: (t: string) => void;
}

// Per-module handle returned by buildVisuals. `layerKeys` drives LayerRegistry
// show/hide; the rest is archetype-local state (secType, seal, etc.).
export interface ArchetypeHandle {
  layerKeys: string[];
  frameUnsubs?: Array<() => void>;
  [k: string]: unknown;
}

// The archetype seam.
//   buildVisuals — ONCE at engine start: create persistent Three.js objects,
//     register named layers. Returns a handle (archetype-local state).
//   buildPanel/buildControls — on EVERY activate: the #ctx/#assist DOM is shared
//     across modules, so it is re-rendered when this module becomes active.
//   onEnter/onExit — swap active module (show/hide layers already done by engine;
//     seed/tear-down state, start/stop loops, RE-SEAL in onExit).
//   onAction — data-act router (seismic/circulate/play/…); 'speak' is handled by
//     renderControls (spoiler-gated).
export interface Archetype<P = unknown> {
  key: string;
  buildVisuals(ctx: ModuleContext, params: P): ArchetypeHandle;
  buildPanel(ctx: ModuleContext, module: ModuleInstance<P>, handle: ArchetypeHandle): void;
  buildControls(ctx: ModuleContext, module: ModuleInstance<P>, handle: ArchetypeHandle): void;
  onEnter(ctx: ModuleContext, handle: ArchetypeHandle, params: P): void;
  onExit(ctx: ModuleContext, handle: ArchetypeHandle): void;
  onAction(ctx: ModuleContext, act: string, handle: ArchetypeHandle, params: P): void;
}
