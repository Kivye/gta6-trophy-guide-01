// verify.mjs — Leonida Ledger v4 verification. Authored in-session.
// Part A: data integrity against the official 55 (table embedded below from
// the build brief) and the edition's audit formulas.
// Part B: headless-Chrome behaviour checks against out/ (the inlined build).
// Prints one PASS/FAIL line per check; exits non-zero on any failure.
import { readFileSync, existsSync, writeFileSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
let failures = 0;
function check(name, ok, extra = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
  if (!ok) failures++;
}

// id|name|grade|hidden(1/0)|kind|stage|description — the official list, exactly.
const OFFICIAL = `1|Vice Got a Price!|platinum|0|misc|05 Clean up & audit|Congratulations! You're a Leonida Legend.
2|Just Like Paradise|bronze|1|story|01 Follow the story|Complete Gone Fishing.
3|Paradise Lost|bronze|1|story|01 Follow the story|Complete Chapter 1.
4|T**s Ass Drug Money|bronze|1|story|01 Follow the story|Complete Chapter 2.
5|Vice City, Baby!|bronze|1|story|01 Follow the story|Complete Chapter 3.
6|Top Of The World, Ma|bronze|1|story|01 Follow the story|Complete Chapter 4.
7|You Gotta Know When to Get Off|gold|1|story|01 Follow the story|Complete the final mission.
8|Trust|bronze|1|story|01 Follow the story|Complete Breakfast Run.
9|Break the Bank|bronze|1|story|01 Follow the story|Complete The Cartel Heist.
10|Family Matters|bronze|1|story|01 Follow the story|Complete Child's Play.
11|DWNFALL|bronze|1|story|01 Follow the story|Complete Headliners.
12|Hi-Jacked|bronze|1|story|01 Follow the story|Complete VCIA Takedown.
13|Snow Storm|bronze|1|story|01 Follow the story|Complete Operation Savage Glory.
14|A Long Road|gold|0|misc|05 Clean up & audit|Attain 100% Completion.
15|Cunning Stunts|silver|0|collectible|04 Big counters|Complete 250 Stunts.
16|Master of None|bronze|0|misc|03 Explore & collect|Try each type of activity once.
17|The Shootist|silver|0|misc|04 Big counters|Earn a gold medal in all Shooting Range challenges.
18|Top Fun|bronze|0|misc|04 Big counters|Win a Top Fun Drone Race at every location.
19|Earn Cash, Not Kudos|bronze|0|misc|04 Big counters|Win 20 different races.
20|Baited My Tackle|bronze|0|misc|05 Clean up & audit|Beat Cal in a fishing challenge.
21|Stick Fiddler|bronze|0|misc|05 Clean up & audit|Complete an arcade game.
22|Road to Rehabilitation|bronze|1|story|01 Follow the story|Complete the final mission for Andy.
23|This Was No Boat Accident|bronze|1|story|01 Follow the story|Complete the final mission for Kenton.
24|The Lone Rider|bronze|1|story|01 Follow the story|Complete the final mission for Billy.
25|Strangers & Freaks|silver|0|misc|04 Big counters|Complete 8 mission strands for strangers across the state of Leonida.
26|Supply & Demand|bronze|1|story|01 Follow the story|Complete the final mission for Randy.
27|Spin On This!|bronze|1|story|01 Follow the story|Complete the final mission for Tyrone.
28|Positive Mental Attitude|bronze|0|collectible|02 Missable-first|Meditate at every spot across Leonida.
29|Fair Game|bronze|1|story|01 Follow the story|Hunt a unique animal for Bret.
30|Don't Touch My Deck|silver|0|collectible|03 Explore & collect|Complete 3 Collectible Card sets.
31|You WAiNKer!|silver|0|collectible|03 Explore & collect|WAiNK It at 100 locations.
32|One Last Thing|bronze|0|collectible|04 Big counters|Complete 50 Challenges.
33|Hot Together|bronze|0|misc|05 Clean up & audit|Lose a 4 star Wanted Level with your partner and escape the heat.
34|Retail Therapy|bronze|0|misc|05 Clean up & audit|Rob 3 shops back-to-back with your partner without losing your Wanted Level.
35|Whip It Good|bronze|0|collectible|03 Explore & collect|Discover 100 vehicles.
36|Gunslinger|bronze|0|misc|05 Clean up & audit|Take down 5 enemies in a single use of Combat Focus.
37|Catch Me If You Can|bronze|1|misc|05 Clean up & audit|Make an unscheduled departure at VCIA.
38|Challenging Tank|bronze|1|misc|05 Clean up & audit|Kinda hot in these Rhinos.
39|Sneakthief|bronze|0|misc|05 Clean up & audit|Rob a jewelry store without being detected.
40|Maximum Withdrawal|silver|0|misc|05 Clean up & audit|Rob 5 Bank Vaults and escape.
41|A Classic Blitz Play|bronze|0|misc|05 Clean up & audit|Rob an Armored Truck and escape.
42|The Goodtime State|bronze|0|collectible|03 Explore & collect|Explore all of Leonida.
43|Pest Control|bronze|0|misc|05 Clean up & audit|Rob an Illegal Operation belonging to each gang.
44|In The Beginning…|bronze|1|misc|05 Clean up & audit|Enjoy a cocktail with a view on Ocean Beach.
45|Capital Offense|bronze|1|misc|05 Clean up & audit|Smash your way out of a vehicle showroom in classic style.
46|Let's Go Bowling|bronze|1|misc|05 Clean up & audit|Follow-through at the Kolt & Associates' bowling alley.
47|Personal Best|bronze|1|misc|05 Clean up & audit|A partnership with mass appeal.
48|Actions Speak Louder|bronze|1|misc|05 Clean up & audit|Choices made (for better or worse).
49|Bad Luck, I Guess|bronze|1|misc|05 Clean up & audit|Second time's the charm.
50|The Truth Is Out There|bronze|1|misc|05 Clean up & audit|What the hell just happened?
51|Ten Pin|bronze|1|misc|05 Clean up & audit|Bowl 'em over with a melee drive-by.
52|Dime on the Dollar|bronze|0|misc|04 Big counters|Earn $250,000 laundering Marked Bills through your contacts.
53|Treat Yo Self|bronze|0|misc|04 Big counters|Spend $100,000 across all shops.
54|Little Boxes|bronze|0|collectible|03 Explore & collect|Purchase all garage properties.
55|On the Spot|bronze|0|misc|05 Clean up & audit|Register 10 vehicles to the Scooter Bros app.`
  .split('\n').map(line => {
    const [id, name, grade, hidden, kind, stage, description] = line.split('|');
    return { id: +id, name, grade, hidden: hidden === '1', kind, stage, description };
  });

const load = f => JSON.parse(readFileSync(join(root, 'app', 'data', f), 'utf8'));
const trophies = load('trophies.json').trophies;
const disagreements = load('disagreements.json').disagreements;
const sources = load('sources.json').sources;
const roadmap = load('roadmap.json');

check('A1 exactly 55 trophy records', trophies.length === 55, `got ${trophies.length}`);
let officialOk = true, firstBad = '';
for (const exp of OFFICIAL) {
  const t = trophies.find(x => x.id === exp.id);
  if (!t) { officialOk = false; firstBad = `missing #${exp.id}`; break; }
  for (const k of ['name', 'grade', 'hidden', 'kind', 'stage', 'description']) {
    if (t[k] !== exp[k]) { officialOk = false; firstBad = `#${exp.id} ${k}: "${t[k]}" != "${exp[k]}"`; break; }
  }
  if (!officialOk) break;
}
check('A2 official fields exact for all 55 (name/grade/hidden/kind/stage/description)', officialOk, firstBad);
const grades = {}; let hiddenN = 0, storyN = 0;
for (const t of trophies) { grades[t.grade] = (grades[t.grade] || 0) + 1; if (t.hidden) hiddenN++; if (t.kind === 'story') storyN++; }
check('A3 grade split 1P/2G/6S/46B, 28 hidden, 18 story', grades.platinum === 1 && grades.gold === 2 && grades.silver === 6 && grades.bronze === 46 && hiddenN === 28 && storyN === 18, JSON.stringify(grades));

const srcNums = new Set(sources.map(s => s.n));
check('A4 sources.json holds exactly sources 1-7', sources.length === 7 && srcNums.size === 7 && [1, 2, 3, 4, 5, 6, 7].every(n => srcNums.has(n)));
let citeOk = true;
for (const t of trophies) {
  for (const s of [...t.steps, ...(t.known || [])]) {
    if (!s.c || !s.c.length || !s.c.every(n => srcNums.has(n))) citeOk = false;
  }
}
const totalSteps = trophies.reduce((n, t) => n + t.steps.length, 0);
const citedSteps = trophies.reduce((n, t) => n + t.steps.filter(s => s.c && s.c.length).length, 0);
check('A5 every step carries >=1 citation and every cited number exists', citeOk);
check('A6 steps-cited ratio is 100%', totalSteps > 0 && citedSteps === totalSteps, `${citedSteps}/${totalSteps}`);
const unconf = trophies.filter(t => t.status === 'unconfirmed');
check('A7 unconfirmed trophies have 0 steps; all others have steps',
  unconf.every(t => t.steps.length === 0) && trophies.filter(t => t.status !== 'unconfirmed').every(t => t.steps.length > 0),
  `unconfirmed: ${unconf.map(t => t.id).join(',')}`);
check('A8 in_short within 70-150 chars for all 55', trophies.every(t => t.in_short.length >= 70 && t.in_short.length <= 150));
const byStatus = {}; for (const t of trophies) byStatus[t.status] = (byStatus[t.status] || 0) + 1;
check('A9 status counts sum to 55 and use only the five statuses',
  Object.values(byStatus).reduce((a, b) => a + b, 0) === 55 && Object.keys(byStatus).every(k => ['confirmed', 'verified', 'single-source', 'disagree', 'unconfirmed'].includes(k)), JSON.stringify(byStatus));
const flagged = trophies.filter(t => t.missable === 'flagged').map(t => t.id);
const watch = trophies.filter(t => t.missable === 'watch').map(t => t.id);
check('A10 missable apparatus: flagged={28}, watch={23,25}, confirmed missable=0',
  JSON.stringify(flagged) === '[28]' && JSON.stringify(watch) === '[23,25]', `flagged ${flagged} watch ${watch}`);
check('A11 disagreements: >=4 entries, each with two cited versions and a ruling',
  disagreements.length >= 4 && disagreements.every(d => d.topic && d.versionA.claim && d.versionB.claim && d.ruling &&
    [...d.versionA.sources, ...d.versionB.sources].every(n => srcNums.has(n)) && d.trophyIds.every(id => trophies.some(t => t.id === id))),
  `${disagreements.length} entries`);
const stageIds = roadmap.stages.flatMap(s => s.trophyIds).sort((a, b) => a - b);
check('A12 roadmap stages partition the 55 ids exactly once',
  stageIds.length === 55 && stageIds.every((id, i) => id === i + 1));
check('A13 roadmap carries >=4 checkpoints, >=4 ground rules, a watch list and hour bands',
  roadmap.checkpoints.length >= 4 && roadmap.groundRules.length >= 4 && roadmap.watchList.length >= 3 &&
  roadmap.stages.every(s => s.hours && typeof s.hours.label === 'string'));
const c28 = trophies.find(t => t.id === 28), c15 = trophies.find(t => t.id === 15), c54 = trophies.find(t => t.id === 54);
check('A14 key counters: #28=18 meditations, #15=250 stunts, #54=8 garages',
  c28.counter && c28.counter.target === 18 && c15.counter && c15.counter.target === 250 && c54.counter && c54.counter.target === 8);
check('A15 enrichment.json is gone and nothing references it',
  !existsSync(join(root, 'app', 'data', 'enrichment.json')) &&
  !readFileSync(join(root, 'app', 'app.js'), 'utf8').includes('enrichment'));

// ---------------- Part B: browser behaviour (out/ build, file://) ----------------
const PORT = 9444;
const PROFILE = '/tmp/ll-verify-profile';
if (!existsSync('/tmp/webgl-policy.txt')) writeFileSync('/tmp/webgl-policy.txt', '');
rmSync(PROFILE, { recursive: true, force: true });
const chrome = spawn('/opt/meta-chromium/chrome', [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
  '--window-size=1280,800',
  '--hatch-webgl-allowed-domains-file=/tmp/webgl-policy.txt',
  '--hatch-webgl-allowed-domains-sha256=c5c85869591ff8b3491450f49cfd62912c6dd41e5cecada4e831191d3185035e',
  'about:blank'
], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, seq = 0; const pending = new Map(); const consoleErrors = [];
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++seq; pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function ev(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error('evaluate failed: ' + JSON.stringify(r.exceptionDetails).slice(0, 200));
  return r.result ? r.result.value : undefined;
}
try {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) break; } catch (e) { /* retry */ }
    await sleep(250);
  }
  const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const page = targets.find(t => t.type === 'page');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = e2 => {
    const msg = JSON.parse(e2.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id); pending.delete(msg.id);
      if (msg.error) p.reject(new Error(msg.error.message)); else p.resolve(msg.result);
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(JSON.stringify(msg.params.args).slice(0, 200));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      consoleErrors.push('exception: ' + JSON.stringify(msg.params.exceptionDetails).slice(0, 200));
    }
  };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: 'file://' + join(root, 'out', 'index.html') });
  for (let i = 0; i < 50; i++) { if (await ev(`!!document.querySelector('#audit-strip .audit-metric')`)) break; await sleep(200); }
  await sleep(400);

  const rowThree = await ev(`(document.querySelector('[data-row="3"]')||{textContent:''}).textContent`);
  check('B1 spoiler shield masks a hidden trophy in the checklist', rowThree.includes('Hidden trophy') && !rowThree.includes('Paradise Lost'), rowThree.slice(0, 60));

  const detail0 = await ev(`document.querySelector('#detail-panel').textContent`);
  check('B2 default detail is Positive Mental Attitude with a 0/18 stepper',
    detail0.includes('Positive Mental Attitude') && detail0.includes('0 / 18'));
  await ev(`document.querySelector('[data-step="inc"][data-id="28"]').click()`);
  await sleep(150);
  const detail1 = await ev(`document.querySelector('#detail-panel').textContent`);
  check('B3 stepper increments to 1 / 18', detail1.includes('1 / 18'));

  let viewsOk = true, viewInfo = '';
  for (const v of ['roadmap', 'matrix', 'missables', 'sources', 'ledger']) {
    await ev(`location.hash = 'view=${v}'`); await sleep(350);
    const vis = await ev(`(() => { const el = document.querySelector('#view-${v}'); return el && !el.classList.contains('hidden') && el.textContent.trim().length > 200; })()`);
    if (!vis) { viewsOk = false; viewInfo = v; break; }
  }
  check('B4 all five views render with content', viewsOk, viewInfo);

  await ev(`location.hash = 'view=roadmap'`); await sleep(300);
  const pace0 = await ev(`document.querySelector('#pace-remaining').textContent`);
  await ev(`location.hash = 'view=ledger'`); await sleep(300);
  await ev(`document.querySelector('[data-check="2"]').click()`);
  await sleep(200);
  await ev(`location.hash = 'view=roadmap'`); await sleep(300);
  const pace1 = await ev(`document.querySelector('#pace-remaining').textContent`);
  check('B5 pace figure changes when a trophy is checked', pace0 !== pace1, `"${pace0}" -> "${pace1}"`);

  const saved = await ev(`JSON.stringify({ app: 'leonida-ledger', version: 4, state: JSON.parse(localStorage.getItem('leonida-ledger-v4')) })`);
  await ev(`document.querySelector('#export-open').click()`); await sleep(200);
  await ev(`document.querySelector('#exp-clear').click()`); await sleep(200);
  const clearedCount = await ev(`document.querySelector('#earned-count').textContent`);
  await ev(`document.querySelector('#imp-text').value = ${JSON.stringify(saved)}; document.querySelector('#imp-restore').click()`);
  await sleep(250);
  const restoredCount = await ev(`document.querySelector('#earned-count').textContent`);
  const restoredCounter = await ev(`JSON.parse(localStorage.getItem('leonida-ledger-v4')).counters[28]`);
  check('B6 export/import round-trips (clear wipes, restore brings back)',
    clearedCount.startsWith('0 /') && restoredCount.startsWith('1 /') && restoredCounter === 1,
    `cleared "${clearedCount}" restored "${restoredCount}" counter28=${restoredCounter}`);

  check('B7 zero console errors across all views and interactions', consoleErrors.length === 0, consoleErrors[0] || '');
} catch (err) {
  check('B0 browser harness ran', false, String(err).slice(0, 200));
} finally {
  try { if (ws) ws.close(); } catch (e) { /* noop */ }
  chrome.kill('SIGKILL');
}

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
