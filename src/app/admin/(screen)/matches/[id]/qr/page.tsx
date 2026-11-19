import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";
import LiveQr from "./LiveQr";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

export default async function QrScreen({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ print?: string }> }) {
  const { id } = await params;
  const { print } = await searchParams;
  const m = await prisma.match.findUnique({ where: { id }, include: { competition: true, prizes: { orderBy: { sortOrder: "asc" } } } });
  if (!m) notFound();
  const poster = print === "1" && !m.rotatingQr;

  if (poster) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center bg-white p-8 text-center text-slate-900 print:p-0">
        <PrintButton />
        <div className="text-lg font-semibold tracking-widest text-brand-600 uppercase">{m.competition.name}</div>
        <h1 className="mt-2 text-5xl font-black">{m.teamA && m.teamB ? `${m.teamA} vs ${m.teamB}` : m.title}</h1>
        <p className="mt-2 text-xl text-slate-600">{fmtDateTime(m.startsAt)}{m.venue ? ` · ${m.venue}` : ""}</p>
        <div className="my-8"><LiveQr matchId={m.id} poster /></div>
        <p className="text-4xl font-black">📱 Scan to join the Lucky Draw!</p>
        {m.prizes.length > 0 && <p className="mt-3 text-xl text-slate-600">Prizes: {m.prizes.map((p) => (p.quantity > 1 ? `${p.quantity}× ${p.name}` : p.name)).join(" · ")}</p>}
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-gradient-to-br from-brand-700 via-brand-900 to-slate-950 p-6 text-center text-white">
      <div>
        <div className="text-lg font-semibold tracking-widest text-brand-100 uppercase">{m.competition.name}</div>
        <h1 className="mt-1 text-4xl font-black sm:text-5xl">{m.teamA && m.teamB ? `${m.teamA} vs ${m.teamB}` : m.title}</h1>
      </div>
      <LiveQr matchId={m.id} poster={false} />
      <p className="text-3xl font-black sm:text-4xl">
        📱 Scan to join the <span className="text-accent-400">Lucky Draw!</span>
      </p>
      {m.prizes.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {m.prizes.map((p) => (
            <span key={p.id} className="rounded-full bg-accent-400 px-4 py-1.5 text-lg font-bold text-brand-900">
              🎁 {p.quantity > 1 ? `${p.quantity} × ` : ""}{p.name}
            </span>
          ))}
        </div>
      )}
    </main>
  );
}
