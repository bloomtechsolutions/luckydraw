"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type QrData = { url: string; svg: string; rotating: boolean; secondsLeft: number | null; count: number; state: string };

const WINDOW = 60;

export default function LiveQr({ endpoint, poster }: { endpoint: string; poster: boolean }) {
  const [data, setData] = useState<QrData | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bump, setBump] = useState(0);
  const lastCount = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const load = useCallback(async () => {
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      if (res.status === 401 || res.status === 403) {
        setError(res.status === 401 ? "Admin session expired. Please sign in again." : "This screen link is no longer valid. Copy a new one from the admin page.");
        return;
      }
      const d: QrData = await res.json();
      if (lastCount.current !== null && d.count > lastCount.current) setBump((b) => b + 1);
      lastCount.current = d.count;
      setData(d);
      setLeft(d.secondsLeft);
      setError(null);
      // Refresh right after the QR window rolls over, and at least every 10s for the live count.
      const next = d.rotating && d.secondsLeft ? d.secondsLeft + 1 : 10;
      timer.current = setTimeout(load, Math.min(next, 10) * 1000);
    } catch {
      setError("Connection lost, retrying…");
      timer.current = setTimeout(load, 5000);
    }
  }, [endpoint]);

  useEffect(() => {
    load();
    return () => clearTimeout(timer.current);
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => setLeft((s) => (s && s > 0 ? s - 1 : s)), 1000);
    return () => clearInterval(id);
  }, []);

  if (error && !data) return <p className="text-center text-xl">{error}</p>;
  if (!data) return <div className="aspect-square w-[min(48vh,78vw)] animate-pulse rounded-3xl bg-white/10" />;

  if (poster) {
    return (
      <div className="flex flex-col items-center">
        <div className="rounded-3xl bg-white p-4 ring-4 ring-gold-400">
          <div className="aspect-square w-[min(60vh,80vw)] [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: data.svg }} />
        </div>
        <p className="mt-4 font-mono text-sm break-all text-slate-500">{data.url}</p>
      </div>
    );
  }

  const pct = data.rotating && left !== null ? left / WINDOW : 1;
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* corner brackets */}
        {["-top-3 -left-3 border-t-4 border-l-4 rounded-tl-2xl", "-top-3 -right-3 border-t-4 border-r-4 rounded-tr-2xl", "-bottom-3 -left-3 border-b-4 border-l-4 rounded-bl-2xl", "-bottom-3 -right-3 border-b-4 border-r-4 rounded-br-2xl"].map((c) => (
          <span key={c} className={`absolute h-10 w-10 border-gold-400 ${c}`} />
        ))}
        <div className="animate-glow relative rounded-3xl bg-white p-4 sm:p-5">
          <div key={data.url} className="animate-pop aspect-square w-[min(48vh,78vw)] [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: data.svg }} />
          {data.state !== "open" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-3xl bg-white/95 text-center text-2xl font-black text-night-900">
              <span className="text-5xl">🔒</span>Registration is not open
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        {data.rotating && left !== null && (
          <div className="flex items-center gap-3 rounded-full bg-white/10 py-2 pr-5 pl-2 ring-1 ring-white/15">
            <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90" aria-hidden>
              <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
              <circle cx="20" cy="20" r="16" fill="none" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" strokeDasharray={2 * Math.PI * 16} strokeDashoffset={2 * Math.PI * 16 * (1 - pct)} className="transition-[stroke-dashoffset] duration-1000 ease-linear" />
            </svg>
            <span className="text-lg">New code in <strong className="tabular-nums">{left}s</strong></span>
          </div>
        )}
        <div className="flex items-center gap-3 rounded-full bg-white/10 px-5 py-2 ring-1 ring-white/15">
          <span className="text-2xl">🙌</span>
          <strong key={bump} className={`inline-block text-3xl font-black tabular-nums ${bump ? "animate-bump" : ""}`}>{data.count}</strong>
          <span className="text-lg text-white/80">supporters in the draw</span>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-amber-300">{error}</p>}
    </div>
  );
}
