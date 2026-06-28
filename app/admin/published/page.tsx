import Link from "next/link";
import { getPublishedArticles } from "@/lib/db";
import ReliabilityBadge from "@/components/ReliabilityBadge";
import { unpublishAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function PublishedAdminPage() {
  const articles = await getPublishedArticles();

  return (
    <main className="min-h-screen bg-paper px-6 py-10 sm:px-10">
      <header className="mx-auto max-w-3xl mb-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-sans text-xs uppercase tracking-widest text-mute mb-2">
              Painel editorial
            </p>
            <h1 className="font-display text-4xl font-semibold text-ink">
              Matérias publicadas
            </h1>
          </div>
          <Link
            href="/admin"
            className="font-sans text-sm text-mute hover:text-terracotta transition-colors underline"
          >
            ← Rascunhos
          </Link>
        </div>
        <p className="font-sans text-sm text-mute mt-2">
          {articles.length} {articles.length === 1 ? "matéria" : "matérias"} no ar.
        </p>
      </header>

      <div className="mx-auto max-w-3xl space-y-3">
        {articles.length === 0 && (
          <div className="rounded-lg border border-dashed border-mute/30 p-10 text-center">
            <p className="font-sans text-sm text-mute">Nenhuma matéria publicada ainda.</p>
          </div>
        )}

        {articles.map((article) => (
          <div
            key={article.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-ink/10 bg-white px-5 py-4"
          >
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-lg font-semibold text-ink truncate">
                {article.title}
              </h2>
              <p className="font-sans text-xs text-mute mt-1">
                Publicada em {new Date(article.published_at ?? article.created_at).toLocaleString("pt-BR")} ·{" "}
                {article.category}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <ReliabilityBadge score={article.reliability_score} />
              <Link
                href={`/admin/review/${article.id}`}
                className="font-sans text-sm text-ink border border-ink/15 rounded-md px-3 py-1.5 hover:bg-ink/5 transition-colors"
              >
                Editar
              </Link>
              <form action={unpublishAction}>
                <input type="hidden" name="id" value={article.id} />
                <button
                  type="submit"
                  className="font-sans text-sm text-terracotta-dark border border-terracotta/30 rounded-md px-3 py-1.5 hover:bg-terracotta/5 transition-colors"
                >
                  Remover do site
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
