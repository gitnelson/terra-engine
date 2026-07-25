import { defineConfig, type Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Terra builds ONE self-contained index.html per lesson: Three.js, fonts, world
// data, and narration mp3s are all inlined so the artifact opens via file:// with
// zero network at runtime (offline-safe for teaching from travel).
//
// The lesson to build is selected by TERRA_LESSON env var (default hs-01). In dev
// (`vite dev`) the shell index.html reads ?lesson=<id> instead.

// Substitutes the browser-tab <title> from index.html's %VITE_TERRA_TITLE%
// placeholder. build-all.ts sets VITE_TERRA_TITLE per lesson (from lessons.json);
// this only covers the brief pre-script-execution paint — ui/chrome.ts overwrites
// document.title again at runtime from config.title. A plain fallback (not a .env
// file, which is gitignored for secrets) keeps `npm run dev` sane with no setup.
function terraTitle(): Plugin {
  return {
    name: 'terra-title',
    transformIndexHtml(html) {
      return html.replace('%VITE_TERRA_TITLE%', process.env.VITE_TERRA_TITLE || 'TERRA · Teaching Console');
    },
  };
}

export default defineConfig({
  base: './', // relative asset paths so the built file works from file://
  plugins: [viteSingleFile(), terraTitle()],
  build: {
    assetsInlineLimit: 100_000_000, // force-inline everything (mp3s, land data)
    cssCodeSplit: false,
    chunkSizeWarningLimit: 100_000, // a multi-MB single file is expected here
  },
});
