import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedArticleById, getMediaByArticleId, type ArticleMedia } from "@/lib/db";
import AdSlot from "@/components/AdSlot";
import SensitiveImage from "@/components/SensitiveImage";
import WhatsAppTipBanner from "@/components/WhatsAppTipBanner";
import ShareButton from "@/components/ShareButton";
import FeaturedScoreCard from "@/components/FeaturedScoreCard";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// Renderiza uma imagem da matéria, decidindo entre exibição normal ou
// o aviso de "conteúdo sensível" (quando marcada como is_sensitive e
// tendo uma original_url guardada para revelar após confirmação).
function ArticleImage({
  img,
  alt,
  className,
}: {
  img: ArticleMedia;
  alt: string;
  className: string;
}) {
  if (img.is_sensitive && img.original_url) {
    return (
      <SensitiveImage
        blurredUrl={img.url}
        originalUrl={img.original_url}
        alt={alt}
        className={className}
      />
    );
  }
  return <img src={img.url} alt={alt} className={className} />;
}

// Divide o corpo da matéria em blocos de texto e marcadores de imagem
// ([IMAGEM:N]), na ordem em que aparecem, para renderizar cada um no
// ponto exato escolhido na revisão. N é 1-based (1 = capa).
type BodyBlock =
  | { type: "text"; content: string }
  | { type: "image"; index: number };

function parseBodyWithImages(body: string): BodyBlock[] {
  const blocks: BodyBlock[] = [];
  const regex = /\[IMAGEM:(\d+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(body)) !== null) {
    const textBefore = body.slice(lastIndex, match.index).trim();
    if (textBefore) blocks.push({ type: "text", content: textBefore });
    blocks.push({ type: "image", index: Number(match[1]) });
    lastIndex = regex.lastIndex;
  }

  const remaining = body.slice(lastIndex).trim();
  if (remaining) blocks.push({ type: "text", content: remaining });

  return blocks;
}

export default async function ArticlePage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  const article = await getPublishedArticleById(id);
  if (!article) notFound();

  const media = await getMediaByArticleId(id);
  const images = media.filter((m) => m.media_type === "image");
  const videos = media.filter((m) => m.media_type === "video_embed");
  const [coverImage, ...restImages] = images;

  const bodyBlocks = parseBodyWithImages(article.body);
  const usedImageIndexes = new Set(
    bodyBlocks.filter((b) => b.type === "image").map((b) => (b as { index: number }).index)
  );
  // Imagens que sobraram (não usadas via marcador no texto) ainda aparecem
  // na grade do final, como já funcionava antes.
  const leftoverImages = restImages.filter((_, i) => !usedImageIndexes.has(i + 2));

  return (
    <main className="min-h-screen bg-paper">
      <FeaturedScoreCard />
      <header className="border-b border-ink/10 px-6 py-6 sm:px-10">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="RD Notícias" className="w-9 h-9 rounded-full" />
            <h1 className="font-display text-2xl font-bold text-ink tracking-tight">
              RD Notícias
            </h1>
          </Link>
          <p className="hidden sm:block font-sans text-xs uppercase tracking-widest text-mute">
            Porto Seguro &amp; Costa do Descobrimento
          </p>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-12 sm:px-10">
        <Link
          href="/"
          className="font-sans text-sm text-mute hover:text-terracotta transition-colors"
        >
          ← Todas as notícias
        </Link>

        <p className="font-sans text-xs uppercase tracking-widest text-terracotta mt-6 mb-3">
          {article.category} ·{" "}
          {formatDate(article.published_at ?? article.created_at)}
        </p>

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink leading-tight mb-5">
          {article.title}
        </h1>

        <div className="mb-6">
          <ShareButton title={article.title} />
        </div>

        {coverImage && (
          <ArticleImage
            img={coverImage}
            alt={article.title}
            className="w-full aspect-[16/9] object-cover rounded-2xl mb-8"
          />
        )}

        {article.lead && (
          <p className="font-sans text-lg text-ink/70 leading-relaxed mb-8 border-l-2 border-terracotta pl-4">
            {article.lead}
          </p>
        )}

        <div className="font-sans text-base text-ink leading-relaxed space-y-4">
          {bodyBlocks.map((block, i) => {
            if (block.type === "text") {
              return (
                <p key={i} className="whitespace-pre-line">
                  {block.content}
                </p>
              );
            }
            // block.type === "image" — busca a imagem pela posição (1-based)
            const img = images[block.index - 1];
            if (!img) return null;
            return (
              <ArticleImage
                key={i}
                img={img}
                alt={article.title}
                className="w-full aspect-[16/9] object-cover rounded-xl my-6"
              />
            );
          })}
        </div>

        {leftoverImages.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mt-8">
            {leftoverImages.map((img) => (
              <ArticleImage
                key={img.id}
                img={img}
                alt={article.title}
                className="w-full aspect-[4/3] object-cover rounded-xl"
              />
            ))}
          </div>
        )}

        {videos.length > 0 && (
          <div className="space-y-6 mt-8">
            {videos.map((video) => (
              <div key={video.id} className="aspect-video rounded-xl overflow-hidden bg-ink/5">
                <iframe
                  src={video.embed_url ?? video.url}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ))}
          </div>
        )}

        {/* Espaço reservado para anúncio dentro da matéria (in-article). */}
        <div className="my-8">
          <AdSlot id="ad-in-article" />
        </div>
      </article>

      <footer className="border-t border-ink/10 px-6 py-8 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <WhatsAppTipBanner />
          <div className="mt-6">
            <AdSlot id="ad-article-footer" minHeight="90px" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6">
            <p className="font-sans text-xs text-mute">
              RD Notícias — conteúdo apurado a partir de fontes públicas e
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
