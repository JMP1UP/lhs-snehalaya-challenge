# 25Thirty 365

## Bright challenge home — 10 September 2026

The public front page explains LHS 365 and the Snehalaya partnership before sign-in, gives an honest status for the current reading project, and prominently celebrates the completed Steps challenge (8,535.1 km, 122% of target). Open the featured reading challenge or use Log reading in the header to reach the logger in one click. Reading uses a contemporary graphic-novel identity—school-navy ink, warm paper, signal red, sky blue and small flashes of yellow—with an estimated-height book tower. Whole-school reading height is not published until it can be derived from verified school records.


Part of **25Thirty School**, with **LHS 365** as the Leicester High School programme. Intended address: `365.25thirty.school` (not connected yet). See [suite positioning](docs/suite-positioning.md).

The fictional-data preview is published at [25thirty-365.vercel.app](https://25thirty-365.vercel.app) and linked from the live suite. See [deployment status and the remaining DNS record](docs/deployment.md).

Learning and personal development beyond the school day, with a featured termly challenge and a collection of previous challenges.

## Reading design preview — September 2026

The home page opens directly into page logging, with current books first and finished books folded away. A book tower converts newly read pages into estimated height (1,000 pages = 5 cm), with doorway, giraffe and Elizabeth Tower comparisons. The admin preview begins with a privacy-safe, screenshot-ready community tower before the detailed staff report, and includes form-group participation/average-page comparisons plus local JSON/CSV/TSV roster and participation tools. `#/challenges` holds the challenge collection. Book lookup/manual entry and session storage are preserved. Use fictional entries: nothing is submitted to school or added to shared totals.

The `#/steps` route is a read-only history page. The original steps source and its existing Firebase-hosted application are preserved separately. No route in the 365 preview initialises Firebase, signs in, or loads live participation records.

Read the full [reading design brief](docs/reading-design-brief.md) for the permanent LHS 365 identity, challenge theme, journeys, scoring rules, inclusion and launch decisions. This build is an **external fictional-data design preview**, not a live pupil launch. The shared-reading API and role-specific dashboards are implemented behind disabled live flags; credentials, an approved roster and real-account pilot checks remain outstanding.

## Current implementation

- React and Vite
- Tailwind CSS and Framer Motion
- Microsoft identity through Firebase Authentication's Microsoft OAuth provider (legacy steps app)
- Cloud Firestore with rules in `firestore.rules`
- Firebase Hosting configuration in `firebase.json`

Pledges are not evidence of received funds, and student submissions are not verified until the staff workflow records approval.

## Local development

1. Run `npm ci`.
2. Copy `.env.example` to an ignored local file and provide the approved public client configuration.
3. Run `npm run dev`.
4. Run `npm run build` before release.

Run `npm test` for reading arithmetic and saved-record validation, `npm run lint:reading` for the new frontend, and `npm run build` for the full build. `npm run lint` checks the entire repository and currently reports existing errors in the legacy steps app. There is no TypeScript configuration or separate type-check command. There are still no automated Firestore-rule tests: real student or financial use remains blocked until authorization, school scope, approval and aggregate integrity have coverage.

Book lookup requires a network connection to Google Books and can be unavailable or rate-limited. The manual form remains usable. Browser session storage is temporary and may not survive closing the tab; it is not account storage or a backup.

## Documentation

- `docs/design.md` — audience, interaction, accessibility, and visual rules
- `docs/architecture.md` — identity, Firestore, and hosting boundaries
- `docs/data-model.md` — records, integrity, and lifecycle
- `docs/user-flows.md` — student and staff journeys
- `docs/decisions.md` — settled technical and product boundaries
- `docs/release-checklist.md` — minimum release gate
- `AGENTS.md` — repository-specific working rules

Never commit credentials or confidential student, sponsor, or financial data.

## Reading administration

Open `#/admin` for the fictional dashboard: separate top tens for students and staff, house rankings, participation and an exportable no-pages list. The live version uses Microsoft school sign-in and a server-only admin allowlist; it is not enabled on the public preview. See [configuration, roster format and the single pilot checklist](docs/reading-admin.md). `npm test` includes report and API policy/integrity tests; `npm run lint:reading` includes the new server.
