[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Kivye/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Kivye/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Ledger — GTA VI Trophy Guide & Tracker

A printed-ledger style guide and tracker for all **55 Grand Theft Auto VI trophies** on PlayStation 5: 1 Platinum, 2 Gold, 6 Silver, 46 Bronze, 28 of them hidden. It is a fully static, offline web app — open it, track your run, and keep it next to the game.

Version 4 is a ground-up content rebuild. Earlier editions listed the trophies and summarised them; this one rebuilds the content layer to **method level**: for every trophy, a one-breath summary and a short list of numbered, tactical steps — the mission trigger, the location, the button prompt, the menu path, the chapter cutoff — each step carrying the numbers of the sources that support it.

## What is new in v4

- **Method-level rewrite of all 55 guides.** 171 steps in total, and **171 of 171 steps are cited** — the citation ratio is computed from the data file and printed in the audit strip, not asserted.
- **Per-step citations.** Steps cite seven numbered sources (below) individually, so a claim can be traced to the page it came from.
- **A status taxonomy with zero fabricated steps.** Every trophy is labelled exactly one of:
  - `confirmed` — the method is the official requirement itself, confirmed by a full-method source (the story trophies, the Platinum);
  - `verified` — the method is cross-checked in two or more sources;
  - `single-source` — the method rests on one source only (flagged `1 SRC` everywhere it appears);
  - `disagree` — the sources conflict on the method or its condition, and both versions are printed (flagged `DIFFER`);
  - `unconfirmed` — **no consulted source gives a method, so the trophy carries no steps at all** (flagged `OPEN`). Instead of invented instructions, its card shows a transparent status box and what *is* known. In this edition that is Fair Game (#29 — the questline is documented, the unlocking animal is not) and Bad Luck, I Guess (#49 — no source publishes a trigger).
- **The audit strip.** About a dozen metrics computed at runtime from the data files: trophies, steps cited X/X, confirmed / verified / single-source / disputed / unconfirmed counts, confirmed missable (0), possibly missable (1), cutoff watch (2), sources audited (7), and the Platinum time band (~200 hrs, with the 300 hrs figure on the record in the disagreements).
- **Missables & Disagreements view.** The one possibly missable trophy (Positive Mental Attitude) and the watch set get a dedicated view, followed by every verified disagreement between the sources — six at the time of writing, including the balcony-meditation requirement, the 200 vs 300+ hour Platinum estimates, which chapter holds the final mission, the 5 vs 8 vs 22 bank-vault numbers, the shooting-range count, and four hidden trophies whose methods one source publishes while three others still list them as unknown. Each disagreement shows Version A and Version B side by side, with their sources, and the edition's ruling underneath.
- **The high-stakes default.** The Ledger opens on Positive Mental Attitude — the one trophy with a closing window — with its Missable Precaution Alert, both versions of the dispute, the full cited method, and its interactive counter.
- **Counter steppers.** Every trophy with a concrete sourced count gets a working stepper that persists: 18 meditations, 250 stunts, 42 range golds, 100 WAiNK locations, 50 challenges, $250,000 laundered, 8 garages, and more.
- **A roadmap with a time economy.** Five stages with source-based hour bands (story 60–80 hrs, checklist ≈100 hrs, cleanup 10–20 hrs), ground rules, a chapter cutoff watch list, and the **Mandatory Manual Save Checkpoints** — five numbered saves tied to the moments that close (the Chapter 1 balcony window, the Coffee Break unlock, the chapter starts, the pre-finale save). A banner in the Ledger links the next checkpoints to their trophies.
- **Platinum Pace.** An interactive time-budget bar on the Roadmap: remaining estimated hours are recomputed live from the stage bands as you check trophies off or move counters (a counter at k of its target counts as that fraction of its trophy).
- **Completion Matrix.** Stages × grades, all 55 trophies, each cell showing its step-citation ratio and the `DIFFER` / `1 SRC` / `OPEN` flags where they apply.
- **Cross-Source Evidence Matrix.** In the Sources view (and in compact form inside the disagreements view): the verification aspects this edition had to settle, scored per source as Agrees / Differs / Not covered — only ever from what that source actually states.

## The seven sources

Numbered as cited throughout the app; coverage (entries and steps citing each) is computed by the app from the data, never typed in. All read 2026-11-20.

| # | Source | Read depth | What it contributed |
|---|--------|-----------|---------------------|
| 1 | PowerPyx — GTA 6 Trophy Guide & Roadmap | Full method walkthrough | Primary method source: per-trophy methods, the meditation sequence, roadmap phases, difficulty 4/10, the ~200-hour estimate |
| 2 | KeenGamer — GTA 6 Trophy Guide & Platinum Roadmap | Full page | Numbered roadmap steps, the fullest 100% checklist tables, the Chapter 1 meditation step-by-step |
| 3 | Output Lag — GTA 6 Trophy List | Full page | Full list with method sections; the four save rules, the Yago timed-race warning |
| 4 | GTABase — GTA 6 Trophy Guide & Achievements List | Full page | List and metadata cross-check, a how-to note on every trophy, Gamerscore values |
| 5 | GTA-Zone — GTA 6 Trophies & Achievements | Full page | One-line methods, roadmap and FAQ; the missable reporting |
| 6 | Exophase — GTA VI (PS5) | List & metadata only (indirect) | The public PS5 list itself, as reported by Push Square from Exophase's listing. The direct page did not resolve during the build session (404 at the listed address), so no method content is taken from it; it anchors the list's provenance only |
| 7 | eGamers — GTA 6 Trophy List, Plus the Hardest Ones | Full page | Hardest-trophy analysis, trophy-vs-checklist targets, the final-mission chapter dispute |

All guide text in the app is written in this project's own words from those pages. Facts, methods, counts and sequences are the research; the sources' sentences are not reproduced.

## Data model

`app/data/trophies.json` — one record per trophy:

- `id`, `name`, `description`, `grade`, `hidden`, `kind`, `stage` — the official fields, reproduced exactly;
- `in_short` — a 70–150 character summary in our own words;
- `steps` — an array of `{t, c}`: one tactical step, and the source numbers that support that step;
- `known` — for unconfirmed trophies only, the same `{t, c}` shape listing what is documented;
- `status` — one of `confirmed`, `verified`, `single-source`, `disagree`, `unconfirmed`;
- `missable` — `safe`, `watch`, or `flagged`;
- `counter` — `null`, or `{label, target}` where the official description or a read source states a concrete count;
- `sources` — the source numbers the entry rests on.

`app/data/disagreements.json` — `{topic, trophyIds, versionA {claim, sources}, versionB {claim, sources}, ruling}` per disagreement.
`app/data/sources.json` — the seven sources with URL, honest read-depth label, note, and read date.
`app/data/roadmap.json` — the five stages with hour bands and tactical text, difficulty and playthroughs, ground rules, the save checkpoints, and the watch list.

## The app

Five views, hash-routed (`#view=roadmap`, `#guide=28`, …): **Ledger** (masthead, audit strip, save-checkpoint banner, detail panel, filters, checklist), **Roadmap**, **Matrix**, **Missables & Disagreements**, **Sources**. Kept from earlier editions and rebuilt: per-trophy check-off with a progress ring and per-grade totals, name search, filters (grade, stage, kind, status, missable), a spoiler shield that masks hidden trophies until earned or revealed, and Export/Import of progress as JSON (progress is stored in the browser; the backup is the portable copy).

## Screenshots

Four frames at 1280×800 in `screenshots/`: `01-cover.jpg` (Ledger with the audit strip, checkpoint banner and the Positive Mental Attitude detail open), `02-roadmap.jpg` (stage hours, Platinum Pace, ground rules, watch list), `03-matrix.jpg` (the full Completion Matrix with citation ratios and flags), `04-disagreements.jpg` (a two-version disagreement panel with the compact evidence matrix and source table).

## Running it

It is a static site with no build step and no dependencies. Serve the `app/` folder with any static file server (for example `python3 -m http.server -d app`) and open `index.html`. `node build-out.mjs` produces `out/`, a self-contained copy with the data inlined (used for screenshot capture from `file://`); `node capture-cdp.mjs` re-shoots the four frames with headless Chrome; `node verify.mjs` runs the full verification suite — data integrity against the official list and audit formulas, plus headless-Chrome behaviour checks (all five views, the default detail and its stepper, the pace calculator reacting to a check-off, export/import round-trip, the spoiler shield, zero console errors).
