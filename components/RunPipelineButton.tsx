"use client";

import { useState } from "react";

export default function RunPipelineButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleClick() {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/run-pipeline", { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Falha ao disparar o pipeline.");

      setStatus("success");
      setTimeout(() => setStatus("idle"), 4000);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Erro desconhecido.");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "loading"}
        className="font-sans text-sm font-medium border border-ink/15 text-ink px-4 py-2 rounded-md hover:bg-ink/5 transition-colors disabled:opacity-50"
      >
        {status === "loading" ? "Disparando..." : "🔄 Rodar pipeline agora"}
      </button>
      {status === "success" && (
        <p className="font-sans text-xs text-sage mt-1.5">
          Pipeline disparado! Os novos rascunhos aparecem aqui em 1-2 minutos.
        </p>
      )}
      {status === "error" && (
        <p className="font-sans text-xs text-terracotta-dark mt-1.5">{errorMessage}</p>
      )}
    </div>
  );
}
