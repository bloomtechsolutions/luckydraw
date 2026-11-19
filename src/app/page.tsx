import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";
import { matchLabel } from "@/lib/match";

export const dynamic = "force-dynamic";

export default async function Home() {
  const upcoming = await prisma.match.findMany({
    where: { status: { not: "DRAFT" }, regClosesAt: { gte: new Date() } },
    include: { competition: true },
    orderBy: { startsAt: "asc" },
    take: 10,
  });

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 py-10">
      <div className="text-center">
        <div className="text-6xl">🎡</div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Supporters Lucky Draw</h1>
        <p className="mt-2 text-slate-600">
          Come support your colleagues at the match, scan the QR code displayed at the venue and you&apos;re in the draw.
        </p>
      </div>

      <section className="card mt-8 p-5">
        <h2 className="font-semibold">Upcoming matches</h2>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No upcoming matches right now.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {upcoming.map((m) => (
              <li key={m.id} className="py-3">
                <div className="text-xs font-medium text-brand-600">{m.competition.name}</div>
                <div className="font-medium">{matchLabel(m)}</div>
                <div className="text-sm text-slate-500">
                  {fmtDateTime(m.startsAt)}
                  {m.venue ? ` · ${m.venue}` : ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-auto pt-10 text-center text-xs text-slate-400">
        <Link href="/admin" className="hover:text-slate-600">Admin</Link>
      </p>
    </main>
  );
}
