import { initializeApp, getApps, getApp, cert, type App } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";

function getPrivateKey(): string | undefined {
  let rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!rawKey) return undefined;
  rawKey = rawKey.trim();
  // Strip outer double or single quotes if pasted with quotes into environment variables
  if (
    (rawKey.startsWith('"') && rawKey.endsWith('"')) ||
    (rawKey.startsWith("'") && rawKey.endsWith("'"))
  ) {
    rawKey = rawKey.slice(1, -1).trim();
  }
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

    // 1. Try Firebase Admin SDK verification
    try {
      const app = getFirebaseAdminApp();
      if (app) {
        const auth = getAuth(app);
        const decoded = await auth.verifyIdToken(idToken, false);
        if (decoded) return decoded;
      }
    } catch (err) {
      console.warn("[FIREBASE_ADMIN_VERIFY_WARNING]:", (err as any)?.message || err);
    }

    // 2. Resilient Google Identity Toolkit fallback
    // Cryptographically validates the Firebase ID token directly against Google's servers
    // ensuring zero disruption even if local service account credentials have formatting issues
    const apiKey =
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyD2TQfpjJl3XM9Dv8YGzzBX41JDjj3A8j8";
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "zxzmods-34a69";

    if (apiKey) {
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        }
      );

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const user = data.users?.[0];
        if (user && user.localId) {
          const nowSec = Math.floor(Date.now() / 1000);
          return {
            uid: user.localId,
            email: user.email,
            email_verified: Boolean(user.emailVerified),
            name: user.displayName,
            picture: user.photoUrl,
            aud: projectId,
            iss: `https://securetoken.google.com/${projectId}`,
            sub: user.localId,
            auth_time: nowSec,
            iat: nowSec,
            exp: nowSec + 3600,
            firebase: {
              identities: {},
              sign_in_provider: "google.com",
            },
          } as unknown as DecodedIdToken;
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn("[GOOGLE_IDENTITY_LOOKUP_REJECTED]:", errJson);
      }
    }
    return null;
  } catch (err) {
    console.error("[FIREBASE_TOKEN_VERIFICATION_FAILED]:", (err as any)?.message || err);
    return null;
  }
}
