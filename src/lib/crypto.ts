import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { env } from "@/lib/env";

// Application-level encryption for sensitive PII (CNIC). AES-256-GCM with a
// key that lives only in the environment — the database never sees plaintext,
// so a leaked backup or dashboard access reveals nothing.
// Wire format: v1:<iv b64>:<auth tag b64>:<ciphertext b64>

function key(): Buffer {
  const hex = env().CNIC_ENCRYPTION_KEY;
  const buf = Buffer.from(hex, "hex");
  if (buf.length !== 32) {
    throw new Error("CNIC_ENCRYPTION_KEY must be 64 hex characters (32 bytes)");
  }
  return buf;
}

export function encryptPii(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return `v1:${iv.toString("base64")}:${cipher.getAuthTag().toString("base64")}:${ciphertext.toString("base64")}`;
}

export function decryptPii(stored: string): string {
  if (!stored) return "";
  const parts = stored.split(":");
  if (parts[0] !== "v1" || parts.length !== 4) return stored;
  try {
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(parts[1], "base64"));
    decipher.setAuthTag(Buffer.from(parts[2], "base64"));
    return Buffer.concat([decipher.update(Buffer.from(parts[3], "base64")), decipher.final()]).toString("utf8");
  } catch {
    return "[decryption failed]";
  }
}
