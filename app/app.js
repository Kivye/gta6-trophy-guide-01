/* Leonida Ledger v4 — app logic.
   Static, offline, no framework. Data comes from window.__LL_DATA__ when the
   capture build inlines it, otherwise from the JSON files under data/. */
'use strict';

const LS_KEY = 'leonida-ledger-v4';
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let DATA = null; // {trophies, disagreements, sources, roadmap}
let state = loadState();
let selectedId = 28;
let currentView = 'ledger';

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) { const p = JSON.parse(raw); if (p && typeof p === 'object') return normalizeState(p); }
  } catch (e) { /* fresh state below */ }
  return normalizeState({});
}
function normalizeState(p) {
  return {
    earned: p.earned && typeof p.earned === 'object' ? p.earned : {},
    counters: p.counters && typeof p.counters === 'object' ? p.counters : {},
    revealed: p.revealed && typeof p.revealed === 'object' ? p.revealed : {},
    spoilersOff: !!p.spoilersOff
  };
}
function saveState() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
  const n = $('#saved-note'); if (n) { n.textContent = '✓ Saved in this browser'; }
}

const byId = id => DATA.trophies.find(t => t.id === id);
const isEarned = id => !!state.earned[id];
const counterOf = id => Math.max(0, state.counters[id] || 0);
const shieldOn = () => !state.spoilersOff;
const isMasked = t => shieldOn() && t.hidden && !isEarned(t.id) && !state.revealed[t.id];
const displayName = t => isMasked(t) ? 'Hidden trophy' : t.name;
const citedCount = t => t.steps.filter(s => s.c && s.c.length).length;
const ratioText = t => t.steps.length ? `${citedCount(t)}/${t.steps.length} cited` : 'no steps';
const STATUS_LABEL = { confirmed: 'Confirmed', verified: 'Verified', 'single-source': 'Single-source', disagree: 'Disputed', unconfirmed: 'Unconfirmed' };
const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };

function citeHtml(nums) {
  if (!nums || !nums.length) return '';
  return ' <span class="cite">' + nums.map(n => `<button data-goto="sources" title="Source ${n}">[${n}]</button>`).join(' ') + '</span>';
}
function flagPills(t) {
  let h = '';
  if (t.status === 'disagree') h += ' <span class="pill differ">DIFFER</span>';
  if (t.status === 'single-source') h += ' <span class="pill onesrc">1 SRC</span>';
  if (t.status === 'unconfirmed') h += ' <span class="pill open">OPEN</span>';
  if (t.missable === 'flagged') h += ' <span class="pill flagged">MISSABLE?</span>';
  if (t.missable === 'watch') h += ' <span class="pill watch">WATCH</span>';
  return h;
}
function disagreementsFor(id) {
  return DATA.disagreements.map((d, i) => ({ d, i })).filter(x => x.d.trophyIds.includes(id));
}

/* ---------------- audit ---------------- */
function auditNumbers() {
  const T = DATA.trophies;
  const totalSteps = T.reduce((n, t) => n + t.steps.length, 0);
  const citedSteps = T.reduce((n, t) => n + citedCount(t), 0);
  const count = pred => T.filter(pred).length;
  return {
    trophies: T.length, totalSteps, citedSteps,
    confirmed: count(t => t.status === 'confirmed'),
    verified: count(t => t.status === 'verified'),
    singleSource: count(t => t.status === 'single-source'),
    disagree: count(t => t.status === 'disagree'),
    unconfirmed: count(t => t.status === 'unconfirmed'),
    confirmedMissable: count(t => t.missable === 'flagged' && t.status === 'confirmed'),
    possiblyMissable: count(t => t.missable === 'flagged'),
    watch: count(t => t.missable === 'watch'),
    sources: DATA.sources.length,
    platinumBand: DATA.roadmap.totalHours
  };
}
function renderAudit() {
  const a = auditNumbers();
  const m = (v, lab) => `<span class="audit-metric"><b>${esc(v)}</b><span class="lab">${esc(lab)}</span></span>`;
  $('#audit-strip').innerHTML =
    '<span class="audit-metric"><b>AUDIT</b><span class="lab">counted from the data</span></span>' +
    m(a.trophies, 'Trophies') +
    m(`${a.citedSteps}/${a.totalSteps}`, 'Steps cited') +
    m(a.confirmed, 'Confirmed methods') +
    m(a.verified, 'Verified cross-source') +
    m(a.singleSource, 'Single-source · 1 SRC') +
    m(a.disagree, 'Disputed · DIFFER') +
    m(a.unconfirmed, 'Unconfirmed · OPEN') +
    m(a.confirmedMissable, 'Confirmed missable') +
    m(a.possiblyMissable, 'Possibly missable') +
    m(a.watch, 'Cutoff watch') +
    m(a.sources, 'Sources audited') +
    m(a.platinumBand, 'Platinum band');
}

