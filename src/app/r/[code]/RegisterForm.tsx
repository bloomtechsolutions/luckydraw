"use client";

import { useActionState } from "react";
import { register, type RegisterResult } from "./actions";

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

  if (state.status === "success") {
    return (
      <div className="card p-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-5xl">✅</div>
        <h2 className="mt-4 text-2xl font-extrabold">{state.already ? "You're already registered!" : "You're in the draw!"}</h2>
        <p className="mt-1 text-slate-600">Thanks for supporting. Good luck! 🍀</p>
        <dl className="mt-6 space-y-2 rounded-xl bg-slate-50 p-4 text-left text-sm">
          <Row k="Match" v={matchName} />
          <Row k="Staff ID" v={state.staffId} />
          <Row k="Name" v={state.name} />
          <Row k="Department" v={state.department} />
          <Row k="Registered" v={new Date(state.registeredAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} />
        </dl>
        <p className="mt-4 text-xs text-slate-500">Take a screenshot of this screen. Stay till the end for the draw!</p>
      </div>
    );
  }

  const values = state.status === "error" ? state.values : undefined;

  return (
    <form action={action} className="card space-y-4 p-5">
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="ticket" value={ticket} />
      <div>
        <label className="label" htmlFor="staffId">Staff ID</label>
        <input
          id="staffId"
          name="staffId"
          required
          autoComplete="off"
          autoCapitalize="characters"
          inputMode="text"
          defaultValue={values?.staffId}
          placeholder="e.g. 10234"
          className="input uppercase placeholder:normal-case"
        />
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
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full py-3 text-base">
        {pending ? "Registering…" : "Enter the lucky draw 🎉"}
      </button>
    </form>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}
