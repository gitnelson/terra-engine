// Single source of "now" for every time-based animation (marker pulse, hadley
// wave, pulse-ring expansion, boot phases). freezeTime pins it so Playwright
// visual diffs are deterministic across the onFrame rewrite (plan verification).
let frozen: number | null = null;

export function nowSec(): number {
  return frozen ?? performance.now() * 0.001;
}
export function freezeTime(t: number): void {
  frozen = t;
}
export function unfreezeTime(): void {
  frozen = null;
}
export function isFrozen(): boolean {
  return frozen !== null;
}