/* ---------------- sidebar ---------------- */
function trophyFraction(t) {
  if (isEarned(t.id)) return 1;
  if (t.counter) return Math.min(1, counterOf(t.id) / t.counter.target);
  return 0;
}
function renderSidebar() {
  const T = DATA.trophies;
  const earned = T.filter(t => isEarned(t.id)).length;
  $('#earned-count').textContent = `${earned} / ${T.length}`;
  const pct = Math.round(earned / T.length * 100);
  $('#ring-pct').textContent = pct + '%';
  const C = 2 * Math.PI * 44;
  const arc = $('#ring-arc');
  arc.style.strokeDasharray = C.toFixed(1);
  arc.style.strokeDashoffset = (C * (1 - earned / T.length)).toFixed(1);
  const g = { platinum: [0, 0], gold: [0, 0], silver: [0, 0], bronze: [0, 0] };
  for (const t of T) { g[t.grade][1]++; if (isEarned(t.id)) g[t.grade][0]++; }
  $('#grade-totals').innerHTML = ['platinum', 'gold', 'silver', 'bronze']
    .map(k => `<span><b>${g[k][0]}/${g[k][1]}</b> ${k[0].toUpperCase()}</span>`).join('');
  $('#spoiler-toggle').textContent = shieldOn() ? 'Spoilers hidden' : 'Spoilers shown';
  $$('#main-nav button').forEach(b => b.classList.toggle('active', b.dataset.nav === currentView));
}

/* ---------------- ledger ---------------- */
function renderBanner() {
  const cps = DATA.roadmap.checkpoints.slice(0, 3);
  $('#checkpoint-banner').innerHTML =
    '<span class="cb-h">Mandatory manual saves</span>' +
    cps.map(cp => `<button data-open="${cp.trophyIds[0]}">${esc(cp.label)}</button>`).join('') +
    '<span>— full timeline in the Roadmap.</span>';
}
function renderNextUp() {
  const stageOrder = DATA.roadmap.stages.map(s => s.key);
  const rank = t => (t.missable === 'flagged' ? 0 : t.missable === 'watch' ? 1 : 2);
  const next = DATA.trophies.filter(t => !isEarned(t.id))
    .sort((a, b) => rank(a) - rank(b) || stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage) || a.id - b.id)
    .slice(0, 4);
  $('#next-up').innerHTML = '<span class="nu-h">Next up</span>' + next.map(t =>
    `<button data-open="${t.id}">${t.missable !== 'safe' ? '! ' : ''}${esc(displayName(t))}</button>`).join('');
}

function stepperHtml(t) {
  if (!t.counter) return '';
  const v = counterOf(t.id), target = t.counter.target;
  const shown = t.counter.target >= 1000 ? v.toLocaleString('en-US') : v;
  const tgt = t.counter.target >= 1000 ? target.toLocaleString('en-US') : target;
  const pct = Math.min(100, Math.round(v / target * 100));
  return `<div class="stepper" data-stepper="${t.id}">
    <span class="st-lab">Your count · ${esc(t.counter.label)}</span>
    <button data-step="dec" data-id="${t.id}" aria-label="Decrease">−</button>
    <span class="st-val">${shown} / ${tgt}</span>
    <button data-step="inc" data-id="${t.id}" aria-label="Increase">+</button>
    <span class="st-bar"><span class="st-fill" style="display:block;width:${pct}%"></span></span>
  </div>`;
}

