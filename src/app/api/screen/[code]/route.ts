import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { qrPayload } from "@/lib/qr";
import { verifyDisplayKey } from "@/lib/tokens";

export const dynamic = "force-dynamic";

/** Public (no login) QR feed for the venue screen; protected by the per-match display key. */
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const k = new URL(req.url).searchParams.get("k") ?? undefined;
  const m = await prisma.match.findUnique({ where: { code: code.toUpperCase() }, include: { _count: { select: { registrations: true } } } });
  if (!m || !verifyDisplayKey(m, k)) return NextResponse.json({ error: "Invalid screen link" }, { status: 403 });
  return NextResponse.json(await qrPayload(req, m), { headers: { "Cache-Control": "no-store" } });
}
