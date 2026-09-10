# Architecture

## Catalogue fallback — 10 September 2026

Google Books returned HTTP 429 quota exhaustion for Dune. Added Open Library search fallback on provider failure with bounded timeout/results and sanitised metadata. Open Library work-level median page counts are explicitly approximate and editable, never claimed as edition-specific. Search privacy copy names both providers. Browser verified live Dune/Frank Herbert result and selection prefilling 607 with the estimate warning; 22 tests, reading lint and build pass. Manual fallback and stale-search protection remain intact.


## Reading refinements — 10 September 2026

BookTower now receives existing books as well as contributed pages, deriving a decorative stack from up to eight books with positive contributions. No new stored fields; arithmetic remains in tower.mjs.


## Bright home and challenge themes

Lhs365 renders Home at / and /challenges, ReadingChallenge at /reading and static StepsArchive at /steps. challenge-brand.css scopes the bright adventure theme and cream reading theme while sharing the original school palette. Empty-hash browser-back navigation restores Home. No record, storage or live-service changes.


## Logging and tower update — 10 September 2026

`/` and `/reading` render the logger; `/challenges` renders the concise catalogue; `/steps` stays static. `tower.mjs` derives estimated height and bounded goal progress from validated contributed pages. `BookTower.jsx` owns only the temporary landmark selection. Stored book records and their key are unchanged; no Firebase or shared-school writes were added.


## LHS 365 frontend — September 2026

`src/main.jsx` mounts `src/lhs365/Lhs365.jsx`, which provides hash navigation for home, reading and a static steps-history page. `StepsArchive.jsx` has no Firebase imports or live-data actions. The original `src/App.jsx` remains in source but is not imported or bundled by the preview. `src/lhs365/challenges.js` is the catalogue; stable IDs and explicit status keep future challenges distinct.

`ReadingChallenge.jsx` owns the temporary bookshelf UI. `reading.mjs` validates records and computes page deltas, completion and distinct logging days. Session storage uses `lhs365:reading-preview:v1`; it contains only preview book records, not identity. No reading data is written to Firestore. Book search calls Google Books without sending identity or the bookshelf.

Live reading will require a separate school-scoped, owner-authorised data model with tested corrections and aggregates. The preview must not be relabelled live merely by removing its notice.

## Runtime and frontend

The challenge app is a React application built with Vite and styled with Tailwind and application CSS. `src/App.jsx` contains the principal product workflow; reusable UI components live under `src/components/ui/`. Framer Motion provides animation.

## Identity and data

Microsoft authentication is integrated through MSAL in `src/authConfig.js`. `src/firebase.js` configures Cloud Firestore, and `firestore.rules` is the data authorization boundary. Browser role or view state must not be treated as proof of staff authority.

## Hosting and configuration

Firebase hosting is configured by `firebase.json`; Vite environment values are compiled into the browser and therefore cannot contain confidential client secrets. Use `npm run dev` and `npm run build`; the current package has no automated test or lint script.

## Security boundaries

Firestore rules must restrict student and fundraising records to intended users and staff actions. Microsoft sign-in establishes identity, but access to Firestore still requires explicit authorization rules. Fundraising totals and approval states must be derived from authorised records.

## Known constraints

There is no versioned database migration process, documented restore test, automated security-rule test, or end-to-end test suite. Before live use, add rule tests and verify tenant/school scoping, approval workflows, record correction, retention, and recovery.
