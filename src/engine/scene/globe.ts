import * as THREE from 'three';
import { ll } from './projection';
import { LAND } from '../../data/world/land';
import { ANTARCTICA } from '../../data/world/antarctica';

// The shared globe scene, built ONCE by the engine and handed to every archetype
// via ModuleContext. Archetypes never build a scene — they attach to `globe`.
// Ported layer-for-layer from the console (index.html 473-521): lit core sphere
// (0.992) -> fibonacci dot shimmer (1.004) -> graticule (1.001) -> land
// LineSegments (1.006) -> fresnel atmosphere (1.18, additive). Radii/opacities/
// colors are byte-for-byte to preserve the aesthetic (plan risk #5).
export interface GlobeContext {
  THREE: typeof THREE;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  canvas: HTMLCanvasElement;
  root: THREE.Group;
  globe: THREE.Group;
  atmo: THREE.Mesh;
  landMesh: THREE.LineSegments | null;
  dir: THREE.DirectionalLight;
  setGlow(hex: number): void;
}

export function buildGlobe(canvas: HTMLCanvasElement): GlobeContext {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0.3, 3.15);

  const root = new THREE.Group();
  scene.add(root);
  const globe = new THREE.Group();
  root.add(globe);

  // lit inner sphere for depth + occlusion
  const dir = new THREE.DirectionalLight(0xbfe9ff, 1.15);
  dir.position.set(-3, 1.5, 2.2);
  scene.add(dir);
  scene.add(new THREE.AmbientLight(0x18323a, 1));
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.992, 64, 64),
    new THREE.MeshPhongMaterial({ color: 0x0a1a20, emissive: 0x03121a, shininess: 6, specular: 0x0e3a44 }),
  );
  globe.add(core);

  // dotted surface shimmer (fibonacci sphere)
  {
    const N = 1700;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = i * 2.399963;
      pos[i * 3] = Math.cos(th) * r * 1.004;
      pos[i * 3 + 1] = y * 1.004;
      pos[i * 3 + 2] = Math.sin(th) * r * 1.004;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({
      color: 0x2f6f74, size: 0.012, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    globe.add(new THREE.Points(g, m));
  }

  // graticule
  {
    const mat = new THREE.LineBasicMaterial({ color: 0x1c4a4e, transparent: true, opacity: 0.5 });
    for (let lat = -60; lat <= 60; lat += 30) {
      const p: THREE.Vector3[] = [];
      for (let lon = -180; lon <= 180; lon += 6) p.push(ll(lon, lat, 1.001));
      globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), mat));
    }
    for (let lon = -180; lon < 180; lon += 30) {
      const p: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 6) p.push(ll(lon, lat, 1.001));
      globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), mat));
    }
  }

  // real land — coastlines + borders from world.svg + appended Antarctica, one LineSegments
  let landMesh: THREE.LineSegments | null = null;
  {
    const seg: number[] = [];
    (LAND as [number, number][][]).concat([ANTARCTICA]).forEach((sp) => {
      for (let i = 0; i < sp.length - 1; i++) {
        const a = ll(sp[i][0], sp[i][1], 1.006);
        const b = ll(sp[i + 1][0], sp[i + 1][1], 1.006);
        seg.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    });
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
    landMesh = new THREE.LineSegments(
      lg,
      new THREE.LineBasicMaterial({ color: 0x64dccb, transparent: true, opacity: 0.62 }),
    );
    globe.add(landMesh);
  }

  // atmosphere fresnel — `ub` uniform (0..1) drives the boot ignition
  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(1.18, 64, 64),
    new THREE.ShaderMaterial({
      transparent: true, blending: THREE.AdditiveBlending, side: THREE.FrontSide, depthWrite: false,
      uniforms: { glow: { value: new THREE.Color(0x39d6cf) }, ub: { value: 1 } },
      vertexShader: `varying vec3 vN;varying vec3 vP;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vP=mv.xyz;gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `varying vec3 vN;varying vec3 vP;uniform vec3 glow;uniform float ub;void main(){vec3 v=normalize(-vP);float r=1.-max(dot(v,vN),0.);r=pow(r,2.4);gl_FragColor=vec4(glow,r*.9*ub);}`,
    }),
  );
  globe.add(atmo);

  function setGlow(hex: number): void {
    ((atmo.material as THREE.ShaderMaterial).uniforms.glow.value as THREE.Color).set(hex);
  }

  return { THREE, renderer, scene, camera, canvas, root, globe, atmo, landMesh, dir, setGlow };
}
