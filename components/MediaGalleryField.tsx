"use client";

import { useState } from "react";
import { applyWatermark, applyBlur } from "@/lib/image-processing";

export type MediaItem = {
  type: "image" | "video_embed";
  url: string;
  embedUrl?: string | null;
  previewUrl?: string; // usado só para preview local antes do upload terminar
  isBlurred?: boolean; // marca se essa imagem já foi desfocada
  originalUrl?: string | null; // URL da versão nítida, guardada quando a imagem é marcada como sensível
  isSensitive?: boolean; // true = mostra aviso "conteúdo sensível, clique para ver" no site público
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
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [processingIndex, setProcessingIndex] = useState<number | null>(null);

  async function handleCopyMarker(imagePosition: number) {
    const marker = `[IMAGEM:${imagePosition}]`;
    try {
      await navigator.clipboard.writeText(marker);
      setCopiedIndex(imagePosition);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      // Clipboard pode falhar em contextos sem permissão (raro); sem
      // necessidade de tratamento visual extra além de simplesmente
      // não mostrar a confirmação de cópia.
    }
  }

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploadingCount((c) => c + files.length);

    for (let file of files) {
      // Aplica a marca d'água ANTES do upload, se habilitada — assim a
      // imagem já sobe para o servidor com a marca, sem etapa extra.
      if (watermarkEnabled) {
        try {
          file = await applyWatermark(file);
        } catch {
          // Se o processamento falhar por qualquer motivo, segue com o
          // arquivo original em vez de bloquear o upload inteiro.
        }
      }

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

  async function handleBlurImage(index: number) {
    const item = items[index];
    if (!item.url) return;

    setProcessingIndex(index);
    try {
      // Guarda a URL nítida ATUAL antes de qualquer processamento — essa
      // é a versão que será revelada no site público após o leitor
      // confirmar que quer ver o conteúdo sensível.
      const originalUrl = item.url;

      const sourceUrl = item.previewUrl ?? item.url;
      const res = await fetch(sourceUrl);
      const blob = await res.blob();
      const file = new File([blob], "image", { type: blob.type || "image/jpeg" });

      const blurredFile = await applyBlur(file);
      const newPreview = URL.createObjectURL(blurredFile);

      const formData = new FormData();
      formData.append("file", blurredFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(data.error ?? "Falha no upload.");

      setItems((prev) =>
        prev.map((it, i) =>
          i === index
            ? {
                ...it,
                url: data.url, // versão borrada — exibida por padrão
                previewUrl: newPreview,
                isBlurred: true,
                isSensitive: true,
                originalUrl, // versão nítida — revelada só após clique do leitor
              }
            : it
        )
      );
    } catch {
      // Se falhar, mantém a imagem original sem alteração.
    } finally {
      setProcessingIndex(null);
    }
  }

  function handleUnblurImage(index: number) {
    // Desfaz o desfoque: volta a usar a URL original como exibição
    // padrão, removendo o aviso de conteúdo sensível.
    setItems((prev) =>
      prev.map((it, i) =>
        i === index && it.originalUrl
          ? { ...it, url: it.originalUrl, isBlurred: false, isSensitive: false, originalUrl: null }
          : it
      )
    );
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
        <div className="flex items-center justify-between mb-2">
          <label className="font-sans text-xs text-mute">
            Galeria de imagens {images.length > 0 && `(${images.length})`}
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={watermarkEnabled}
              onChange={(e) => setWatermarkEnabled(e.target.checked)}
              className="rounded border-ink/20 text-terracotta focus:ring-terracotta"
            />
            <span className="font-sans text-xs text-mute">Marca d&apos;água ao enviar</span>
          </label>
        </div>

        {items.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-2">
            {items.map((item, index) => {
              // Posição 1-based só entre as imagens (vídeos não contam
              // para a numeração do marcador [IMAGEM:N]).
              const imagePosition =
                item.type === "image"
                  ? items.slice(0, index + 1).filter((i) => i.type === "image").length
                  : null;

              return (
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
                  {processingIndex === index && (
                    <div className="absolute inset-0 bg-ink/60 flex items-center justify-center">
                      <span className="font-sans text-[10px] text-white">Desfocando...</span>
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
                    {item.type === "image" && item.url && (
                      <button
                        type="button"
                        onClick={() => handleBlurImage(index)}
                        disabled={processingIndex !== null}
                        title="Desfocar imagem (para cenas sensíveis)"
                        className="bg-ink/80 text-white text-[10px] w-5 h-5 rounded flex items-center justify-center hover:bg-terracotta disabled:opacity-40"
                      >
                        ◐
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
                  {item.isBlurred && (
                    <button
                      type="button"
                      onClick={() => handleUnblurImage(index)}
                      title="Desfazer desfoque (volta a mostrar nítida no painel; no site, leitor ainda precisa confirmar para ver)"
                      className="absolute top-1 left-1 bg-ink/80 text-white text-[9px] font-sans px-1.5 py-0.5 rounded hover:bg-terracotta transition-colors"
                    >
                      Desfocada ✕
                    </button>
                  )}
                  {index === 0 && item.type === "image" && (
                    <span className="absolute bottom-1 left-1 bg-terracotta text-white text-[9px] font-sans px-1.5 py-0.5 rounded">
                      Capa
                    </span>
                  )}
                  {item.type === "image" && item.url && imagePosition && imagePosition > 1 && (
                    <button
                      type="button"
                      onClick={() => handleCopyMarker(imagePosition)}
                      title="Copiar marcador para colar no texto"
                      className="absolute bottom-1 left-1 bg-ink/80 text-white text-[9px] font-sans px-1.5 py-0.5 rounded hover:bg-terracotta transition-colors"
                    >
                      {copiedIndex === imagePosition ? "Copiado!" : `Foto ${imagePosition} · copiar`}
                    </button>
                  )}
                </div>
              );
            })}
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
          A primeira imagem é usada como capa. Para inserir outra imagem no
          meio do texto, clique em <strong>&quot;Foto N · copiar&quot;</strong>{" "}
          na miniatura e cole (Ctrl+V) no ponto desejado do corpo da matéria.
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
            .map((i) => ({
              type: i.type,
              url: i.url,
              embedUrl: i.embedUrl ?? null,
              originalUrl: i.originalUrl ?? null,
              isSensitive: i.isSensitive ?? false,
            }))
        )}
      />
    </div>
  );
}
