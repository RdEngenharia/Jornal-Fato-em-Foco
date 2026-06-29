import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdvertisementById } from "@/lib/db";
import NewAdForm from "@/components/NewAdForm";

export const dynamic = "force-dynamic";

export default async function EditAdPage({ params }: { params: { id: string } }) {
  const ad = await getAdvertisementById(Number(params.id));
  if (!ad) notFound();

  return (
    <main className="min-h-screen bg-paper px-6 py-10 sm:px-10">
      <header className="mx-auto max-w-3xl mb-8">
        <Link
          href="/admin/anuncios"
          className="font-sans text-sm text-mute hover:text-terracotta transition-colors underline"
        >
          ← Voltar para anúncios
        </Link>
      </header>

      <div className="mx-auto max-w-3xl">
        <NewAdForm existingAd={ad} />
      </div>
    </main>
  );
}
