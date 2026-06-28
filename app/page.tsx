import Link from "next/link";
import { getPendingArticles } from "@/lib/db";
import ReliabilityBadge from "@/components/ReliabilityBadge";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const articles = await getPendingArticles();

  return (
    <main className="min-h-screen bg-paper px-6 py-10 sm:px-10">
      <header className="mx-auto max-w-3xl mb-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-sans text-xs uppercase tracking-widest text-mute mb-2">
              Painel editorial
            </p>
            <h1 className="font-display text-4xl font-semibold text-ink">
              Rascunhos para revisão
            </h1>
          </div>
          <Link
            href="/published"
            className="font-sans text-sm text-mute hover:text-terracotta transition-colors underline"
          >
            Ver publicadas →
          </Link>
        </div>
        <p className="font-sans text-sm text-mute mt-2">
          {articles.length === 0
            ? "Nenhum rascunho pendente no momento."
            : `${articles.length} ${articles.length === 1 ? "matéria" : "matérias"} aguardando sua decisão.`}
        </p>
      </header>

      <div className="mx-auto max-w-3xl space-y-3">
        {articles.length === 0 && (
          <div className="rounded-lg border border-dashed border-mute/30 p-10 text-center">
            <p className="font-sans text-sm text-mute">
              Quando o pipeline encontrar e validar novas notícias, elas aparecem aqui.
            </p>
          </div>
        )}

        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/review/${article.id}`}
            className="group flex items-center justify-between gap-4 rounded-lg border border-ink/10 bg-white px-5 py-4 transition hover:border-terracotta/40 hover:shadow-sm"
          >
            <div className="min-w-0">
              <h2 className="font-display text-lg font-semibold text-ink truncate group-hover:text-terracotta transition-colors">
                {article.title}
              </h2>
              <p className="font-sans text-xs text-mute mt-1">
                {new Date(article.created_at).toLocaleString("pt-BR")} ·{" "}
                {article.category}
              </p>
            </div>
            <ReliabilityBadge score={article.reliability_score} />
          </Link>
        ))}
      </div>
    </main>
  );
}