function renderDetail() {
  const t = byId(selectedId) || byId(28);
  const panel = $('#detail-panel');
  const masked = isMasked(t);
  const head = `<div class="detail-head">
      <span class="d-num">TROPHY ${t.id} OF 55</span>
      <h2>${esc(displayName(t))}</h2>
      <span class="grade-chip ${t.grade}">${GRADE_LABEL[t.grade]}</span>
      <span class="pill status-${t.status}">${STATUS_LABEL[t.status]}</span>
      ${t.missable === 'flagged' ? '<span class="pill flagged">Possibly missable</span>' : t.missable === 'watch' ? '<span class="pill watch">Watch</span>' : '<span class="pill safe">Not missable</span>'}
      <span class="spacer"></span>
      <span class="d-num">${esc(t.stage)} · ${esc(t.kind)}</span>
    </div>`;
  if (masked) {
    panel.innerHTML = head + `<p class="official">The spoiler shield is on, so this trophy's name, description and guide stay covered until you earn it or reveal it. It belongs to stage ${esc(t.stage.slice(0, 2))} of the roadmap.</p>
      <div class="detail-actions">
        <button class="btn" data-reveal="${t.id}">Reveal this one</button>
        <button class="btn ghost" data-earn="${t.id}">${isEarned(t.id) ? 'Earned ✓ (undo)' : 'Mark earned'}</button>
      </div>`;
    return;
  }
  let left = `<div class="d-label">Official description</div><p class="official">“${esc(t.description)}”</p>
    <div class="d-label">In short</div><p class="in-short">${esc(t.in_short)}</p>`;
  if (t.id === 28) {
    left += `<div class="alert-box"><div class="ab-h">Missable? Possibly — precaution required</div>
      <p><b>Version A — it counts:</b> the balcony session adds +1 to the Meditations counter, and the window closes when Chapter 1 ends.${citeHtml([1, 3, 4])}</p>
      <p><b>Version B — it may not be required:</b> the session is not a marked Meditation Spot, and the 100% checklist needs only 15 of 18 meditations.${citeHtml([1, 2])}</p>
      <p><b>Precaution:</b> do it anyway, and keep a Chapter 1 manual save until the trophy pops. Full panel in Missables &amp; Disagreements.</p></div>`;
  } else if (t.missable === 'watch') {
    const w = DATA.roadmap.watchList.find(x => x.trophyId === t.id);
    left += `<div class="alert-box" style="background:#f7ecd0;border-color:#c9a227;border-left-color:#c9a227"><div class="ab-h" style="color:#7a5b06">Cutoff watch</div><p>${esc(w ? w.text : 'Time-sensitive — see the Roadmap watch list.')}</p></div>`;
  }
  const srcNames = t.sources.map(n => { const s = DATA.sources.find(x => x.n === n); return s ? `[${n}] ${s.name}` : `[${n}]`; }).join(' · ');
  left += `<div class="d-label">Sources for this entry</div><p style="font-size:12.5px;margin:0">${esc(srcNames)} · read 20 Nov 2026</p>`;
  const dis = disagreementsFor(t.id);
  if (dis.length) {
    left += `<div class="dispute-note">On the record: ${dis.map(x => `<button data-goto="missables">${esc(x.d.topic)}</button>`).join(' · ')}</div>`;
  }
  let right;
  if (t.status === 'unconfirmed') {
    right = `<div class="d-label">Method</div>
      <div class="unconfirmed-box"><span class="ub-h">Method unconfirmed across consulted sources — no fabricated steps.</span>
      <div style="margin-top:4px">What is known:</div>
      <ul class="known-list">${(t.known || []).map(k => `<li>${esc(k.t)}${citeHtml(k.c)}</li>`).join('')}</ul></div>`;
  } else {
    right = `<div class="d-label">How to get it · in our own words</div>
      <ol class="steps">${t.steps.map(s => `<li>${esc(s.t)}${citeHtml(s.c)}</li>`).join('')}</ol>`;
  }
  right += stepperHtml(t);
  right += `<div class="detail-actions">
      <button class="btn ${isEarned(t.id) ? 'earned-on' : ''}" data-earn="${t.id}">${isEarned(t.id) ? 'Earned ✓ (click to undo)' : 'Mark earned'}</button>
      ${t.hidden && shieldOn() ? `<button class="btn ghost" data-hide="${t.id}">Re-hide</button>` : ''}
    </div>`;
  panel.innerHTML = head + `<div class="detail-grid"><div>${left}</div><div>${right}</div></div>`;
}

