import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { guard } from "@/lib/api";
import { qrPayload } from "@/lib/qr";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  const m = await prisma.match.findUnique({ where: { id }, include: { _count: { select: { registrations: true } } } });
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(await qrPayload(req, m), { headers: { "Cache-Control": "no-store" } });
}
