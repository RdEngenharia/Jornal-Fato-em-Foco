"use client";

import { useState } from "react";
import { createAdAction } from "@/app/admin/anuncios/actions";

const SLOTS = [
  { id: "ad-home-top", label: "Topo da home" },
  { id: "ad-home-sidebar-left", label: "Lateral esquerda (home, telas grandes)" },
  { id: "ad-home-sidebar-right", label: "Lateral direita (home, telas grandes)" },
  { id: "ad-home-footer", label: "Rodapé da home" },
  { id: "ad-in-article", label: "Dentro da matéria" },
  { id: "ad-article-footer", label: "Rodapé da matéria" },
];

export default function NewAdForm() {
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
    <form action={createAdAction} className="rounded-lg border border-ink/10 bg-white p-5 space-y-4">
      <h3 className="font-display text-lg font-semibold text-ink">Novo anúncio</h3>

      <input type="hidden" name="imageUrl" value={imageUrl} />

      <div>
        <label className="font-sans text-xs text-mute block mb-1">Nome do anunciante</label>
        <input
          name="advertiserName"
          required
          placeholder="Ex: Restaurante Sabor do Mar"
          className="w-full font-sans text-sm bg-paper border border-ink/10 rounded-md px-3 py-2 focus:border-terracotta"
        />
      </div>

      <div>
        <label className="font-sans text-xs text-mute block mb-1">Link de destino</label>
        <input
          name="linkUrl"
          required
          placeholder="https://wa.me/55... ou site da empresa"
          className="w-full font-sans text-sm bg-paper border border-ink/10 rounded-md px-3 py-2 focus:border-terracotta"
        />
      </div>

      <div>
        <label className="font-sans text-xs text-mute block mb-1">Imagem do anúncio</label>
        {imageUrl ? (
          <div className="relative w-full aspect-[3/1] rounded-md overflow-hidden border border-ink/10 mb-2">
            <img src={imageUrl} alt="Preview do anúncio" className="w-full h-full object-cover" />
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
          Onde exibir (selecione um ou mais)
        </label>
        <div className="space-y-1.5">
          {SLOTS.map((slot) => (
            <label key={slot.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name={`slot_${slot.id}`}
                className="rounded border-ink/20 text-terracotta focus:ring-terracotta"
              />
              <span className="font-sans text-sm text-ink">{slot.label}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={!imageUrl || uploading}
        className="rounded-md bg-terracotta px-5 py-2.5 font-sans text-sm font-medium text-white hover:bg-terracotta-dark transition-colors disabled:opacity-40"
      >
        Criar anúncio
      </button>
    </form>
  );
}
