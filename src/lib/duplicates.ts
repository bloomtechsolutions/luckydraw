import "server-only";
import { prisma } from "./db";
import { normaliseName } from "./format";

export type DupReg = { id: string; staffId: string; name: string; department: string; createdAt: Date };
export type DupGroup = { kind: "device" | "name" | "mismatch"; title: string; detail: string; regs: DupReg[] };

/**
 * Suspicious-looking entries for a match, for an admin to review:
 *  - one phone used for several staff IDs
 *  - the same name under different staff IDs
 *  - a staff ID that was registered with a different name in another match
 */
export async function duplicateReport(matchId: string) {
  const match = await prisma.match.findUniqueOrThrow({ where: { id: matchId }, select: { competitionId: true } });
  const regs = await prisma.registration.findMany({ where: { matchId }, orderBy: { createdAt: "asc" } });
  const groups: DupGroup[] = [];

  const byDevice = new Map<string, typeof regs>();
  for (const r of regs) if (r.deviceId) byDevice.set(r.deviceId, [...(byDevice.get(r.deviceId) ?? []), r]);
  for (const list of byDevice.values()) {
    if (new Set(list.map((r) => r.staffId)).size > 1) {
      groups.push({ kind: "device", title: "Same phone, different staff IDs", detail: `${list.length} entries were submitted from one phone.`, regs: list });
    }
  }

  const byName = new Map<string, typeof regs>();
  for (const r of regs) {
    const k = normaliseName(r.name);
    if (k) byName.set(k, [...(byName.get(k) ?? []), r]);
  }
  for (const list of byName.values()) {
    if (new Set(list.map((r) => r.staffId)).size > 1) {
      groups.push({ kind: "name", title: "Same name, different staff IDs", detail: `"${list[0].name}" appears under ${list.length} staff IDs. This could be two people with the same name, so check before removing.`, regs: list });
    }
  }

  // Same staff ID used with a different name elsewhere in this competition.
  const others = await prisma.registration.findMany({
    where: { staffId: { in: regs.map((r) => r.staffId) }, matchId: { not: matchId }, match: { competitionId: match.competitionId } },
    select: { staffId: true, name: true },
  });
  const otherNames = new Map<string, Set<string>>();
  for (const o of others) otherNames.set(o.staffId, (otherNames.get(o.staffId) ?? new Set()).add(o.name));
  for (const r of regs) {
    const names = [...(otherNames.get(r.staffId) ?? [])].filter((n) => normaliseName(n) !== normaliseName(r.name));
    if (names.length) {
      groups.push({ kind: "mismatch", title: "Staff ID used with another name", detail: `${r.staffId} was registered as ${names.map((n) => `"${n}"`).join(", ")} in another match.`, regs: [r] });
    }
  }

  const flagged = new Map<string, string[]>();
  for (const g of groups) for (const r of g.regs) flagged.set(r.id, [...(flagged.get(r.id) ?? []), g.title]);
  return { groups, flagged };
}
