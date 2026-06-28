// Espaço de publicidade. Busca automaticamente um anúncio vendido
// diretamente (cadastrado em /admin/anuncios) para este slot — se não
// houver nenhum ativo, mostra um placeholder discreto no lugar.
import Link from "next/link";
import { getActiveAdForSlot } from "@/lib/db";

type AdSlotProps = {
  id: string;
  label?: string;
  minHeight?: string;
};

export default async function AdSlot({ id, label = "Publicidade", minHeight = "100px" }: AdSlotProps) {
  const ad = await getActiveAdForSlot(id);

  if (ad) {
    return (
      <Link
        href={ad.link_url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block relative rounded-lg overflow-hidden border border-ink/10"
        style={{ minHeight }}
      >
        <img
          src={ad.image_url}
          alt={ad.advertiser_name}
          className="w-full h-full object-cover"
        />
        <span className="absolute top-1.5 right-1.5 bg-ink/70 text-white text-[9px] font-sans px-1.5 py-0.5 rounded uppercase tracking-wide">
          Publicidade
        </span>
      </Link>
    );
  }

  return (
    <div
      id={id}
      data-ad-slot={id}
      className="flex items-center justify-center border border-dashed border-mute/20 rounded-lg text-mute/60 text-[10px] font-sans uppercase tracking-widest"
      style={{ minHeight }}
    >
      {label}
    </div>
  );
}
