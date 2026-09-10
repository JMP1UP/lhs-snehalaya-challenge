# Architecture decisions

## 10 September 2026 — Restore the original Steps visual identity

User feedback selects a bright challenge front page and a separate reading theme. Restore LHS logo, royal blue, pink, aqua, purple, bold headings and rounded cards, retaining 25Thirty attribution. Home is no longer the logger; the prominent CTA and header lead directly to logging.


## 10 September 2026 — Logging first; a tower as tall as…

Following user feedback, replace the promotional home with the logger and a virtual book tower. Use an explicit estimated 0.05 mm/page conversion, with selectable landmark examples. Keep actual completed books separate from the illustration. The school target is not approved by selecting a preview landmark. Preserve existing session data and original steps records.


## 2026-09-09 — Join the 25Thirty School suite

Use **25Thirty 365** as the product, **LHS 365** as the school programme and `365.25thirty.school` as the planned address. Brand the header and metadata at product level, preserving challenge themes. Add an in-development listing to the suite homepage. This decision does not move hosting or data, or establish multi-school access. See `suite-positioning.md`.

## 2026-09-09 — LHS 365 programme and reading preview

**Status:** Implemented for internal development; live reading decisions pending.

Use a persistent LHS 365 home with a featured challenge and collection of previous challenges. Keep stable navigation and interaction patterns while varying theme, artwork, palette and activity language. Reading uses a book-led editorial theme. Preserve the original steps experience and records at a separate route.

Use temporary session storage for the first reviewable reading experience. Do not write to live school data or invent shared totals. Count incremental pages from an explicit starting point, completed books and distinct logging days. Catalogue metadata is a suggestion requiring edition/page confirmation; manual addition must remain available.

## 2026-08-01 — Use Microsoft identity and Firestore

**Status:** Accepted for the current implementation

MSAL establishes identity and Cloud Firestore stores shared challenge records. Firestore rules, not React route state, determine access.

## 2026-08-01 — Distinguish pledges, receipts, and approvals

**Status:** Accepted

A sponsor pledge is not proof of payment, and a student submission is not verified until the staff workflow records approval. Public totals must identify which state they represent.

## 2026-08-01 — Require rule tests before live use

**Status:** Accepted

The current repository lacks automated Firestore-rule coverage. Real student or financial use is blocked until authorization, school scope, approval, and aggregate-integrity rules are tested.

## Reading admin — 10 September 2026

Reading admin authorisation uses a server environment allowlist, not a display-name suffix or editable profile role. Complete roster membership is the denominator for non-contributors, including accounts that never sign in. New records are isolated from historical steps data. Live mode stays disabled until the one operational checklist in reading-admin.md is completed.