function passesFilters(t) {
  const q = $('#f-search').value.trim().toLowerCase();
  if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
  const g = $('#f-grade').value; if (g && t.grade !== g) return false;
  const st = $('#f-stage').value; if (st && t.stage !== st) return false;
  const k = $('#f-kind').value; if (k && t.kind !== k) return false;
  const s = $('#f-status').value; if (s && t.status !== s) return false;
  const m = $('#f-missable').value; if (m && t.missable !== m) return false;
  if ($('#f-unearned').checked && isEarned(t.id)) return false;
  return true;
}
function renderChecklist() {
  const wrap = $('#checklist');
  let shown = 0;
  wrap.innerHTML = DATA.roadmap.stages.map(stage => {
    const rows = DATA.trophies.filter(t => t.stage === stage.key && passesFilters(t));
    shown += rows.length;
    if (!rows.length) return '';
    const done = DATA.trophies.filter(t => t.stage === stage.key && isEarned(t.id)).length;
    const total = DATA.trophies.filter(t => t.stage === stage.key).length;
    return `<div class="stage-group"><div class="stage-group-h"><h3>${esc(stage.key)}</h3><span class="sg-meta">${done}/${total} earned · ${esc(stage.hours.label)}</span></div>` +
      rows.map(t => {
        const masked = isMasked(t);
        return `<div class="trophy-row ${isEarned(t.id) ? 'earned' : ''} ${t.id === selectedId ? 'selected' : ''}" data-row="${t.id}">
          <input type="checkbox" data-check="${t.id}" ${isEarned(t.id) ? 'checked' : ''} aria-label="Mark ${esc(t.name)} earned">
          <div class="tr-main" data-open="${t.id}">
            <div class="tr-name">${masked ? '<span class="hidden-name">Hidden trophy</span>' : esc(t.name)}${flagPills(t)}</div>
            <div class="tr-desc">${masked ? `Hidden until earned · stage ${esc(t.stage.slice(0, 2))} · ${esc(t.kind)}` : esc(t.description)}</div>
            <div class="tr-meta"><span class="grade-chip ${t.grade}">${GRADE_LABEL[t.grade]}</span><span class="pill status-${t.status}">${STATUS_LABEL[t.status]}</span>${t.counter ? `<span class="tr-desc">${esc(t.counter.label)}: ${counterOf(t.id)}/${t.counter.target}</span>` : ''}</div>
          </div>
          <div class="tr-right"><div class="ratio">${ratioText(t)}</div><div>${t.steps.length ? 'steps cited' : 'no steps printed'}</div>${masked ? `<button class="reveal-btn" data-reveal="${t.id}">Reveal</button>` : ''}</div>
        </div>`;
      }).join('') + '</div>';
  }).join('');
  $('#shown-count').textContent = `${shown} shown`;
}

