import * as THREE from 'three';

// Equirectangular lon/lat -> point on a sphere of radius r. Ported verbatim from
// the console; every layer (globe, archetypes, faceLon) shares this projection.
export const D2R = Math.PI / 180;

export function ll(lon: number, lat: number, r = 1): THREE.Vector3 {
  const phi = (90 - lat) * D2R;
  const th = (lon + 180) * D2R;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(th),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(th),
  );
}
