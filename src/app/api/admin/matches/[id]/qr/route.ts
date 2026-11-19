import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { appOrigin, guard } from "@/lib/api";
import { registrationState } from "@/lib/match";
import { qrToken, secondsUntilNextWindow } from "@/lib/tokens";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  const m = await prisma.match.findUnique({ where: { id }, include: { _count: { select: { registrations: true } } } });
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const base = `${appOrigin(req)}/r/${m.code}`;
  const url = m.rotatingQr ? `${base}?t=${qrToken(m).token}` : base;
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#1e1b4b", light: "#ffffff" } });

  return NextResponse.json(
    {
      url,
      svg,
      rotating: m.rotatingQr,
      secondsLeft: m.rotatingQr ? secondsUntilNextWindow() : null,
      count: m._count.registrations,
      state: registrationState(m),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
