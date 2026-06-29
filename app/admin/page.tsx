import Link from "next/link";
import { getPendingArticles } from "@/lib/db";
import ReliabilityBadge from "@/components/ReliabilityBadge";
import AudioUploadCard from "@/components/AudioUploadCard";
import { cleanupOldDraftsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminHome({
  searchParams,
}: {
  searchParams: { cleaned?: string };
}) {
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
            href="/admin/published"
            className="font-sans text-sm text-mute hover:text-terracotta transition-colors underline"
          >
            Ver publicadas →
          </Link>
        </div>
        <div className="flex justify-end mt-1 gap-3">
          <Link
            href="/admin/configuracoes"
            className="font-sans text-xs text-mute hover:text-terracotta transition-colors underline"
          >
            Configurações
          </Link>
          <Link
            href="/admin/anuncios"
            className="font-sans text-xs text-mute hover:text-terracotta transition-colors underline"
          >
            Gerenciar anúncios
          </Link>
        </div>
        <p className="font-sans text-sm text-mute mt-2">
          {articles.length === 0
            ? "Nenhum rascunho pendente no momento."
            : `${articles.length} ${articles.length === 1 ? "matéria" : "matérias"} aguardando sua decisão.`}
        </p>
      </header>

      <div className="mx-auto max-w-3xl mb-6">
        <AudioUploadCard />
      </div>

      {searchParams.cleaned && (
        <div className="mx-auto max-w-3xl mb-4 rounded-md bg-sage/10 border border-sage/30 px-4 py-3">
          <p className="font-sans text-sm text-sage">
            {searchParams.cleaned}{" "}
            {searchParams.cleaned === "1" ? "rascunho antigo foi rejeitado" : "rascunhos antigos foram rejeitados"}.
          </p>
        </div>
      )}

      {articles.length > 0 && (
        <div className="mx-auto max-w-3xl mb-6">
          <form
            action={cleanupOldDraftsAction}
            className="flex items-center gap-3 rounded-lg border border-dashed border-mute/30 px-4 py-3"
          >
            <p className="font-sans text-xs text-mute flex-1">
              Rejeitar em massa rascunhos pendentes com mais de
            </p>
            <select
              name="daysOld"
              defaultValue="3"
              className="font-sans text-xs bg-white border border-ink/10 rounded-md px-2 py-1.5"
            >
              <option value="1">1 dia</option>
              <option value="2">2 dias</option>
              <option value="3">3 dias</option>
              <option value="7">7 dias</option>
            </select>
            <button
              type="submit"
              className="font-sans text-xs text-terracotta-dark border border-terracotta/30 rounded-md px-3 py-1.5 hover:bg-terracotta/5 transition-colors shrink-0"
            >
              Limpar antigos
            </button>
          </form>
        </div>
      )}

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
            href={`/admin/review/${article.id}`}
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
