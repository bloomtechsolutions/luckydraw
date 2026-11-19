"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/** Live countdown to a match. Renders nothing once the time has passed. */
export default function Countdown({ to, className = "" }: { to: string; className?: string }) {
  const target = new Date(to).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (now === null || target <= now) return null;
  const { d, h, m, s } = parts(target - now);
  const cells = d > 0 ? [[d, "days"], [h, "hrs"], [m, "min"]] : [[h, "hrs"], [m, "min"], [s, "sec"]];
  return (
    <div className={`flex gap-2 ${className}`}>
      {cells.map(([v, l]) => (
        <div key={l as string} className="min-w-14 rounded-xl bg-white/10 px-2 py-1.5 text-center ring-1 ring-white/10">
          <div className="text-xl font-black tabular-nums">{String(v).padStart(2, "0")}</div>
          <div className="text-[10px] font-semibold tracking-wider text-white/60 uppercase">{l}</div>
        </div>
      ))}
    </div>
  );
}
