import "server-only";
import { randomInt } from "crypto";
import { prisma } from "./db";

export function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Registrations that can still win in this match. */
export async function eligibleFor(matchId: string, excludeOtherWinners: boolean) {
  const match = await prisma.match.findUniqueOrThrow({ where: { id: matchId } });
  const [regs, drawnHere, wonElsewhere] = await Promise.all([
    prisma.registration.findMany({ where: { matchId }, select: { id: true, staffId: true, name: true, department: true } }),
    // Anyone already drawn in this match (including absent/re-drawn) is out.
    prisma.winner.findMany({ where: { matchId }, select: { registrationId: true } }),
    excludeOtherWinners
      ? prisma.winner.findMany({
          where: { status: "VALID", matchId: { not: matchId }, match: { competitionId: match.competitionId } },
          select: { registration: { select: { staffId: true } } },
        })
      : Promise.resolve([]),
  ]);
  const outReg = new Set(drawnHere.map((w) => w.registrationId));
  const outStaff = new Set(wonElsewhere.map((w) => w.registration.staffId));
  return regs.filter((r) => !outReg.has(r.id) && !outStaff.has(r.staffId));
}

