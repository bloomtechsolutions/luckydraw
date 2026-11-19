import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";
import { matchLabel, registrationState } from "@/lib/match";
import { departmentBreakdown, topSupporters, uniqueSupporters } from "@/lib/stats";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import ConfirmButton from "@/components/ConfirmButton";
import { ColumnBars, HorizontalBars } from "@/components/Charts";
import { deleteCompetition, updateCompetition } from "../../../actions";
import TopList from "@/components/TopList";

export const dynamic = "force-dynamic";

export default async function CompetitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await prisma.competition.findUnique({
    where: { id },
    include: { matches: { orderBy: { startsAt: "asc" }, include: { _count: { select: { registrations: true } } } } },
  });
  if (!c) notFound();

  const [depts, top, unique, winners] = await Promise.all([
    departmentBreakdown({ match: { competitionId: id } }),
    topSupporters(id, 10),
    uniqueSupporters(id),
    prisma.winner.count({ where: { status: "VALID", match: { competitionId: id } } }),
  ]);
  const total = c.matches.reduce((n, m) => n + m._count.registrations, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-800">← Dashboard</Link>
          <h1 className="mt-1 text-2xl font-extrabold">{c.name}</h1>
          {c.description && <p className="text-slate-600">{c.description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/admin/export?competition=${c.id}&format=xlsx`} className="btn-secondary">⬇ Export all (Excel)</a>
          <Link href={`/admin/competitions/${c.id}/new-match`} className="btn-primary">+ New match</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Matches" value={c.matches.length} />
        <StatCard label="Registrations" value={total} />
        <StatCard label="Unique supporters" value={unique} />
        <StatCard label="Winners" value={winners} />
      </div>

      <section className="card overflow-hidden">
        <h2 className="border-b border-slate-100 px-5 py-3 font-bold">Matches</h2>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 font-bold">Supporters per match</h2>
          <ColumnBars data={c.matches.map((m, i) => ({ label: m.teamA && m.teamB ? `${m.teamA} v ${m.teamB}` : `M${i + 1}`, value: m._count.registrations }))} />
        </section>
        <section className="card p-5">
          <h2 className="mb-3 font-bold">By department</h2>
          <HorizontalBars data={depts} />
        </section>
      </div>

      <section className="card p-5">
        <h2 className="font-bold">🏅 Most loyal supporters</h2>
        <TopList rows={top} />
      </section>

      <details className="card p-5">
        <summary className="cursor-pointer font-bold">Competition settings</summary>
        <form action={updateCompetition.bind(null, c.id)} className="mt-4 space-y-3">
          <input name="name" required defaultValue={c.name} className="input" />
          <textarea name="description" rows={2} defaultValue={c.description ?? ""} className="input" />
          <button className="btn-primary">Save</button>
        </form>
        <div className="mt-6 border-t border-slate-100 pt-4">
          <ConfirmButton action={deleteCompetition.bind(null, c.id)} confirm={`Delete "${c.name}" and ALL its matches, registrations and winners? This cannot be undone.`}>
            Delete competition
          </ConfirmButton>
        </div>
      </details>
    </div>
  );
}
