"use client";

import { useActionState, useEffect } from "react";
import { register, type RegisterResult } from "./actions";
import Logo from "@/components/Logo";

export default function RegisterForm({
  code,
  ticket,
  departments,
  matchName,
}: {
  code: string;
  ticket: string;
  departments: string[];
  matchName: string;
}) {
  const [state, action, pending] = useActionState<RegisterResult, FormData>(register, { status: "idle" });

  useEffect(() => {
    if (state.status !== "success" || state.already) return;
    import("canvas-confetti").then(({ default: confetti }) => {
      const colors = ["#fbbf24", "#fde68a", "#6366f1", "#ec4899", "#ffffff"];
      confetti({ particleCount: 120, spread: 75, origin: { y: 0.35 }, colors });
      setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 60, origin: { x: 0, y: 0.6 }, colors }), 250);
      setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 60, origin: { x: 1, y: 0.6 }, colors }), 400);
    });
  }, [state]);

  if (state.status === "success") {
    return (
      <div className="animate-pop text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400 text-4xl text-night-900 shadow-[0_0_40px_rgba(52,211,153,0.6)]">✓</div>
        <h2 className="mt-4 text-3xl font-black">{state.already ? "You're already in!" : "You're in the draw!"}</h2>
        <p className="mt-1 text-white/70">Thanks for supporting. Good luck! 🍀</p>

        {/* Ticket */}
        <div className="relative mx-auto mt-6 overflow-hidden rounded-3xl bg-white text-left text-night-900 shadow-2xl">
          <div className="flex items-center gap-3 bg-gradient-to-r from-brand-600 to-brand-900 px-5 py-4 text-white">
            <Logo variant="mark" className="h-10 w-auto text-white" />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold tracking-[0.25em] text-white/70 uppercase">Lucky draw entry</div>
              <div className="truncate font-bold">{matchName}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold tracking-widest text-gold-300 uppercase">Entry</div>
              <div className="text-2xl leading-none font-black text-gold-400">#{state.entryNo}</div>
            </div>
          </div>
          {/* perforation */}
          <div className="relative h-0 border-t-2 border-dashed border-slate-200">
            <span className="absolute -top-3 -left-3 h-6 w-6 rounded-full bg-night-950" />
            <span className="absolute -top-3 -right-3 h-6 w-6 rounded-full bg-night-950" />
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-5 text-sm">
            <Field k="Name" v={state.name} wide />
            <Field k="Staff ID" v={state.staffId} mono />
            <Field k="Department" v={state.department} />
            <Field k="Registered" v={new Date(state.registeredAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} wide />
          </dl>
        </div>

        <p className="mt-6 rounded-2xl bg-gold-400/15 px-4 py-3 text-sm font-semibold text-gold-300 ring-1 ring-gold-400/30">
          🎡 The draw will be taken live after the match ends.
        </p>
      </div>
    );
  }

  const values = state.status === "error" ? state.values : undefined;

  return (
    <form action={action} className="animate-rise space-y-4 rounded-3xl bg-white p-5 text-night-900 shadow-2xl sm:p-6">
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="ticket" value={ticket} />
      <div>
        <h2 className="text-xl font-black">Enter the lucky draw</h2>
        <p className="text-sm text-slate-500">One entry per staff member for this match.</p>
      </div>
      <div>
        <label className="label" htmlFor="staffId">Staff ID</label>
        <input id="staffId" name="staffId" required autoComplete="off" autoCapitalize="characters" defaultValue={values?.staffId} placeholder="e.g. 10234" className="input uppercase placeholder:normal-case" />
      </div>
      <div>
        <label className="label" htmlFor="name">Full name</label>
        <input id="name" name="name" required autoComplete="name" defaultValue={values?.name} placeholder="Your name" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="department">Department</label>
        {departments.length > 0 ? (
          <select id="department" name="department" required defaultValue={values?.department ?? ""} className="input">
            <option value="" disabled>Select your department</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        ) : (
          <input id="department" name="department" required defaultValue={values?.department} placeholder="Your department" className="input" />
        )}
      </div>
      {state.status === "error" && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="btn w-full bg-gradient-to-r from-gold-400 to-gold-500 py-3.5 text-base font-black text-night-900 shadow-lg shadow-amber-500/30 hover:brightness-105 active:scale-[0.99]"
      >
        {pending ? "Registering…" : "Count me in! 🎉"}
      </button>
    </form>
  );
}

function Field({ k, v, wide, mono }: { k: string; v: string; wide?: boolean; mono?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <dt className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{k}</dt>
      <dd className={`font-bold break-words ${mono ? "font-mono" : ""}`}>{v}</dd>
    </div>
  );
}
