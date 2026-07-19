import type * as THREE from 'three';

// Generalizes the console's setModuleVisuals(m) (index.html 575-581), which
// hard-coded each group's visibility per module index. Every visual registers
// under a string key; the engine shows exactly the active module's keys. Adding
// a module no longer edits a central switch — its handle declares its layerKeys.
export class LayerRegistry {
  private layers = new Map<string, THREE.Object3D | THREE.Object3D[]>();

  register(key: string, obj: THREE.Object3D | THREE.Object3D[]): void {
    this.layers.set(key, obj);
  }

  setVisible(key: string, v: boolean): void {
    const o = this.layers.get(key);
    if (!o) return;
    if (Array.isArray(o)) o.forEach((x) => { x.visible = v; });
    else o.visible = v;
  }

  showOnly(keys: string[]): void {
    const want = new Set(keys);
    for (const k of this.layers.keys()) this.setVisible(k, want.has(k));
  }

  hideAll(): void {
    for (const k of this.layers.keys()) this.setVisible(k, false);
  }

  has(key: string): boolean {
    return this.layers.has(key);
  }
}
