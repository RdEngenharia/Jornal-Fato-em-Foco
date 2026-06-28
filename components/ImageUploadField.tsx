"use client";

import { useState } from "react";

type Props = {
  initialUrl?: string | null;
};

export default function ImageUploadField({ initialUrl }: Props) {
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(initialUrl ?? null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setErrorMessage(null);
    setPreview(URL.createObjectURL(file));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Falha no upload.");
      }

      setUploadedUrl(data.url);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Erro desconhecido.");
    }
  }

  function handleRemove() {
    setPreview(null);
    setUploadedUrl(null);
    setStatus("idle");
  }

  return (
    <div>
      <label className="font-sans text-xs text-mute block mb-2">
        Imagem de destaque
      </label>

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Pré-visualização da imagem"
            className="w-full h-56 object-cover rounded-md border border-ink/10"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 rounded-md bg-ink/80 text-white text-xs px-3 py-1.5 font-sans hover:bg-ink transition-colors"
          >
            Remover
          </button>
          {status === "uploading" && (
            <div className="absolute inset-0 bg-ink/40 rounded-md flex items-center justify-center">
              <span className="font-sans text-sm text-white">Enviando...</span>
            </div>
          )}
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-40 border border-dashed border-mute/40 rounded-md cursor-pointer hover:border-terracotta/50 transition-colors bg-white">
          <span className="font-sans text-sm text-mute">
            Clique para escolher uma imagem
          </span>
          <span className="font-sans text-xs text-mute/70 mt-1">
            JPG, PNG ou WEBP — até 8MB
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      )}

      {status === "error" && (
        <p className="font-sans text-xs text-terracotta-dark mt-2">{errorMessage}</p>
      )}

      {/* Campo oculto que vai junto com o submit do formulário de publicação */}
      <input type="hidden" name="imageUrl" value={uploadedUrl ?? ""} />
    </div>
  );
}
