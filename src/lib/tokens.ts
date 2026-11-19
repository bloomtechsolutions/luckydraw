import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";

/** How often the venue QR code changes. */
export const QR_WINDOW_SECONDS = 60;
/** A scanned QR stays valid for the current window plus this many previous ones. */
const QR_GRACE_WINDOWS = 2;
/** After a valid scan, the person has this long to submit the form. */
const TICKET_TTL_MS = 20 * 60 * 1000;

type Signable = { code: string; qrSecret: string };

function sign(secret: string, data: string, len = 22) {
  return createHmac("sha256", secret).update(data).digest("base64url").slice(0, len);
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function currentWindow(now = Date.now()) {
  return Math.floor(now / 1000 / QR_WINDOW_SECONDS);
}

export function qrToken(match: Signable, now = Date.now()) {
  const w = currentWindow(now);
  return { token: `${w.toString(36)}.${sign(match.qrSecret, `qr:${match.code}:${w}`, 12)}`, window: w };
}

export function secondsUntilNextWindow(now = Date.now()) {
  const ms = QR_WINDOW_SECONDS * 1000;
  return Math.ceil((ms - (now % ms)) / 1000);
}

export function verifyQrToken(match: Signable, token: string | undefined, now = Date.now()) {
  if (!token) return false;
  const [wStr, sig] = token.split(".");
  if (!wStr || !sig) return false;
  const w = parseInt(wStr, 36);
  const cur = currentWindow(now);
  if (!Number.isFinite(w) || w > cur || w < cur - QR_GRACE_WINDOWS) return false;
  return safeEqual(sig, sign(match.qrSecret, `qr:${match.code}:${w}`, 12));
}

/** Issued when someone opens the form via a valid QR; checked when they submit. */
export function issueTicket(match: Signable, now = Date.now()) {
  return `${now.toString(36)}.${sign(match.qrSecret, `ticket:${match.code}:${now}`)}`;
}

export function verifyTicket(match: Signable, ticket: string | undefined, now = Date.now()) {
  if (!ticket) return false;
  const [tStr, sig] = ticket.split(".");
  if (!tStr || !sig) return false;
  const t = parseInt(tStr, 36);
  if (!Number.isFinite(t) || t > now + 60_000 || now - t > TICKET_TTL_MS) return false;
  return safeEqual(sig, sign(match.qrSecret, `ticket:${match.code}:${t}`));
}

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function newMatchCode(length = 6) {
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

export function newQrSecret() {
  return randomBytes(24).toString("base64url");
}

/**
 * Secret key for the public venue-screen link (/screen/<code>?k=<key>).
 * Derived from the match's QR secret, so "Invalidate old QR codes" also revokes old screen links.
 */
export function displayKey(match: Signable) {
  return sign(match.qrSecret, `display:${match.code}`, 16);
}

export function verifyDisplayKey(match: Signable, key: string | undefined) {
  return !!key && safeEqual(key, displayKey(match));
}
