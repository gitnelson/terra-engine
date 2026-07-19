import type { GlobeContext } from './globe';
import { nowSec } from '../time';

// Owns camera interaction (manual pointer-drag rotate + wheel zoom — NOT
// OrbitControls, which is version-touchy) AND the single rAF loop. The console's
// animate() reached into four modules' private objects; here the loop does only
// rotation + render, and every module registers its per-frame animation via
// onFrame(cb). This is a REWRITE of the frame loop, not a verbatim port.
export type FrameHook = (tSec: number) => void;

export interface CameraController {
  onFrame(cb: FrameHook): () => void;
  start(): void;
  resize(): void;
  snap(y: number, x?: number, z?: number): void;
  faceLon(lon: number, lat: number, z?: number): void;
  state(): { ry: number; rx: number; zoom: number };
  setAuto(v: number): void;
  getAuto(): number;
}

const D2R = Math.PI / 180;

export function createCamera(ctx: GlobeContext): CameraController {
  const { renderer, scene, camera, globe, canvas } = ctx;
  let drag = false, px = 0, py = 0;
  let ry = -1.1, rx = 0.18, tRy = -1.1, tRx = 0.18, zoom = 3.15, tZoom = 3.15, autov = 0.0016;
  const hooks = new Set<FrameHook>();

  canvas.addEventListener('pointerdown', (e) => { drag = true; px = e.clientX; py = e.clientY; autov = 0; });
  addEventListener('pointerup', () => { drag = false; });
  addEventListener('pointermove', (e) => {
    if (!drag) return;
    tRy += (e.clientX - px) * 0.006;
    tRx += (e.clientY - py) * 0.006;
    tRx = Math.max(-0.9, Math.min(0.9, tRx));
    px = e.clientX; py = e.clientY;
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    tZoom = Math.max(2.3, Math.min(4.6, tZoom + e.deltaY * 0.0016));
  }, { passive: false });

  function resize(): void {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  function animate(): void {
    requestAnimationFrame(animate);
    if (!drag) tRy += autov;
    ry += (tRy - ry) * 0.08;
    rx += (tRx - rx) * 0.08;
    zoom += (tZoom - zoom) * 0.08;
    globe.rotation.y = ry;
    globe.rotation.x = rx;
    camera.position.z = zoom;
    const tt = nowSec();
    for (const cb of hooks) cb(tt);
    renderer.render(scene, camera);
  }

  return {
    onFrame(cb) { hooks.add(cb); return () => { hooks.delete(cb); }; },
    start() { animate(); },
    resize,
    snap(y, x = 0, z) { tRy = ry = y; tRx = rx = x; if (z != null) tZoom = zoom = z; autov = 0; },
    faceLon(lon, lat, z) {
      tRy = ry = (Math.PI / 2) - ((lon + 180) * D2R);
      tRx = rx = (lat || 0) * D2R;
      if (z != null) tZoom = zoom = z;
      autov = 0;
    },
    state() { return { ry: +tRy.toFixed(3), rx: +tRx.toFixed(3), zoom: +tZoom.toFixed(3) }; },
    setAuto(v) { autov = v; },
    getAuto() { return autov; },
  };
}
