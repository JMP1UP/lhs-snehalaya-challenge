# LHS Snehalaya Challenge App

This bundle includes the main files for the React/Firebase/Microsoft sign-in version of the app.

## Replace these files in your project

- `src/App.jsx`
- `src/main.jsx`
- `src/authConfig.js`
- `src/firebase.js`
- `src/components/ui/card.jsx`
- `src/components/ui/button.jsx`
- `src/index.css`
- `vite.config.js`

## Test locally

```bash
npm install
npm run dev
```

## Build and deploy

```bash
npm run build
firebase deploy
```

## Security note

The app now includes a logged-out public splash screen. This hides personal data in the UI.

Before launch, Firestore rules should be tightened. The included `firestore.rules` is a suggested starting point, but because this app currently uses MSAL directly rather than Firebase Auth, the Firestore `request.auth` rules will need a proper Firebase Auth bridge or a revised backend security model before being used as-is.

For now, do not treat UI hiding alone as full security.

## Workspace information

**Purpose:** See the product and repository documentation above. Confirm the product purpose with stakeholders before changing behaviour.

**Current status:** Active repository; review `TASKS.md` and `docs/roadmap.md` for current priorities.

**Technology stack:** React and Vite.

**Local setup:**

1. Install the runtime versions expected by the repository.
2. Run `npm ci` when a lockfile is present, otherwise follow the repository-specific setup.
3. Copy `.env.example` to the appropriate local environment file and provide values through an approved secret store.
4. Never commit local environment files.

**Development, test, and build commands:**

- `npm run dev` â€” `vite`
- `npm run build` â€” `vite build`
- `npm run preview` â€” `vite preview`

**Deployment:** Inspect the checked-in hosting configuration and deployment provider before releasing. Use `docs/release-checklist.md` for every release.

**External services:** Inspect configuration and `docs/architecture.md`. Never place credentials in documentation.

**Repository:** https://github.com/JMP1UP/lhs-snehalaya-challenge.git
