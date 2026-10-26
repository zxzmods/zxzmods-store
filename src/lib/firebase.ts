import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";

export const isFirebaseConfigured = Boolean(
  apiKey &&
  !apiKey.toLowerCase().includes("dummy") &&
  !apiKey.includes("YOUR_") &&
  apiKey.length > 20
);

const firebaseConfig = {
  apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "zxzmods-ac591.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "zxzmods-ac591",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "zxzmods-ac591.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "171438426786",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:171438426786:web:c04eb25bbda2dbc6c265fb",
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let googleProvider: GoogleAuthProvider | undefined;

if (typeof window !== "undefined" && isFirebaseConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);

    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
  } catch (error) {
    console.warn("Firebase client initialization warning:", error);
  }
}

export { app, auth, googleProvider };

