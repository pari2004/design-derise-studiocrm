import { randomBytes } from "crypto";

const ALPHABET =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Compact, URL-safe, collision-resistant id (nanoid-style) without an extra
 * dependency. 21 chars ≈ 126 bits of entropy.
 */
export function createId(size = 21): string {
  const bytes = randomBytes(size);
  let out = "";
  for (let i = 0; i < size; i++) {
    out += ALPHABET[bytes[i] & 61];
  }
  return out;
}
