(() => {
  'use strict';
  const trophies = JSON.parse(document.getElementById('trophy-data').textContent).trophies;
  const STAGES = ['01 Follow the story', '02 Missable-first', '03 Explore & collect', '04 Big counters', '05 Clean up & audit'];
  const GRADE_WEIGHT = {platinum: 4, gold: 3, silver: 2, bronze: 1};
  let enrichment = {};
  try { enrichment = JSON.parse(document.getElementById('trophy-enrichment').textContent).trophies || {}; } catch (error) { enrichment = {}; }
  for (const trophy of trophies) {
    const extra = enrichment[String(trophy.id)] || {};
    trophy.stage = STAGES.includes(extra.stage) ? extra.stage : '05 Clean up & audit';
    trophy.confidence = ['Confirmed — Official List', 'Verified — Cross-checked', 'Reported — Unconfirmed'].includes(extra.confidence) ? extra.confidence : 'Verified — Cross-checked';
    trophy.steps = Array.isArray(extra.steps) ? extra.steps.filter(step => typeof step === 'string' && step) : [];
  }
  const byId = new Map(trophies.map(t => [String(t.id), t]));
  const key = 'leonida-ledger-v1';
  const $ = id => document.getElementById(id);
  const slug = name => name.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let earned = new Set(), counts = {}, demo = false, guideId = null, storageAvailable = true;
  let spoiler = false, guidesAll = false;
  let matrixFilter = 'all';
  const filters = ['grade', 'stage', 'kind', 'status', 'missable'];
  function validateProgress(data) {
    if (!data || data.version !== 1 || !Array.isArray(data.earned) || !data.counts || typeof data.counts !== 'object' || Array.isArray(data.counts)) throw new Error('Use a version 1 Ledger export.');
    if (data.earned.some(id => !byId.has(String(id))) || new Set(data.earned.map(String)).size !== data.earned.length) throw new Error('Unknown or duplicate trophy IDs.');
    const nextCounts = {};
    for (const [id, value] of Object.entries(data.counts)) {
      const trophy = byId.get(id);
      if (!trophy || !trophy.count || !Number.isInteger(value) || value < 0 || value > trophy.count) throw new Error('Invalid trophy counter.');
      nextCounts[id] = value;
    }
    return {earned: new Set(data.earned.map(String)), counts: nextCounts};
  }
  function readSave() {
    try {
      const raw = localStorage.getItem(key);
      if (raw) ({earned, counts} = validateProgress(JSON.parse(raw)));
    } catch (error) {
      storageAvailable = false;
      $('save-status').textContent = 'Save unavailable — use JSON backup';
    }
  }
  function progressObject() { return {version: 1, game: 'GTA VI', earned: [...earned].map(Number).sort((a,b) => a-b), counts: {...counts}}; }
  function save() {
    if (demo) { $('save-status').textContent = 'Demo save · not stored'; return; }
    try {
      localStorage.setItem(key, JSON.stringify(progressObject()));
      storageAvailable = true;
      $('save-status').textContent = 'Saved on this device';
    } catch (error) {
      storageAvailable = false;
      $('save-status').textContent = 'Save unavailable — export a backup';
    }
  }
  function summary() {
    const percent = Math.round(earned.size / trophies.length * 100);
    $('percent').textContent = `${percent}%`;
    $('progress').textContent = `${earned.size} / 55 earned`;
    $('ring').style.setProperty('--p', `${percent}%`);
    const coverBar = $('cover-bar');
    if (coverBar) { coverBar.style.width = `${percent}%`; $('cover-progress-label').textContent = `${earned.size} / 55 · ${percent}%`; }
    $('grade-summary').innerHTML = ['platinum','gold','silver','bronze'].map(grade => {
      const group = trophies.filter(t => t.grade === grade);
      const done = group.filter(t => earned.has(String(t.id))).length;
      return `<div class="grade-card ${grade}"><span class="medal" aria-hidden="true">♜</span><div><strong>${grade[0].toUpperCase()+grade.slice(1)}</strong><small>${done} of ${group.length} earned</small></div><b>${group.length}</b></div>`;
    }).join('');
  }
  function isMasked(trophy) { return spoiler && (trophy.hidden || trophy.kind === 'story') && !earned.has(String(trophy.id)); }
  function guideHTML(trophy) {
    const [body, citation] = trophy.guide.split('\n');
    const steps = trophy.steps.length ? `<div class="steps"><div class="eyebrow">STEP-BY-STEP</div><ol>${trophy.steps.map(step => `<li>${escape(step)}</li>`).join('')}</ol></div>` : '';
    return `<div class="guide"><div class="eyebrow">FIELD NOTES / HOW TO UNLOCK</div>${trophy.missable ? '<strong class="warning">REPORTED, UNCONFIRMED — NOT A CONFIRMED MISSABLE</strong>' : ''}<p>${escape(body)}</p>${steps}<p class="citation">${escape(citation)}</p>${trophy.count ? `<div class="counter-note">Tracker target: ${trophy.count.toLocaleString()}. Source: ${escape(trophy.countSource)}. Manual tracking does not verify an in-game unlock.</div>` : ''}</div>`;
  }
  function render() {
    document.body.classList.toggle('guide-view', !!guideId || guidesAll);
    const query = $('search').value.trim().toLowerCase();
    const visible = trophies.filter(t => {
      const done = earned.has(String(t.id));
      return ($('grade').value === 'all' || t.grade === $('grade').value) &&
        ($('stage').value === 'all' || t.stage.slice(0, 2) === $('stage').value) &&
        ($('kind').value === 'all' || t.kind === $('kind').value) &&
        ($('status').value === 'all' || ($('status').value === 'done' ? done : !done)) &&
        ($('missable').value === 'all' || ($('missable').value === 'reported' ? !!t.missable : $('missable').value === 'none' ? !t.missable : false)) &&
        (!query || (!isMasked(t) && t.name.toLowerCase().includes(query)));
    });
    const editorial = [1,14,15,17,40,25,30,31];
    const rank = t => String(t.id) === guideId ? -1 : editorial.includes(t.id) ? editorial.indexOf(t.id) : 100+t.id;
    visible.sort((a,b) => rank(a)-rank(b));
    $('result-count').textContent = visible.length;
    $('list-message').textContent = `${visible.length} OF 55 TROPHIES · ${spoiler ? 'UNEARNED STORY & HIDDEN NAMES PROTECTED' : 'OFFICIAL REQUIREMENTS · ORIGINAL CITED GUIDES'}`;
    $('empty').hidden = !!visible.length;
    $('spoiler-label').textContent = spoiler ? 'ON' : 'OFF';
    const pristine = demo && !guideId && !guidesAll && !spoiler && !query && filters.every(f => $(f).value === 'all');
    const peek = pristine ? visible.find(t => !isMasked(t)) : null;
    $('rows').innerHTML = visible.map(t => {
      const id = String(t.id), done = earned.has(id), masked = isMasked(t);
      const name = masked ? 'Spoiler-protected trophy' : t.name;
      return `<article class="trophy ${done ? 'done' : ''}" data-id="${id}"><div class="trophy-row"><input class="check" type="checkbox" ${done ? 'checked' : ''} data-check="${id}" aria-label="Mark ${escape(name)} earned"><details ${(guideId === id || guidesAll || (peek && String(peek.id) === id)) && !masked ? 'open' : ''}><summary><div class="trophy-text"><span class="trophy-name">${escape(name)}</span><span class="trophy-desc">${masked ? 'Name, requirement and guide concealed. Earn it or turn protection off.' : escape(t.description)}</span><span class="tags"><span class="tag">${t.kind === 'misc' ? 'Activity / misc' : t.kind}</span><span class="tag stage">${escape(t.stage)}</span><span class="tag conf">${escape(t.confidence)}</span>${t.hidden ? '<span class="tag">Hidden</span>' : ''}${t.missable ? '<span class="tag warning">Reported · unconfirmed</span>' : ''}</span></div><span class="grade ${t.grade}">${t.grade}</span><span class="chevron" aria-hidden="true">›</span></summary>${masked ? '<div class="guide">Spoiler protection is on. Turn it off to read this trophy’s guide.</div>' : guideHTML(t)}</details>${t.count && !masked ? `<label class="counter"><input type="number" min="0" max="${t.count}" step="1" value="${counts[id] || 0}" data-counter="${id}" aria-label="Progress count for ${escape(name)}"><span>/ ${t.count.toLocaleString()}</span></label>` : '<span class="counter-label">'+(done ? 'EARNED ✓' : masked ? 'PROTECTED' : 'NOT EARNED')+'</span>'}</div></article>`;
    }).join('');
    renderNextUp();
    renderMatrix();
    renderRoadmap();
    summary();
  }
  function renderNextUp() {
    const next = trophies.filter(t => !earned.has(String(t.id)))
      .sort((a, b) => a.stage.localeCompare(b.stage) || GRADE_WEIGHT[b.grade] - GRADE_WEIGHT[a.grade] || a.id - b.id)
      .slice(0, 3);
    $('next-up').innerHTML = '<span class="next-label">NEXT UP</span>' + (next.length ? next.map(t => {
      const masked = isMasked(t);
      const label = masked ? 'Spoiler-protected trophy' : t.name;
      return masked
        ? `<span class="next-chip masked"><b>${escape(t.stage.slice(0, 2))}</b> ${escape(label)} <i>${t.grade}</i></span>`
        : `<a class="next-chip" href="#guide=${slug(t.name)}"><b>${escape(t.stage.slice(0, 2))}</b> ${escape(label)} <i>${t.grade}</i></a>`;
    }).join('') : '<span class="next-chip done-all">All 55 earned — the platinum audit is complete.</span>');
  }
  function renderMatrix() {
    const modes = [['all', 'All 55'], ['open', 'Unearned'], ['done', 'Earned'], ['missable', 'Missable watch']];
    $('matrix-filters').innerHTML = modes.map(([value, label]) => `<button type="button" data-mx="${value}" class="${matrixFilter === value ? 'active' : ''}">${label}</button>`).join('');
    const shown = t => matrixFilter === 'all' || (matrixFilter === 'done' ? earned.has(String(t.id)) : matrixFilter === 'open' ? !earned.has(String(t.id)) : !!t.missable);
    let cells = 0;
    const head = `<div class="mx-corner">STAGE ╲ GRADE</div>${['platinum', 'gold', 'silver', 'bronze'].map(grade => `<div class="mx-head ${grade}">${grade}</div>`).join('')}`;
    const rowsHtml = STAGES.map(stage => {
      const inStage = trophies.filter(t => t.stage === stage);
      const doneCount = inStage.filter(t => earned.has(String(t.id))).length;
      const cols = ['platinum', 'gold', 'silver', 'bronze'].map(grade => {
        const group = inStage.filter(t => t.grade === grade);
        const chips = group.filter(shown).map(t => {
          cells++;
          const done = earned.has(String(t.id)), masked = isMasked(t);
          return `<span class="mx-chip ${done ? 'done' : ''}${t.missable ? ' flagged' : ''}" title="${escape(masked ? 'Spoiler-protected trophy' : t.name)}"><i>${done ? '✓' : '○'}</i>${escape(masked ? 'Spoiler-protected' : t.name)}</span>`;
        }).join('');
        return `<div class="mx-cell">${chips || '<span class="mx-none">—</span>'}</div>`;
      }).join('');
      return `<div class="mx-rowhead"><strong>${escape(stage)}</strong><small>${doneCount} / ${inStage.length} earned</small></div>${cols}`;
    }).join('');
    $('matrix-grid').innerHTML = head + rowsHtml;
    $('matrix-count').textContent = cells;
  }
  function renderRoadmap() {
    for (const stage of STAGES) {
      const group = trophies.filter(t => t.stage === stage);
      const done = group.filter(t => earned.has(String(t.id))).length;
      $(`count-${stage.slice(0, 2)}`).textContent = `· ${group.length} ${group.length === 1 ? 'trophy' : 'trophies'} · ${done} earned`;
    }
  }
  function toast(message) {
    $('toast').textContent = message; $('toast').hidden = false;
    clearTimeout(toast.timer); toast.timer = setTimeout(() => {$('toast').hidden = true;}, 3500);
  }
  function applyHash() {
    const params = new URLSearchParams(location.hash.slice(1));
    const nextDemo = params.get('demo') === '1';
    if (nextDemo !== demo) {
      demo = nextDemo;
      earned = new Set(); counts = {};
      if (demo) { earned = new Set([2,3,8,16,20,21,33].map(String)); counts = {'15':87,'17':16,'31':24}; }
      else readSave();
    }
    $('save-status').textContent = demo ? 'Demo save · not stored' : storageAvailable ? 'Saved on this device' : 'Save unavailable — use JSON backup';
    spoiler = params.get('spoiler') === '1'; $('spoiler').checked = spoiler;
    filters.forEach(id => {const value = params.get(id) || 'all'; $(id).value = [...$(id).options].some(o => o.value === value) ? value : 'all';});
    $('search').value = params.get('q') || '';
    guideId = String(trophies.find(t => slug(t.name) === params.get('guide'))?.id || '') || null;
    guidesAll = params.get('guides') === 'all';
    const view = params.get('view');
    const roadmap = view === 'roadmap', matrix = view === 'matrix';
    $('roadmap').hidden = !roadmap; $('matrix').hidden = !matrix;
    document.body.classList.toggle('roadmap-view', roadmap);
    document.body.classList.toggle('matrix-view', matrix);
    $('nav-list').classList.toggle('active', !roadmap && !matrix);
    $('nav-matrix').classList.toggle('active', matrix);
    $('nav-roadmap').classList.toggle('active', roadmap);
    $('backup').hidden = params.get('backup') !== '1';
    render();
    if (roadmap) requestAnimationFrame(() => $('roadmap').scrollIntoView({block:'start'}));
    else if (matrix) requestAnimationFrame(() => $('matrix').scrollIntoView({block:'start'}));
    else window.scrollTo(0,0);
  }
  function updateHash() {
    const params = new URLSearchParams(location.hash.slice(1));
    filters.forEach(id => $(id).value === 'all' ? params.delete(id) : params.set(id, $(id).value));
    spoiler ? params.set('spoiler','1') : params.delete('spoiler');
    $('search').value ? params.set('q',$('search').value) : params.delete('q');
    history.replaceState(null, '', `#${params}`);
  }
  filters.forEach(id => $(id).addEventListener('change', () => {updateHash(); render();}));
  $('search').addEventListener('input', () => {updateHash(); render();});
  $('spoiler').addEventListener('change', () => {spoiler = $('spoiler').checked; updateHash(); render();});
  $('reset').addEventListener('click', () => {filters.forEach(id => $(id).value='all'); $('search').value=''; guideId=null; const p=new URLSearchParams(location.hash.slice(1));p.delete('guide');history.replaceState(null,'',`#${p}`);updateHash();render();});
  $('rows').addEventListener('change', event => {
    const input = event.target;
    if (input.dataset.check) {
      const id = input.dataset.check;
      input.checked ? earned.add(id) : earned.delete(id);
      if (input.checked && byId.get(id).count) counts[id] = byId.get(id).count;
      save(); render();
    }
    if (input.dataset.counter) {
      const id = input.dataset.counter, value = Number(input.value);
      counts[id] = Math.min(byId.get(id).count, Math.max(0, Number.isFinite(value) ? Math.floor(value) : 0));
      input.value = counts[id]; save();
    }
  });
  $('rows').addEventListener('toggle', event => {
    if (event.target.tagName !== 'DETAILS') return;
    const article = event.target.closest('.trophy');
    if (event.target.open && article) {
      guideId = article.dataset.id;
      if (!isMasked(byId.get(guideId))) {
        const params = new URLSearchParams(location.hash.slice(1));
        params.set('guide', slug(byId.get(guideId).name)); history.replaceState(null,'',`#${params}`);
      }
    }
  }, true);
  $('matrix-filters').addEventListener('click', event => {
    const mode = event.target && event.target.dataset ? event.target.dataset.mx : null;
    if (mode && mode !== matrixFilter) { matrixFilter = mode; renderMatrix(); }
  });
  $('backup-toggle').addEventListener('click', () => {
    $('backup').hidden = !$('backup').hidden;
    const params = new URLSearchParams(location.hash.slice(1));
    $('backup').hidden ? params.delete('backup') : params.set('backup','1');
    history.replaceState(null,'',`#${params}`);
  });
  $('backup-close').addEventListener('click', () => $('backup-toggle').click());
  $('export').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(progressObject(),null,2)], {type:'application/json'}));
    const link = document.createElement('a'); link.href=url;link.download='leonida-ledger-progress.json';link.click();
    setTimeout(() => URL.revokeObjectURL(url),1000); toast('Progress exported as JSON.');
  });
  $('import').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      if (file.size > 1048576) throw new Error('Progress files must be under 1 MiB.');
      const next = validateProgress(JSON.parse(await file.text()));
      ({earned,counts} = next); save(); render();
      $('import-status').textContent = `Imported ${earned.size} earned trophies${demo ? ' into demo only' : ''}.`;
    } catch (error) { $('import-status').textContent = `Import failed: ${error.message} Your progress was kept.`; }
    event.target.value='';
  });
  window.addEventListener('hashchange', applyHash);
  readSave(); applyHash();
})();
