import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyDisplayKey } from "@/lib/tokens";
import VenueScreen from "@/components/VenueScreen";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Scan to join the Lucky Draw", robots: { index: false, follow: false } };

/** Public venue screen: shows the live QR without admin login. Needs the secret key from the admin page. */
export default async function PublicScreen({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ k?: string }> }) {
  const { code } = await params;
  const { k } = await searchParams;
  const m = await prisma.match.findUnique({
    where: { code: code.toUpperCase() },
    include: { competition: true, prizes: { orderBy: { sortOrder: "asc" } } },
  });
  if (!m || !verifyDisplayKey(m, k)) notFound();
  return <VenueScreen match={m} endpoint={`/api/screen/${m.code}?k=${encodeURIComponent(k!)}`} />;
}
