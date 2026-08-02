import { createHmac } from "crypto";

const SECRET = process.env.BETTER_AUTH_SECRET || "dev-secret-change-me";
const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface TokenPayload {
  pid: string;   // patient ID
  exp: number;   // expiry timestamp (ms)
}

/**
 * Generate a short-lived signed token for a patient link.
 * No session, no login. Just a signed URL the patient taps from their phone.
 */
export function signPatientToken(patientId: string, ttlMs = DEFAULT_TTL_MS): string {
  const payload: TokenPayload = {
    pid: patientId,
    exp: Date.now() + ttlMs,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

/**
 * Verify a patient token. Returns the patient ID if valid, null if expired or tampered.
 */
export function verifyPatientToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [data, sig] = parts;
  const expectedSig = createHmac("sha256", SECRET).update(data).digest("base64url");

  // Constant-time comparison
  if (sig.length !== expectedSig.length) return null;
  let mismatch = 0;
  for (let i = 0; i < sig.length; i++) {
    mismatch |= sig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  }
  if (mismatch !== 0) return null;

  try {
    const payload: TokenPayload = JSON.parse(Buffer.from(data, "base64url").toString());
    if (payload.exp < Date.now()) return null;
    return payload.pid;
  } catch {
    return null;
  }
}

/**
 * Build the full patient URL with a signed token.
 */
export function buildPatientUrl(patientId: string, baseUrl?: string): string {
  const token = signPatientToken(patientId);
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/patient?t=${token}`;
}
