import type { LessonConfig } from './config/schema';
import { startLesson } from './bootstrap';
import { hs01Config } from '../lessons/hs-01-physical-world/config';
import { landformsConfig } from '../lessons/landforms-shaping-the-land/config';
import { advanced03UsaConfig } from '../lessons/advanced-03-united-states/config';

// Lesson selection with PER-LESSON BUILD ISOLATION. In a production build,
// import.meta.env.DEV is false (the dev branch — which references every lesson for
// ?lesson= switching — is dead-code-eliminated) and VITE_TERRA_LESSON is inlined to
// a string literal, so the static ternary resolves at build time and Rollup
// tree-shakes the OTHER lesson's config + its audio out of the bundle. Each built
// console therefore contains only its own lesson (no cross-lesson answer strings or
// mp3s). build-all.ts sets VITE_TERRA_LESSON per lesson.
let config: LessonConfig;
if (import.meta.env.DEV) {
  const id = new URLSearchParams(location.search).get('lesson');
  config = id === 'landforms-shaping-the-land' ? landformsConfig
    : id === 'advanced-03-united-states' ? advanced03UsaConfig
    : hs01Config;
} else {
  const sel = (import.meta.env as Record<string, string | undefined>).VITE_TERRA_LESSON;
  config = sel === 'landforms-shaping-the-land' ? landformsConfig
    : sel === 'advanced-03-united-states' ? advanced03UsaConfig
    : hs01Config;
}

startLesson(config);
