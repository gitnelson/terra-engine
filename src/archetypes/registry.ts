import type { Archetype } from './types';

// key -> Archetype. A new lesson composes registered archetypes by key; the proof
// that a lesson is "config-only" is that adding it does NOT add a key here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const registry = new Map<string, Archetype<any>>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerArchetype(a: Archetype<any>): void {
  registry.set(a.key, a);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getArchetype(key: string): Archetype<any> {
  const a = registry.get(key);
  if (!a) throw new Error(`unknown archetype: ${key}`);
  return a;
}

export function archetypeKeys(): string[] {
  return [...registry.keys()].sort();
}
