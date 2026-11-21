// Tracker state: which trophies are earned, saved in the browser's localStorage.
// Export writes the set to a JSON file; import reads one back. Nothing leaves the
// device unless the reader exports it. A ?demo=1 URL seeds a fixed sample of earned
// trophies so screenshots can show the tracker mid-hunt; ordinary readers start empty.
export const STORAGE_KEY = 'leonida-trophy-guide-v1';
export const SPOILER_KEY = 'leonida-trophy-guide-spoilers-v1';

// A ?demo=1 URL seeds a fixed sample of earned trophies so screenshots can show
// the tracker mid-hunt; ordinary readers start empty. Note: seeding overwrites
// whatever progress the reader had saved, so it only runs with ?demo=1.
export const DEMO_EARNED = [
  'Just Like Paradise', 'Paradise Lost', "T**s Ass Drug Money", 'Vice City, Baby!',
  'Trust', 'Break the Bank', 'Family Matters', 'DWNFALL', 'Hi-Jacked',
  'Master of None', 'Top Fun', 'Baited My Tackle', 'Stick Fiddler',
  'Whip It Good', 'The Goodtime State', 'Dime on the Dollar', 'Treat Yo Self',
  'Little Boxes', 'On the Spot', 'One Last Thing', 'Earn Cash, Not Kudos',
];

export function loadEarned() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const list = JSON.parse(raw);
    return new Set(Array.isArray(list) ? list.filter((n) => typeof n === 'string') : []);
  } catch {
    return new Set();
  }
}

export function saveEarned(earned) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort()));
  } catch {
    // Storage full or blocked: progress still works for this session.
  }
}

export function loadSpoilerHidden() {
  try {
    return localStorage.getItem(SPOILER_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveSpoilerHidden(value) {
  try {
    localStorage.setItem(SPOILER_KEY, value ? '1' : '0');
  } catch {
    // Ignore storage errors.
  }
}

export function earnedSetFromFile(text) {
  const data = JSON.parse(text);
  const names = Array.isArray(data) ? data : data.earned ?? data.trophies ?? [];
  if (!Array.isArray(names)) throw new Error('Expected a JSON array of trophy names.');
  return new Set(names.filter((n) => typeof n === 'string'));
}

export function downloadEarned(earned) {
  const blob = new Blob([JSON.stringify([...earned].sort(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gta6-trophy-progress.json';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Apply URL parameters used by screenshots and deep links:
// ?demo=1 seeds the sample progress, ?grade= / ?kind= / ?open=<id> pre-select filters
// and a trophy, ?view=roadmap scrolls to the roadmap, ?spoiler=1 hides story trophies.
export function readUrlParams() {
  const params = new URLSearchParams(location.search);
  const out = {};
  if (params.get('demo') === '1') out.demo = true;
  if (params.get('grade')) out.grade = params.get('grade');
  if (params.get('kind')) out.kind = params.get('kind');
  if (params.get('open')) out.open = Number.parseInt(params.get('open'), 10);
  if (params.get('view') === 'roadmap') out.view = 'roadmap';
  if (params.get('spoiler') === '1') out.spoiler = true;
  if (params.get('missable') === '1') out.missable = true;
  if (params.get('compact') === '1') out.compact = true;
  return out;
}
