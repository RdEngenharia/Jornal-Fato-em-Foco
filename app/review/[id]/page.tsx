import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getArticleById,
  getSourcesByArticleId,
  getValidationLogByArticleId,
  getMediaByArticleId,
} from "@/lib/db";
import ReliabilityBadge from "@/components/ReliabilityBadge";
import MediaGalleryField from "@/components/MediaGalleryField";
import { publishAction, rejectAction } from "@/app/review/actions";

export const dynamic = "force-dynamic";

const SOURCE_TYPE_LABEL: Record<string, string> = {
  oficial: "Fonte oficial",
  portal_regional: "Portal regional",
  rede_social: "Rede social de órgão público",
  outro: "Outra fonte",
};

export default async function ReviewPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  const article = await getArticleById(id);
  if (!article) notFound();

  const [sources, validation, media] = await Promise.all([
    getSourcesByArticleId(id),
    getValidationLogByArticleId(id),
    getMediaByArticleId(id),
  ]);

  return (
    <main className="min-h-screen bg-paper px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="font-sans text-sm text-mute hover:text-terracotta transition-colors"
        >
          ← Voltar para a lista
        </Link>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Coluna principal: rascunho editável */}
          <form action={publishAction} className="space-y-5">
            <input type="hidden" name="id" value={article.id} />

            <div className="flex items-center justify-between">
              <span className="font-sans text-xs uppercase tracking-widest text-mute">
                Rascunho · {article.status === "pending_review" ? "pendente" : article.status}
              </span>
              <ReliabilityBadge score={article.reliability_score} size="lg" />
            </div>

            <MediaGalleryField
              initialMedia={media.map((m) => ({
                type: m.media_type,
                url: m.url,
                embedUrl: m.embed_url,
              }))}
            />

            <div>
              <label className="font-sans text-xs text-mute block mb-1">Categoria</label>
              <select
                name="category"
                defaultValue={article.category}
                className="w-full font-sans text-sm text-ink bg-white border border-ink/10 rounded-md px-4 py-2.5 focus:border-terracotta"
              >
                <option value="geral">Geral</option>
                <option value="politica">Política</option>
                <option value="negocios">Negócios</option>
                <option value="policia">Polícia</option>
                <option value="cultura">Cultura</option>
                <option value="esporte">Esporte</option>
                <option value="saude">Saúde</option>
                <option value="turismo">Turismo</option>
              </select>
            </div>

            <div>
              <label className="font-sans text-xs text-mute block mb-1">Título</label>
              <input
                name="title"
                defaultValue={article.title}
                className="w-full font-display text-2xl font-semibold text-ink bg-white border border-ink/10 rounded-md px-4 py-3 focus:border-terracotta"
              />
            </div>

            <div>
              <label className="font-sans text-xs text-mute block mb-1">Lide (resumo)</label>
              <textarea
                name="lead"
                defaultValue={article.lead ?? ""}
                rows={2}
                className="w-full font-sans text-base text-ink bg-white border border-ink/10 rounded-md px-4 py-3 focus:border-terracotta resize-none"
              />
            </div>

            <div>
              <label className="font-sans text-xs text-mute block mb-1">Corpo da matéria</label>
              <textarea
                name="body"
                defaultValue={article.body}
                rows={16}
                className="w-full font-sans text-base text-ink bg-white border border-ink/10 rounded-md px-4 py-3 focus:border-terracotta leading-relaxed"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="rounded-md bg-terracotta px-6 py-3 font-sans text-sm font-medium text-white hover:bg-terracotta-dark transition-colors"
              >
                Publicar
              </button>
              <button
                type="submit"
                formAction={rejectAction}
                className="rounded-md border border-ink/15 px-6 py-3 font-sans text-sm font-medium text-ink hover:bg-ink/5 transition-colors"
              >
                Rejeitar
              </button>
            </div>
          </form>

          {/* Coluna lateral: fontes cruzadas e raciocínio da validação */}
          <aside className="space-y-6">
            <section className="rounded-lg border border-ink/10 bg-white p-5">
              <h3 className="font-sans text-xs uppercase tracking-widest text-mute mb-3">
                Fontes cruzadas ({sources.length})
              </h3>
              <ul className="space-y-3">
                {sources.map((s) => (
                  <li key={s.id} className="text-sm">
                    <p className="font-sans font-medium text-ink">{s.source_name}</p>
                    <p className="font-sans text-xs text-mute">
                      {SOURCE_TYPE_LABEL[s.source_type] ?? s.source_type}
                    </p>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-sans text-xs text-terracotta hover:underline break-all"
                    >
                      {s.url}
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            {validation && (
              <section className="rounded-lg border border-ink/10 bg-white p-5">
                <h3 className="font-sans text-xs uppercase tracking-widest text-mute mb-3">
                  Raciocínio da validação
                </h3>
                <dl className="space-y-2 font-sans text-sm">
                  <div className="flex justify-between">
                    <dt className="text-mute">Score por regras</dt>
                    <dd className="text-ink font-medium">{validation.rule_based_score}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-mute">Score do classificador IA</dt>
                    <dd className="text-ink font-medium">{validation.llm_score}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-mute">Confiança</dt>
                    <dd className="text-ink font-medium capitalize">{validation.confidence}</dd>
                  </div>
                </dl>
                {validation.reasoning && (
                  <p className="font-sans text-sm text-ink/80 mt-3 leading-relaxed">
                    {validation.reasoning}
                  </p>
                )}
                {validation.contradictions?.length > 0 && (
                  <div className="mt-3">
                    <p className="font-sans text-xs text-terracotta font-medium mb-1">
                      Contradições encontradas
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      {validation.contradictions.map((c, i) => (
                        <li key={i} className="font-sans text-xs text-ink/70">
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
