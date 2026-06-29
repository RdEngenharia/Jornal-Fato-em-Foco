import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getArticleById,
  getSourcesByArticleId,
  getValidationLogByArticleId,
  getMediaByArticleId,
} from "@/lib/db";
import { checkPlagiarism } from "@/lib/plagiarism-check";
import ReliabilityBadge from "@/components/ReliabilityBadge";
import ReviewForm from "@/components/ReviewForm";
import { publishAction, rejectAction } from "@/app/admin/review/actions";

export const dynamic = "force-dynamic";

const SOURCE_TYPE_LABEL: Record<string, string> = {
  oficial: "Fonte oficial",
  portal_regional: "Portal regional",
  rede_social: "Rede social de órgão público",
  outro: "Outra fonte",
};

const RISK_STYLES = {
  baixo: { bg: "bg-sage/10", text: "text-sage", label: "Baixo risco de cópia literal" },
  atencao: { bg: "bg-terracotta/10", text: "text-terracotta", label: "Atenção: trechos repetidos da fonte" },
  alto: { bg: "bg-terracotta-dark/15", text: "text-terracotta-dark", label: "Alto risco: revise antes de publicar" },
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

  const plagiarism = checkPlagiarism(
    article.body,
    sources.map((s) => s.raw_excerpt ?? "")
  );
  const riskStyle = RISK_STYLES[plagiarism.riskLevel];

  return (
    <main className="min-h-screen bg-paper px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin"
          className="font-sans text-sm text-mute hover:text-terracotta transition-colors"
        >
          ← Voltar para a lista
        </Link>

        <ReviewForm
          articleId={article.id}
          title={article.title}
          lead={article.lead ?? ""}
          body={article.body}
          category={article.category}
          status={article.status}
          publishAction={publishAction}
          rejectAction={rejectAction}
          reliabilityBadge={<ReliabilityBadge score={article.reliability_score} size="lg" />}
          initialMedia={media.map((m) => ({
            type: m.media_type,
            url: m.url,
            embedUrl: m.embed_url,
          }))}
          rightColumnExtra={
            <>
              <section className={`rounded-lg border border-ink/10 p-5 ${riskStyle.bg}`}>
                <h3 className="font-sans text-xs uppercase tracking-widest text-mute mb-2">
                  Similaridade com a fonte
                </h3>
                <p className={`font-display text-2xl font-bold ${riskStyle.text}`}>
                  {plagiarism.matchPercentage}%
                </p>
                <p className={`font-sans text-sm font-medium mt-1 ${riskStyle.text}`}>
                  {riskStyle.label}
                </p>
                <p className="font-sans text-xs text-mute mt-2 leading-relaxed">
                  Mede quanto do texto gerado contém sequências de 8+ palavras
                  idênticas ao resumo da fonte original. Compara só com o
                  resumo (RSS), não com o artigo completo da fonte.
                </p>
                {plagiarism.matchedPhrases.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-ink/10">
                    <p className="font-sans text-xs font-medium text-ink mb-1">
                      Trechos repetidos encontrados:
                    </p>
                    <ul className="space-y-1">
                      {plagiarism.matchedPhrases.map((phrase, i) => (
                        <li key={i} className="font-sans text-xs text-ink/70 italic">
                          &quot;...{phrase}...&quot;
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>

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
            </>
          }
        />
      </div>
    </main>
  );
}