/* ---------------- roadmap ---------------- */
function stageMid(stage) { return (stage.hours.lo + stage.hours.hi) / 2; }
function paceData() {
  return DATA.roadmap.stages.map(stage => {
    const ts = stage.trophyIds.map(byId).filter(Boolean);
    const frac = ts.length ? ts.reduce((n, t) => n + trophyFraction(t), 0) / ts.length : 1;
    const mid = stageMid(stage);
    return { stage, mid, remaining: mid * (1 - frac), frac };
  });
}
function renderRoadmap() {
  const R = DATA.roadmap;
  $('#rm-total').textContent = R.totalHours;
  $('#rm-basis').textContent = `${R.hoursBasis} Difficulty ${R.difficulty} · ${R.playthroughs} playthrough · ${R.totalHoursNote}.`;
  $('#stage-cards').innerHTML = R.stages.map(stage => {
    const ts = stage.trophyIds.map(byId).filter(Boolean);
    const done = ts.filter(t => isEarned(t.id)).length;
    const pct = ts.length ? Math.round(ts.reduce((n, t) => n + trophyFraction(t), 0) / ts.length * 100) : 100;
    return `<div class="stage-card"><div class="sc-head"><h3>${esc(stage.key)}</h3><span class="sc-count">${done}/${ts.length} earned</span><span class="sc-hours">${esc(stage.hours.label)}</span></div>
      <p>${esc(stage.text)}</p>
      <div class="chip-row">${ts.map(t => `<button class="tchip ${isEarned(t.id) ? 'done' : ''}" data-open="${t.id}">${esc(displayName(t))}</button>`).join('')}</div>
      <div class="bar"><div style="width:${pct}%"></div></div></div>`;
  }).join('');
  $('#checkpoint-list').innerHTML = R.checkpoints.map(cp =>
    `<div class="checkpoint-item"><span class="cp-n">${cp.n}</span><div><button data-open="${cp.trophyIds[0]}">${esc(cp.label)}</button><div>${esc(cp.text)}</div></div></div>`).join('');
  $('#ground-rules-list').innerHTML = R.groundRules.map(r => `<li>${esc(r)}</li>`).join('');
  $('#watch-list').innerHTML = R.watchList.map(w => {
    const t = byId(w.trophyId);
    return `<div class="watch-item ${t && t.missable === 'flagged' ? 'flagged' : ''}"><button data-open="${w.trophyId}">${esc(t ? t.name : '')}</button> — ${esc(w.text)}</div>`;
  }).join('');
  const pd = paceData();
  const remaining = pd.reduce((n, x) => n + x.remaining, 0);
  const total = pd.reduce((n, x) => n + x.mid, 0);
  $('#pace-remaining').textContent = `≈ ${Math.round(remaining)} hrs to go`;
  $('#pace-sub').textContent = `of a ${Math.round(total)}-hour stage-band budget (${R.totalHours} headline) · ${Math.round(total - remaining)} hrs banked by your checks and counters`;
  $('#pace-bars').innerHTML = pd.map(x => {
    const pct = x.mid > 0 ? Math.round((1 - x.remaining / x.mid) * 100) : 100;
    return `<div class="pace-row"><div class="pr-head"><span>${esc(x.stage.key)}</span><span>${x.mid > 0 ? `≈ ${Math.round(x.remaining)} of ${Math.round(x.mid)} hrs left` : 'rides in Stage 01'}</span></div><div class="bar"><div style="width:${pct}%"></div></div></div>`;
  }).join('');
}

/* ---------------- matrix ---------------- */
function renderMatrix() {
  const grades = ['platinum', 'gold', 'silver', 'bronze'];
  let h = grades.map(g => `<div class="mx-head">${GRADE_LABEL[g]}${g === 'gold' ? '' : ''}</div>`).join('');
  for (const stage of DATA.roadmap.stages) {
    h += `<div class="mx-stage">${esc(stage.key)}</div>`;
    for (const g of grades) {
      const ts = DATA.trophies.filter(t => t.stage === stage.key && t.grade === g);
      if (!ts.length) { h += '<div class="mx-cell"><span class="mx-empty">—</span></div>'; continue; }
      h += `<div class="mx-cell"><div class="cell-trophies">${ts.map(t =>
        `<button class="mx-chip ${isEarned(t.id) ? 'done' : ''}" data-open="${t.id}" title="${esc(t.name)} — ${ratioText(t)}">${esc(displayName(t))} <span class="mx-ratio">${t.steps.length ? citedCount(t) + '/' + t.steps.length : '—'}</span>${flagPills(t)}</button>`).join('')}</div></div>`;
    }
  }
  $('#matrix-grid').innerHTML = h;
}

