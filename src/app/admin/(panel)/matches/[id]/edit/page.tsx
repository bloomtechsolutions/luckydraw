import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import MatchForm from "@/components/MatchForm";
import { updateMatch } from "../../../../actions";

export default async function EditMatch({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await prisma.match.findUnique({ where: { id } });
  if (!m) notFound();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href={`/admin/matches/${m.id}`} className="text-sm text-slate-500 hover:text-slate-800">← Back to match</Link>
      <h1 className="text-2xl font-extrabold">Edit match</h1>
      <MatchForm
        action={updateMatch.bind(null, m.id)}
        submitLabel="Save changes"
        defaults={{
          title: m.title,
          teamA: m.teamA,
          teamB: m.teamB,
          venue: m.venue,
          startsAt: m.startsAt.toISOString(),
          regOpensAt: m.regOpensAt.toISOString(),
          regClosesAt: m.regClosesAt.toISOString(),
          rotatingQr: m.rotatingQr,
          status: m.status,
        }}
      />
    </div>
  );
}
