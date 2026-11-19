import "server-only";
import QRCode from "qrcode";
import type { Match } from "@prisma/client";
import { appOrigin } from "./api";
import { registrationState } from "./match";
import { qrToken, secondsUntilNextWindow } from "./tokens";

/** Current QR image + live count for a venue screen. */
export async function qrPayload(req: Request, m: Match & { _count: { registrations: number } }) {
  const base = `${appOrigin(req)}/r/${m.code}`;
  const url = m.rotatingQr ? `${base}?t=${qrToken(m).token}` : base;
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#1e1b4b", light: "#ffffff" } });
  return {
    url,
    svg,
    rotating: m.rotatingQr,
    secondsLeft: m.rotatingQr ? secondsUntilNextWindow() : null,
    count: m._count.registrations,
    state: registrationState(m),
  };
}
