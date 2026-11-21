// Leonida Trophy Guide — boot, render and events.
// Loads the official trophy list and the roadmap, renders the checklist, the detail
// panel and the progress ring, and keeps earned trophies in localStorage.
import {
  DEMO_EARNED,
  loadEarned,
  saveEarned,
  loadSpoilerHidden,
  saveSpoilerHidden,
  earnedSetFromFile,
  downloadEarned,
  readUrlParams,
} from './tracker.js';
import { stageProgress, stageCard } from './roadmap.js';

const KIND_LABELS = {
  story: 'Story',
  mission: 'Story mission',
  side: 'Side strand',
  activity: 'Activity',
  collectible: 'Collectible',
  combat: 'Combat & crime',
  exploration: 'Exploration',
  completion: '100% completion',
  misc: 'Miscellaneous',
  platinum: 'Platinum',
  online: 'Online',
};
const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];
const RING_CIRCUMFERENCE = 326.7;

const $ = (id) => document.getElementById(id);
const grid = $('grid');
const detail = $('detail');

const state = {
  trophies: [],
  byId: new Map(),
  byName: new Map(),
  roadmap: { stages: [] },
  earned: loadEarned(),
  spoilerHidden: loadSpoilerHidden(),
  search: '',
  grade: 'all',
  kind: 'all',
  missableOnly: false,
  hideEarned: false,
  stageId: null,
  selectedId: null,
};

function isSpoilerMasked(trophy) {
  return state.spoilerHidden && trophy.hidden && !state.earned.has(trophy.name);
}

function visibleTrophies() {
  const q = state.search.trim().toLowerCase();
  return state.trophies.filter((t) => {
    if (state.stageId) {
      const stage = state.roadmap.stages.find((s) => s.id === state.stageId);
      if (stage && !stage.trophyIds.includes(t.id)) return false;
    }
    if (state.kind === 'online') return false; // No online trophies: all 55 are offline.
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (state.kind !== 'all' && t.kind !== state.kind) return false;
    if (state.missableOnly && !t.missable) return false;
    if (state.hideEarned && state.earned.has(t.name)) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.guide.toLowerCase().includes(q))) return false;
    return true;
  });
}

function renderProgress() {
  const total = state.trophies.length;
  const done = state.earned.size;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  $('ringFill').style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - pct / 100));
  $('ringText').textContent = done + '/' + total;
  $('ringPct').textContent = pct + '%';
  const counts = $('gradeCounts');
  counts.replaceChildren();
  for (const grade of GRADE_ORDER) {
    const all = state.trophies.filter((t) => t.grade === grade).length;
    const got = state.trophies.filter((t) => t.grade === grade && state.earned.has(t.name)).length;
    const row = document.createElement('div');
    const dot = document.createElement('span');
    dot.className = 'dot ' + grade;
    const label = document.createElement('span');
    label.textContent = grade[0].toUpperCase() + grade.slice(1);
    const value = document.createElement('b');
    value.textContent = got + ' / ' + all;
    row.append(dot, label, value);
    counts.append(row);
  }
}

