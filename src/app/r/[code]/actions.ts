"use server";

import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { cleanText, normaliseStaffId } from "@/lib/format";
import { registrationState } from "@/lib/match";
import { verifyTicket } from "@/lib/tokens";

export type RegisterResult =
  | { status: "idle" }
  | { status: "error"; message: string; values?: { staffId: string; name: string; department: string } }
  | { status: "success"; already: boolean; staffId: string; name: string; department: string; registeredAt: string; entryNo: number };

export async function register(_prev: RegisterResult, formData: FormData): Promise<RegisterResult> {
  const code = String(formData.get("code") ?? "");
  const ticket = String(formData.get("ticket") ?? "");
  const staffId = normaliseStaffId(String(formData.get("staffId") ?? "")).slice(0, 30);
  const name = cleanText(formData.get("name"), 100);
  const department = cleanText(formData.get("department"), 100);
  const values = { staffId, name, department };

  const match = await prisma.match.findUnique({ where: { code } });
  if (!match) return { status: "error", message: "This event could not be found." };

  const state = registrationState(match);
  if (state !== "open") {
    return { status: "error", message: state === "not_yet" ? "Registration hasn't opened yet." : "Registration for this match is closed." };
  }
  if (match.rotatingQr && !verifyTicket(match, ticket)) {
    return { status: "error", message: "Your session expired. Please scan the QR code at the venue again." };
  }
  if (!staffId || staffId.length < 2) return { status: "error", message: "Please enter your staff ID.", values };
  if (!name || name.length < 2) return { status: "error", message: "Please enter your full name.", values };
  if (!department) return { status: "error", message: "Please select your department.", values };

  const deptCount = await prisma.department.count();
  if (deptCount > 0 && !(await prisma.department.findUnique({ where: { name: department } }))) {
    return { status: "error", message: "Please select a department from the list.", values };
  }

  // Already registered with this staff ID? Show their existing entry instead of an error.
  const existing = await prisma.registration.findUnique({ where: { matchId_staffId: { matchId: match.id, staffId } } });
  if (existing) return alreadyRegistered(match.id, existing);

  const deviceId = await getDeviceId();
  if (match.onePerDevice) {
    const fromThisPhone = await prisma.registration.findFirst({ where: { matchId: match.id, deviceId } });
    if (fromThisPhone) {
      return {
        status: "error",
        message: `This phone has already been used to register ${fromThisPhone.name} (${fromThisPhone.staffId}) for this match. Each phone can register only one person, so please use your own phone.`,
      };
    }
  }

  try {
    const r = await prisma.registration.create({ data: { matchId: match.id, staffId, name, department, deviceId } });
    return { status: "success", already: false, staffId, name, department, registeredAt: r.createdAt.toISOString(), entryNo: await entryNumber(match.id, r.createdAt) };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      // Lost a race with a simultaneous submit of the same staff ID.
      const dup = await prisma.registration.findUnique({ where: { matchId_staffId: { matchId: match.id, staffId } } });
      if (dup) return alreadyRegistered(match.id, dup);
    }
    console.error(e);
    return { status: "error", message: "Something went wrong. Please try again.", values };
  }
}

/** Position of this entry in the match (1 = first supporter to register). */
async function entryNumber(matchId: string, createdAt: Date) {
  return prisma.registration.count({ where: { matchId, createdAt: { lte: createdAt } } });
}

async function alreadyRegistered(
  matchId: string,
  r: { staffId: string; name: string; department: string; createdAt: Date },
): Promise<RegisterResult> {
  return {
    status: "success",
    already: true,
    staffId: r.staffId,
    name: r.name,
    department: r.department,
    registeredAt: r.createdAt.toISOString(),
    entryNo: await entryNumber(matchId, r.createdAt),
  };
}

const DEVICE_COOKIE = "ld_device";

/** Anonymous per-browser ID kept in a long-lived cookie. */
async function getDeviceId() {
  const store = await cookies();
  const existing = store.get(DEVICE_COOKIE)?.value;
  if (existing && /^[A-Za-z0-9_-]{16,64}$/.test(existing)) return existing;
  const id = randomBytes(16).toString("base64url");
  store.set(DEVICE_COOKIE, id, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  return id;
}
