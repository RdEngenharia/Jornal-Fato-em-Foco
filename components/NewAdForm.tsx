"use client";

import { useState } from "react";
import { createAdAction, updateAdAction } from "@/app/admin/anuncios/actions";
import type { Advertisement } from "@/lib/db";

const SLOTS = [
  { id: "ad-home-top", label: "Topo da home" },
  { id: "ad-home-sidebar-left-1", label: "Lateral esquerda — posição 1 (home, telas grandes)" },
  { id: "ad-home-sidebar-left-2", label: "Lateral esquerda — posição 2 (home, telas grandes)" },
  { id: "ad-home-sidebar-right-1", label: "Lateral direita — posição 1 (home, telas grandes)" },
  { id: "ad-home-sidebar-right-2", label: "Lateral direita — posição 2 (home, telas grandes)" },
  { id: "ad-home-footer", label: "Rodapé da home" },
  { id: "ad-in-article", label: "Dentro da matéria" },
  { id: "ad-article-footer", label: "Rodapé da matéria" },
];

const PLANS = {
  destaque: {
    label: "Destaque (home)",
    description: "Maior visibilidade — aparece para todo visitante que abre o site.",
    slots: ["ad-home-top", "ad-home-sidebar-left-1", "ad-home-sidebar-right-1", "ad-home-footer"],
  },
  padrao: {
    label: "Padrão (matérias)",
    description: "Aparece dentro das matérias — visibilidade mais segmentada, custo menor.",
    slots: ["ad-in-article", "ad-article-footer"],
  },
  personalizado: {
    label: "Personalizado",
    description: "Escolha manualmente quais posições exibem este anúncio.",
    slots: [] as string[],
  },
} as const;

type PlanKey = keyof typeof PLANS;

function toDateInputValue(isoString: string | null): string {
  if (!isoString) return "";
  return isoString.slice(0, 10); // "AAAA-MM-DD" a partir do ISO completo
}

type Props = {
  existingAd?: Advertisement;
};

