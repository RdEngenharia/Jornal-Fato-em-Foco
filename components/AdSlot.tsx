// Espaço reservado para publicidade. Hoje mostra só um placeholder
// discreto; quando você tiver o código de uma rede de anúncios (Google
// AdSense, etc), cole o <script>/<ins> fornecido por ela dentro da div
// abaixo, no lugar do comentário {/* Publicidade */}.
//
// Para o Google AdSense especificamente: depois de aprovado, o código
// de "Auto Ads" vai no <head> (ver app/layout.tsx) e os "ad units"
// manuais (se quiser controlar posições específicas) substituem estes
// placeholders.

type AdSlotProps = {
  id: string;
  label?: string;
  minHeight?: string;
};

export default function AdSlot({ id, label = "Publicidade", minHeight = "100px" }: AdSlotProps) {
  return (
    <div
      id={id}
      data-ad-slot={id}
      className="flex items-center justify-center border border-dashed border-mute/20 rounded-lg text-mute/60 text-[10px] font-sans uppercase tracking-widest"
      style={{ minHeight }}
    >
      {label}
      {/* Cole aqui o código do seu ad network quando estiver pronto. */}
    </div>
  );
}
