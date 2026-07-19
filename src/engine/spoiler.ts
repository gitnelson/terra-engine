// The spoiler-seal invariant made testable in one place. Generalizes the console's
// `curveSealed` flag: a sealed view withholds the answer (e.g. the population
// future line) until the teacher explicitly reveals it, and RE-SEALS whenever the
// module is re-entered. Archetypes call reseal() in onExit.
export interface Seal {
  readonly sealed: boolean;
  reveal(): void;
  reseal(): void;
}
export interface SealFactory {
  create(initial?: boolean): Seal;
}

export function createSealFactory(): SealFactory {
  return {
    create(initial = true): Seal {
      let s = initial;
      return {
        get sealed() { return s; },
        reveal() { s = false; },
        reseal() { s = true; },
      };
    },
  };
}