/* ---------------- disagreements + evidence ---------------- */
const EVIDENCE = [
  { aspect: 'Total count of 55 trophies, including a Platinum', cells: { 1: 'a', 2: 'a', 3: 'a', 4: 'a', 5: 'a', 6: 'a', 7: 'a' } },
  { aspect: 'Grade split — 1 Platinum · 2 Gold · 6 Silver · 46 Bronze', cells: { 1: 'a', 2: 'a', 3: 'a', 4: 'a', 5: 'a', 6: 'n', 7: 'a' } },
  { aspect: '28 hidden trophies', cells: { 1: 'n', 2: 'n', 3: 'a', 4: 'a', 5: 'a', 6: 'n', 7: 'a' } },
  { aspect: 'Story structure — five chapters, named mission triggers', cells: { 1: 'a', 2: 'a', 3: 'a', 4: 'a', 5: 'a', 6: 'n', 7: 'd' }, link: 2 },
  { aspect: 'The meditation method — Ch.1 balcony, both-character spots, 18 total', cells: { 1: 'a', 2: 'a', 3: 'a', 4: 'a', 5: 'a', 6: 'n', 7: 'n' } },
  { aspect: "Missable status — exactly one candidate, and only 'possibly'", cells: { 1: 'a', 2: 'a', 3: 'a', 4: 'a', 5: 'a', 6: 'n', 7: 'a' }, link: 0 },
  { aspect: 'Platinum time — about 200 hours', cells: { 1: 'a', 2: 'a', 3: 'a', 4: 'a', 5: 'a', 6: 'n', 7: 'a' }, link: 1 },
  { aspect: '100% checklist numbers — 300 stunts · 70 of 80 challenges · 15 of 18 meditations · 8 vaults', cells: { 1: 'a', 2: 'a', 3: 'a', 4: 'a', 5: 'a', 6: 'n', 7: 'a' }, link: 3 },
  { aspect: 'Shooting ranges — 12 locations hold the 42 golds', cells: { 1: 'a', 2: 'n', 3: 'd', 4: 'a', 5: 'a', 6: 'n', 7: 'n' }, link: 4 },
  { aspect: 'Methods for the four late hidden trophies (#44, #45, #50, #51)', cells: { 1: 'a', 2: 'd', 3: 'n', 4: 'd', 5: 'd', 6: 'n', 7: 'd' }, link: 5 }
];
function evidenceTable() {
  const names = DATA.sources.map(s => s.name);
  let h = '<table class="ev"><tr><th>Aspect</th>' + DATA.sources.map(s => `<th>[${s.n}] ${esc(s.name)}</th>`).join('') + '</tr>';
  for (const row of EVIDENCE) {
    h += `<tr><td>${esc(row.aspect)}</td>` + DATA.sources.map(s => {
      const v = row.cells[s.n] || 'n';
      if (v === 'a') return '<td class="agree">Agrees</td>';
      if (v === 'd') return `<td class="diff" ${row.link != null ? `data-goto="missables" title="Opens disagreement ${row.link + 1}"` : ''}>Differs</td>`;
      return '<td class="nc">Not covered</td>';
    }).join('') + '</tr>';
  }
  return h + '</table>';
}
function coverage(n) {
  let trophies = 0, steps = 0;
  for (const t of DATA.trophies) {
    const inSteps = t.steps.filter(s => s.c.includes(n)).length;
    const inKnown = (t.known || []).filter(s => s.c.includes(n)).length;
    steps += inSteps + inKnown;
    if (t.sources.includes(n) || inSteps || inKnown) trophies++;
  }
  return { trophies, steps };
}
function sourcesCompactTable() {
  let h = '<table class="src"><tr><th>#</th><th>Source</th><th>Read depth</th><th>Coverage</th></tr>';
  for (const s of DATA.sources) {
    const c = coverage(s.n);
    h += `<tr><td>[${s.n}]</td><td>${esc(s.name)}</td><td>${esc(s.depth)}</td><td>cited by ${c.trophies} of 55 entries · ${c.steps} steps</td></tr>`;
  }
  return h + '</table>';
}
function disagreementPanel(x) {
  const d = x.d;
  const names = ids => ids.map(id => { const t = byId(id); return t ? `#${id} ${t.name}` : `#${id}`; }).join(' · ');
  return `<div class="dis-panel" id="dis-${x.i}">
    <h3>${x.i + 1}. ${esc(d.topic)}</h3>
    <div style="font-size:12px;color:var(--ink2)">${esc(names(d.trophyIds))}</div>
    <div class="versions">
      <div class="version"><div class="v-h">Version A</div><p>${esc(d.versionA.claim)}</p><p>${citeHtml(d.versionA.sources)}</p></div>
      <div class="version"><div class="v-h">Version B</div><p>${esc(d.versionB.claim)}</p><p>${citeHtml(d.versionB.sources)}</p></div>
    </div>
    <div class="ruling"><span class="r-h">The edition's ruling — </span>${esc(d.ruling)}</div>
  </div>`;
}
function renderMissables() {
  const a = auditNumbers();
  const cleared = DATA.trophies.length - a.possiblyMissable - a.watch;
  $('#miss-summary').innerHTML =
    `Possibly missable <b>${a.possiblyMissable}</b> · Watch <b>${a.watch}</b> · Confirmed missable <b>${a.confirmedMissable}</b> · Cleared <b>${cleared}</b> — everything else stays available after the credits, and nothing on the 100% checklist is missable. One standing warning: cheats disable trophies and saving, so keep the trophy save clean.${citeHtml([1, 4, 5])}`;
  const panels = DATA.disagreements.map((d, i) => ({ d, i }));
  $('#disagreement-list').innerHTML = panels.length ? disagreementPanel(panels[0]) : '';
  $('#disagreement-rest').innerHTML = panels.slice(1).map(disagreementPanel).join('');
  $('#evidence-matrix-compact').innerHTML = evidenceTable();
  $('#sources-compact').innerHTML = sourcesCompactTable();
}

