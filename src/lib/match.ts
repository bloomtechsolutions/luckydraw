import type { Match } from "@prisma/client";

export type RegState = "draft" | "not_yet" | "open" | "closed";

export function registrationState(m: Pick<Match, "status" | "regOpensAt" | "regClosesAt">, now = new Date()): RegState {
  if (m.status === "DRAFT") return "draft";
  if (m.status === "CLOSED") return "closed";
  if (now < m.regOpensAt) return "not_yet";
  if (now > m.regClosesAt) return "closed";
  return "open";
}

export const REG_STATE_LABEL: Record<RegState, string> = {
  draft: "Draft",
  not_yet: "Scheduled",
  open: "Registration open",
  closed: "Closed",
};

export function matchLabel(m: Pick<Match, "title" | "teamA" | "teamB">) {
  return m.teamA && m.teamB ? `${m.title}: ${m.teamA} vs ${m.teamB}` : m.title;
}
