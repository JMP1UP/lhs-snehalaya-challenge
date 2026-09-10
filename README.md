# 25Thirty 365

Part of **25Thirty School**, with **LHS 365** as the Leicester High School programme. Intended address: `365.25thirty.school` (not connected yet). See [suite positioning](docs/suite-positioning.md).

The fictional-data preview is published at [25thirty-365.vercel.app](https://25thirty-365.vercel.app) and linked from the live suite. See [deployment status and the remaining DNS record](docs/deployment.md).

Learning and personal development beyond the school day, with a featured termly challenge and a collection of previous challenges.

## Reading design preview — September 2026

The home page opens directly into page logging, with current books first and finished books folded away. A book tower converts newly read pages into estimated height (1,000 pages = 5 cm), with doorway, giraffe and Elizabeth Tower comparisons. `#/challenges` holds the challenge collection. Book lookup/manual entry and session storage are preserved. Use fictional entries: nothing is submitted to school or added to shared totals.

The `#/steps` route is a read-only history page. The original steps source and its existing Firebase-hosted application are preserved separately. No route in the 365 preview initialises Firebase, signs in, or loads live participation records.

Read the full [reading design brief](docs/reading-design-brief.md) for the permanent LHS 365 identity, challenge theme, journeys, scoring rules, inclusion and launch decisions. This build is **internal development**, not a live reading launch. Cloud storage, corrections and shared totals remain future work.

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
