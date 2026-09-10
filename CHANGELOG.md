# Changelog — LHS Snehalaya Challenge

## Catalogue fallback — 10 September 2026

Google Books returned HTTP 429 quota exhaustion for Dune. Added Open Library search fallback on provider failure with bounded timeout/results and sanitised metadata. Open Library work-level median page counts are explicitly approximate and editable, never claimed as edition-specific. Search privacy copy names both providers. Browser verified live Dune/Frank Herbert result and selection prefilling 607 with the estimate warning; 22 tests, reading lint and build pass. Manual fallback and stale-search protection remain intact.


## Celebrating the first adventure — 10 September 2026

Replaced the prose-only steps archive with a finish-line celebration: 8,535.1 km, 122% of the 7,000 km goal, 125 contributors and 849 activities, copied from the original App.jsx Hall of Fame. Illustrated route is explicitly non-geographical. No individual records or Firebase loads. Home recap now celebrates the result. Empty reading shelves open the first-book form immediately without autofocus, preserving quick logging and Cancel. Desktop and 390px layouts checked; first-book submission and 20-page/1-mm update work. Existing 19 tests, reading lint and build passed.


## Reading refinements — 10 September 2026

Reading polish: stronger Add a book action, compact empty state, quieter preview notice, larger landmark stage with named book spines, welcoming zero state, Days logged label, challenge-count badge and simplified footer.


## 2026-09-10 — Bright challenge branding

- Restore original Steps colours and LHS logo on a concise, illustrated challenge home.
- Give reading a distinct paper-and-books theme while preserving its logging workflow.
- Retain direct reading links and the static history route.


## 2026-09-10 — Read. Stack. Reach higher.

- Open directly into logging; move challenge history to its own view and collapse finished books.
- Replace promotional copy and milestone sidebar with a book tower and landmark targets.
- Estimate height from contributed pages, keeping saved records and actual completed-book counts separate.
- Add boundary, conversion and landmark tests; retain the fictional-session limitation.


All notable changes to LHS Snehalaya Challenge are recorded here.

## [Unreleased] - 2026-09-09

- Positioned the product as **25Thirty 365**, part of **25Thirty School**, retaining LHS 365 as the school programme and the reading theme. Documented the planned `365.25thirty.school` address.

- Added the LHS 365 programme home, featured reading challenge and challenge collection.
- Added a static steps history route, leaving original Firebase records untouched.
- Created a book-led theme and full reading design brief.
- Added session-only reading preview with catalogue search/manual fallback, starting pages, incremental updates, completion and participation milestones.
- Hardened catalogue responses, session persistence and date/numeric validation; added 16 tests.
- Added reading validation tests and installed the existing ESLint configuration's missing tooling. Full legacy lint findings remain unresolved.

## [Unreleased] - 2026-07-24

### Changed
- Aligned product design documentation (`docs/design.md`) to **25Thirty Learning** standards.
- Updated main user flows (`docs/user-flows.md`) for student challenge logging and house leaderboard monitoring.
- Updated task priorities in `TASKS.md`.
