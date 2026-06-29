// Espaço de publicidade. Busca automaticamente um anúncio vendido
// diretamente (cadastrado em /admin/anuncios) para este slot — se não
// houver nenhum ativo, mostra um placeholder discreto no lugar.
import Link from "next/link";
import { getActiveAdForSlot, type Advertisement } from "@/lib/db";

type AdSlotProps = {
  id: string;
  label?: string;
  /** Altura fixa do espaço de imagem (não apenas mínima), para o
   * anúncio nunca ficar maior que o esperado independente da proporção
   * da imagem enviada. Ex: "70px", "160px". */
  minHeight?: string;
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

export default async function AdSlot({ id, label = "Publicidade", minHeight = "100px" }: AdSlotProps) {
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

  return (
    <div
      id={id}
      data-ad-slot={id}
      className="flex items-center justify-center border border-dashed border-mute/20 rounded-lg text-mute/60 text-[10px] font-sans uppercase tracking-widest"
      style={{ height: minHeight }}
    >
      {label}
    </div>
  );
}
