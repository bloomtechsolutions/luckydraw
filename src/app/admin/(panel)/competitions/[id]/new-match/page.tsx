import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import MatchForm from "@/components/MatchForm";
import { createMatch } from "../../../../actions";

export default async function NewMatch({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await prisma.competition.findUnique({ where: { id }, include: { _count: { select: { matches: true } } } });
  if (!c) notFound();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href={`/admin/competitions/${c.id}`} className="text-sm text-slate-500 hover:text-slate-800">← {c.name}</Link>
      <h1 className="text-2xl font-extrabold">New match</h1>
      <MatchForm action={createMatch.bind(null, c.id)} defaults={{ title: `Match ${c._count.matches + 1}` }} submitLabel="Create match" />
    </div>
  );
}
