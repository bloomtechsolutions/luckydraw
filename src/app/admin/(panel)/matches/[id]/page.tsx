import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";
import { matchLabel, registrationState } from "@/lib/match";
import { departmentBreakdown, timeline } from "@/lib/stats";
import { duplicateReport } from "@/lib/duplicates";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import ConfirmButton from "@/components/ConfirmButton";
import AutoRefresh from "@/components/AutoRefresh";
import RegistrationsTable from "@/components/RegistrationsTable";
import { ColumnBars, HorizontalBars } from "@/components/Charts";
import CopyButton from "@/components/CopyButton";
import { displayKey } from "@/lib/tokens";
import { addPrize, deleteMatch, deletePrize, deleteRegistration, deleteWinner, rotateQrSecret, setMatchStatus } from "../../../actions";

export const dynamic = "force-dynamic";

const TABS = [
  ["registrations", "Registrations"],
  ["stats", "Stats"],
  ["prizes", "Prizes & winners"],
  ["settings", "Settings"],
] as const;

export default async function MatchPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const { tab = "registrations" } = await searchParams;
  const m = await prisma.match.findUnique({
    where: { id },
    include: {
      competition: true,
      registrations: { orderBy: { createdAt: "asc" } },
      prizes: { orderBy: { sortOrder: "asc" }, include: { winners: { where: { status: "VALID" } } } },
      winners: { orderBy: { drawnAt: "asc" }, include: { registration: true, prize: true } },
    },
  });
  if (!m) notFound();

  const state = registrationState(m);
  const validWinners = m.winners.filter((w) => w.status === "VALID");
  const wonBy = new Map(validWinners.map((w) => [w.registrationId, w.prize.name]));
  const depts = tab === "stats" ? await departmentBreakdown({ matchId: m.id }) : [];
  const dups = await duplicateReport(m.id);
  const h = await headers();
  const origin = process.env.APP_URL?.replace(/\/$/, "") || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const screenUrl = `${origin}/screen/${m.code}?k=${displayKey(m)}`;

  return (
    <div className="space-y-6">
      {state === "open" && <AutoRefresh seconds={15} />}
      <div>
        <Link href={`/admin/competitions/${m.competitionId}`} className="text-sm text-slate-500 hover:text-slate-800">← {m.competition.name}</Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold">{matchLabel(m)}</h1>
          <StatusBadge state={state} />
        </div>
        <p className="text-sm text-slate-600">
          {fmtDateTime(m.startsAt)}
          {m.venue ? ` · ${m.venue}` : ""} · Registration {fmtDateTime(m.regOpensAt)} → {fmtDateTime(m.regClosesAt)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <a href={`/admin/matches/${m.id}/qr`} target="_blank" className="btn-primary">📺 Show QR at venue</a>
        <a href={`/admin/matches/${m.id}/draw`} target="_blank" className="btn bg-accent-400 text-brand-900 hover:bg-accent-500">🎡 Lucky draw</a>
        <a href={`/api/admin/export?match=${m.id}&format=xlsx`} className="btn-secondary">⬇ Excel</a>
        <a href={`/api/admin/export?match=${m.id}&format=csv`} className="btn-secondary">⬇ CSV</a>
        {state !== "open" ? (
          <ConfirmButton action={setMatchStatus.bind(null, m.id, "OPEN")} className="btn-secondary">▶ Open registration now</ConfirmButton>
        ) : (
          <ConfirmButton action={setMatchStatus.bind(null, m.id, "CLOSED")} confirm="Close registration for this match?" className="btn-secondary">■ Close registration</ConfirmButton>
        )}
        <Link href={`/admin/matches/${m.id}/edit`} className="btn-secondary">✎ Edit</Link>
      </div>

      <section className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold">📺 Venue screen link <span className="font-normal text-slate-500">(no login needed)</span></div>
          <p className="text-xs text-slate-500">Open this on the TV, laptop or tablet at the court to show the live QR. Keep it private: anyone with this link can see the QR.</p>
          <code className="mt-1.5 block truncate rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs">{screenUrl}</code>
        </div>
        <div className="flex shrink-0 gap-2">
          <CopyButton text={screenUrl} label="Copy link" />
          <a href={screenUrl} target="_blank" className="btn-secondary">Open</a>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Registrations" value={m.registrations.length} hint={m.registrations.length ? `Last at ${fmtDateTime(m.registrations[m.registrations.length - 1].createdAt)}` : undefined} />
        <StatCard label="Departments" value={new Set(m.registrations.map((r) => r.department)).size} />
        <StatCard label="Prizes" value={m.prizes.reduce((n, p) => n + p.quantity, 0)} />
        <StatCard label="Winners drawn" value={validWinners.length} />
      </div>

      <nav className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map(([key, label]) => (
          <Link
            key={key}
            href={`?tab=${key}`}
            className={`border-b-2 px-4 py-2 text-sm font-semibold whitespace-nowrap ${tab === key ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {tab === "registrations" && dups.groups.length > 0 && (
        <section className="card overflow-hidden ring-rose-200">
          <div className="flex items-center gap-2 border-b border-rose-100 bg-rose-50 px-5 py-3">
            <span className="text-lg">⚠️</span>
            <h2 className="font-bold text-rose-800">Possible duplicates ({dups.groups.length})</h2>
            <span className="text-sm text-rose-700/80">Review these and remove any entries that shouldn&apos;t count.</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {dups.groups.map((g, i) => (
              <li key={i} className="px-5 py-3">
                <div className="text-sm font-semibold">{g.title}</div>
                <div className="text-xs text-slate-500">{g.detail}</div>
                <ul className="mt-2 space-y-1">
                  {g.regs.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 text-sm">
                      <span className="w-24 shrink-0 font-mono font-medium">{r.staffId}</span>
                      <span className="min-w-0 flex-1 truncate">{r.name} <span className="text-slate-500">· {r.department} · {fmtDateTime(r.createdAt)}</span></span>
                      <ConfirmButton action={deleteRegistration.bind(null, r.id)} confirm={`Remove ${r.name} (${r.staffId}) from this match?`}>Remove</ConfirmButton>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "registrations" && (
        <section className="card overflow-hidden">
          <RegistrationsTable
            rows={m.registrations.map((r, i) => ({
              id: r.id,
              no: i + 1,
              staffId: r.staffId,
              name: r.name,
              department: r.department,
              registeredAt: fmtDateTime(r.createdAt),
              won: wonBy.get(r.id),
              flags: dups.flagged.get(r.id),
            }))}
          />
        </section>
      )}

      {tab === "stats" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card p-5">
            <h2 className="mb-3 font-bold">By department</h2>
            <HorizontalBars data={depts} />
          </section>
          <section className="card p-5">
            <h2 className="mb-3 font-bold">Arrivals (registrations per 10 min)</h2>
            <ColumnBars data={timeline(m.registrations.map((r) => r.createdAt))} />
          </section>
        </div>
      )}

      {tab === "prizes" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card p-5">
            <h2 className="font-bold">Prizes</h2>
            <p className="text-sm text-slate-500">Draw order follows this list. Quantity = number of winners for that prize.</p>
            <ul className="mt-4 divide-y divide-slate-100">
              {m.prizes.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5">
                  <span className="text-xl">🎁</span>
                  <div className="flex-1">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.winners.length} / {p.quantity} drawn</div>
                  </div>
                  <ConfirmButton action={deletePrize.bind(null, p.id)} confirm={`Delete prize "${p.name}"? Its winners will also be removed.`}>Delete</ConfirmButton>
                </li>
              ))}
              {m.prizes.length === 0 && <li className="py-3 text-sm text-slate-500">No prizes yet. Add at least one before the draw.</li>}
            </ul>
            <form action={addPrize.bind(null, m.id)} className="mt-4 flex gap-2">
              <input name="name" required placeholder="Prize name, e.g. Gift voucher" className="input" />
              <input name="quantity" type="number" min={1} max={500} defaultValue={1} className="input w-20" aria-label="Quantity" />
              <button className="btn-primary">Add</button>
            </form>
          </section>

          <section className="card p-5">
            <h2 className="font-bold">Winners</h2>
            <ul className="mt-3 divide-y divide-slate-100">
              {m.winners.map((w) => (
                <li key={w.id} className={`flex items-center gap-3 py-2.5 ${w.status === "REDRAWN" ? "opacity-50" : ""}`}>
                  <span className="text-xl">{w.status === "VALID" ? "🏆" : "↺"}</span>
                  <div className="min-w-0 flex-1">
                    <div className={`font-medium ${w.status === "REDRAWN" ? "line-through" : ""}`}>{w.registration.name} <span className="font-mono text-xs text-slate-500">{w.registration.staffId}</span></div>
                    <div className="text-xs text-slate-500">{w.prize.name} · {w.registration.department} · {fmtDateTime(w.drawnAt)}{w.status === "REDRAWN" ? " · absent, re-drawn" : ""}</div>
                  </div>
                  <ConfirmButton action={deleteWinner.bind(null, w.id)} confirm="Remove this draw result?">Remove</ConfirmButton>
                </li>
              ))}
              {m.winners.length === 0 && <li className="py-3 text-sm text-slate-500">No winners drawn yet.</li>}
            </ul>
          </section>
        </div>
      )}

      {tab === "settings" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card space-y-3 p-5">
            <h2 className="font-bold">Registration link</h2>
            {m.rotatingQr ? (
              <p className="text-sm text-slate-600">
                Rotating QR is <strong>on</strong>: staff can only register by scanning the live QR on the venue screen. Links and screenshots expire within ~3 minutes.
              </p>
            ) : (
              <>
                <p className="text-sm text-slate-600">Rotating QR is <strong>off</strong>: this permanent link works for anyone during the registration window.</p>
                <code className="block rounded-lg bg-slate-100 p-3 text-sm break-all">{origin}/r/{m.code}</code>
                <a href={`/admin/matches/${m.id}/qr?print=1`} target="_blank" className="btn-secondary">🖨 Printable poster</a>
              </>
            )}
            <div className="border-t border-slate-100 pt-3">
              <ConfirmButton action={rotateQrSecret.bind(null, m.id)} confirm="Invalidate all QR codes/links issued so far for this match? This also changes the venue screen link." className="btn-secondary btn-sm">
                Invalidate old QR codes
              </ConfirmButton>
            </div>
          </section>
          <section className="card space-y-3 p-5">
            <h2 className="font-bold">Danger zone</h2>
            <p className="text-sm text-slate-600">Deleting removes this match with all {m.registrations.length} registrations and winners.</p>
            <ConfirmButton action={deleteMatch.bind(null, m.id)} confirm="Delete this match and all its data? This cannot be undone." className="btn-danger">Delete match</ConfirmButton>
          </section>
        </div>
      )}
    </div>
  );
}
