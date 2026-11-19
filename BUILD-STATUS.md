# Leonida Ledger — build record

Build complete and committed locally. Not pushed, not submitted.

## What the entry is

- `app/data/trophies.json`: 55 entries; names, descriptions and grades match the kit starter exactly; 28 research-derived hidden flags; story/collectible/misc kinds; 0 confirmed missables and one `reported-unconfirmed` flag (Positive Mental Attitude); counter targets with labelled sources; 55 original guides, each ending in a Sources citation line.
- `app/index.html`, `app/style.css`, `app/app.js`: original offline interface ("Leonida Ledger"), embedded JSON so it opens from file://, check-off and counters, grade progress, localStorage, validated JSON export/import, search and filters, spoiler protection, five-stage platinum roadmap with a structural time-band estimate, and the missable-honesty panel.
- Hash states for deterministic captures: `#demo=1` (labelled demo save, 7 earned), `#guide=<slug>`, `#guides=all` (expands every guide), `#spoiler=1`, `#grade=<grade>`, `#status=open`, `#view=roadmap`, `#backup=1`.
- `main.ts`: stages `out/app/` plus a root mirror for file:// captures; `--preview` stages without a dossier.
- `serve.ts`: original small static server. `verify.mjs`: dependency-free data/state tests (passes).

## Screenshots (1280×800 JPEG, all ≤ 256 KiB, visually inspected)

- `01-cover.jpg` — demo checklist, 13% progress ring, filter bar, "0 confirmed missables" rail card.
- `02-guide-open.jpg` — `#demo=1&guides=all`, scrolled to the list: three full guides open with readable text and Sources lines.
- `03-roadmap.jpg` — five stages, "Estimate from list structure" strip (1,206 counter actions + $350,000 money targets → 100+ hour band, labelled as a structural estimate), missable panel (0 confirmed, 1 reported-unconfirmed).
- `04-spoiler-filters.jpg` — spoiler protection ON, Bronze + Unearned filters, Export/Import panel open, story/hidden names masked.

Captured with headless Chrome over CDP from `out/index.html` (the one-shot `--screenshot` mode and the Codex sandbox could not run Chrome; the finishing session drove CDP directly and converted PNG → JPEG at quality 82).

## Verification

- Data check vs `git show HEAD:app/data/trophies.json`: all 55 names/descriptions/grades identical; grades 1P/2G/6S/46B; hidden = 28 per research; every guide non-empty with a Sources line; only Positive Mental Attitude carries a missable flag, as reported-unconfirmed.
- `node verify.mjs` passes. Full build (`MAKEFUN_OUTPUT_DIR=out node main.ts`) completes cleanly and writes a dossier with the 4 screenshots.

## v3 structural round (this session)

- `app/data/enrichment.json` (new): stage, confidence and 2–4 authored steps for all 55 trophies, keyed by id; embedded into `app/index.html` alongside the base data and merged at load with documented fallbacks. Stage distribution 18 / 1 / 6 / 8 / 22; confidence 38 Confirmed / 16 Verified / 1 Reported (Positive Mental Attitude only). `app/data/trophies.json` is byte-untouched.
- Three views: Ledger gains the Data Audit Strip (exact line: "55/55 Cited • 11-Field Schema • 0 Confirmed Missable / 1 Flagged • Original Text"), a Next Up widget (stage, then grade weight), and per-card stage/confidence badges plus numbered steps in every guide. Matrix view (`#view=matrix`, sidebar "02 Matrix view") renders all 55 trophies as stage × grade cells with quick filters and a highlighted flagged cell. Roadmap (`#view=roadmap`) shows per-stage counts computed live from the stage field and a Persistent Source Rail under the layout; the missable panel is unchanged in substance.
- Filters gain Stage (hash `#stage=01` etc.); spoiler protection also masks matrix names and Next Up recommendations; export/import unchanged and covered by the harness.
- `capture-screenshots.sh` now drives headless Chrome over CDP via the new `capture-cdp.mjs` (the one-shot `--screenshot` mode writes no file in this environment, as recorded in the v2 note above); the driver also reports page console errors (0 across all four states). Shots: `01-cover.jpg` (audit band, Next Up, first card's steps + Sources above the fold), `02-matrix.jpg` (full 55-cell matrix), `03-roadmap.jpg` (dynamic counts, Missable Watch, full Source Rail), `04-spoiler-filters.jpg` (Bronze + Stage 01 + Unearned filters, spoiler ON, backup panel). All 1280×800 JPEG ≤ 256 KiB, visually inspected.
- `verify.mjs` extended in place: enrichment file/embedding equality, distribution and steps assertions, stage-filter counts, badge presence, steps rendering, Next Up count, matrix cell count + quick filters + spoiler masking, roadmap count checks. Full harness passes.
