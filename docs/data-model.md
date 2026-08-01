# Data model

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
