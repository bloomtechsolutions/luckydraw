"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { cleanText, normaliseStaffId } from "@/lib/format";
import { registrationState } from "@/lib/match";
import { verifyTicket } from "@/lib/tokens";

export type RegisterResult =
  | { status: "idle" }
  | { status: "error"; message: string; values?: { staffId: string; name: string; department: string } }
  | { status: "success"; already: boolean; staffId: string; name: string; department: string; registeredAt: string };

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

  try {
    const r = await prisma.registration.create({ data: { matchId: match.id, staffId, name, department } });
    return { status: "success", already: false, staffId, name, department, registeredAt: r.createdAt.toISOString() };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const existing = await prisma.registration.findUnique({ where: { matchId_staffId: { matchId: match.id, staffId } } });
      if (existing) {
        return {
          status: "success",
          already: true,
          staffId: existing.staffId,
          name: existing.name,
          department: existing.department,
          registeredAt: existing.createdAt.toISOString(),
        };
      }
    }
    console.error(e);
    return { status: "error", message: "Something went wrong. Please try again.", values };
  }
}
