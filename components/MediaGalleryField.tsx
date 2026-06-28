"use client";

import { useState } from "react";

export type MediaItem = {
  type: "image" | "video_embed";
  url: string;
  embedUrl?: string | null;
  previewUrl?: string; // usado só para preview local antes do upload terminar
};

type Props = {
  initialMedia?: MediaItem[];
};

export default function MediaGalleryField({ initialMedia = [] }: Props) {
  const [items, setItems] = useState<MediaItem[]>(initialMedia);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [videoInput, setVideoInput] = useState("");
  const [videoStatus, setVideoStatus] = useState<"idle" | "checking" | "error">("idle");
  const [videoError, setVideoError] = useState<string | null>(null);

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploadingCount((c) => c + files.length);

    for (const file of files) {
      const localPreview = URL.createObjectURL(file);
      // Adiciona um placeholder imediatamente para feedback visual rápido.
      setItems((prev) => [...prev, { type: "image", url: "", previewUrl: localPreview }]);

      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error ?? "Falha no upload.");

        setItems((prev) =>
          prev.map((item) =>
            item.previewUrl === localPreview
              ? { type: "image", url: data.url, previewUrl: localPreview }
              : item
          )
        );
      } catch {
        // Remove o item que falhou.
        setItems((prev) => prev.filter((item) => item.previewUrl !== localPreview));
      } finally {
        setUploadingCount((c) => c - 1);
      }
    }

    e.target.value = "";
  }

  function handleRemove(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function moveItem(index: number, direction: -1 | 1) {
    setItems((prev) => {
      const newItems = [...prev];
      const target = index + direction;
      if (target < 0 || target >= newItems.length) return prev;
      [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
      return newItems;
    });
  }

  async function handleAddVideo() {
    if (!videoInput.trim()) return;
    setVideoStatus("checking");
    setVideoError(null);

    try {
      const res = await fetch("/api/video-embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: videoInput.trim() }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Link não reconhecido.");

      setItems((prev) => [
        ...prev,
        { type: "video_embed", url: videoInput.trim(), embedUrl: data.embedUrl },
      ]);
      setVideoInput("");
      setVideoStatus("idle");
    } catch (err) {
      setVideoStatus("error");
      setVideoError(err instanceof Error ? err.message : "Erro desconhecido.");
    }
  }

  const images = items.filter((i) => i.type === "image");
  const videos = items.filter((i) => i.type === "video_embed");

  return (
    <div className="space-y-4">
      <div>
        <label className="font-sans text-xs text-mute block mb-2">
          Galeria de imagens {images.length > 0 && `(${images.length})`}
        </label>

        {items.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-2">
            {items.map((item, index) => (
              <div key={index} className="relative aspect-square rounded-md overflow-hidden border border-ink/10 bg-white">
                {item.type === "image" ? (
                  <img
                    src={item.previewUrl ?? item.url}
                    alt={`Imagem ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-ink/5 p-2">
                    <span className="font-sans text-xs text-mute text-center">
                      Vídeo ({item.url.includes("instagram") ? "Instagram" : "YouTube"})
                    </span>
                  </div>
                )}
                {!item.url && item.type === "image" && (
                  <div className="absolute inset-0 bg-ink/40 flex items-center justify-center">
                    <span className="font-sans text-[10px] text-white">Enviando...</span>
                  </div>
                )}
                <div className="absolute top-1 right-1 flex gap-1">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => moveItem(index, -1)}
                      className="bg-ink/80 text-white text-[10px] w-5 h-5 rounded flex items-center justify-center hover:bg-ink"
                      title="Mover para a esquerda"
                    >
                      ←
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="bg-ink/80 text-white text-[10px] w-5 h-5 rounded flex items-center justify-center hover:bg-terracotta"
                    title="Remover"
                  >
                    ✕
                  </button>
                </div>
                {index === 0 && item.type === "image" && (
                  <span className="absolute bottom-1 left-1 bg-terracotta text-white text-[9px] font-sans px-1.5 py-0.5 rounded">
                    Capa
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <label className="flex items-center justify-center w-full h-16 border border-dashed border-mute/40 rounded-md cursor-pointer hover:border-terracotta/50 transition-colors bg-white">
          <span className="font-sans text-sm text-mute">
            {uploadingCount > 0 ? "Enviando..." : "+ Adicionar imagem(ns)"}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={handleFilesSelected}
          />
        </label>
        <p className="font-sans text-[11px] text-mute/70 mt-1">
          A primeira imagem é usada como capa. Arraste com as setas para reordenar.
        </p>
      </div>

      <div>
        <label className="font-sans text-xs text-mute block mb-2">
          Vídeo (YouTube ou Instagram) {videos.length > 0 && `(${videos.length})`}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={videoInput}
            onChange={(e) => setVideoInput(e.target.value)}
            placeholder="Cole o link do vídeo aqui"
            className="flex-1 font-sans text-sm bg-white border border-ink/10 rounded-md px-3 py-2 focus:border-terracotta"
          />
          <button
            type="button"
            onClick={handleAddVideo}
            disabled={videoStatus === "checking"}
            className="font-sans text-sm px-4 py-2 rounded-md bg-ink text-white hover:bg-ink/90 transition-colors disabled:opacity-50"
          >
            {videoStatus === "checking" ? "Verificando..." : "Adicionar"}
          </button>
        </div>
        {videoStatus === "error" && (
          <p className="font-sans text-xs text-terracotta-dark mt-1">{videoError}</p>
        )}
      </div>

      {/* Campo oculto serializado, lido pela server action ao publicar */}
      <input
        type="hidden"
        name="mediaJson"
        value={JSON.stringify(
          items
            .filter((i) => i.url) // ignora placeholders ainda enviando
            .map((i) => ({ type: i.type, url: i.url, embedUrl: i.embedUrl ?? null }))
        )}
      />
    </div>
  );
}
