import type { Competition, Match, Prize } from "@prisma/client";
import LiveQr from "./LiveQr";
import Logo from "./Logo";
import Scoreboard from "./Scoreboard";

/** Full-screen "scan to join" display with the live QR code. */
export default function VenueScreen({ match: m, endpoint }: { match: Match & { competition: Competition; prizes: Prize[] }; endpoint: string }) {
  return (
    <main className="bg-stadium relative flex min-h-dvh flex-col items-center justify-center gap-6 overflow-hidden p-6 text-center">
      <div className="orb -top-32 -left-32 h-[28rem] w-[28rem] bg-brand-500/40" />
      <div className="orb -right-40 -bottom-40 h-[30rem] w-[30rem] bg-pink-500/25 [animation-delay:-6s]" />

      <Logo variant="full" className="absolute top-6 left-6 z-10 h-24 w-auto text-white drop-shadow-[0_6px_20px_rgba(99,102,241,0.7)] sm:h-28 lg:h-32" />

      <header className="relative w-full max-w-5xl px-24 text-center sm:px-32">
        <div className="text-sm font-bold tracking-[0.3em] text-gold-300 uppercase sm:text-base">{m.competition.name}</div>
        {m.teamA && m.teamB && <div className="mt-1 text-base font-semibold text-white/60 sm:text-lg">{m.title}</div>}
        <div className="mt-2">
          <Scoreboard title={m.title} teamA={m.teamA} teamB={m.teamB} size="lg" />
        </div>
      </header>

      <div className="relative">
        <LiveQr endpoint={endpoint} poster={false} />
      </div>

      <div className="relative">
        <p className="text-3xl font-black sm:text-5xl">
          Scan to join the <span className="text-gold-gradient">Lucky Draw!</span>
        </p>
        <p className="mt-2 text-lg text-white/70">Winners are drawn live after the match.</p>
      </div>

      {m.prizes.length > 0 && (
        <div className="relative flex flex-wrap justify-center gap-2">
          {m.prizes.map((p) => (
            <span key={p.id} className="rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-5 py-2 text-lg font-black text-night-900 shadow-lg shadow-amber-500/30">
              🎁 {p.quantity > 1 ? `${p.quantity} × ` : ""}{p.name}
            </span>
          ))}
        </div>
      )}
    </main>
  );
}
