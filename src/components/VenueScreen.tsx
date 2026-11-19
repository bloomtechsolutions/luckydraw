import type { Competition, Match, Prize } from "@prisma/client";
import LiveQr from "./LiveQr";

/** Full-screen "scan to join" display with the live QR code. */
export default function VenueScreen({ match: m, endpoint }: { match: Match & { competition: Competition; prizes: Prize[] }; endpoint: string }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-gradient-to-br from-brand-700 via-brand-900 to-slate-950 p-6 text-center text-white">
      <div>
        <div className="text-lg font-semibold tracking-widest text-brand-100 uppercase">{m.competition.name}</div>
        <h1 className="mt-1 text-4xl font-black sm:text-5xl">{m.teamA && m.teamB ? `${m.teamA} vs ${m.teamB}` : m.title}</h1>
      </div>
      <LiveQr endpoint={endpoint} poster={false} />
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
