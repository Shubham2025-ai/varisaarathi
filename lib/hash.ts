import crypto from "crypto";

/**
 * One-way hash for Aadhaar. The raw value must be discarded by the caller
 * immediately after this returns — never log it, never store it.
 * Exists ONLY to detect duplicate registration via a DB unique constraint.
 */
export function aadhaarHash(raw: string): string {
  const salt = process.env.AADHAAR_HASH_SALT;
  if (!salt) {
    throw new Error("AADHAAR_HASH_SALT is not set — refusing to hash without a salt.");
  }
  return crypto.createHash("sha256").update(raw + salt).digest("hex");
}

/**
 * Signed/opaque QR token — deliberately NOT the raw DB id, so a QR image
 * can't be used to enumerate other pilgrim records by guessing ids.
 */
export function generateQrToken(): string {
  return crypto.randomBytes(16).toString("hex");
}