import Link from "next/link";
import { logout } from "../actions";
import Logo from "@/components/Logo";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Link href="/admin" className="flex items-center gap-2 font-extrabold">
            <Logo variant="mark" className="h-8 w-auto text-brand-700" /> <span>Lucky Draw</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/admin" className="rounded-lg px-2.5 py-1.5 text-slate-600 hover:bg-slate-100">Dashboard</Link>
            <Link href="/admin/departments" className="rounded-lg px-2.5 py-1.5 text-slate-600 hover:bg-slate-100">Departments</Link>
          </nav>
          <form action={logout} className="ml-auto">
            <button className="text-sm text-slate-500 hover:text-slate-800">Sign out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
