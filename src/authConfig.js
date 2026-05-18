import { app } from "./firebase.js";

import {
  getAuth,
  OAuthProvider,
  signInWithPopup,
  getRedirectResult,
  signOut,
} from "firebase/auth";

export const auth = getAuth(app);

const microsoftProvider = new OAuthProvider("microsoft.com");

microsoftProvider.setCustomParameters({
  tenant: "89b66541-893d-4f1a-926d-17941da298a1",
});

export async function signInWithMicrosoft() {
  return signInWithPopup(auth, microsoftProvider);
}

export async function getMicrosoftRedirectResult() {
  return getRedirectResult(auth);
}

export async function signOutUser() {
  return signOut(auth);
}