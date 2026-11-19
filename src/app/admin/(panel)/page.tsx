import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";
import { matchLabel, registrationState } from "@/lib/match";
import { topSupporters, uniqueSupporters } from "@/lib/stats";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import TopList from "@/components/TopList";
import { createCompetition } from "../actions";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [competitions, totalRegs, unique, winners, top, deptCount] = await Promise.all([
    prisma.competition.findMany({
      orderBy: { createdAt: "desc" },
      include: { matches: { orderBy: { startsAt: "asc" }, include: { _count: { select: { registrations: true } } } } },
    }),
    prisma.registration.count(),
    uniqueSupporters(),
    prisma.winner.count({ where: { status: "VALID" } }),
    topSupporters(undefined, 5),
    prisma.department.count(),
  ]);
  const matchCount = competitions.reduce((n, c) => n + c.matches.length, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Dashboard</h1>

      {deptCount === 0 && (
        <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
          No departments set up yet. Staff will type their department freely.{" "}
          <Link href="/admin/departments" className="font-semibold underline">Add departments</Link> to show a dropdown instead (cleaner stats).
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Matches" value={matchCount} hint={`${competitions.length} competition(s)`} />
        <StatCard label="Registrations" value={totalRegs} />
        <StatCard label="Unique supporters" value={unique} />
        <StatCard label="Winners drawn" value={winners} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {competitions.length === 0 && (
            <div className="card p-8 text-center text-slate-500">Create your first competition to get started →</div>
          )}
          {competitions.map((c) => (
            <section key={c.id} className="card overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
                <Link href={`/admin/competitions/${c.id}`} className="font-bold hover:text-brand-600">{c.name}</Link>
                <Link href={`/admin/competitions/${c.id}/new-match`} className="btn-secondary btn-sm">+ Match</Link>
              </div>
              {c.matches.length === 0 ? (
                <p className="px-5 py-4 text-sm text-slate-500">No matches yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {c.matches.map((m) => (
                    <li key={m.id}>
                      <Link href={`/admin/matches/${m.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{matchLabel(m)}</div>
                          <div className="text-xs text-slate-500">{fmtDateTime(m.startsAt)}{m.venue ? ` · ${m.venue}` : ""}</div>
                        </div>
                        <StatusBadge state={registrationState(m)} />
                        <div className="w-14 text-right text-lg font-bold tabular-nums">{m._count.registrations}</div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="space-y-6">
          <form action={createCompetition} className="card space-y-3 p-5">
            <h2 className="font-bold">New competition</h2>
            <input name="name" required placeholder="e.g. Interoffice Netball 2026" className="input" />
            <textarea name="description" rows={2} placeholder="Description (optional)" className="input" />
            <button className="btn-primary w-full">Create competition</button>
          </form>

          <section className="card p-5">
            <h2 className="font-bold">🏅 Top supporters</h2>
            <TopList rows={top} />
          </section>
        </div>
      </div>
    </div>
  );
}
