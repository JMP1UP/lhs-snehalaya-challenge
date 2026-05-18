import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyApwYI8A9bYukgE-W_mVX0CEGd9E_WTZSU",
  authDomain: "lhs-snehalaya-challenge.firebaseapp.com",
  projectId: "lhs-snehalaya-challenge",
  storageBucket: "lhs-snehalaya-challenge.firebasestorage.app",
  messagingSenderId: "837049723983",
  appId: "1:837049723983:web:c27f95fcfe1cb99528e3a",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);