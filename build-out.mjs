// build-out.mjs — produces out/, a self-contained copy of the app whose data
// is inlined (window.__LL_DATA__) so it renders from file:// for screenshots.
// The shipped app/ keeps clean fetch-based loading. Authored in-session.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const appDir = join(root, 'app');
const outDir = join(root, 'out');
mkdirSync(outDir, { recursive: true });

const data = {
  trophies: JSON.parse(readFileSync(join(appDir, 'data', 'trophies.json'), 'utf8')).trophies,
  disagreements: JSON.parse(readFileSync(join(appDir, 'data', 'disagreements.json'), 'utf8')).disagreements,
  sources: JSON.parse(readFileSync(join(appDir, 'data', 'sources.json'), 'utf8')).sources,
  roadmap: JSON.parse(readFileSync(join(appDir, 'data', 'roadmap.json'), 'utf8'))
};

let html = readFileSync(join(appDir, 'index.html'), 'utf8');
const inject = `<script>window.__LL_DATA__=${JSON.stringify(data)};</script>\n<script src="app.js"></script>`;
html = html.replace('<script src="app.js"></script>', inject);
if (!html.includes('__LL_DATA__')) throw new Error('injection failed');
writeFileSync(join(outDir, 'index.html'), html);
copyFileSync(join(appDir, 'style.css'), join(outDir, 'style.css'));
copyFileSync(join(appDir, 'app.js'), join(outDir, 'app.js'));
console.log('out/ built:', Object.keys(data), 'trophies:', data.trophies.length);
