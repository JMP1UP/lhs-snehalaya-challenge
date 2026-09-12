# Changelog — LHS Snehalaya Challenge

## Pre-launch production review — 12 September 2026

- Replaced the public reading placeholder with a cached, privacy-safe community total: pages, estimated height, participating readers and finished books. No names, roster records or individual activity are returned.
- Moved roster loading behind authentication so anonymous requests never read the private roster.
- Added HSTS, clickjacking protection and a restrictive browser-permissions policy to production responses.
- Rechecked the visitor, reading, teacher and administrator surfaces at desktop and phone widths; the fictional add, progress, finish and reload journey reconciles to the expected total.

## Public project story and community celebration — 12 September 2026

- Reworked the pre-sign-in homepage to explain LHS 365 and its purpose within the Snehalaya partnership.
- Added a prominent current-project update that clearly labels the reading experience as a fictional-data preview and does not invent a shared total.
- Elevated the completed Steps to Snehalaya result into a community celebration with the 8,535.1 km total, 122% achievement, distance beyond target and participation figures.
- Rebalanced the bold palette so school navy provides structure, aqua identifies progress and magenta is reserved for celebration; reduced the large purple field and decorative competition.
- Reduced homepage copy and moved the fuller parent/visitor explanation into an accessible “What is LHS 365?” dialog.
- Removed repeated instructional and promotional copy across the homepage, reading logger, tower, completed challenge and admin preview; kept privacy, preview, validation and reconciliation guidance.
- Reframed the reading screen as **Pages Become Places**: inked editorial panels, flat landmark illustrations and hard print-style shadows replace the quiet library and neon-wireframe treatments.
- Added a privacy-safe, screenshot-ready community tower to the teacher report. It turns filtered pages into a visible height and pairs that with aggregate readers and completed books; individual rankings remain below the shareable summary.
- Completed first-time reader, returning quick-log, keyboard-only quick-log and teacher reporting journeys at desktop and phone widths. Fictional progress survives reloads and invalid backward page updates are rejected without changing totals.
- Added a private participation checker for staff: upload or paste JSON, CSV or TSV and compare each person with verified reading activity. The list is processed only in the current browser window, with explicit Taken part, Not yet and Check match states.
- Added a copyable, privacy-qualified AI formatting prompt and replaced the CSS giraffe symbol with a recognisable inked illustration. The admin route now inherits the same paper, ink, red, blue and yellow book-project system as the reading route.
- Made roster imports additive by default, matching on normalised school email so later new-joiner files do not remove existing members; complete replacement is now a separate confirmed action.
- Added form groups to JSON/CSV/TSV roster imports and reporting. Staff rows may be marked with a trailing `(staff)`, but access still requires a verified school account matched to a stored staff roster role.
- Added school and form-group participation percentages plus average pages per active student, with an aggregate-only form progress view for verified rostered staff.
- Added a fictional teacher/administrator role switch to the disabled-live preview so both permission-shaped interfaces can be reviewed without exposing or inventing school accounts.
- Refreshed compatible dependency resolutions to clear all reported production audit findings, declared the existing ES-module package format, and reverified 40 tests, reading lint and the production build for the launch-ready fictional preview.

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