function renderRoadmap() {
  const wrap = $('stages');
  wrap.replaceChildren();
  const earnedIds = new Set(state.trophies.filter((t) => state.earned.has(t.name)).map((t) => t.id));
  for (const stage of state.roadmap.stages) {
    const progress = stageProgress(stage, earnedIds);
    const card = stageCard(stage, progress, (selected) => {
      state.stageId = state.stageId === selected.id ? null : selected.id;
      for (const el of wrap.children) el.setAttribute('aria-pressed', 'false');
      if (state.stageId) card.setAttribute('aria-pressed', 'true');
      renderGrid();
      $('grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    if (state.stageId === stage.id) card.setAttribute('aria-pressed', 'true');
    wrap.append(card);
  }
}

function cardFor(trophy) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'card' + (state.earned.has(trophy.name) ? ' earned' : '') + (state.selectedId === trophy.id ? ' selected' : '');
  const masked = isSpoilerMasked(trophy);
  const top = document.createElement('div');
  top.className = 'card-top';
  const badge = document.createElement('span');
  badge.className = 'badge ' + trophy.grade;
  badge.textContent = trophy.grade;
  const kind = document.createElement('span');
  kind.className = 'card-kind';
  kind.textContent = KIND_LABELS[trophy.kind] ?? trophy.kind;
  top.append(badge, kind);
  const name = document.createElement('p');
  name.className = 'card-name';
  name.textContent = masked ? 'Hidden trophy' : trophy.name;
  const desc = document.createElement('p');
  desc.className = 'card-desc' + (masked ? ' spoiler-mask' : '');
  desc.textContent = masked ? 'Hidden until earned — turn spoilers on to reveal it.' : trophy.description;
  const foot = document.createElement('div');
  foot.className = 'card-foot';
  if (trophy.missable) {
    const flag = document.createElement('span');
    flag.className = 'flag-missable';
    flag.textContent = '⚠ Missable';
    foot.append(flag);
  }
  if (trophy.hidden && !masked) {
    const flag = document.createElement('span');
    flag.className = 'flag-hidden';
    flag.textContent = 'Hidden on PSN';
    foot.append(flag);
  }
  if (trophy.count != null) {
    const count = document.createElement('span');
    count.className = 'card-count';
    count.textContent = '× ' + trophy.count.toLocaleString('en-US');
    foot.append(count);
  }
  const check = document.createElement('span');
  check.className = 'card-check';
  check.textContent = state.earned.has(trophy.name) ? '✓ Earned' : 'Mark earned';
  foot.append(check);
  card.append(top, name, desc, foot);
  card.addEventListener('click', () => selectTrophy(trophy.id));
  return card;
}

function renderGrid() {
  const list = visibleTrophies();
  grid.replaceChildren();
  for (const trophy of list) grid.append(cardFor(trophy));
  const total = state.trophies.length;
  $('showing').textContent = list.length === total
    ? 'Showing all 55 trophies'
    : 'Showing ' + list.length + ' of 55 trophies';
  $('onlineNote').hidden = state.kind !== 'online';
}

function sourceLinks(sources) {
  const urls = {
    PushSquare: 'https://www.pushsquare.com/guides/gta-6-trophy-guide-and-roadmap',
    KeenGamer: 'https://www.keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies/',
  };
  return sources.map((label) => {
    const a = document.createElement('a');
    a.href = urls[label] ?? '#';
    a.textContent = label;
    a.rel = 'noopener';
    return a;
  });
}

function renderDetail() {
  const trophy = state.byId.get(state.selectedId);
  detail.replaceChildren();
  if (!trophy) {
    const p = document.createElement('p');
    p.className = 'detail-empty';
    p.textContent = 'Pick a trophy card to read its guide, its sources, and whether it can be missed.';
    detail.append(p);
    return;
  }
  const masked = isSpoilerMasked(trophy);
  const badge = document.createElement('span');
  badge.className = 'badge ' + trophy.grade;
  badge.textContent = trophy.grade;
  const title = document.createElement('h2');
  title.textContent = masked ? 'Hidden trophy' : trophy.name;
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = masked
    ? 'Official name and description hidden until earned (spoiler setting on).'
    : 'Official: "' + trophy.description + '" — ' + (KIND_LABELS[trophy.kind] ?? trophy.kind) + (trophy.count != null ? ', × ' + trophy.count.toLocaleString('en-US') : '') + '.';
  detail.append(badge, title, official);
  if (trophy.missable) {
    const box = document.createElement('p');
    box.className = 'missable-box';
    const b = document.createElement('b');
    b.textContent = 'Missable — read this first. ';
    box.append(b, document.createTextNode('This is the one trophy in the list that can be missed. Do the Chapter 1 balcony meditation before leaving Chapter 1, and keep a manual save from the start of the chapter.'));
    detail.append(box);
  }
  if (!masked) {
    const guideHead = document.createElement('h3');
    guideHead.textContent = 'Guide';
    const guide = document.createElement('p');
    guide.className = 'guide';
    guide.textContent = trophy.guide;
    const stepsHead = document.createElement('h3');
    stepsHead.textContent = 'Steps';
    const steps = document.createElement('ol');
    for (const step of trophy.steps) {
      const li = document.createElement('li');
      li.textContent = step;
      steps.append(li);
    }
    const sourcesHead = document.createElement('h3');
    sourcesHead.textContent = 'Sources';
    const sources = document.createElement('p');
    sources.className = 'sources';
    sources.append(document.createTextNode('Facts and counts from '));
    const links = sourceLinks(trophy.sources);
    links.forEach((link, i) => {
      if (i > 0) sources.append(document.createTextNode(i === links.length - 1 ? ' and ' : ', '));
      sources.append(link);
    });
    sources.append(document.createTextNode('. Guide text is original to this entry.'));
    detail.append(guideHead, guide, stepsHead, steps, sourcesHead, sources);
  } else {
    const note = document.createElement('p');
    note.className = 'guide';
    note.textContent = 'Earn this trophy to reveal its guide, or turn the spoiler setting off.';
    detail.append(note);
  }
  const meta = document.createElement('p');
  meta.className = 'meta';
  meta.textContent = 'Trophy ' + trophy.id + ' of 55 · ' + trophy.grade + ' · ' + (trophy.hidden ? 'hidden on PSN' : 'visible on PSN') + (trophy.missable ? ' · missable' : '');
  const earnRow = document.createElement('div');
  earnRow.className = 'earn-row';
  const earnBtn = document.createElement('button');
  earnBtn.type = 'button';
  const earned = state.earned.has(trophy.name);
  earnBtn.textContent = earned ? '✓ Earned — click to unmark' : 'Mark as earned';
  if (earned) earnBtn.classList.add('earned-btn');
  earnBtn.addEventListener('click', () => toggleEarned(trophy));
  earnRow.append(earnBtn);
  detail.append(meta, earnRow);
}

function selectTrophy(id) {
  state.selectedId = state.selectedId === id ? null : id;
  renderGrid();
  renderDetail();
}

function toggleEarned(trophy) {
  if (state.earned.has(trophy.name)) state.earned.delete(trophy.name);
  else state.earned.add(trophy.name);
  saveEarned(state.earned);
  renderProgress();
  renderRoadmap();
  renderGrid();
  renderDetail();
}

function renderAll() {
  renderProgress();
  renderRoadmap();
  renderGrid();
  renderDetail();
  $('spoilerToggle').setAttribute('aria-pressed', String(state.spoilerHidden));
  $('spoilerToggle').textContent = state.spoilerHidden ? 'Spoilers: hidden' : 'Spoilers: show all';
}

function wireEvents() {
  $('search').addEventListener('input', (e) => { state.search = e.target.value; renderGrid(); });
  $('gradeFilter').addEventListener('change', (e) => { state.grade = e.target.value; renderGrid(); });
  $('kindFilter').addEventListener('change', (e) => { state.kind = e.target.value; renderGrid(); });
  $('missableOnly').addEventListener('change', (e) => { state.missableOnly = e.target.checked; renderGrid(); });
  $('hideEarned').addEventListener('change', (e) => { state.hideEarned = e.target.checked; renderGrid(); });
  $('spoilerToggle').addEventListener('click', () => {
    state.spoilerHidden = !state.spoilerHidden;
    saveSpoilerHidden(state.spoilerHidden);
    renderAll();
  });
  $('exportBtn').addEventListener('click', () => downloadEarned(state.earned));
  $('importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const next = earnedSetFromFile(await file.text());
      const known = new Set(state.trophies.map((t) => t.name));
      state.earned = new Set([...next].filter((n) => known.has(n)));
      saveEarned(state.earned);
      renderAll();
    } catch (err) {
      alert('Could not import that file: ' + err.message);
    }
    e.target.value = '';
  });
  $('resetBtn').addEventListener('click', () => {
    if (!confirm('Clear all earned trophies?')) return;
    state.earned = new Set();
    saveEarned(state.earned);
    renderAll();
  });
}

