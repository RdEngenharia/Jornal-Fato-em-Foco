import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedArticleById, getMediaByArticleId } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
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

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-ink/10 px-6 py-6 sm:px-10">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <Link href="/noticias">
            <h1 className="font-display text-2xl font-bold text-ink tracking-tight">
              Fato em Foco
            </h1>
          </Link>
          <p className="font-sans text-xs uppercase tracking-widest text-mute">
            Porto Seguro &amp; Costa do Descobrimento
          </p>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-12 sm:px-10">
        <Link
          href="/noticias"
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

        {coverImage && (
          <img
            src={coverImage.url}
            alt={article.title}
            className="w-full aspect-[16/9] object-cover rounded-2xl mb-8"
          />
        )}

        {article.lead && (
          <p className="font-sans text-lg text-ink/70 leading-relaxed mb-8 border-l-2 border-terracotta pl-4">
            {article.lead}
          </p>
        )}

        <div className="font-sans text-base text-ink leading-relaxed whitespace-pre-line space-y-4">
          {article.body}
        </div>

        {restImages.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mt-8">
            {restImages.map((img) => (
              <img
                key={img.id}
                src={img.url}
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
      </article>

      <footer className="border-t border-ink/10 px-6 py-8 sm:px-10">
        <div className="mx-auto max-w-3xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
      </footer>
    </main>
  );
}
