"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AudioUploadCard() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStatus("uploading");
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/audio-to-article", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Falha ao processar áudio.");

      // Leva direto para a tela de revisão do rascunho recém-criado.
      router.push(`/admin/review/${data.articleId}`);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      e.target.value = "";
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-sage/40 bg-sage/5 p-5">
      <h3 className="font-display text-base font-semibold text-ink mb-1">
        Criar rascunho a partir de áudio
      </h3>
      <p className="font-sans text-xs text-mute mb-3">
        Recebeu um áudio de WhatsApp com um relato sobre algo na região?
        Suba aqui — o sistema transcreve e já gera um rascunho para você
        revisar e apurar antes de publicar.
      </p>

      <label className="flex items-center justify-center w-full h-12 border border-dashed border-sage/50 rounded-md cursor-pointer hover:border-sage transition-colors bg-white">
        <span className="font-sans text-sm text-sage font-medium">
          {status === "uploading"
            ? `Transcrevendo${fileName ? ` "${fileName}"` : ""}...`
            : "+ Enviar áudio (.ogg, .mp3, .m4a)"}
        </span>
        <input
          type="file"
          accept="audio/*"
          className="hidden"
          disabled={status === "uploading"}
          onChange={handleFileChange}
        />
      </label>

      {status === "error" && (
        <p className="font-sans text-xs text-terracotta-dark mt-2">{errorMessage}</p>
      )}
    </div>
  );
}
