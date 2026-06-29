import Link from "next/link";
import { getPublishedArticles, getPublishedArticlesCount, getCoverImagesForArticles } from "@/lib/db";
import CategoryTabs from "@/components/CategoryTabs";
import AdSlot from "@/components/AdSlot";
import WhatsAppTipBanner from "@/components/WhatsAppTipBanner";
import LastUpdatedBadge from "@/components/LastUpdatedBadge";
import Pagination from "@/components/Pagination";
import FeaturedScoreCard from "@/components/FeaturedScoreCard";

export const dynamic = "force-dynamic";

const CATEGORY_COLORS: Record<string, string> = {
  geral: "#C1502E",
  policia: "#8F3A1F",
  politica: "#2E4F6B",
  cultura: "#8B5FA6",
  esporte: "#2E7D5C",
  saude: "#2E7D5C",
  turismo: "#C1862E",
};

function categoryColor(category: string) {
  const key = category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return CATEGORY_COLORS[key] ?? "#C1502E";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function PlaceholderArt({ seed }: { seed: number }) {
  // Gradiente determinístico (mesmo id = mesma cor sempre) para matérias sem imagem.
  const hue = (seed * 47) % 360;
  return (
    <div
      className="w-full h-full"
      style={{
        background: `linear-gradient(135deg, hsl(${hue}, 55%, 38%), hsl(${(hue + 40) % 360}, 60%, 24%))`,
      }}
    />
  );
}

export default async function PublicHome({
  searchParams,
}: {
  searchParams: { categoria?: string; pagina?: string };
}) {
  const activeCategory = searchParams.categoria ?? "todas";
  const currentPage = Math.max(1, Number(searchParams.pagina) || 1);

  const [articles, totalCount] = await Promise.all([
    getPublishedArticles(activeCategory, currentPage),
    getPublishedArticlesCount(activeCategory),
  ]);
  const coverImages = await getCoverImagesForArticles(articles.map((a) => a.id));

  const ARTICLES_PER_PAGE = 18;
  const totalPages = Math.max(1, Math.ceil(totalCount / ARTICLES_PER_PAGE));

  // O destaque (card grande no topo) só aparece na primeira página, para
  // não repetir a mesma matéria em destaque em todas as páginas.
  const destaque = currentPage === 1 ? articles[0] : undefined;
  const resto = currentPage === 1 ? articles.slice(1) : articles;

  return (
    <main className="min-h-screen bg-paper">
      <FeaturedScoreCard />
      <header className="sticky top-0 z-10 bg-paper/95 backdrop-blur-sm border-b border-ink/10 px-5 py-4 sm:px-10">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Fato em Foco" className="w-10 h-10 rounded-full" />
            <h1 className="font-display text-2xl font-extrabold text-ink tracking-tight">
              Fato em Foco
            </h1>
          </Link>
          <p className="hidden sm:block font-sans text-xs font-medium uppercase tracking-widest text-mute">
            Porto Seguro · Costa do Descobrimento
          </p>
        </div>
      </header>

      <CategoryTabs active={activeCategory} />

      <div className="mx-auto max-w-6xl px-5 pt-4 flex justify-end">
        <LastUpdatedBadge lastPublishedAt={articles[0]?.published_at ?? null} />
      </div>

      <div className="mx-auto max-w-6xl px-5 pt-5">
        <AdSlot id="ad-home-top" minHeight="140px" />
      </div>

      {/* Layout de 3 colunas em telas extra grandes: anúncio | conteúdo | anúncio.
          Em telas menores, as colunas laterais somem e o conteúdo ocupa tudo. */}
      <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-10 grid grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)_220px] gap-8">
        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-4">
            <AdSlot id="ad-home-sidebar-left-1" minHeight="160px" />
            <AdSlot id="ad-home-sidebar-left-2" minHeight="160px" />
          </div>
        </aside>

        <div className="max-w-6xl mx-auto w-full">
        {articles.length === 0 && (
          <div className="border border-dashed border-mute/30 rounded-2xl p-16 text-center">
            <p className="font-display text-xl text-ink mb-2">
              {activeCategory === "todas"
                ? "Ainda não há matérias publicadas."
                : "Nenhuma matéria publicada nessa categoria ainda."}
            </p>
            <p className="font-sans text-sm text-mute">
              As próximas notícias revisadas aparecem aqui.
            </p>
          </div>
        )}

        {destaque && (
          <Link
            href={`/materia/${destaque.id}`}
            className="group block relative rounded-2xl overflow-hidden mb-10 bg-ink"
          >
            <div className="relative w-full aspect-[16/9] sm:aspect-[21/9]">
              {coverImages[destaque.id] ? (
                <img
                  src={coverImages[destaque.id]}
                  alt={destaque.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <PlaceholderArt seed={destaque.id} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 p-6 sm:p-10 max-w-3xl">
              <span
                className="inline-block font-sans text-xs font-bold uppercase tracking-wider text-white px-3 py-1 rounded-full mb-4"
                style={{ backgroundColor: categoryColor(destaque.category) }}
              >
                {destaque.category}
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white leading-tight mb-3">
                {destaque.title}
              </h2>
              {destaque.lead && (
                <p className="font-sans text-base sm:text-lg text-white/85 leading-relaxed hidden sm:block">
                  {destaque.lead}
                </p>
              )}
              <p className="font-sans text-xs text-white/60 mt-4 uppercase tracking-wide">
                {formatDate(destaque.published_at ?? destaque.created_at)}
              </p>
            </div>
          </Link>
        )}

        {resto.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {resto.map((article, index) => (
              <>
                <Link
                  key={article.id}
                  href={`/materia/${article.id}`}
                  className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-ink/8 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="relative w-full aspect-[4/3] overflow-hidden">
                    {coverImages[article.id] ? (
                      <img
                        src={coverImages[article.id]}
                        alt={article.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <PlaceholderArt seed={article.id} />
                    )}
                    <span
                      className="absolute top-3 left-3 font-sans text-[10px] font-bold uppercase tracking-wider text-white px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: categoryColor(article.category) }}
                    >
                      {article.category}
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-display text-lg font-bold text-ink leading-snug mb-2 group-hover:text-terracotta transition-colors">
                      {article.title}
                    </h3>
                    {article.lead && (
                      <p className="font-sans text-sm text-ink/60 leading-relaxed mb-3 line-clamp-3">
                        {article.lead}
                      </p>
                    )}
                    <p className="font-sans text-xs text-mute mt-auto uppercase tracking-wide">
                      {formatDate(article.published_at ?? article.created_at)}
                    </p>
                  </div>
                </Link>

                {/* Anúncios laterais (vendidos para telas grandes) reaparecem
                    aqui, intercalados no feed, só em telas pequenas — onde
                    não há espaço de coluna lateral disponível. */}
                {index === 5 && (
                  <div key="mobile-ad-1" className="sm:col-span-2 lg:col-span-3 xl:hidden">
                    <AdSlot id="ad-home-sidebar-left-1" minHeight="120px" />
                  </div>
                )}
                {index === 11 && (
                  <div key="mobile-ad-2" className="sm:col-span-2 lg:col-span-3 xl:hidden">
                    <AdSlot id="ad-home-sidebar-right-1" minHeight="120px" hideCallToActionIfEmpty />
                  </div>
                )}
                {index === 17 && (
                  <div key="mobile-ad-3" className="sm:col-span-2 lg:col-span-3 xl:hidden">
                    <AdSlot id="ad-home-sidebar-left-2" minHeight="120px" hideCallToActionIfEmpty />
                  </div>
                )}
                {index === 23 && (
                  <div key="mobile-ad-4" className="sm:col-span-2 lg:col-span-3 xl:hidden">
                    <AdSlot id="ad-home-sidebar-right-2" minHeight="120px" hideCallToActionIfEmpty />
                  </div>
                )}
              </>
            ))}
          </div>
        )}

        <Pagination currentPage={currentPage} totalPages={totalPages} category={activeCategory} />
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-4">
            <AdSlot id="ad-home-sidebar-right-1" minHeight="160px" />
            <AdSlot id="ad-home-sidebar-right-2" minHeight="160px" />
          </div>
        </aside>
      </div>

      <footer className="border-t border-ink/10 px-5 py-8 sm:px-10 mt-10">
        <div className="mx-auto max-w-6xl">
          <WhatsAppTipBanner />
          <div className="mt-6">
            <AdSlot id="ad-home-footer" minHeight="70px" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6">
            <p className="font-sans text-xs text-mute">
              Fato em Foco — conteúdo apurado a partir de fontes públicas e
              portais regionais, com revisão editorial antes da publicação.
            </p>
            <Link
              href="/sobre"
              className="font-sans text-xs text-mute hover:text-terracotta transition-colors underline shrink-0"
            >
              Sobre o jornal
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
