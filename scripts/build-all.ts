import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Builds one single-file console per lesson and copies the artifact back next to
// its lesson: lessons/<subject>/<slug>/console/<copyBack>. Run: npm run build:all
// (optionally pass lesson ids to build a subset). See lessons/lessons.json.
const here = dirname(fileURLToPath(import.meta.url));
const terraRoot = resolve(here, '..');
const teachingRoot = resolve(terraRoot, '..');

interface Lesson { id: string; subject: string; slug: string; copyBack: string }
const lessons: Lesson[] = JSON.parse(readFileSync(resolve(terraRoot, 'lessons/lessons.json'), 'utf8'));

const only = process.argv.slice(2);
const todo = only.length ? lessons.filter((l) => only.includes(l.id)) : lessons;

for (const lesson of todo) {
  const outDir = resolve(terraRoot, 'dist', lesson.id);
  console.log(`\n▶ building ${lesson.id} -> ${outDir}`);
  execFileSync('npx', ['vite', 'build', '--outDir', outDir, '--emptyOutDir'], {
    cwd: terraRoot,
    stdio: 'inherit',
    env: { ...process.env, VITE_TERRA_LESSON: lesson.id },
  });

  const built = resolve(outDir, 'index.html');
  if (!existsSync(built)) { console.error(`  ✗ no build output at ${built}`); process.exitCode = 1; continue; }

  const consoleDir = resolve(teachingRoot, 'lessons', lesson.subject, lesson.slug, 'console');
  mkdirSync(consoleDir, { recursive: true });
  const target = resolve(consoleDir, lesson.copyBack);
  copyFileSync(built, target);
  console.log(`  ✓ copied to ${target}`);
}

console.log('\n✓ build-all done');
