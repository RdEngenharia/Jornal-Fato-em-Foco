"use client";

import { useState, useMemo, useEffect } from "react";
import { generateInstagramCard } from "@/lib/instagram-card";

const CATEGORY_HASHTAGS: Record<string, string> = {
  geral: "#PortoSeguro #CostaDoDescobrimento",
  politica: "#PortoSeguro #Política #Bahia",
  negocios: "#PortoSeguro #Negócios #Bahia",
  policia: "#PortoSeguro #SegurançaPública #Bahia",
  justica: "#PortoSeguro #Justiça #Bahia",
  cultura: "#PortoSeguro #Cultura #CostaDoDescobrimento",
  esporte: "#PortoSeguro #Esporte #Bahia",
  saude: "#PortoSeguro #Saúde #Bahia",
  turismo: "#PortoSeguro #Turismo #CostaDoDescobrimento",
};

const BASE_HASHTAGS = "#RDNoticias #NotíciasBA";

type Props = {
  title: string;
  lead: string;
  category: string;
  coverImageUrl?: string;
};

export default function InstagramPostHelper({ title, lead, category, coverImageUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [cardStatus, setCardStatus] = useState<"idle" | "loading" | "error">("idle");

  const caption = useMemo(() => {
    const hashtags = CATEGORY_HASHTAGS[category] ?? CATEGORY_HASHTAGS.geral;
    const parts = [
      title,
      "",
      lead,
      "",
      "📲 Leia a matéria completa no link da bio.",
      "",
      `${hashtags} ${BASE_HASHTAGS}`,
    ];
    return parts.join("\n");
  }, [title, lead, category]);

  // Gera o card visual (foto + título sobreposto) sempre que a imagem,
  // título, lide ou categoria mudarem, enquanto o painel estiver aberto.
  useEffect(() => {
    if (!open || !coverImageUrl) {
      setCardUrl(null);
      return;
    }

    let cancelled = false;
    setCardStatus("loading");

    generateInstagramCard(coverImageUrl, title, lead, category)
      .then((dataUrl) => {
        if (!cancelled) {
          setCardUrl(dataUrl);
          setCardStatus("idle");
        }
      })
      .catch(() => {
        if (!cancelled) setCardStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [open, coverImageUrl, title, lead, category]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sem feedback extra se o clipboard falhar — o texto continua
      // selecionável manualmente na caixa.
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 font-sans text-sm text-ink border border-ink/15 rounded-md px-4 py-2 hover:bg-ink/5 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
        Preparar post Instagram
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-sans text-sm font-semibold text-ink">Post para Instagram</h4>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="font-sans text-xs text-mute hover:text-terracotta"
        >
          Fechar
        </button>
      </div>

      {coverImageUrl ? (
        <div className="space-y-1.5">
          {cardStatus === "loading" && (
            <div className="w-full aspect-square rounded-md border border-ink/10 bg-paper flex items-center justify-center">
              <p className="font-sans text-xs text-mute">Gerando card...</p>
            </div>
          )}
          {cardStatus === "error" && (
            <div className="w-full aspect-square rounded-md border border-ink/10 bg-paper flex items-center justify-center p-4">
              <p className="font-sans text-xs text-terracotta-dark text-center">
                Não foi possível gerar o card automático. Use a imagem
                original abaixo.
              </p>
            </div>
          )}
          {cardUrl && cardStatus === "idle" && (
            <img
              src={cardUrl}
              alt="Card pronto para Instagram"
              className="w-full aspect-square object-cover rounded-md border border-ink/10"
            />
          )}
          <a
            href={cardUrl ?? coverImageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-xs text-terracotta hover:underline"
          >
            Abrir imagem em nova aba (clique com botão direito → Salvar
            imagem)
          </a>
        </div>
      ) : (
        <p className="font-sans text-xs text-mute">
          Nenhuma imagem de capa definida nesta matéria ainda.
        </p>
      )}

      <div>
        <label className="font-sans text-xs text-mute block mb-1">Legenda pronta</label>
        <textarea
          readOnly
          value={caption}
          rows={8}
          className="w-full font-sans text-sm text-ink bg-paper border border-ink/10 rounded-md px-3 py-2 resize-none"
          onClick={(e) => e.currentTarget.select()}
        />
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="w-full rounded-md bg-ink px-4 py-2.5 font-sans text-sm font-medium text-white hover:bg-ink/85 transition-colors"
      >
        {copied ? "Copiado!" : "Copiar legenda"}
      </button>

      <p className="font-sans text-[11px] text-mute/70">
        O card já vem com o título sobreposto na imagem. Salve e cole
        junto com a legenda copiada direto no app do Instagram.
      </p>
    </div>
  );
}
