import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// Ship the Ledger as plain offline files; the root mirror also supports file:// previews.
const repository = fileURLToPath(new URL('.', import.meta.url));
const destination = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(destination, { recursive: true });
cpSync(join(repository, 'app'), join(destination, 'app'), { recursive: true });
for (const entry of ['index.html', 'style.css', 'app.js', 'data']) {
  cpSync(join(repository, 'app', entry), join(destination, entry), { recursive: true });
}
mkdirSync(join(destination, 'screenshots'), { recursive: true });
if (existsSync(join(repository, 'screenshots'))) {
  cpSync(join(repository, 'screenshots'), join(destination, 'screenshots'), { recursive: true });
}
// A preview stages the real output before the first screenshot exists.
rmSync(join(destination, 'dossier.json'), { force: true });
if (process.argv.includes('--preview')) {
  console.log('Ledger preview staged; capture real screenshots before the full build.');
} else {
const dossier = buildDossier(destination, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(destination, 'dossier.json'), dossier);
console.log('Leonida Ledger built: offline app, screenshots and deterministic dossier.');
}
