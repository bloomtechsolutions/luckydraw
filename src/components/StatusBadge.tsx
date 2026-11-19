import type { RegState } from "@/lib/match";
import { REG_STATE_LABEL } from "@/lib/match";

const STYLES: Record<RegState, string> = {
  draft: "bg-slate-100 text-slate-600",
  not_yet: "bg-sky-100 text-sky-700",
  open: "bg-emerald-100 text-emerald-700",
  closed: "bg-rose-100 text-rose-700",
};

export default function StatusBadge({ state }: { state: RegState }) {
  return (
    <span className={`badge ${STYLES[state]}`}>
      {state === "open" && <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />}
      {REG_STATE_LABEL[state]}
    </span>
  );
}
