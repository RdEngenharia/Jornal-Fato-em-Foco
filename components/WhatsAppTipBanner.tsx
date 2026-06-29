import { getWhatsAppNumber } from "@/lib/db";

function formatDisplay(digits: string): string {
  const withoutCountry = digits.startsWith("55") ? digits.slice(2) : digits;
  const ddd = withoutCountry.slice(0, 2);
  const rest = withoutCountry.slice(2);
  return rest.length === 9
    ? `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`
    : `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
}

export default async function WhatsAppTipBanner() {
  const whatsappNumber = await getWhatsAppNumber();

  return (
    <div className="rounded-xl bg-ink text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
      <div className="flex items-center gap-2 shrink-0">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-sage">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.94.55 3.76 1.5 5.3L2 22l4.93-1.6a9.86 9.86 0 0 0 5.11 1.4c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.79 14.1c-.24.68-1.4 1.3-1.96 1.38-.5.08-1.13.11-1.83-.11a14.7 14.7 0 0 1-3.78-1.79c-2.49-1.58-4.1-3.96-4.22-4.13-.12-.17-1-1.33-1-2.54s.65-1.8.87-2.05c.22-.25.49-.31.65-.31h.47c.15 0 .35-.06.55.42.21.5.7 1.72.77 1.84.06.13.1.28.02.45-.08.17-.13.27-.26.42-.13.15-.27.33-.39.45-.12.12-.25.25-.11.49.15.25.66 1.1 1.42 1.78 1 .9 1.83 1.18 2.08 1.31.25.13.4.11.55-.04.15-.15.62-.72.78-.97.16-.25.32-.2.54-.12.22.08 1.41.67 1.65.79.24.12.4.18.46.28.06.1.06.58-.18 1.26Z" />
        </svg>
        <p className="font-sans text-sm font-semibold">Tem uma pauta pra nós?</p>
      </div>
      <p className="font-sans text-sm text-white/80 flex-1">
        Envie foto, vídeo ou seu relato pelo WhatsApp. Toda sugestão é apurada
        antes de qualquer publicação.
      </p>
      <a
        href={`https://wa.me/${whatsappNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-sans text-sm font-medium bg-sage text-white px-4 py-2 rounded-md hover:bg-sage/90 transition-colors shrink-0 text-center"
      >
        {formatDisplay(whatsappNumber)}
      </a>
    </div>
  );
}
