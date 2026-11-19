"use client";

import { useMemo, useState } from "react";
import { deleteRegistration } from "@/app/admin/actions";
import ConfirmButton from "./ConfirmButton";

export type RegRow = { id: string; no: number; staffId: string; name: string; department: string; registeredAt: string; won?: string; flags?: string[] };
type SortKey = "no" | "staffId" | "name" | "department";

export default function RegistrationsTable({ rows }: { rows: RegRow[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "no", dir: -1 });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = needle
      ? rows.filter((r) => `${r.staffId} ${r.name} ${r.department}`.toLowerCase().includes(needle))
      : rows.slice();
    return list.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      return (typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv))) * sort.dir;
    });
  }, [rows, q, sort]);

  const th = (key: SortKey, label: string) => (
    <th className="px-3 py-2 text-left">
      <button
        className="font-semibold hover:text-slate-900"
        onClick={() => setSort((s) => ({ key, dir: s.key === key ? ((-s.dir) as 1 | -1) : 1 }))}
      >
        {label} {sort.key === key ? (sort.dir === 1 ? "▲" : "▼") : ""}
      </button>
    </th>
  );

  return (
    <div>
      <div className="flex items-center gap-3 p-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search staff ID, name or department…" className="input max-w-sm" />
        <span className="text-sm text-slate-500">{filtered.length} of {rows.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
            <tr>
              {th("no", "#")}
              {th("staffId", "Staff ID")}
              {th("name", "Name")}
              {th("department", "Department")}
              <th className="px-3 py-2 text-left font-semibold">Registered</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-3 py-2 text-slate-500 tabular-nums">{r.no}</td>
                <td className="px-3 py-2 font-mono font-medium">{r.staffId}</td>
                <td className="px-3 py-2">
                  {r.name}
                  {r.won && <span className="badge ml-2 bg-amber-100 text-amber-800">🏆 {r.won}</span>}
                  {r.flags?.length ? (
                    <span title={r.flags.join("\n")} className="badge ml-2 cursor-help bg-rose-100 text-rose-700">⚠ Check</span>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-slate-600">{r.department}</td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-500">{r.registeredAt}</td>
                <td className="px-3 py-2 text-right">
                  <ConfirmButton action={() => deleteRegistration(r.id)} confirm={`Remove ${r.name} (${r.staffId}) from this match?`}>
                    Remove
                  </ConfirmButton>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-slate-400">
                  {rows.length === 0 ? "No registrations yet. Put the QR code up at the venue!" : "No matches for your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
