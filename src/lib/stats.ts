import "server-only";
import { prisma } from "./db";
import { APP_TIMEZONE, fmtTime } from "./format";

export async function departmentBreakdown(where: { matchId?: string; match?: { competitionId: string } }) {
  const rows = await prisma.registration.groupBy({ by: ["department"], where, _count: { _all: true } });
  return rows
    .map((r) => ({ label: r.department, value: r._count._all }))
    .sort((a, b) => b.value - a.value);
}

/** Registrations bucketed into intervals, for the "arrival" chart. */
export function timeline(dates: Date[], bucketMinutes = 10) {
  if (dates.length === 0) return [];
  const ms = bucketMinutes * 60_000;
  const sorted = dates.map((d) => d.getTime()).sort((a, b) => a - b);
  const start = Math.floor(sorted[0] / ms) * ms;
  const end = Math.floor(sorted[sorted.length - 1] / ms) * ms;
  const buckets = new Map<number, number>();
  for (let t = start; t <= end; t += ms) buckets.set(t, 0);
  for (const t of sorted) {
    const b = Math.floor(t / ms) * ms;
    buckets.set(b, (buckets.get(b) ?? 0) + 1);
  }
  return [...buckets].map(([t, value]) => ({ label: fmtTime(new Date(t), APP_TIMEZONE), value }));
}

/** Staff who supported the most matches (optionally within one competition). */
export async function topSupporters(competitionId?: string, limit = 10) {
  const rows = await prisma.registration.groupBy({
    by: ["staffId"],
    where: competitionId ? { match: { competitionId } } : undefined,
    _count: { _all: true },
    orderBy: [{ _count: { staffId: "desc" } }, { staffId: "asc" }],
    take: limit,
  });
  if (rows.length === 0) return [];
  const latest = await prisma.registration.findMany({
    where: { staffId: { in: rows.map((r) => r.staffId) } },
    orderBy: { createdAt: "desc" },
    distinct: ["staffId"],
    select: { staffId: true, name: true, department: true },
  });
  const byId = new Map(latest.map((l) => [l.staffId, l]));
  return rows.map((r) => ({ ...byId.get(r.staffId)!, matches: r._count._all }));
}

export async function uniqueSupporters(competitionId?: string) {
  const rows = await prisma.registration.groupBy({
    by: ["staffId"],
    where: competitionId ? { match: { competitionId } } : undefined,
  });
  return rows.length;
}
