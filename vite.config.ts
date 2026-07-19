import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Terra builds ONE self-contained index.html per lesson: Three.js, fonts, world
// data, and narration mp3s are all inlined so the artifact opens via file:// with
// zero network at runtime (offline-safe for teaching from travel).
//
// The lesson to build is selected by TERRA_LESSON env var (default hs-01). In dev
// (`vite dev`) the shell index.html reads ?lesson=<id> instead.
export default defineConfig({
  base: './', // relative asset paths so the built file works from file://
  plugins: [viteSingleFile()],
  build: {
    assetsInlineLimit: 100_000_000, // force-inline everything (mp3s, land data)
    cssCodeSplit: false,
    chunkSizeWarningLimit: 100_000, // a multi-MB single file is expected here
  },
});
