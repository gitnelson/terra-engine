import type { LessonConfig } from '../src/config/schema';
import { hs01Config } from './hs-01-physical-world/config';
import { landformsConfig } from './landforms-shaping-the-land/config';
import { advanced03UsaConfig } from './advanced-03-united-states/config';

// All buildable lessons, keyed by id. build-all.ts builds one entry per key and
// copies the single-file artifact back to lessons/<subject>/<slug>/console/.
export const LESSONS: Record<string, LessonConfig> = {
  'hs-01-physical-world': hs01Config,
  'landforms-shaping-the-land': landformsConfig,
  'advanced-03-united-states': advanced03UsaConfig,
};
export const DEFAULT_LESSON = 'hs-01-physical-world';
