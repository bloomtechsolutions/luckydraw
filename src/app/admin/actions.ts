"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { MatchStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { ADMIN_COOKIE, adminToken } from "@/lib/auth";
import { cleanText } from "@/lib/format";
import { newMatchCode, newQrSecret } from "@/lib/tokens";

// ---------- auth ----------

export async function login(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");
  if (!process.env.ADMIN_PASSWORD) return { error: "ADMIN_PASSWORD is not configured on the server." };
  if (password !== process.env.ADMIN_PASSWORD) return { error: "Incorrect password." };
  const store = await cookies();
  store.set(ADMIN_COOKIE, await adminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logout() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

// ---------- competitions ----------

export async function createCompetition(formData: FormData) {
  await requireAdmin();
  const name = cleanText(formData.get("name"));
  if (!name) return;
  const c = await prisma.competition.create({ data: { name, description: cleanText(formData.get("description"), 500) || null } });
  redirect(`/admin/competitions/${c.id}`);
}

export async function updateCompetition(id: string, formData: FormData) {
  await requireAdmin();
  const name = cleanText(formData.get("name"));
  if (!name) return;
  await prisma.competition.update({ where: { id }, data: { name, description: cleanText(formData.get("description"), 500) || null } });
  revalidatePath(`/admin/competitions/${id}`);
}

export async function deleteCompetition(id: string) {
  await requireAdmin();
  await prisma.competition.delete({ where: { id } });
  redirect("/admin");
}

// ---------- matches ----------

function parseMatchForm(formData: FormData) {
  const date = (k: string) => {
    const d = new Date(String(formData.get(k) ?? ""));
    if (isNaN(d.getTime())) throw new Error(`Invalid ${k}`);
    return d;
  };
  const status = String(formData.get("status") ?? "DRAFT") as MatchStatus;
  return {
    title: cleanText(formData.get("title")) || "Match",
    teamA: cleanText(formData.get("teamA")) || null,
    teamB: cleanText(formData.get("teamB")) || null,
    venue: cleanText(formData.get("venue")) || null,
    startsAt: date("startsAt"),
    regOpensAt: date("regOpensAt"),
    regClosesAt: date("regClosesAt"),
    rotatingQr: formData.get("rotatingQr") === "on",
    status: (["DRAFT", "OPEN", "CLOSED"] as const).includes(status) ? status : "DRAFT",
  };
}

export async function createMatch(competitionId: string, formData: FormData) {
  await requireAdmin();
  const data = parseMatchForm(formData);
  let code = newMatchCode();
  while (await prisma.match.findUnique({ where: { code } })) code = newMatchCode();
  const m = await prisma.match.create({ data: { ...data, competitionId, code, qrSecret: newQrSecret() } });
  redirect(`/admin/matches/${m.id}`);
}

export async function updateMatch(id: string, formData: FormData) {
  await requireAdmin();
  await prisma.match.update({ where: { id }, data: parseMatchForm(formData) });
  revalidatePath(`/admin/matches/${id}`);
  redirect(`/admin/matches/${id}`);
}

export async function setMatchStatus(id: string, status: MatchStatus) {
  await requireAdmin();
  const data: { status: MatchStatus; regOpensAt?: Date; regClosesAt?: Date } = { status };
  const m = await prisma.match.findUniqueOrThrow({ where: { id } });
  const now = new Date();
  // "Open now" should actually let people in: pull the window around the current time if needed.
  if (status === "OPEN") {
    if (m.regOpensAt > now) data.regOpensAt = now;
    if (m.regClosesAt < now) data.regClosesAt = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  }
  await prisma.match.update({ where: { id }, data });
  revalidatePath(`/admin/matches/${id}`);
}

export async function deleteMatch(id: string) {
  await requireAdmin();
  const m = await prisma.match.delete({ where: { id } });
  redirect(`/admin/competitions/${m.competitionId}`);
}

export async function rotateQrSecret(id: string) {
  await requireAdmin();
  await prisma.match.update({ where: { id }, data: { qrSecret: newQrSecret() } });
  revalidatePath(`/admin/matches/${id}`);
}

// ---------- registrations ----------

export async function deleteRegistration(id: string) {
  await requireAdmin();
  const r = await prisma.registration.delete({ where: { id } });
  revalidatePath(`/admin/matches/${r.matchId}`);
}

// ---------- prizes ----------

export async function addPrize(matchId: string, formData: FormData) {
  await requireAdmin();
  const name = cleanText(formData.get("name"));
  const quantity = Math.max(1, Math.min(500, parseInt(String(formData.get("quantity") ?? "1"), 10) || 1));
  if (!name) return;
  const max = await prisma.prize.aggregate({ where: { matchId }, _max: { sortOrder: true } });
  await prisma.prize.create({ data: { matchId, name, quantity, sortOrder: (max._max.sortOrder ?? 0) + 1 } });
  revalidatePath(`/admin/matches/${matchId}`);
}

export async function deletePrize(id: string) {
  await requireAdmin();
  const p = await prisma.prize.delete({ where: { id } });
  revalidatePath(`/admin/matches/${p.matchId}`);
}

export async function deleteWinner(id: string) {
  await requireAdmin();
  const w = await prisma.winner.delete({ where: { id } });
  revalidatePath(`/admin/matches/${w.matchId}`);
}

// ---------- departments ----------

export async function addDepartments(formData: FormData) {
  await requireAdmin();
  const names = String(formData.get("names") ?? "")
    .split(/[\n,]/)
    .map((s) => cleanText(s, 100))
    .filter(Boolean);
  if (names.length) await prisma.department.createMany({ data: names.map((name) => ({ name })), skipDuplicates: true });
  revalidatePath("/admin/departments");
}

export async function deleteDepartment(id: string) {
  await requireAdmin();
  await prisma.department.delete({ where: { id } });
  revalidatePath("/admin/departments");
}
