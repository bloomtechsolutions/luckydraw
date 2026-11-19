"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const BRAND = "#4f46e5";

export function HorizontalBars({ data, height }: { data: { label: string; value: number }[]; height?: number }) {
  if (data.length === 0) return <Empty />;
  const h = height ?? Math.max(160, data.length * 34 + 30);
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
        <CartesianGrid horizontal={false} stroke="#e2e8f0" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="label" width={130} tick={{ fontSize: 12, fill: "#334155" }} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: "#eef2ff" }} formatter={(v) => [v, "Registrations"]} />
        <Bar dataKey="value" fill={BRAND} radius={[0, 6, 6, 0]} maxBarSize={22} label={{ position: "right", fontSize: 12, fill: "#334155" }} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ColumnBars({ data, height = 220 }: { data: { label: string; value: number }[]; height?: number }) {
  if (data.length === 0) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 16, right: 8, bottom: 4, left: -16 }}>
        <CartesianGrid vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: "#eef2ff" }} formatter={(v) => [v, "Registrations"]} />
        <Bar dataKey="value" fill={BRAND} radius={[6, 6, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function Empty() {
  return <div className="flex h-32 items-center justify-center text-sm text-slate-400">No registrations yet</div>;
}