export default function NewAdForm({ existingAd }: Props) {
  const isEditing = !!existingAd;
  const [imageUrl, setImageUrl] = useState(existingAd?.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanKey>("destaque");
  const [selectedSlots, setSelectedSlots] = useState<string[]>(
    existingAd?.slot_ids ?? (PLANS.destaque.slots as unknown as string[])
  );

  function handlePlanChange(newPlan: PlanKey) {
    setPlan(newPlan);
    setSelectedSlots([...PLANS[newPlan].slots]);
  }

  function toggleSlot(slotId: string) {
    setSelectedSlots((prev) =>
      prev.includes(slotId) ? prev.filter((s) => s !== slotId) : [...prev, slotId]
    );
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha no upload.");
      setImageUrl(data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      action={isEditing ? updateAdAction : createAdAction}
      className="rounded-lg border border-ink/10 bg-white p-5 space-y-4"
    >
      <h3 className="font-display text-lg font-semibold text-ink">
        {isEditing ? `Editar anúncio — ${existingAd.advertiser_name}` : "Novo anúncio"}
      </h3>

      {isEditing && <input type="hidden" name="id" value={existingAd.id} />}
      <input type="hidden" name="imageUrl" value={imageUrl} />

      <div>
        <label className="font-sans text-xs text-mute block mb-2">Tipo de anúncio</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(Object.keys(PLANS) as PlanKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handlePlanChange(key)}
              className={`text-left rounded-md border p-3 transition-colors ${
                plan === key
                  ? "border-terracotta bg-terracotta/5"
                  : "border-ink/10 hover:border-ink/20"
              }`}
            >
              <p className="font-sans text-sm font-semibold text-ink">{PLANS[key].label}</p>
              <p className="font-sans text-[11px] text-mute mt-0.5">{PLANS[key].description}</p>
            </button>
          ))}
        </div>
        {isEditing && (
          <p className="font-sans text-[11px] text-mute/70 mt-1.5">
            As posições já selecionadas abaixo refletem o anúncio atual —
            escolher um plano aqui substitui essa seleção.
          </p>
        )}
      </div>

      <div>
        <label className="font-sans text-xs text-mute block mb-1">Nome do anunciante</label>
        <input
          name="advertiserName"
          required
          defaultValue={existingAd?.advertiser_name}
          placeholder="Ex: Restaurante Sabor do Mar"
          className="w-full font-sans text-sm bg-paper border border-ink/10 rounded-md px-3 py-2 focus:border-terracotta"
        />
      </div>

      <div>
        <label className="font-sans text-xs text-mute block mb-1">
          Link de destino (opcional)
        </label>
        <input
          name="linkUrl"
          defaultValue={existingAd?.link_url ?? ""}
          placeholder="https://wa.me/55... ou site da empresa"
          className="w-full font-sans text-sm bg-paper border border-ink/10 rounded-md px-3 py-2 focus:border-terracotta"
        />
        <p className="font-sans text-[11px] text-mute/70 mt-1">
          Deixe em branco para o anúncio aparecer só como imagem, sem
          direcionar a lugar nenhum quando clicado.
        </p>
      </div>

      <div>
        <label className="font-sans text-xs text-mute block mb-1">
          Texto curto sobre o anúncio (opcional)
        </label>
        <input
          name="description"
          maxLength={80}
          defaultValue={existingAd?.description ?? ""}
          placeholder="Ex: Energia solar com até 95% de economia"
          className="w-full font-sans text-sm bg-paper border border-ink/10 rounded-md px-3 py-2 focus:border-terracotta"
        />
        <p className="font-sans text-[11px] text-mute/70 mt-1">
          Aparece como legenda abaixo da imagem do anúncio. Até 80 caracteres.
        </p>
      </div>

      <div>
        <label className="font-sans text-xs text-mute block mb-1">Imagem do anúncio</label>
        {imageUrl ? (
          <div className="space-y-2">
            <div className="relative w-full aspect-[3/1] rounded-md overflow-hidden border border-ink/10">
              <img src={imageUrl} alt="Preview do anúncio" className="w-full h-full object-cover" />
            </div>
            <label className="inline-block font-sans text-xs text-terracotta cursor-pointer hover:underline">
              Trocar imagem
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={handleImageChange}
              />
            </label>
            {uploading && <p className="font-sans text-xs text-mute">Enviando...</p>}
          </div>
        ) : (
          <label className="flex items-center justify-center w-full h-24 border border-dashed border-mute/40 rounded-md cursor-pointer hover:border-terracotta/50 bg-paper">
            <span className="font-sans text-sm text-mute">
              {uploading ? "Enviando..." : "+ Escolher imagem"}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={handleImageChange}
            />
          </label>
        )}
        {uploadError && (
          <p className="font-sans text-xs text-terracotta-dark mt-1">{uploadError}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-sans text-xs text-mute block mb-1">
            Início (opcional)
          </label>
          <input
            type="date"
            name="startsAt"
            defaultValue={toDateInputValue(existingAd?.starts_at ?? null)}
            className="w-full font-sans text-sm bg-paper border border-ink/10 rounded-md px-3 py-2 focus:border-terracotta"
          />
        </div>
        <div>
          <label className="font-sans text-xs text-mute block mb-1">
            Expira em (opcional)
          </label>
          <input
            type="date"
            name="endsAt"
            defaultValue={toDateInputValue(existingAd?.ends_at ?? null)}
            className="w-full font-sans text-sm bg-paper border border-ink/10 rounded-md px-3 py-2 focus:border-terracotta"
          />
        </div>
      </div>
      <p className="font-sans text-[11px] text-mute/70 -mt-2">
        Deixe em branco para anúncio sem prazo. Definindo a data de
        expiração, o anúncio some automaticamente do site nesse dia, sem
        precisar remover manualmente.
      </p>

      <div>
        <label className="font-sans text-xs text-mute block mb-2">
          Posições selecionadas ({selectedSlots.length})
        </label>
        <div className="space-y-1.5">
          {SLOTS.map((slot) => (
            <label key={slot.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name={`slot_${slot.id}`}
                checked={selectedSlots.includes(slot.id)}
                onChange={() => toggleSlot(slot.id)}
                className="rounded border-ink/20 text-terracotta focus:ring-terracotta"
              />
              <span className="font-sans text-sm text-ink">{slot.label}</span>
            </label>
          ))}
        </div>
        <p className="font-sans text-[11px] text-mute/70 mt-1.5">
          Os planos já vêm com posições sugeridas, mas você pode ajustar
          manualmente marcando ou desmarcando antes de criar.
        </p>
      </div>

      <button
        type="submit"
        disabled={!imageUrl || uploading || selectedSlots.length === 0}
        className="rounded-md bg-terracotta px-5 py-2.5 font-sans text-sm font-medium text-white hover:bg-terracotta-dark transition-colors disabled:opacity-40"
      >
        {isEditing ? "Salvar alterações" : "Criar anúncio"}
      </button>
    </form>
  );
}
