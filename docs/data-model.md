# Data model

## Reading preview records

The preview uses session storage only, isolated from steps records. A book contains `id`, `title`, `author`, `total`, `start`, `current` and `logs`. Each log has positive `pages` and a local calendar `date`. New entries are finished by default: `start` is zero, `current` is the total and one dated log credits the whole book. Older unfinished records retain positive-delta progress support.

Records are validated on restoration and before updates. These are self-reported trial values, not school-approved activity. No shared totals or live reading collections exist yet. Production ownership, corrections, concurrent updates, retention and staff access require implementation before launch.

## Storage and identity

The application uses Microsoft sign-in through MSAL and Cloud Firestore through `src/firebase.js`. Firestore is the shared store; rules in `firestore.rules` are the authorization boundary. Demo and presentation content may also be embedded in the React application.

## Main records

The interface works with participants and house teams, fundraising activities, sponsor pledges, totals and milestones, announcements or cultural updates, and staff approval state. The exact deployed collections and fields are defined by `src/App.jsx` and the Firestore rules rather than a separate schema migration system.

## Integrity rules

- A pledge is not proof of money received.
- Submitted activities and amounts must not be presented as verified until the recorded staff workflow approves them.
- Aggregate totals must be derived consistently from authorised records and must not double-count edits.
- Student identifiers and participation must not be exposed outside the intended school audience.

## Retention and recovery

Firebase supplies persistence, but no guaranteed retention, export, deletion, or restore procedure is implemented in this repository. These controls and collection-level ownership must be agreed before use with real students or financial records.

## Reading admin — 10 September 2026

The `readingCampaigns/read-for-snehalaya-2026` namespace holds a versioned `settings/roster` document, `members/{emailHash}` counters, `books/{requestUUID}`, private `households/{uuid}`, `familyMemberships/{emailHash}` and hashed `familyCodes/{sha256}` lookups. Personal book ownership is derived from verified identity. Family books carry `householdId` and `familyReaderId`; the API checks household membership before writes. A household stores up to eight linked school-account hashes and twelve minimal named readers. No parent email, date of birth or contact data is collected. Add requests remain idempotent by UUID and payload.
