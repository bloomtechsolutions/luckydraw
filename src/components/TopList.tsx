export default function TopList({ rows }: { rows: { staffId: string; name: string; department: string; matches: number }[] }) {
  if (rows.length === 0) return <p className="mt-3 text-sm text-slate-500">No registrations yet.</p>;
  return (
    <ol className="mt-3 space-y-2">
      {rows.map((r, i) => (
        <li key={r.staffId} className="flex items-center gap-3 text-sm">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{r.name}</div>
            <div className="truncate text-xs text-slate-500">{r.staffId} · {r.department}</div>
          </div>
          <span className="font-semibold tabular-nums">{r.matches} <span className="text-xs font-normal text-slate-500">match{r.matches === 1 ? "" : "es"}</span></span>
        </li>
      ))}
    </ol>
  );
}
