import * as THREE from 'three';
import type { GlobeContext } from './globe';
import type { CameraController } from './camera';

// Expanding seismic pulse rings (ported from console spawnPulse 569-572 + the
// pulses update block in animate 604-605). Shared: boot ignition AND module-0's
// seismic scan both spawn these. Frame-count driven (matches original), so the
// transient isn't affected by freezeTime.
export interface Pulses {
  spawn(v: THREE.Vector3): void;
}

export function createPulses(globeCtx: GlobeContext, cam: CameraController): Pulses {
  const globe = globeCtx.globe;
  const pulses: { ring: THREE.Mesh; t: number; mat: THREE.MeshBasicMaterial }[] = [];

  function spawn(v: THREE.Vector3): void {
    const geo = new THREE.RingGeometry(0.02, 0.03, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffb454, transparent: true, opacity: 0.9, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.position.copy(v.clone().multiplyScalar(1.02));
    ring.lookAt(v.clone().multiplyScalar(2));
    globe.add(ring);
    pulses.push({ ring, t: 0, mat });
  }

  cam.onFrame(() => {
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.t += 0.02;
      const s = 1 + p.t * 10;
      p.ring.scale.setScalar(s);
      p.mat.opacity = Math.max(0, 0.9 - p.t * 1.1);
      if (p.t > 0.9) { globe.remove(p.ring); pulses.splice(i, 1); }
    }
  });

  return { spawn };
}
