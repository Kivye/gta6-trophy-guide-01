[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Kivye/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Kivye/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Ledger — GTA VI Trophy Guide & Tracker

A field guide and completion tracker for the 55 official Grand Theft Auto VI
PlayStation 5 trophies: 1 Platinum, 2 Gold, 6 Silver, 46 Bronze, 28 of them
hidden.

Every trophy carries an original guide written for this edition — never copied
from a guide site — and each guide ends with its sources. The tracker offers
per-trophy check-off with a progress ring and per-grade totals, counters for
the count-based trophies, filters by grade, kind, status and missable state,
name search, a spoiler mode that masks story and hidden trophies, and
Export/Import of your progress as JSON. Fully offline; no account, no network.

The platinum roadmap runs in five stages — story first, missable-first
precautions, collectibles, the big counters, then cleanup — and the missable
check is stated honestly: **0 confirmed missables**, and **1 reported,
unconfirmed candidate** (Positive Mental Attitude), labelled as such with its
sources. A completion-time band is shown only as an estimate derived from the
list's own structure, never as a measured playtime.

Built by an AI agent for make.fun's "Build the best GTA 6 trophy guide"
bounty.

## Data model — 11 fields per trophy

Every trophy record carries eleven fields. Eight live in
`app/data/trophies.json`: `id`, `name`, `description`, `grade`, `guide`,
`hidden`, `kind` and `missable` (counter trophies add `count` and
`countSource`). The other three live in `app/data/enrichment.json`, keyed by
trophy id, and are merged into each record when the app loads:

- `stage` — where the trophy belongs in the platinum plan, one of
  "01 Follow the story", "02 Missable-first", "03 Explore & collect",
  "04 Big counters" or "05 Clean up & audit". The roadmap's per-stage counts
  and the matrix rows are computed from this field, never hard-coded.
- `confidence` — how firmly the requirement is established:
  "Confirmed — Official List" when the official description fully states it,
  "Verified — Cross-checked" when the detail rests on reporting cross-checked
  across both cited lists, and "Reported — Unconfirmed" for the single
  flagged missable candidate (Positive Mental Attitude) only.
- `steps` — two to four short, concrete actions per trophy, written for this
  edition, shown as a numbered list inside each guide.

If an id were missing from the enrichment file, the app still renders it with
a stage-05 placement, a "Verified — Cross-checked" label and no steps, so the
dataset can grow without breaking the page. Both JSON documents are also
embedded in `app/index.html`, which is what keeps the guide fully offline.

## Three views

- **Trophy Ledger** (default, `#view=ledger`) — the checklist. A data audit
  strip above the list states the dataset's credentials (55/55 cited,
  11-field schema, 0 confirmed missable / 1 flagged, original text), and a
  Next Up widget recommends the next two or three unearned trophies by stage,
  then grade weight. Each card shows stage and confidence badges, the
  original guide, its numbered steps and its Sources line.
- **Completion Matrix** (`#view=matrix`) — all 55 trophies on one grid,
  five stages against four grades, every cell marked earned or unearned from
  the same saved progress as the ledger. Quick filters narrow the grid to
  unearned, earned, or the missable watch; the flagged candidate's cell is
  highlighted in a warning colour.
- **Platinum Roadmap & Missable Watch** (`#view=roadmap`) — the five-stage
  plan with trophy and earned counts computed live from the `stage` field,
  the missable panel (0 confirmed, 1 reported and unconfirmed, with its
  precaution), and a persistent source rail documenting every source and the
  method behind the labels, including that Exophase is a reported origin,
  not directly fetched.

Filters (grade, stage, kind, status, missable) and name search, spoiler
protection, per-trophy counters and JSON export/import work the same in
every view; spoiler protection masks hidden and story trophy names in the
matrix exactly as it does in the ledger.
