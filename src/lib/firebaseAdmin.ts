export interface DecodedIdToken {
  aud: string;
  auth_time: number;
  email?: string;
  email_verified?: boolean;
  exp: number;
  firebase: {
    identities: { [key: string]: any };
    sign_in_provider: string;
    [key: string]: any;
  };
  iat: number;
  iss: string;
  name?: string;
  picture?: string;
  sub: string;
  uid: string;
  [key: string]: any;
}

function getPrivateKey(): string | undefined {
  let rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!rawKey) return undefined;
  rawKey = rawKey.trim();
  if (
    (rawKey.startsWith('"') && rawKey.endsWith('"')) ||
    (rawKey.startsWith("'") && rawKey.endsWith("'"))
  ) {
    rawKey = rawKey.slice(1, -1).trim();
  }
  return rawKey.replace(/\\n/g, "\n");
}

let firebaseAdminApp: any = null;

export async function getFirebaseAdminApp(): Promise<any | null> {
  if (firebaseAdminApp) return firebaseAdminApp;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  try {
    const { initializeApp, getApps, getApp, cert } = await import("firebase-admin/app");
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
    console.warn("[FIREBASE_ADMIN_DYNAMIC_INIT_WARNING]:", (error as any)?.message || error);
    return null;
  }
}

/**
 * Validates a Firebase ID Token on the server side with zero-trust security.
 * Uses Google Identity Platform REST API (standard fetch) for 100% serverless resilience,
 * with automatic fallback to Firebase Admin SDK if configured.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<DecodedIdToken | null> {
  try {
    if (!idToken || typeof idToken !== "string" || idToken.trim().length === 0) {
      return null;
    }

    const cleanToken = idToken.trim();
    const apiKey =
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyD2TQfpjJl3XM9Dv8YGzzBX41JDjj3A8j8";
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "zxzmods-34a69";

    // 1. Google Identity Toolkit REST API (Primary, highly reliable across all serverless environments)
    // Directly verifies token authenticity, signature, and expiration against Google servers.
    if (apiKey) {
      try {
        const res = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: cleanToken }),
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
            };
          }
        } else {
          const errJson = await res.json().catch(() => ({}));
          console.warn("[GOOGLE_IDENTITY_LOOKUP_REJECTED]:", errJson);
        }
      } catch (restErr) {
        console.warn("[GOOGLE_IDENTITY_LOOKUP_NETWORK_WARNING]:", (restErr as any)?.message || restErr);
      }
    }

    // 2. Fallback to Firebase Admin SDK if dynamic import succeeds
    try {
      const app = await getFirebaseAdminApp();
      if (app) {
        const { getAuth } = await import("firebase-admin/auth");
        const auth = getAuth(app);
        const decoded = await auth.verifyIdToken(cleanToken, false);
        if (decoded) {
          return decoded as unknown as DecodedIdToken;
        }
      }
    } catch (adminErr) {
      console.warn("[FIREBASE_ADMIN_VERIFY_WARNING]:", (adminErr as any)?.message || adminErr);
    }

    return null;
  } catch (err) {
    console.error("[FIREBASE_TOKEN_VERIFICATION_FAILED]:", (err as any)?.message || err);
    return null;
  }
}
