import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { guard } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import { matchLabel } from "@/lib/match";

export const dynamic = "force-dynamic";

type Row = Record<string, string | number>;

function toCsv(rows: Row[]) {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // avoid spreadsheet formula injection
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\r\n");
}

function addSheet(wb: ExcelJS.Workbook, name: string, rows: Row[]) {
  const ws = wb.addWorksheet(name);
  const cols = rows.length ? Object.keys(rows[0]) : ["(empty)"];
  ws.columns = cols.map((c) => ({ header: c, key: c, width: Math.min(45, Math.max(10, c.length + 2, ...rows.map((r) => String(r[c] ?? "").length + 2))) }));
  ws.addRows(rows);
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  if (rows.length) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };
}

function safeName(s: string) {
  return s.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "_").slice(0, 60) || "export";
}

export async function GET(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const sp = new URL(req.url).searchParams;
  const matchId = sp.get("match");
  const competitionId = sp.get("competition");
  const format = sp.get("format") === "csv" ? "csv" : "xlsx";

  const matches = await prisma.match.findMany({
    where: matchId ? { id: matchId } : competitionId ? { competitionId } : { id: "__none__" },
    orderBy: { startsAt: "asc" },
    include: {
      competition: true,
      registrations: { orderBy: { createdAt: "asc" } },
      winners: { orderBy: { drawnAt: "asc" }, include: { registration: true, prize: true } },
    },
  });
  if (matches.length === 0 && !competitionId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const multi = !matchId;
  const regs: Row[] = matches.flatMap((m) =>
    m.registrations.map((r, i) => ({
      ...(multi ? { Match: matchLabel(m), "Match date": fmtDateTime(m.startsAt) } : {}),
      No: i + 1,
      "Staff ID": r.staffId,
      Name: r.name,
      Department: r.department,
      "Registered at": fmtDateTime(r.createdAt),
    })),
  );
  const winners: Row[] = matches.flatMap((m) =>
    m.winners.map((w) => ({
      ...(multi ? { Match: matchLabel(m) } : {}),
      Prize: w.prize.name,
      "Staff ID": w.registration.staffId,
      Name: w.registration.name,
      Department: w.registration.department,
      "Drawn at": fmtDateTime(w.drawnAt),
      Status: w.status === "VALID" ? "Winner" : "Absent (re-drawn)",
    })),
  );

  const base = matchId
    ? safeName(`${matches[0].competition.name} ${matchLabel(matches[0])}`)
    : safeName((await prisma.competition.findUnique({ where: { id: competitionId ?? "" } }))?.name ?? "competition");

  if (format === "csv") {
    return new NextResponse("﻿" + toCsv(regs), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${base}_registrations.csv"`,
      },
    });
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = "Lucky Draw";
  addSheet(wb, "Registrations", regs);
  addSheet(wb, "Winners", winners);
  if (multi) {
    addSheet(
      wb,
      "Per match",
      matches.map((m) => ({ Match: matchLabel(m), Date: fmtDateTime(m.startsAt), Venue: m.venue ?? "", Registrations: m.registrations.length, Winners: m.winners.filter((w) => w.status === "VALID").length })),
    );
    const supporters = new Map<string, Row & { Matches: number }>();
    for (const m of matches)
      for (const r of m.registrations) {
        const s = supporters.get(r.staffId) ?? { "Staff ID": r.staffId, Name: r.name, Department: r.department, Matches: 0 };
        s.Matches += 1;
        supporters.set(r.staffId, s);
      }
    addSheet(wb, "Supporters", [...supporters.values()].sort((a, b) => b.Matches - a.Matches));
  }
  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${base}.xlsx"`,
    },
  });
}