async function boot() {
  const [trophyDoc, roadmapDoc] = await Promise.all([
    (await fetch('data/trophies.json')).json(),
    (await fetch('data/roadmap.json')).json(),
  ]);
  state.trophies = trophyDoc.trophies;
  state.byId = new Map(state.trophies.map((t) => [t.id, t]));
  state.byName = new Map(state.trophies.map((t) => [t.name, t]));
  state.roadmap = roadmapDoc;
  const params = readUrlParams();
  if (params.demo) {
    state.earned = new Set(DEMO_EARNED);
    saveEarned(state.earned);
  }
  if (params.grade) { state.grade = params.grade; $('gradeFilter').value = params.grade; }
  if (params.kind) { state.kind = params.kind; $('kindFilter').value = params.kind; }
  if (params.missable) { state.missableOnly = true; $('missableOnly').checked = true; }
  if (params.spoiler) { state.spoilerHidden = true; saveSpoilerHidden(true); }
  if (params.open) state.selectedId = params.open;
  if (params.compact) document.body.classList.add('compact');
  wireEvents();
  renderAll();
  if (params.view === 'roadmap') $('roadmap').scrollIntoView();
}

boot().catch((err) => {
  detail.replaceChildren();
  const p = document.createElement('p');
  p.className = 'detail-empty';
  p.textContent = 'Could not load the trophy data: ' + err.message;
  detail.append(p);
});
