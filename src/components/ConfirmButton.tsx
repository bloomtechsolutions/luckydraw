"use client";

import { useTransition } from "react";

export default function ConfirmButton({
  action,
  confirm: message,
  children,
  className = "btn-danger btn-sm",
}: {
  action: () => Promise<void>;
  confirm?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={() => {
        if (message && !window.confirm(message)) return;
        start(() => action());
      }}
    >
      {pending ? "…" : children}
    </button>
  );
}
