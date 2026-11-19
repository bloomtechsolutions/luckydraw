import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { prisma } from "@/lib/db";
import { guard } from "@/lib/api";
import { eligibleFor, shuffle } from "@/lib/draw";

export const dynamic = "force-dynamic";

const MAX_SEGMENTS = 60;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { prizeId?: string; excludeOtherWinners?: boolean; redrawWinnerId?: string };

  const prize = body.prizeId ? await prisma.prize.findFirst({ where: { id: body.prizeId, matchId: id } }) : null;
  if (!prize) return NextResponse.json({ error: "Choose a prize first." }, { status: 400 });

  if (body.redrawWinnerId) {
    await prisma.winner.updateMany({ where: { id: body.redrawWinnerId, matchId: id, status: "VALID" }, data: { status: "REDRAWN" } });
  }

  const drawn = await prisma.winner.count({ where: { prizeId: prize.id, status: "VALID" } });
  if (drawn >= prize.quantity) {
    return NextResponse.json({ error: `All ${prize.quantity} "${prize.name}" prize(s) have been drawn.` }, { status: 400 });
  }

  const pool = await eligibleFor(id, body.excludeOtherWinners ?? true);
  if (pool.length === 0) return NextResponse.json({ error: "No eligible participants left." }, { status: 400 });

  const picked = pool[randomInt(pool.length)];
  const winner = await prisma.winner.create({ data: { matchId: id, prizeId: prize.id, registrationId: picked.id } });

  const others = shuffle(pool.filter((p) => p.id !== picked.id)).slice(0, MAX_SEGMENTS - 1);
  const segments = shuffle([picked, ...others]).map((p) => ({ id: p.id, name: p.name }));

  return NextResponse.json({
    winner: { id: winner.id, registrationId: picked.id, name: picked.name, staffId: picked.staffId, department: picked.department, prize: prize.name, prizeId: prize.id, drawnAt: winner.drawnAt },
    segments,
    winnerIndex: segments.findIndex((s) => s.id === picked.id),
    poolSize: pool.length,
  });
}
