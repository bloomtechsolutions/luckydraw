import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { eligibleFor, shuffle } from "@/lib/draw";
import { fmtDateTime } from "@/lib/format";
import DrawClient from "./DrawClient";

export const dynamic = "force-dynamic";

export default async function DrawPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await prisma.match.findUnique({
    where: { id },
    include: {
      competition: true,
      prizes: { orderBy: { sortOrder: "asc" }, include: { _count: { select: { winners: { where: { status: "VALID" } } } } } },
      winners: { where: { status: "VALID" }, orderBy: { drawnAt: "asc" }, include: { registration: true, prize: true } },
    },
  });
  if (!m) notFound();

  const [excl, incl] = await Promise.all([eligibleFor(m.id, true), eligibleFor(m.id, false)]);
  const segments = shuffle(excl.slice()).slice(0, 60).map((r) => ({ id: r.id, name: r.name }));

  return (
    <DrawClient
      matchId={m.id}
      title={m.teamA && m.teamB ? `${m.teamA} vs ${m.teamB}` : m.title}
      subtitle={`${m.competition.name} · ${fmtDateTime(m.startsAt)}`}
      initialPrizes={m.prizes.map((p) => ({ id: p.id, name: p.name, quantity: p.quantity, drawn: p._count.winners }))}
      initialSegments={segments}
      initialWinners={m.winners.map((w) => ({
        id: w.id,
        registrationId: w.registrationId,
        name: w.registration.name,
        staffId: w.registration.staffId,
        department: w.registration.department,
        prize: w.prize.name,
        prizeId: w.prizeId,
      }))}
      poolExcluding={excl.length}
      poolIncluding={incl.length}
    />
  );
}
