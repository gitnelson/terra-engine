import type { LessonConfig } from '../src/config/schema';
import { hs01Config } from './hs-01-physical-world/config';
import { landformsConfig } from './landforms-shaping-the-land/config';
import { advanced03UsaConfig } from './advanced-03-united-states/config';

// All buildable lessons, keyed by id.
//
// ⚠️ Nothing imports this today. Lesson selection happens through the static branches
// in src/main.ts (so each build tree-shakes to a single lesson) and build-all.ts
// drives off lessons.json — and a Node-side consumer can't import it anyway, because
// lesson configs import .mp3 assets that only Vite can resolve. Kept as the declared
// index of buildable lessons; see docs/tech-debt.md TD-002.
export const LESSONS: Record<string, LessonConfig> = {
  'hs-01-physical-world': hs01Config,
  'landforms-shaping-the-land': landformsConfig,
  'advanced-03-united-states': advanced03UsaConfig,
};
export const DEFAULT_LESSON = 'hs-01-physical-world';