/* ---------------- sources ---------------- */
function renderSources() {
  $('#source-list').innerHTML = DATA.sources.map(s => {
    const c = coverage(s.n);
    return `<div class="source-card"><div class="source-num">${s.n}</div><div>
      <h3><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a></h3>
      <p>${esc(s.note)}</p>
      <p class="source-meta">Read depth: <b>${esc(s.depth)}</b> · Read ${esc(s.readDate)} · Coverage: cited by <b>${c.trophies} of 55</b> entries, across <b>${c.steps}</b> cited steps</p>
    </div></div>`;
  }).join('');
  $('#evidence-matrix').innerHTML = evidenceTable();
}

/* ---------------- views & routing ---------------- */
const VIEWS = ['ledger', 'roadmap', 'matrix', 'missables', 'sources'];
function showView(v) {
  currentView = VIEWS.includes(v) ? v : 'ledger';
  VIEWS.forEach(x => $('#view-' + x).classList.toggle('hidden', x !== currentView));
  renderSidebar();
  $('#main').scrollTop = 0; window.scrollTo(0, 0);
}
function openTrophy(id) {
  selectedId = id;
  if (location.hash !== '#guide=' + id) { location.hash = 'guide=' + id; }
  showView('ledger'); renderDetail(); renderChecklist();
  $('#detail-panel').scrollIntoView({ block: 'start' });
}
function route() {
  const h = location.hash || '';
  const g = h.match(/^#guide=(\d+)$/);
  if (g) { selectedId = parseInt(g[1], 10); showView('ledger'); renderDetail(); renderChecklist(); return; }
  const v = h.match(/^#view=(\w+)$/);
  if (v) { showView(v[1]); return; }
  const bare = h.replace('#', '');
  if (VIEWS.includes(bare)) { showView(bare); return; }
  showView('ledger');
}

/* ---------------- export / import ---------------- */
function openModal() { $('#modal-backdrop').classList.remove('hidden'); $('#modal-msg').textContent = ''; }
function closeModal() { $('#modal-backdrop').classList.add('hidden'); }
function exportJson() { return JSON.stringify({ app: 'leonida-ledger', version: 4, state }, null, 1); }
function applyImport(text) {
  try {
    const p = JSON.parse(text);
    const st = p && p.state ? p.state : p;
    if (!st || typeof st !== 'object' || !('earned' in st)) throw new Error('shape');
    state = normalizeState(st);
    saveState(); renderAll();
    $('#modal-msg').textContent = 'Backup restored.';
  } catch (e) { $('#modal-msg').textContent = 'That backup could not be read — nothing was changed.'; }
}

/* ---------------- render all ---------------- */
function renderAll() {
  renderSidebar(); renderAudit(); renderBanner(); renderNextUp(); renderDetail(); renderChecklist();
  renderRoadmap(); renderMatrix(); renderMissables(); renderSources();
}

/* ---------------- events ---------------- */
document.addEventListener('click', e => {
  const open = e.target.closest('[data-open]');
  if (open) { openTrophy(parseInt(open.dataset.open, 10)); return; }
  const nav = e.target.closest('[data-nav]');
  if (nav) { location.hash = 'view=' + nav.dataset.nav; return; }
  const go = e.target.closest('[data-goto]');
  if (go) { location.hash = 'view=' + go.dataset.goto; return; }
  const step = e.target.closest('[data-step]');
  if (step) {
    const id = parseInt(step.dataset.id, 10); const t = byId(id); if (!t || !t.counter) return;
    const delta = step.dataset.step === 'inc' ? 1 : -1;
    const stepSize = t.counter.target >= 1000 ? 1000 : 1;
    state.counters[id] = Math.min(t.counter.target, Math.max(0, counterOf(id) + delta * stepSize));
    saveState(); renderDetail(); renderChecklist(); renderSidebar(); renderRoadmap(); renderNextUp();
    return;
  }
  const earn = e.target.closest('[data-earn]');
  if (earn) {
    const id = parseInt(earn.dataset.earn, 10);
    if (isEarned(id)) delete state.earned[id]; else state.earned[id] = true;
    saveState(); renderAll(); route();
    return;
  }
  const rev = e.target.closest('[data-reveal]');
  if (rev) { state.revealed[parseInt(rev.dataset.reveal, 10)] = true; saveState(); renderDetail(); renderChecklist(); renderMatrix(); return; }
  const hide = e.target.closest('[data-hide]');
  if (hide) { delete state.revealed[parseInt(hide.dataset.hide, 10)]; saveState(); renderDetail(); renderChecklist(); renderMatrix(); return; }
});
document.addEventListener('change', e => {
  const chk = e.target.closest('[data-check]');
  if (chk) {
    const id = parseInt(chk.dataset.check, 10);
    if (chk.checked) state.earned[id] = true; else delete state.earned[id];
    saveState(); renderAll(); route();
  }
});
['f-search', 'f-grade', 'f-stage', 'f-kind', 'f-status', 'f-missable', 'f-unearned'].forEach(id => {
  document.addEventListener('input', e => { if (e.target && e.target.id === id) renderChecklist(); });
  document.addEventListener('change', e => { if (e.target && e.target.id === id) renderChecklist(); });
});
$('#spoiler-toggle').addEventListener('click', () => { state.spoilersOff = !state.spoilersOff; saveState(); renderSidebar(); renderDetail(); renderChecklist(); renderMatrix(); renderRoadmap(); });
$('#export-open').addEventListener('click', openModal);
$('#modal-close').addEventListener('click', closeModal);
$('#modal-backdrop').addEventListener('click', e => { if (e.target.id === 'modal-backdrop') closeModal(); });
$('#exp-download').addEventListener('click', () => {
  const blob = new Blob([exportJson()], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'leonida-ledger-progress.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
});
$('#exp-copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(exportJson()); $('#modal-msg').textContent = 'Backup copied to clipboard.'; }
  catch (e) { $('#imp-text').value = exportJson(); $('#modal-msg').textContent = 'Copy blocked — the backup is in the box below instead.'; }
});
$('#imp-restore').addEventListener('click', () => applyImport($('#imp-text').value));
$('#imp-file').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader(); r.onload = () => applyImport(String(r.result)); r.readAsText(f);
});
$('#exp-clear').addEventListener('click', () => {
  state = normalizeState({}); saveState(); renderAll(); route();
  $('#modal-msg').textContent = 'All progress cleared.';
});
window.addEventListener('hashchange', route);

/* ---------------- boot ---------------- */
async function boot() {
  if (window.__LL_DATA__) { DATA = window.__LL_DATA__; }
  else {
    const [t, d, s, r] = await Promise.all([
      fetch('data/trophies.json').then(x => x.json()),
      fetch('data/disagreements.json').then(x => x.json()),
      fetch('data/sources.json').then(x => x.json()),
      fetch('data/roadmap.json').then(x => x.json())
    ]);
    DATA = { trophies: t.trophies, disagreements: d.disagreements, sources: s.sources, roadmap: r };
  }
  const stageSel = $('#f-stage');
  for (const st of DATA.roadmap.stages) {
    const o = document.createElement('option'); o.value = st.key; o.textContent = st.key; stageSel.appendChild(o);
  }
  renderAll();
  route();
}
boot();
