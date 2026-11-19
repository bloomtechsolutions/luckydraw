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

export function normaliseStaffId(v: string) {
  return v.trim().toUpperCase().replace(/\s+/g, "");
}

export function cleanText(v: unknown, max = 120) {
  return String(v ?? "").trim().replace(/\s+/g, " ").slice(0, max);
}
