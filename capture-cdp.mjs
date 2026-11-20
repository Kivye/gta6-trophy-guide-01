// capture-cdp.mjs — shoots the 4 v4 frames from out/ with headless Chrome
// over CDP at 1280x800. Authored in-session.
// Usage: node capture-cdp.mjs
import { spawn } from 'node:child_process';
import { writeFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const PORT = 9333;
const PROFILE = '/tmp/ll-capture-profile';
const SHOTS = [
  { hash: '', file: 'screenshots/01-cover.jpg' },
  { hash: '#view=roadmap', file: 'screenshots/02-roadmap.jpg' },
  { hash: '#view=matrix', file: 'screenshots/03-matrix.jpg' },
  { hash: '#view=missables', file: 'screenshots/04-disagreements.jpg' }
];

if (!existsSync('/tmp/webgl-policy.txt')) writeFileSync('/tmp/webgl-policy.txt', '');
rmSync(PROFILE, { recursive: true, force: true });
mkdirSync(join(root, 'screenshots'), { recursive: true });

const chrome = spawn('/opt/meta-chromium/chrome', [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
  '--window-size=1280,800',
  '--hatch-webgl-allowed-domains-file=/tmp/webgl-policy.txt',
  '--hatch-webgl-allowed-domains-sha256=c5c85869591ff8b3491450f49cfd62912c6dd41e5cecada4e831191d3185035e',
  'about:blank'
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitEndpoint() {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) return await r.json(); } catch (e) { /* retry */ }
    await sleep(250);
  }
  throw new Error('chrome devtools endpoint never came up');
}

let ws, seq = 0; const pending = new Map();
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++seq; pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error('evaluate failed: ' + JSON.stringify(r.exceptionDetails).slice(0, 300));
  return r.result ? r.result.value : undefined;
}

try {
  await waitEndpoint();
  const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const page = targets.find(t => t.type === 'page');
  if (!page) throw new Error('no page target');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id); pending.delete(msg.id);
      if (msg.error) p.reject(new Error(msg.error.message)); else p.resolve(msg.result);
    }
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  const base = 'file://' + join(root, 'out', 'index.html');
  let first = true;
  for (const shot of SHOTS) {
    await send('Page.navigate', { url: base + shot.hash });
    if (!first) {
      // frames 2-4 are shot with the app's own spoiler toggle OFF, so trophy
      // names show on roadmap chips and matrix cells (the toggle is a real
      // app feature; frame 1 keeps the default shielded state)
      await evaluate(`(() => { const b = document.querySelector('#spoiler-toggle'); if (b && b.textContent.includes('hidden')) b.click(); })()`);
    }
    first = false;
    // wait until the app has rendered its audit strip, then settle
    for (let i = 0; i < 40; i++) {
      const ready = await evaluate(`!!document.querySelector('#audit-strip .audit-metric')`);
      if (ready) break;
      await sleep(200);
    }
    await sleep(700);
    const shotRes = await send('Page.captureScreenshot', { format: 'jpeg', quality: 84 });
    const buf = Buffer.from(shotRes.data, 'base64');
    writeFileSync(join(root, shot.file), buf);
    console.log(shot.file, buf.length, 'bytes');
  }
} finally {
  try { if (ws) ws.close(); } catch (e) { /* noop */ }
  chrome.kill('SIGKILL');
}
