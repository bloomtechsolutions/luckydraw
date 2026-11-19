import "server-only";
import { NextResponse } from "next/server";
import { isAdmin } from "./admin";

export async function guard() {
  return (await isAdmin()) ? null : NextResponse.json({ error: "Unauthorised" }, { status: 401 });
}

export function appOrigin(req: Request) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = req.headers;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : new URL(req.url).origin;
}
