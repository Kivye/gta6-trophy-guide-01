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
