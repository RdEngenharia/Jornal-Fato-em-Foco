import Link from "next/link";
import { getAllAdvertisements } from "@/lib/db";
import NewAdForm from "@/components/NewAdForm";
import { toggleAdAction, deleteAdAction } from "./actions";

export const dynamic = "force-dynamic";

const SLOT_LABELS: Record<string, string> = {
  "ad-home-top": "Topo da home",
  "ad-home-sidebar-left-1": "Lateral esquerda 1",
  "ad-home-sidebar-left-2": "Lateral esquerda 2",
  "ad-home-sidebar-right-1": "Lateral direita 1",
  "ad-home-sidebar-right-2": "Lateral direita 2",
  "ad-home-footer": "Rodapé da home",
  "ad-in-article": "Dentro da matéria",
  "ad-article-footer": "Rodapé da matéria",
};

function daysUntil(dateStr: string): number {
  const diffMs = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function expiryLabel(dateStr: string): string {
  const days = daysUntil(dateStr);
  const formatted = new Date(dateStr).toLocaleDateString("pt-BR", { timeZone: "America/Bahia" });
  if (days < 0) return `Expirou em ${formatted}`;
  if (days === 0) return `Expira hoje (${formatted})`;
  if (days <= 7) return `Expira em ${days} dia(s) — ${formatted}`;
  return `Expira em ${formatted}`;
}

function expiryStyle(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days < 0) return "text-terracotta-dark";
  if (days <= 7) return "text-terracotta";
  return "text-mute";
}

export default async function AdsAdminPage() {
  const ads = await getAllAdvertisements();

  return (
    <main className="min-h-screen bg-paper px-6 py-10 sm:px-10">
      <header className="mx-auto max-w-3xl mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-sans text-xs uppercase tracking-widest text-mute mb-2">
              Painel editorial
            </p>
            <h1 className="font-display text-4xl font-semibold text-ink">Anúncios</h1>
          </div>
          <Link
            href="/admin"
            className="font-sans text-sm text-mute hover:text-terracotta transition-colors underline"
          >
            ← Painel
          </Link>
        </div>
        <p className="font-sans text-sm text-mute mt-2">
          Espaços vendidos diretamente a empresas, exibidos nos espaços de
          publicidade do site.
        </p>
      </header>

      <div className="mx-auto max-w-3xl space-y-6">
        <NewAdForm />

        <div className="space-y-3">
          {ads.length === 0 && (
            <div className="rounded-lg border border-dashed border-mute/30 p-8 text-center">
              <p className="font-sans text-sm text-mute">Nenhum anúncio cadastrado ainda.</p>
            </div>
          )}

          {ads.map((ad) => (
            <div
              key={ad.id}
              className="flex items-center gap-4 rounded-lg border border-ink/10 bg-white p-4"
            >
              <img
                src={ad.image_url}
                alt={ad.advertiser_name}
                className="w-24 h-16 object-cover rounded-md border border-ink/10 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-semibold text-ink">
                  {ad.advertiser_name}
                </p>
                <p className="font-sans text-xs text-mute truncate">{ad.link_url}</p>
                {ad.description && (
                  <p className="font-sans text-xs text-ink/70 mt-0.5 italic">
                    &quot;{ad.description}&quot;
                  </p>
                )}
                {ad.ends_at && (
                  <p className={`font-sans text-xs mt-0.5 font-medium ${expiryStyle(ad.ends_at)}`}>
                    {expiryLabel(ad.ends_at)}
                  </p>
                )}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {ad.slot_ids.map((slot) => (
                    <span
                      key={slot}
                      className="font-sans text-[10px] bg-ink/5 text-ink/70 px-2 py-0.5 rounded-full"
                    >
                      {SLOT_LABELS[slot] ?? slot}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/admin/anuncios/${ad.id}`}
                  className="font-sans text-xs px-3 py-1.5 rounded-md border border-ink/15 text-ink hover:bg-ink/5 transition-colors"
                >
                  Editar
                </Link>
                <form action={toggleAdAction}>
                  <input type="hidden" name="id" value={ad.id} />
                  <input type="hidden" name="active" value={(!ad.active).toString()} />
                  <button
                    type="submit"
                    className={`font-sans text-xs px-3 py-1.5 rounded-md border transition-colors ${
                      ad.active
                        ? "border-sage/40 text-sage hover:bg-sage/10"
                        : "border-mute/30 text-mute hover:bg-mute/10"
                    }`}
                  >
                    {ad.active ? "Ativo" : "Pausado"}
                  </button>
                </form>
                <form action={deleteAdAction}>
                  <input type="hidden" name="id" value={ad.id} />
                  <button
                    type="submit"
                    className="font-sans text-xs px-3 py-1.5 rounded-md border border-terracotta/30 text-terracotta-dark hover:bg-terracotta/10 transition-colors"
                  >
                    Remover
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
