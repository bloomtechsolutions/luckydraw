export const APP_TIMEZONE = process.env.APP_TIMEZONE || "Indian/Maldives";

export function fmtDateTime(d: Date | string, tz = APP_TIMEZONE) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(d));
}

export function fmtTime(d: Date | string, tz = APP_TIMEZONE) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date(d));
}

/** "bml-1001", " BML 1001 " and "bml.1001" all become "BML1001". */
export function normaliseStaffId(v: string) {
  return v.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Loose form of a name for spotting the same person under different IDs. */
export function normaliseName(v: string) {
  return v.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function cleanText(v: unknown, max = 120) {
  return String(v ?? "").trim().replace(/\s+/g, " ").slice(0, max);
}
