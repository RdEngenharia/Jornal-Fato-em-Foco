"use client";

import { useState } from "react";
import MediaGalleryField, { type MediaItem } from "@/components/MediaGalleryField";
import InstagramPostHelper from "@/components/InstagramPostHelper";
import CategorySelectField from "@/components/CategorySelectField";

type Props = {
  initialMedia: MediaItem[];
  articleId: number;
  title: string;
  lead: string;
  body: string;
  category: string;
  status: string;
  publishAction: (formData: FormData) => Promise<void>;
  rejectAction: (formData: FormData) => Promise<void>;
  reliabilityBadge: React.ReactNode;
  rightColumnExtra: React.ReactNode;
};

export default function ReviewForm({
  initialMedia,
  articleId,
  title,
  lead,
  body,
  category,
  status,
  publishAction,
  rejectAction,
  reliabilityBadge,
  rightColumnExtra,
}: Props) {
  const [items, setItems] = useState<MediaItem[]>(initialMedia);

  // A capa é sempre o primeiro item de imagem da galeria — reflete em
  // tempo real, mesmo antes de a matéria ser publicada/salva no banco.
  const coverImage = items.find((i) => i.type === "image" && i.url);

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
      {/* Coluna principal: rascunho editável */}
      <form action={publishAction} className="space-y-5">
        <input type="hidden" name="id" value={articleId} />

        <div className="flex items-center justify-between">
          <span className="font-sans text-xs uppercase tracking-widest text-mute">
            Rascunho · {status === "pending_review" ? "pendente" : status}
          </span>
          {reliabilityBadge}
        </div>

        <MediaGalleryField initialMedia={initialMedia} onItemsChange={setItems} />

        <CategorySelectField defaultValue={category} />

        <div>
          <label className="font-sans text-xs text-mute block mb-1">Título</label>
          <input
            name="title"
            defaultValue={title}
            className="w-full font-display text-2xl font-semibold text-ink bg-white border border-ink/10 rounded-md px-4 py-3 focus:border-terracotta"
          />
        </div>

        <div>
          <label className="font-sans text-xs text-mute block mb-1">Lide (resumo)</label>
          <textarea
            name="lead"
            defaultValue={lead}
            rows={2}
            className="w-full font-sans text-base text-ink bg-white border border-ink/10 rounded-md px-4 py-3 focus:border-terracotta resize-none"
          />
        </div>

        <div>
          <label className="font-sans text-xs text-mute block mb-1">
            Corpo da matéria
          </label>
          <p className="font-sans text-[11px] text-mute/80 mb-2">
            Para inserir uma imagem da galeria no meio do texto, digite{" "}
            <code className="bg-ink/5 px-1 rounded">[IMAGEM:2]</code> no
            ponto exato onde ela deve aparecer (o número é a posição da
            imagem na galeria acima — a capa é a 1).
          </p>
          <textarea
            name="body"
            defaultValue={body}
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

      {/* Coluna lateral: post Instagram + fontes cruzadas + validação */}
      <aside className="space-y-6">
        <InstagramPostHelper
          title={title}
          lead={lead}
          category={category}
          coverImageUrl={coverImage?.url}
        />
        {rightColumnExtra}
      </aside>
    </div>
  );
}
