# Leonida Trophy Guide

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/itanoriyah03-droid/gta6-trophy-guide-entry/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/itanoriyah03-droid/gta6-trophy-guide-entry/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of **Grand Theft Auto VI**, built for the [make.fun gta6-trophy-guide-01 bounty](https://make.fun/bounty/gta6-trophy-guide-01).

## What it is

- **Every trophy, with its official name, description and grade**, as PlayStation publishes them — 1 platinum, 2 gold, 6 silver, 46 bronze, 28 of them hidden until earned.
- **A guide for each trophy, written in our own words**: what to do, where, how, and when it can be missed — with its sources named beside it. Facts and counts come from [PushSquare's GTA 6 Trophy Guide & Roadmap](https://www.pushsquare.com/guides/gta-6-trophy-guide-and-roadmap) and [KeenGamer's GTA 6 Trophy Guide & Platinum Roadmap](https://www.keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies/). Where a method is still unconfirmed, the guide says so.
- **A platinum roadmap in three stages** — play the story (60–80 h), reach 100% completion (~100 h), clean up the stragglers (10–20 h) — each with its own progress bar.
- **A tracker**: tick trophies off and your progress is saved in the browser (localStorage). Export it to a file and import it back. Filters by grade and kind, a missable-only filter, a hide-earned toggle, search, and a spoiler setting that hides the names and descriptions of hidden trophies until they are earned.
- **The one missable trophy is flagged everywhere**: Positive Mental Attitude — meditate at all 18 spots, and do the Chapter 1 balcony meditation before leaving Chapter 1.

## Run it

Serve `app/` with any static server and open `index.html` in desktop Chrome. It works with the network off — every file it loads is under `app/`.

```sh
node serve.ts   # http://localhost:8080
```

Hand the entry in with `node main.ts` (writes `/output`, or `MAKEFUN_OUTPUT_DIR` outside the grader).

URL parameters (used by the screenshots in `shots.json`): `?demo=1` seeds a fixed sample of earned trophies, `?grade=` / `?kind=` pre-select filters, `?open=<id>` opens one trophy's guide, `?view=roadmap` jumps to the roadmap, `?spoiler=1` hides hidden trophies, `?missable=1` shows only the missable one.

## Files

- `app/index.html`, `app/style.css` — layout and the original Vice City night look.
- `app/app.js` — boot, rendering, filters, detail panel.
- `app/tracker.js` — saved progress, export/import, URL parameters.
- `app/roadmap.js` — roadmap stages and their progress.
- `app/data/trophies.json` — the official 55-trophy list plus our guides.
- `app/data/roadmap.json` — the three roadmap stages.
- `main.ts` — copies `app/` and `screenshots/` to `/output` and writes `dossier.json`.
