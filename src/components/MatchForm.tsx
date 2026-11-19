"use client";

import { useState } from "react";

type Defaults = {
  title?: string;
  teamA?: string | null;
  teamB?: string | null;
  venue?: string | null;
  startsAt?: string;
  regOpensAt?: string;
  regClosesAt?: string;
  rotatingQr?: boolean;
  onePerDevice?: boolean;
  status?: string;
};

/** ISO string -> value for <input type="datetime-local"> in the admin's own timezone. */
function toLocalInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

function addMinutes(local: string, mins: number) {
  if (!local) return "";
  const d = new Date(local);
  return toLocalInput(new Date(d.getTime() + mins * 60_000).toISOString());
}

function toIso(local: string) {
  return local ? new Date(local).toISOString() : "";
}

export default function MatchForm({
  action,
  defaults = {},
  submitLabel,
}: {
  action: (fd: FormData) => Promise<void>;
  defaults?: Defaults;
  submitLabel: string;
}) {
  const [startsAt, setStartsAt] = useState(toLocalInput(defaults.startsAt));
  const [opensAt, setOpensAt] = useState(toLocalInput(defaults.regOpensAt));
  const [closesAt, setClosesAt] = useState(toLocalInput(defaults.regClosesAt));
  const [touched, setTouched] = useState(Boolean(defaults.regOpensAt));
  const [pending, setPending] = useState(false);

  return (
    <form
      action={async (fd) => {
        setPending(true);
        fd.set("startsAt", toIso(startsAt));
        fd.set("regOpensAt", toIso(opensAt));
        fd.set("regClosesAt", toIso(closesAt));
        try {
          await action(fd);
        } finally {
          setPending(false);
        }
      }}
      className="card space-y-5 p-5"
    >
      <div>
        <label className="label">Match title</label>
        <input name="title" required defaultValue={defaults.title} placeholder="e.g. Match 1 · Group A" className="input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Team A</label>
          <input name="teamA" defaultValue={defaults.teamA ?? ""} placeholder="e.g. Head Office" className="input" />
        </div>
        <div>
          <label className="label">Team B</label>
          <input name="teamB" defaultValue={defaults.teamB ?? ""} placeholder="e.g. Branch A" className="input" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Venue</label>
          <input name="venue" defaultValue={defaults.venue ?? ""} placeholder="e.g. Sports Complex Court 2" className="input" />
        </div>
        <div>
          <label className="label">Match starts</label>
          <input
            type="datetime-local"
            required
            value={startsAt}
            onChange={(e) => {
              setStartsAt(e.target.value);
              if (!touched) {
                setOpensAt(addMinutes(e.target.value, -30));
                setClosesAt(addMinutes(e.target.value, 150));
              }
            }}
            className="input"
          />
        </div>
      </div>

      <fieldset className="rounded-xl bg-slate-50 p-4">
        <legend className="px-1 text-sm font-semibold">Registration window</legend>
        <p className="mb-3 text-xs text-slate-500">Staff can only register between these times (and only while status is Open).</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Opens</label>
            <input type="datetime-local" required value={opensAt} onChange={(e) => { setTouched(true); setOpensAt(e.target.value); }} className="input" />
          </div>
          <div>
            <label className="label">Closes</label>
            <input type="datetime-local" required value={closesAt} onChange={(e) => { setTouched(true); setClosesAt(e.target.value); }} className="input" />
          </div>
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Status</label>
          <select name="status" defaultValue={defaults.status ?? "OPEN"} className="input">
            <option value="DRAFT">Draft (hidden, registration off)</option>
            <option value="OPEN">Open (follows the window above)</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
        <label className="flex items-start gap-3 rounded-xl p-2">
          <input type="checkbox" name="rotatingQr" defaultChecked={defaults.rotatingQr ?? true} className="mt-1 h-4 w-4 accent-brand-600" />
          <span>
            <span className="block text-sm font-medium">Rotating QR code</span>
            <span className="block text-xs text-slate-500">QR on the venue screen changes every minute, so photos of it shared in group chats stop working.</span>
          </span>
        </label>
      </div>

      <label className="flex items-start gap-3 rounded-xl p-2">
        <input type="checkbox" name="onePerDevice" defaultChecked={defaults.onePerDevice ?? true} className="mt-1 h-4 w-4 accent-brand-600" />
        <span>
          <span className="block text-sm font-medium">One registration per phone</span>
          <span className="block text-xs text-slate-500">Stops one person entering several colleagues&apos; staff IDs from their own phone.</span>
        </span>
      </label>

      <button className="btn-primary" disabled={pending}>{pending ? "Saving…" : submitLabel}</button>
    </form>
  );
}
