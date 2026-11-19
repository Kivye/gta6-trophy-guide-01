// Drive headless Chrome over CDP to capture the built app at four hash states.
// The one-shot --screenshot mode produces no file in this environment, so this
// driver navigates, waits for load, probes the DOM, and captures the surface.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME = '/opt/meta-chromium/chrome';
const PORT = 9333;
const outDir = process.argv[2];
const base = process.argv[3];
const shots = [
  ['01-cover', 'demo=1'],
  ['02-matrix', 'demo=1&view=matrix'],
  ['03-roadmap', 'demo=1&view=roadmap'],
  ['04-spoiler-filters', 'demo=1&spoiler=1&grade=bronze&status=open&stage=01&backup=1'],
];
if (!outDir || !base) { console.error('usage: capture-cdp.mjs <png-dir> <file-url-of-out/index.html>'); process.exit(2); }
mkdirSync(outDir, { recursive: true });

const chrome = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
  '--window-size=1280,800',
  '--hatch-webgl-allowed-domains-file=/tmp/webgl-policy.txt',
  '--hatch-webgl-allowed-domains-sha256=c5c85869591ff8b3491450f49cfd62912c6dd41e5cecada4e831191d3185035e',
  '--user-data-dir=/tmp/trophy-chrome-cdp', `--remote-debugging-port=${PORT}`, 'about:blank',
], { stdio: 'ignore' });

async function pageSocket() {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = targets.find(t => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch (error) { /* Chrome not up yet */ }
    await sleep(200);
  }
  throw new Error('Chrome DevTools endpoint never came up.');
}

const ws = new WebSocket(await pageSocket());
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let nextId = 0;
const pending = new Map();
const listeners = new Map();
const consoleErrors = [];
ws.onmessage = event => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result);
  } else if (message.method) {
    if (message.method === 'Runtime.exceptionThrown') consoleErrors.push('exception: ' + (message.params.exceptionDetails.text || 'unknown'));
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') consoleErrors.push('console: ' + message.params.args.map(a => a.value || a.description || '').join(' '));
    for (const fn of listeners.get(message.method) || []) fn(message.params);
  }
};
function send(method, params = {}) {
  const id = ++nextId;
  return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
}
function once(method, timeoutMs) {
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve(false), timeoutMs);
    listeners.set(method, [...(listeners.get(method) || []), () => { clearTimeout(timer); resolve(true); }]);
  });
}

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
for (const [name, hash] of shots) {
  const loaded = once('Page.loadEventFired', 2500);
  await send('Page.navigate', { url: `${base}#${hash}` });
  await loaded;
  await sleep(900);
  const probe = await send('Runtime.evaluate', {
    expression: `JSON.stringify({rows: document.querySelectorAll('.trophy').length, chips: document.querySelectorAll('.mx-chip').length, scrollY: Math.round(window.scrollY), title: document.title})`,
    returnByValue: true,
  });
  const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  writeFileSync(`${outDir}/${name}.png`, Buffer.from(shot.data, 'base64'));
  console.log(name, probe.result.value);
}
console.log('console_errors=' + consoleErrors.length, consoleErrors.join(' | '));
ws.close();
chrome.kill('SIGTERM');
