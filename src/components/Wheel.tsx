"use client";

import { useCallback, useEffect, useImperativeHandle, useRef } from "react";

export type Segment = { id: string; name: string };
export type WheelHandle = { spinTo: (index: number) => Promise<void> };

const COLORS = ["#4f46e5", "#f59e0b", "#ec4899", "#10b981", "#0ea5e9", "#8b5cf6", "#ef4444", "#14b8a6", "#f97316", "#6366f1"];
const TAU = Math.PI * 2;
const POINTER = -Math.PI / 2; // pointer sits at 12 o'clock

function colorFor(i: number, n: number) {
  let c = i % COLORS.length;
  if (i === n - 1 && n > 1 && c === 0) c = (c + 1) % COLORS.length; // avoid same colour next to first slice
  return COLORS[c];
}

export default function Wheel({
  segments,
  sound = true,
  ref,
}: {
  segments: Segment[];
  sound?: boolean;
  ref?: React.Ref<WheelHandle>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotation = useRef(0);
  const spinning = useRef(false);
  /** Once spun, the wheel stays where it landed so everyone can see the result. */
  const parked = useRef(false);
  const segRef = useRef(segments);
  const soundRef = useRef(sound);
  const audio = useRef<AudioContext | null>(null);
  segRef.current = segments;
  soundRef.current = sound;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cssSize = canvas.clientWidth;
    if (canvas.width !== Math.round(cssSize * dpr)) {
      canvas.width = Math.round(cssSize * dpr);
      canvas.height = Math.round(cssSize * dpr);
    }
    const ctx = canvas.getContext("2d")!;
    const size = canvas.width;
    const c = size / 2;
    const r = c - size * 0.03;
    ctx.clearRect(0, 0, size, size);

    const segs = segRef.current;
    const n = segs.length;
    const rot = rotation.current;

    // outer rim
    ctx.beginPath();
    ctx.arc(c, c, r + size * 0.022, 0, TAU);
    ctx.fillStyle = "#fbbf24";
    ctx.fill();

    if (n === 0) {
      ctx.beginPath();
      ctx.arc(c, c, r, 0, TAU);
      ctx.fillStyle = "#334155";
      ctx.fill();
      ctx.fillStyle = "#e2e8f0";
      ctx.font = `600 ${size * 0.04}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("No participants yet", c, c + size * 0.12);
    } else {
      const a = TAU / n;
      const fontSize = Math.max(size * 0.016, Math.min(size * 0.042, r * a * 0.5));
      ctx.font = `700 ${fontSize}px system-ui, sans-serif`;
      for (let i = 0; i < n; i++) {
        const start = rot + i * a;
        ctx.beginPath();
        ctx.moveTo(c, c);
        ctx.arc(c, c, r, start, start + a);
        ctx.closePath();
        ctx.fillStyle = colorFor(i, n);
        ctx.fill();
        if (n <= 120) {
          ctx.strokeStyle = "rgba(255,255,255,0.35)";
          ctx.lineWidth = Math.max(1, size * 0.002);
          ctx.stroke();
        }
        // label
        ctx.save();
        ctx.translate(c, c);
        ctx.rotate(start + a / 2);
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";
        const maxW = r * 0.68;
        let label = segs[i].name;
        if (ctx.measureText(label).width > maxW) {
          while (label.length > 1 && ctx.measureText(label + "…").width > maxW) label = label.slice(0, -1);
          label += "…";
        }
        ctx.shadowColor = "rgba(0,0,0,0.35)";
        ctx.shadowBlur = 3;
        ctx.fillText(label, r - size * 0.025, 0);
        ctx.restore();
      }
    }

    // rim lights
    for (let i = 0; i < 24; i++) {
      const t = (i / 24) * TAU;
      ctx.beginPath();
      ctx.arc(c + Math.cos(t) * (r + size * 0.011), c + Math.sin(t) * (r + size * 0.011), size * 0.006, 0, TAU);
      ctx.fillStyle = i % 2 ? "#fff7ed" : "#fde68a";
      ctx.fill();
    }

    // hub
    ctx.beginPath();
    ctx.arc(c, c, size * 0.085, 0, TAU);
    ctx.fillStyle = "#1e1b4b";
    ctx.fill();
    ctx.lineWidth = size * 0.012;
    ctx.strokeStyle = "#fbbf24";
    ctx.stroke();
    ctx.fillStyle = "#fbbf24";
    ctx.font = `900 ${size * 0.035}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("LUCKY", c, c - size * 0.018);
    ctx.fillText("DRAW", c, c + size * 0.022);
  }, []);

  const tick = useCallback(() => {
    if (!soundRef.current) return;
    try {
      audio.current ??= new AudioContext();
      const ac = audio.current;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "square";
      o.frequency.value = 900;
      g.gain.setValueAtTime(0.04, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.04);
      o.connect(g).connect(ac.destination);
      o.start();
      o.stop(ac.currentTime + 0.05);
    } catch {
      /* audio not available */
    }
  }, []);

  // Idle "attract" rotation + redraw on resize/segment changes.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      if (!spinning.current && !parked.current) {
        rotation.current = (rotation.current + ((now - last) / 1000) * 0.12) % TAU;
        draw();
      }
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [draw]);

  useEffect(() => draw(), [segments, draw]);

  useImperativeHandle(
    ref,
    () => ({
      spinTo: (index: number) =>
        new Promise<void>((resolve) => {
          const n = segRef.current.length;
          if (n === 0) return resolve();
          const a = TAU / n;
          const jitter = (Math.random() - 0.5) * a * 0.6;
          const target = POINTER - (index + 0.5) * a + jitter;
          const from = rotation.current;
          const delta = (((target - from) % TAU) + TAU) % TAU + TAU * (7 + Math.floor(Math.random() * 3));
          const duration = 8000;
          const t0 = performance.now();
          let lastSlice = Math.floor((POINTER - from) / a);
          spinning.current = true;
          parked.current = true;
          const step = (now: number) => {
            const t = Math.min(1, (now - t0) / duration);
            const eased = 1 - Math.pow(1 - t, 4);
            rotation.current = from + delta * eased;
            const slice = Math.floor((POINTER - rotation.current) / a);
            if (slice !== lastSlice) {
              lastSlice = slice;
              tick();
            }
            draw();
            if (t < 1) requestAnimationFrame(step);
            else {
              rotation.current = ((rotation.current % TAU) + TAU) % TAU;
              spinning.current = false;
              resolve();
            }
          };
          requestAnimationFrame(step);
        }),
    }),
    [draw, tick],
  );

  return (
    <div className="relative mx-auto aspect-square w-full">
      <canvas ref={canvasRef} className="h-full w-full drop-shadow-2xl" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1">
        <svg width="48" height="56" viewBox="0 0 48 56" className="drop-shadow-lg" aria-hidden>
          <path d="M24 54 L4 10 A22 22 0 0 1 44 10 Z" fill="#ef4444" stroke="#fff" strokeWidth="4" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
