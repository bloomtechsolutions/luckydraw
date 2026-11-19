import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";
import { registrationState } from "@/lib/match";
import Logo from "@/components/Logo";
import Countdown from "@/components/Countdown";
import Scoreboard from "@/components/Scoreboard";

export const dynamic = "force-dynamic";

const STEPS = [
  ["🏟️", "Come to the match", "Cheer for your colleagues at the venue."],
  ["📱", "Scan the QR code", "It's on the screen at the court. Enter your staff ID and name."],
  ["🎁", "Win live", "Winners are drawn on the big wheel after the final whistle."],
] as const;

export default async function Home() {
  const upcoming = await prisma.match.findMany({
    where: { status: { not: "DRAFT" }, regClosesAt: { gte: new Date() } },
    include: { competition: true, prizes: { orderBy: { sortOrder: "asc" } } },
    orderBy: { startsAt: "asc" },
    take: 10,
  });

  return (
    <main className="bg-stadium relative min-h-dvh overflow-hidden">
      <div className="orb -top-24 -left-24 h-80 w-80 bg-brand-500/40" />
      <div className="orb top-1/3 -right-32 h-96 w-96 bg-pink-500/20 [animation-delay:-5s]" />

      <div className="relative mx-auto flex min-h-dvh max-w-2xl flex-col px-4 py-10 sm:py-14">
        <header className="animate-rise text-center">
          <div className="relative mx-auto w-28 sm:w-32">
            <div className="absolute inset-0 rounded-full bg-gold-400/30 blur-2xl" />
            <Logo variant="mark" className="animate-float relative h-auto w-full text-white drop-shadow-[0_8px_30px_rgba(99,102,241,0.6)]" />
          </div>
          <div className="mt-5 text-xs font-bold tracking-[0.3em] text-white/60 uppercase">United BML presents</div>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
            Supporters <span className="text-gold-gradient">Lucky Draw</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-white/70">Show up, cheer loud, and you could walk away with a prize.</p>
        </header>

        <section className="mt-10 space-y-4">
          <h2 className="text-sm font-bold tracking-widest text-white/60 uppercase">Upcoming matches</h2>
          {upcoming.length === 0 && (
            <div className="glass p-6 text-center text-white/70">No upcoming matches right now. Check back soon!</div>
          )}
          {upcoming.map((m, i) => {
            const state = registrationState(m);
            return (
              <article key={m.id} className="glass animate-rise overflow-hidden" style={{ animationDelay: `${120 + i * 80}ms` }}>
                <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
                  <span className="truncate text-xs font-bold tracking-wider text-gold-300 uppercase">{m.competition.name}</span>
                  {state === "open" ? (
                    <span className="badge shrink-0 bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30">
                      <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                      Registration open
                    </span>
                  ) : (
                    <span className="badge shrink-0 bg-white/10 text-white/70">Opens {fmtDateTime(m.regOpensAt)}</span>
                  )}
                </div>
                <div className="space-y-4 px-5 py-5">
                  {m.teamA && m.teamB && <div className="text-center text-xs font-semibold text-white/50 uppercase">{m.title}</div>}
                  <Scoreboard title={m.title} teamA={m.teamA} teamB={m.teamB} />
                  <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-white/75">
                    <span className="rounded-full bg-white/10 px-3 py-1">🗓 {fmtDateTime(m.startsAt)}</span>
                    {m.venue && <span className="rounded-full bg-white/10 px-3 py-1">📍 {m.venue}</span>}
                  </div>
                  <Countdown to={m.startsAt.toISOString()} className="justify-center" />
                  {m.prizes.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {m.prizes.map((p) => (
                        <span key={p.id} className="badge bg-gold-400/15 text-gold-300 ring-1 ring-gold-400/30">
                          🎁 {p.quantity > 1 ? `${p.quantity} × ` : ""}{p.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-10">
          <h2 className="text-sm font-bold tracking-widest text-white/60 uppercase">How it works</h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3">
            {STEPS.map(([icon, title, text], i) => (
              <li key={title} className="glass animate-rise p-4" style={{ animationDelay: `${300 + i * 100}ms` }}>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-400 text-sm font-black text-night-900">{i + 1}</span>
                  <span className="text-2xl">{icon}</span>
                </div>
                <div className="mt-2 font-bold">{title}</div>
                <p className="mt-1 text-sm text-white/65">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <footer className="mt-auto flex items-center justify-center gap-2 pt-12 text-xs text-white/40">
          <Logo variant="mark" className="h-4 w-auto text-white/40" /> United BML ·{" "}
          <Link href="/admin" className="hover:text-white/70">Admin</Link>
        </footer>
      </div>
    </main>
  );
}
