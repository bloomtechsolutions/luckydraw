"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import Wheel, { type Segment, type WheelHandle } from "@/components/Wheel";

type Prize = { id: string; name: string; quantity: number; drawn: number };
type WinnerInfo = { id: string; registrationId: string; name: string; staffId: string; department: string; prize: string; prizeId: string };

export default function DrawClient({
  matchId,
  title,
  subtitle,
  initialPrizes,
  initialSegments,
  initialWinners,
  poolExcluding,
  poolIncluding,
}: {
  matchId: string;
  title: string;
  subtitle: string;
  initialPrizes: Prize[];
  initialSegments: Segment[];
  initialWinners: WinnerInfo[];
  poolExcluding: number;
  poolIncluding: number;
}) {
  const wheel = useRef<WheelHandle>(null);
  const [prizes, setPrizes] = useState(initialPrizes);
  const [prizeId, setPrizeId] = useState(initialPrizes.find((p) => p.drawn < p.quantity)?.id ?? "");
  const [segments, setSegments] = useState(initialSegments);
  const [winners, setWinners] = useState(initialWinners);
  const [exclude, setExclude] = useState(true);
  const [pool, setPool] = useState({ excl: poolExcluding, incl: poolIncluding });
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<WinnerInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sound, setSound] = useState(true);

  const poolSize = exclude ? pool.excl : pool.incl;
  const prize = prizes.find((p) => p.id === prizeId);
  const allDone = prizes.length > 0 && prizes.every((p) => p.drawn >= p.quantity);

  async function spin(redrawWinnerId?: string) {
    if (spinning || !prizeId) return;
    setError(null);
    setSpinning(true);
    try {
      const res = await fetch(`/api/admin/matches/${matchId}/draw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prizeId, excludeOtherWinners: exclude, redrawWinnerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Draw failed");
        return;
      }
      setSegments(data.segments);
      await new Promise((r) => requestAnimationFrame(r));
      await wheel.current?.spinTo(data.winnerIndex);
      // Let the room see where the pointer landed before the reveal.
      await new Promise((r) => setTimeout(r, 1500));

      const w: WinnerInfo = data.winner;
      setWinners((ws) => [...ws, w]);
      setPrizes((ps) => ps.map((p) => (p.id === w.prizeId ? { ...p, drawn: p.drawn + 1 } : p)));
      setPool((p) => ({ excl: p.excl - 1, incl: p.incl - 1 }));
      setResult(w);
      const confetti = (await import("canvas-confetti")).default;
      const burst = (x: number) => confetti({ particleCount: 140, spread: 80, startVelocity: 55, origin: { x, y: 0.7 }, zIndex: 60 });
      burst(0.2);
      burst(0.8);
      setTimeout(() => confetti({ particleCount: 200, spread: 120, origin: { y: 0.4 }, zIndex: 60 }), 350);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSpinning(false);
    }
  }

  function closeResult() {
    if (!result) return;
    setSegments((s) => s.filter((x) => x.id !== result.registrationId));
    setResult(null);
    const current = prizes.find((p) => p.id === prizeId);
    if (current && current.drawn >= current.quantity) {
      const next = prizes.find((p) => p.drawn < p.quantity);
      if (next) setPrizeId(next.id);
    }
  }

  function redraw() {
    if (!result) return;
    const w = result;
    setSegments((s) => s.filter((x) => x.id !== w.registrationId));
    setWinners((ws) => ws.filter((x) => x.id !== w.id));
    setPrizes((ps) => ps.map((p) => (p.id === w.prizeId ? { ...p, drawn: p.drawn - 1 } : p)));
    setPrizeId(w.prizeId);
    setResult(null);
    spin(w.id);
  }

  function fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-brand-700 via-brand-900 to-slate-950 text-white">
      <div className="flex items-center gap-3 px-4 py-3 text-sm text-brand-100">
        <Link href={`/admin/matches/${matchId}`} className="hover:text-white">← Back</Link>
        <span className="ml-auto" />
        <button onClick={() => setSound((s) => !s)} className="rounded-lg px-2 py-1 hover:bg-white/10">{sound ? "🔊" : "🔇"}</button>
        <button onClick={fullscreen} className="rounded-lg px-2 py-1 hover:bg-white/10">⛶ Fullscreen</button>
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 pb-10 lg:grid-cols-[1fr_380px]">
        <div className="mx-auto w-full max-w-[min(82vh,100%)]">
          <Wheel ref={wheel} segments={segments} sound={sound} />
        </div>

        <aside className="space-y-5">
          <div>
            <div className="text-sm font-semibold tracking-widest text-brand-100 uppercase">{subtitle}</div>
            <h1 className="text-3xl font-black">{title}</h1>
            <p className="mt-1 text-brand-100">
              <strong className="text-white">{poolSize}</strong> eligible participant{poolSize === 1 ? "" : "s"}
              {poolSize > segments.length && segments.length > 0 && <span className="block text-xs opacity-80">Wheel shows {segments.length} random names. Everyone has an equal chance.</span>}
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-brand-100 uppercase">Drawing for</div>
            {prizes.length === 0 && (
              <p className="rounded-xl bg-white/10 p-3 text-sm">No prizes set up. <Link className="underline" href={`/admin/matches/${matchId}?tab=prizes`}>Add prizes</Link> first.</p>
            )}
            {prizes.map((p) => {
              const done = p.drawn >= p.quantity;
              return (
                <button
                  key={p.id}
                  disabled={done || spinning}
                  onClick={() => setPrizeId(p.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                    p.id === prizeId ? "bg-accent-400 text-brand-900" : "bg-white/10 hover:bg-white/15"
                  } ${done ? "opacity-40" : ""}`}
                >
                  <span className="text-2xl">🎁</span>
                  <span className="flex-1 font-bold">{p.name}</span>
                  <span className="text-sm font-semibold tabular-nums">{p.drawn}/{p.quantity}</span>
                </button>
              );
            })}
          </div>

          <label className="flex items-center gap-2 text-sm text-brand-100">
            <input type="checkbox" checked={exclude} onChange={(e) => setExclude(e.target.checked)} disabled={spinning} className="h-4 w-4 accent-amber-400" />
            Exclude staff who already won in other matches of this competition
          </label>

          <button
            onClick={() => spin()}
            disabled={spinning || !prize || prize.drawn >= prize.quantity || poolSize === 0}
            className="w-full rounded-2xl bg-accent-400 py-5 text-2xl font-black text-brand-900 shadow-lg shadow-amber-500/30 transition hover:scale-[1.02] hover:bg-accent-500 disabled:scale-100 disabled:opacity-40"
          >
            {spinning ? "Spinning…" : allDone ? "All prizes drawn 🎉" : "SPIN! 🎡"}
          </button>
          {error && <p className="rounded-xl bg-red-500/20 p-3 text-sm text-red-100">{error}</p>}

          <div>
            <div className="text-xs font-semibold text-brand-100 uppercase">Winners</div>
            <ol className="mt-2 space-y-1.5">
              {winners.map((w) => (
                <li key={w.id} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm">
                  <span>🏆</span>
                  <span className="flex-1 truncate font-semibold">{w.name} <span className="font-mono text-xs opacity-70">{w.staffId}</span></span>
                  <span className="truncate text-xs text-accent-400">{w.prize}</span>
                </li>
              ))}
              {winners.length === 0 && <li className="text-sm opacity-60">No winners yet.</li>}
            </ol>
          </div>
        </aside>
      </div>

      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-white p-8 text-center text-slate-900 shadow-2xl">
            <div className="text-sm font-bold tracking-widest text-brand-600 uppercase">🎉 Congratulations! 🎉</div>
            <div className="mt-4 text-5xl leading-tight font-black break-words sm:text-6xl">{result.name}</div>
            <div className="mt-3 font-mono text-2xl font-bold text-slate-600">{result.staffId}</div>
            <div className="text-lg text-slate-500">{result.department}</div>
            <div className="mt-5 inline-block rounded-full bg-accent-400 px-5 py-2 text-xl font-bold text-brand-900">🎁 {result.prize}</div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button onClick={redraw} className="btn-secondary py-3 text-base">Absent: re-draw</button>
              <button onClick={closeResult} autoFocus className="btn-primary py-3 text-base">Confirm winner ✓</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
