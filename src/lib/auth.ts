// Shared-password admin auth. Works in both the Edge (middleware) and Node runtimes.
export const ADMIN_COOKIE = "ld_admin";

function secret() {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "";
}

async function hmacHex(key: string, data: string) {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, enc.encode(data));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** The cookie value proving the holder knew ADMIN_PASSWORD. Changes if the password changes. */
export async function adminToken() {
  return hmacHex(secret(), `admin:${process.env.ADMIN_PASSWORD ?? ""}`);
}

export async function isValidAdminToken(value: string | undefined) {
  if (!value || !process.env.ADMIN_PASSWORD) return false;
  const expected = await adminToken();
  if (value.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < value.length; i++) diff |= value.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
