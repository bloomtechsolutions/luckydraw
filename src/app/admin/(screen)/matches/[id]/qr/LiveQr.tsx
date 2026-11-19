"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type QrData = { url: string; svg: string; rotating: boolean; secondsLeft: number | null; count: number; state: string };

export default function LiveQr({ matchId, poster }: { matchId: string; poster: boolean }) {
  const [data, setData] = useState<QrData | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/matches/${matchId}/qr`, { cache: "no-store" });
      if (res.status === 401) {
        setError("Admin session expired. Please sign in again.");
        return;
      }
      const d: QrData = await res.json();
      setData(d);
      setLeft(d.secondsLeft);
      setError(null);
      // Refresh right after the QR window rolls over; otherwise just refresh the live count.
      const next = d.rotating && d.secondsLeft ? d.secondsLeft + 1 : 15;
      timer.current = setTimeout(load, Math.min(next, 15) * 1000);
    } catch {
      setError("Connection lost, retrying…");
      timer.current = setTimeout(load, 5000);
    }
  }, [matchId]);

  useEffect(() => {
    load();
    return () => clearTimeout(timer.current);
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => setLeft((s) => (s && s > 0 ? s - 1 : s)), 1000);
    return () => clearInterval(id);
  }, []);

  if (error && !data) return <p className="text-center text-xl">{error}</p>;
  if (!data) return <p className="text-center text-xl opacity-70">Loading…</p>;

  return (
    <div className="flex flex-col items-center">
      <div className="relative rounded-3xl bg-white p-4 shadow-2xl sm:p-6">
        <div className="aspect-square w-[min(52vh,80vw)] [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: data.svg }} />
        {data.state !== "open" && !poster && (
          <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-white/90 text-center text-2xl font-bold text-slate-800">
            Registration is not open
          </div>
        )}
      </div>
      {!poster && (
        <div className="mt-6 flex items-center gap-6 text-lg">
          {data.rotating && left !== null && (
            <span className="rounded-full bg-white/10 px-4 py-1.5 tabular-nums">🔄 New code in {left}s</span>
          )}
          <span className="rounded-full bg-white/10 px-4 py-1.5">
            <strong className="text-2xl tabular-nums">{data.count}</strong> registered
          </span>
        </div>
      )}
      {poster && <p className="mt-4 font-mono text-sm break-all text-slate-500">{data.url}</p>}
      {error && <p className="mt-3 text-sm text-amber-300">{error}</p>}
    </div>
  );
}
