# Release checklist

## Catalogue fallback — 10 September 2026

Google Books returned HTTP 429 quota exhaustion for Dune. Added Open Library search fallback on provider failure with bounded timeout/results and sanitised metadata. Open Library work-level median page counts are explicitly approximate and editable, never claimed as edition-specific. Search privacy copy names both providers. Browser verified live Dune/Frank Herbert result and selection prefilling 607 with the estimate warning; 22 tests, reading lint and build pass. Manual fallback and stale-search protection remain intact.


## Celebrating the first adventure — 10 September 2026

Replaced the prose-only steps archive with a finish-line celebration: 8,535.1 km, 122% of the 7,000 km goal, 125 contributors and 849 activities, copied from the original App.jsx Hall of Fame. Illustrated route is explicitly non-geographical. No individual records or Firebase loads. Home recap now celebrates the result. Empty reading shelves open the first-book form immediately without autofocus, preserving quick logging and Cancel. Desktop and 390px layouts checked; first-book submission and 20-page/1-mm update work. Existing 19 tests, reading lint and build passed.


## Reading refinements — 10 September 2026

Reading refinement verified: 19 existing tests and reading lint passed. Desktop/390px visual checks passed, with no horizontal overflow. A fictional book logged to page 20 produces 1 mm and a named spine; switching to giraffe preserves height. Preview disclosure remains visible. The exact target is available under How does it work. No storage/auth/data-model changes.


## Original Steps branding refresh — 10 September 2026

External fictional-data preview. Original palette and LHS school logo restored, concise home added, reading theme kept separate. All 19 tests, reading lint and build passed; independent source review found no confirmed blocker. No data/storage/authentication changes. Desktop/mobile visual verification completed after restarting: home and reading layouts inspected at desktop and 390px, no mobile home overflow; featured reading link, archive and return links work. Fictional 20-page update adds 1 mm and survives refresh. The prior browser outage is resolved. This is not a school-data launch. Prior deployment remains available for rollback.


## Tower redesign — 10 September 2026

Classification: **external pilot of a fictional-data design preview**, not a real-pupil release. John Partridge remains the owner. All 19 tests, reading lint and Vite production build pass. Browser verification: default logging route; 20→100 contributes 80 pages/4 mm; finish at 120 contributes 100 pages/5 mm and survives refresh. Backward update rejected. Changing landmark preserves height. Finished books expand correctly; completed-save focus moves to their native summary and announces the book. Independent review and correction verification passed.

Desktop and 390px phone layouts inspected, with no horizontal overflow. Logging precedes the mission on mobile. Challenge collection/archive/return navigation works. Session key and records are unchanged; no authentication, Firebase, email, migration or school totals were added. Existing live lookup verification and DNS limitations remain open. Prior publication is the rollback target in deployment.md.


## 25Thirty 365 suite branding — 9 September 2026

New frontend lint, all 16 reading/catalogue tests and production build pass locally and on Vercel. The preview is published at `https://25thirty-365.vercel.app`, and the suite listing is live. Independent review and correction verification passed. The `#/steps` page is now static; no route loads live Firebase data. The original challenge records remain intact. `365.25thirty.school` awaits Cloudflare DNS access; no data migration has occurred. See `deployment.md` for publication IDs, checks and the exact remaining action.

Final pre-merge verification: 16 tests, reading lint and production build pass locally and on Vercel. Browser checks confirm 42→68 adds 26 pages, backward progress is rejected, finishing at 120 adds 78 total, and refresh retains totals. Static archive and suite navigation work. Numeric/date corruption, malformed catalogue fields and failed storage writes are covered. Independent verification found no remaining merge blocker. Live provider success remains unverified; manual entry works.

## LHS 365 reading preview — 9 September 2026

Classification: **internal development**. Owner and final decision-maker: John Partridge. No deployment, migrations or live reading writes were performed.

- [x] Full reading design brief and themed LHS 365 preview created.
- [x] Six reading calculation/validation tests pass; new frontend lint and production build pass.
- [x] Browser check: fictional book at page 42, update to 68 adds 26, finish at 120 produces 78 contributed pages and one completed book; refresh preserves the shelf.
- [x] Desktop and phone layout inspected; mobile home has no horizontal overflow.
- [x] Catalogue-unavailable message shown with manual addition available.
- [ ] Successful live catalogue lookup: provider returned unavailable during verification.
- [ ] Live release: school-scoped reading storage, correction flow, inclusion rules, target and shared totals remain unimplemented.

Full-project lint reports 17 errors and 3 warnings in the unchanged legacy `src/App.jsx`. There is no separate type-check configuration. Dependency audit reports six advisories in the current dependency tree (five high, one critical); assess/update these before live release rather than treating the design preview as deployment-ready.

Next action: review the fictional-data preview and settle the intended year groups and reading rules. The general launch checklist below remains uncompleted; preview checks do not certify the live steps app or a production reading launch.

- [ ] Scope and acceptance criteria confirmed
- [ ] Lint, tests, type checks, and production build pass
- [ ] Accessibility and responsive behaviour checked
- [ ] Authentication, authorization, and sensitive-data paths reviewed
- [ ] Database migrations and rollback plan verified
- [ ] Environment configuration documented without secret values
- [ ] Monitoring, logging, and alerts verified
- [ ] README, decisions, roadmap, and changelog updated
- [ ] Deployment and rollback steps confirmed
- [ ] Post-release smoke test completed

## Reading admin — 10 September 2026

For the reading admin extension, use the single scoped operational checklist in reading-admin.md. Mocked API tests and the fictional dashboard are not proof that live Microsoft configuration or deployed Firestore rules are correct. Live flags remain off until those checks and the roster are complete.
