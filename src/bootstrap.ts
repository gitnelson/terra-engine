import '@fontsource/rajdhani/400.css';
import '@fontsource/rajdhani/500.css';
import '@fontsource/rajdhani/600.css';
import '@fontsource/rajdhani/700.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/700.css';
import './styles/console.css';

import type { LessonConfig } from './config/schema';
import { registerArchetype } from './archetypes/registry';
import { globeMotionOverlay } from './archetypes/globeMotionOverlay';
import { animatedCrossSection } from './archetypes/animatedCrossSection';
import { scrubTimeline } from './archetypes/scrubTimeline';
import { TerraEngine } from './engine/TerraEngine';

// Shared startup: register the archetype library once, then boot a lesson. Every
// lesson entry calls this — the archetypes are the fixed library, the config is
// the lesson.
export function startLesson(config: LessonConfig): void {
  registerArchetype(globeMotionOverlay);
  registerArchetype(animatedCrossSection);
  registerArchetype(scrubTimeline);
  const canvas = document.getElementById('globe-canvas') as HTMLCanvasElement;
  new TerraEngine(config, canvas).start();
}
