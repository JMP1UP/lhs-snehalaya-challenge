# LHS Snehalaya Challenge

School fundraising and cultural-partnership application for challenge participation, house progress, sponsor pledges, updates, and staff oversight.

## Current implementation

- React and Vite
- Tailwind CSS and Framer Motion
- Microsoft identity through MSAL
- Cloud Firestore with rules in `firestore.rules`
- Firebase Hosting configuration in `firebase.json`

Pledges are not evidence of received funds, and student submissions are not verified until the staff workflow records approval.

## Local development

1. Run `npm ci`.
2. Copy `.env.example` to an ignored local file and provide the approved public client configuration.
3. Run `npm run dev`.
4. Run `npm run build` before release.

The repository currently has no automated application or Firestore-rule test command. Real student or financial use is blocked until authorization, school scope, approval, and aggregate-integrity rules have automated coverage.

## Documentation

- `docs/design.md` — audience, interaction, accessibility, and visual rules
- `docs/architecture.md` — identity, Firestore, and hosting boundaries
- `docs/data-model.md` — records, integrity, and lifecycle
- `docs/user-flows.md` — student and staff journeys
- `docs/decisions.md` — settled technical and product boundaries
- `docs/release-checklist.md` — minimum release gate
- `AGENTS.md` — repository-specific working rules

Never commit credentials or confidential student, sponsor, or financial data.
