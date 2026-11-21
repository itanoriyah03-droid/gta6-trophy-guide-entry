// The platinum roadmap: three stages in order, each naming the trophies it covers.
// Stage progress is the share of that stage's trophies already earned, so the reader
// sees at a glance which stage they are in and what is left in it.
export function stageProgress(stage, earned) {
  const total = stage.trophyIds.length;
  const done = stage.trophyIds.filter((id) => earned.has(id)).length;
  return { total, done, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export function stageCard(stage, progress, onSelect) {
  const card = document.createElement('article');
  card.className = 'stage';
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-pressed', 'false');
  const title = document.createElement('h3');
  title.textContent = stage.title;
  const hours = document.createElement('p');
  hours.className = 'hours';
  hours.textContent = stage.hours + ' estimated';
  const summary = document.createElement('p');
  summary.textContent = stage.summary;
  const bar = document.createElement('div');
  bar.className = 'bar';
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-valuenow', String(progress.pct));
  bar.setAttribute('aria-valuemin', '0');
  bar.setAttribute('aria-valuemax', '100');
  bar.setAttribute('aria-label', stage.title + ' progress');
  const fill = document.createElement('i');
  fill.style.width = progress.pct + '%';
  bar.append(fill);
  const count = document.createElement('p');
  count.className = 'stage-count';
  count.textContent = progress.done + ' of ' + progress.total + ' trophies earned — ' + progress.pct + '%';
  const tips = document.createElement('ul');
  for (const tip of stage.tips) {
    const li = document.createElement('li');
    li.textContent = tip;
    tips.append(li);
  }
  card.append(title, hours, summary, bar, count, tips);
  const activate = () => onSelect(stage);
  card.addEventListener('click', activate);
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate();
    }
  });
  return card;
}

// Selecting a stage filters the checklist to that stage's trophies and scrolls to it.
export function trophiesForStage(stage, trophiesById) {
  return stage.trophyIds.map((id) => trophiesById.get(id)).filter(Boolean);
}
