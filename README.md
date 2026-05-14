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
