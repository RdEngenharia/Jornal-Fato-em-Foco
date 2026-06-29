// Espaço de publicidade. Busca automaticamente um anúncio vendido
// diretamente (cadastrado em /admin/anuncios) para este slot — se não
// houver nenhum ativo, mostra um convite clicável para futuros
// anunciantes, em vez de um placeholder vazio.
import Link from "next/link";
import { getActiveAdForSlot, getWhatsAppNumber, type Advertisement } from "@/lib/db";

type AdSlotProps = {
  id: string;
  label?: string;
  /** Altura fixa do espaço de imagem (não apenas mínima), para o
   * anúncio nunca ficar maior que o esperado independente da proporção
   * da imagem enviada. Ex: "70px", "160px". */
  minHeight?: string;
  /** Se true, não renderiza nada quando não houver anúncio ativo (em
   * vez de mostrar o convite "Anuncie Aqui"). Útil para slots repetidos
   * no feed, onde 4 convites seguidos poluiriam a experiência. */
  hideCallToActionIfEmpty?: boolean;
};

function AdContent({ ad, height }: { ad: Advertisement; height: string }) {
  const objectFitClass = ad.fit_mode === "contain" ? "object-contain" : "object-cover";
  const bgClass = ad.fit_mode === "contain" ? "bg-paper" : "";

  return (
    <>
      <div className={`relative w-full ${bgClass}`} style={{ height }}>
        <img
          src={ad.image_url}
          alt={ad.advertiser_name}
          className={`absolute inset-0 w-full h-full ${objectFitClass}`}
        />
        <span className="absolute top-1.5 right-1.5 bg-ink/70 text-white text-[9px] font-sans px-1.5 py-0.5 rounded uppercase tracking-wide">
          Publicidade
        </span>
      </div>
      {ad.description && (
        <p className="font-sans text-xs text-ink/70 px-2.5 py-2 bg-white leading-snug">
          {ad.description}
        </p>
      )}
    </>
  );
}

export default async function AdSlot({
  id,
  minHeight = "100px",
  hideCallToActionIfEmpty = false,
}: AdSlotProps) {
  const ad = await getActiveAdForSlot(id);

  if (ad && ad.link_url) {
    return (
      <Link
        href={ad.link_url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block rounded-lg overflow-hidden border border-ink/10"
      >
        <AdContent ad={ad} height={minHeight} />
      </Link>
    );
  }

  if (ad) {
    // Anúncio sem link de destino: imagem estática, não clicável.
    return (
      <div className="rounded-lg overflow-hidden border border-ink/10">
        <AdContent ad={ad} height={minHeight} />
      </div>
    );
  }

  // Nenhum anúncio ativo para este slot. Se configurado para não
  // poluir o feed com convites repetidos, não renderiza nada.
  if (hideCallToActionIfEmpty) {
    return null;
  }

  const whatsappNumber = await getWhatsAppNumber();
  const message = encodeURIComponent(
    "Olá! Vi o espaço de publicidade no Fato em Foco e quero saber mais sobre como anunciar."
  );

  return (
    <Link
      href={`https://wa.me/${whatsappNumber}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      id={id}
      data-ad-slot={id}
      className="flex flex-col items-center justify-center gap-1 border border-dashed border-terracotta/30 rounded-lg text-center hover:border-terracotta/60 hover:bg-terracotta/5 transition-colors"
      style={{ height: minHeight }}
    >
      <span className="font-sans text-xs font-semibold text-terracotta uppercase tracking-wide">
        Anuncie Aqui
      </span>
      <span className="font-sans text-[10px] text-mute px-2">
        Fale com a gente no WhatsApp
      </span>
    </Link>
  );
}
