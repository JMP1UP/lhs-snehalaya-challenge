# Data model

## Reading preview records

The new preview uses session storage only, isolated from steps records. A book contains `id`, `title`, `author`, `total`, `start`, `current` and `logs`. Each log has positive `pages` and a local calendar `date`. Contributions equal `current - start`; the log sum must agree. Completion requires `current === total` and new progress beyond `start`. Days are distinct logging dates across all books.

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
