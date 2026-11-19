import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";
import { matchLabel, registrationState } from "@/lib/match";
import { issueTicket, verifyQrToken } from "@/lib/tokens";
import RegisterForm from "./RegisterForm";

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
    <main className="mx-auto max-w-md px-4 py-6 sm:py-10">
      <header className="mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 p-5 text-white shadow-lg">
        <div className="text-xs font-semibold tracking-wider text-brand-100 uppercase">{match.competition.name}</div>
        <h1 className="mt-1 text-2xl font-extrabold">{match.title}</h1>
        {match.teamA && match.teamB && (
          <div className="mt-3 flex items-center gap-3 text-lg font-bold">
            <span className="flex-1 truncate">{match.teamA}</span>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">VS</span>
            <span className="flex-1 truncate text-right">{match.teamB}</span>
          </div>
        )}
        <div className="mt-3 text-sm text-brand-100">
          {fmtDateTime(match.startsAt)}
          {match.venue ? ` · ${match.venue}` : ""}
        </div>
        {match.prizes.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {match.prizes.map((p) => (
              <span key={p.id} className="badge bg-accent-400/90 text-brand-900">
                🎁 {p.quantity > 1 ? `${p.quantity} × ` : ""}{p.name}
              </span>
            ))}
          </div>
        )}
      </header>

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
    </main>
  );
}

function Notice({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="card p-6 text-center">
      <div className="text-5xl">{icon}</div>
      <h2 className="mt-3 text-xl font-bold">{title}</h2>
      <p className="mt-2 text-slate-600">{text}</p>
    </div>
  );
}
