import crypto from "node:crypto";
import { env } from "../env";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16; // For AES, this is always 16

// Make sure the ENCRYPTION_SECRET exists, fallback for local dev if missing, but preferably should throw
const SECRET_KEY = env.ENCRYPTION_SECRET
  ? crypto
      .createHash("sha256")
      .update(String(env.ENCRYPTION_SECRET))
      .digest("base64")
      .substring(0, 32)
  : crypto
      .createHash("sha256")
      .update("default_fallback_secret_do_not_use_in_prod")
      .digest("base64")
      .substring(0, 32);

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(text: string): string {
  try {
    const textParts = text.split(":");
    if (textParts.length < 2) return text; // fallback for unencrypted tokens

    const ivStr = textParts.shift();
    if (!ivStr) return text;

    const iv = Buffer.from(ivStr, "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(SECRET_KEY),
      iv,
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    console.error("[Encryption] Decrypt failed:", err);
    throw new Error(
      "Decryption failed. The encryption secret may have changed or the token is invalid.",
    );
  }
}
