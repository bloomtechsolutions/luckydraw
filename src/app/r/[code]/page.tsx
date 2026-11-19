import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";
import { matchLabel, registrationState } from "@/lib/match";
import { issueTicket, verifyQrToken } from "@/lib/tokens";
import RegisterForm from "./RegisterForm";
import Logo from "@/components/Logo";
import Scoreboard from "@/components/Scoreboard";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { code } = await params;
  const { t } = await searchParams;
  const match = await prisma.match.findUnique({
    where: { code: code.toUpperCase() },
    include: { competition: true, prizes: { orderBy: { sortOrder: "asc" } } },
  });
  if (!match) notFound();

  const state = registrationState(match);
  const qrOk = !match.rotatingQr || verifyQrToken(match, t);
  const departments = state === "open" && qrOk ? (await prisma.department.findMany({ orderBy: { name: "asc" } })).map((d) => d.name) : [];

  return (
    <main className="bg-stadium relative min-h-dvh overflow-hidden">
      <div className="orb -top-20 -right-20 h-72 w-72 bg-brand-500/40" />
      <div className="relative mx-auto max-w-md px-4 py-6 sm:py-10">
        <header className="animate-rise text-center">
          <Logo variant="mark" className="mx-auto h-14 w-auto text-white drop-shadow-[0_6px_20px_rgba(99,102,241,0.6)]" />
          <div className="mt-3 text-[11px] font-bold tracking-[0.25em] text-gold-300 uppercase">{match.competition.name}</div>
          {match.teamA && match.teamB && <div className="mt-1 text-sm font-semibold text-white/60">{match.title}</div>}
          <div className="mt-3">
            <Scoreboard title={match.title} teamA={match.teamA} teamB={match.teamB} />
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs text-white/75">
            <span className="rounded-full bg-white/10 px-3 py-1">🗓 {fmtDateTime(match.startsAt)}</span>
            {match.venue && <span className="rounded-full bg-white/10 px-3 py-1">📍 {match.venue}</span>}
          </div>
          {match.prizes.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {match.prizes.map((p) => (
                <span key={p.id} className="badge bg-gold-400/15 text-gold-300 ring-1 ring-gold-400/30">
                  🎁 {p.quantity > 1 ? `${p.quantity} × ` : ""}{p.name}
                </span>
              ))}
            </div>
          )}
        </header>

        <div className="mt-6">
          {state !== "open" ? (
            <Notice
              icon={state === "not_yet" || state === "draft" ? "⏳" : "🔒"}
              title={state === "not_yet" || state === "draft" ? "Registration hasn't opened yet" : "Registration is closed"}
              text={
                state === "not_yet"
                  ? `Registration opens at ${fmtDateTime(match.regOpensAt)}. Scan the QR code at the venue then.`
                  : state === "draft"
                    ? "Please check back at the venue on match day."
                    : "Thanks for your support! Registration for this match has ended."
              }
            />
          ) : !qrOk ? (
            <Notice
              icon="📷"
              title="Please scan the QR code at the venue"
              text="This link has expired. The QR code at the venue changes every minute. Scan the one on the screen to register."
            />
          ) : (
            <RegisterForm code={match.code} ticket={issueTicket(match)} departments={departments} matchName={matchLabel(match)} />
          )}
        </div>
      </div>
    </main>
  );
}

function Notice({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="glass animate-rise p-6 text-center">
      <div className="text-5xl">{icon}</div>
      <h2 className="mt-3 text-xl font-bold">{title}</h2>
      <p className="mt-2 text-white/70">{text}</p>
    </div>
  );
}
