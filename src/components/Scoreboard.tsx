/** "Team A vs Team B" in a scoreboard style; falls back to the match title. */
export default function Scoreboard({ title, teamA, teamB, size = "md" }: { title: string; teamA: string | null; teamB: string | null; size?: "md" | "lg" }) {
  const big = size === "lg";
  if (!teamA || !teamB) return <div className={`font-black ${big ? "text-4xl sm:text-5xl" : "text-2xl"}`}>{title}</div>;
  if (big) {
    // Large screens: centre the whole "A VS B" line as one group so it lines up with content below.
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-4xl leading-tight font-black sm:text-5xl lg:text-6xl">
        <span className="break-words">{teamA}</span>
        <span className="shrink-0 rounded-full bg-gradient-to-br from-gold-300 to-gold-500 px-4 py-2 text-xl text-night-900 shadow-lg shadow-amber-500/30 lg:text-2xl">VS</span>
        <span className="break-words">{teamB}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <div className={`min-w-0 flex-1 text-right font-black leading-tight break-words ${big ? "text-3xl sm:text-5xl" : "text-xl sm:text-2xl"}`}>{teamA}</div>
      <div className={`shrink-0 rounded-full bg-gradient-to-br from-gold-300 to-gold-500 font-black text-night-900 shadow-lg shadow-amber-500/30 ${big ? "px-4 py-2 text-xl" : "px-2.5 py-1 text-xs"}`}>
        VS
      </div>
      <div className={`min-w-0 flex-1 text-left font-black leading-tight break-words ${big ? "text-3xl sm:text-5xl" : "text-xl sm:text-2xl"}`}>{teamB}</div>
    </div>
  );
}
