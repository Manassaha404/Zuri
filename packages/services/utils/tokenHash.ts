import * as bcrypt from "bcrypt";
import * as crypto from "node:crypto";

/**
 * Bcrypt truncates inputs after 72 bytes. Because JWT tokens typically exceed 150+ bytes,
 * we pre-hash with SHA-256 (yielding 64 hex characters, safely under 72 bytes) before bcrypt hashing.
 */
export async function hashToken(token: string): Promise<string> {
  const digest = crypto.createHash("sha256").update(token).digest("hex");
  return bcrypt.hash(digest, 10);
}

export async function compareToken(
  token: string,
  hashedToken: string,
): Promise<boolean> {
  if (!token || !hashedToken) return false;
  const digest = crypto.createHash("sha256").update(token).digest("hex");
  const match = await bcrypt.compare(digest, hashedToken).catch(() => false);
  if (match) return true;
  // Fallback in case raw token was hashed directly
  return await bcrypt.compare(token, hashedToken).catch(() => false);
}
