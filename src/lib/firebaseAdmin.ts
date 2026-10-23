import { initializeApp, getApps, getApp, cert, type App } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";

function getPrivateKey(): string | undefined {
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!rawKey) return undefined;
  // Handle escaped newlines from environment strings
  return rawKey.replace(/\\n/g, "\n");
}

let firebaseAdminApp: App | null = null;

export function getFirebaseAdminApp(): App | null {
  if (firebaseAdminApp) return firebaseAdminApp;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[FIREBASE_ADMIN] Service account credentials not fully configured.");
    }
    return null;
  }

  try {
    const existingApps = getApps();
    if (existingApps.length === 0) {
      firebaseAdminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.GCS_BUCKET_NAME,
      });
    } else {
      firebaseAdminApp = getApp();
    }
    return firebaseAdminApp;
  } catch (error) {
    console.error("[FIREBASE_ADMIN_INIT_ERROR]:", error);
    return null;
  }
}

/**
 * Validates a Firebase ID Token on the server side using the Admin SDK.
 * Returns the decoded token payload or null if invalid/expired.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<DecodedIdToken | null> {
  try {
    if (!idToken || typeof idToken !== "string") return null;

    const app = getFirebaseAdminApp();
    if (!app) {
      console.warn("[FIREBASE_ADMIN] Cannot verify token: Admin SDK not initialized.");
      return null;
    }

    const auth = getAuth(app);
    const decoded = await auth.verifyIdToken(idToken, true);
    return decoded;
  } catch (err) {
    console.warn("[FIREBASE_TOKEN_VERIFICATION_FAILED]:", (err as any)?.message || err);
    return null;
  }
}
