# Architecture

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
