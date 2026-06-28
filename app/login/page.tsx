"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Falha no login.");
      }

      const destination = searchParams.get("from") ?? "/";
      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm bg-white border border-ink/10 rounded-lg p-8"
    >
      <p className="font-sans text-xs uppercase tracking-widest text-mute mb-2">
        Painel editorial
      </p>
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">
        Entrar
      </h1>

      <label className="font-sans text-xs text-mute block mb-1">Senha</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
        className="w-full font-sans text-base text-ink bg-paper border border-ink/10 rounded-md px-4 py-3 focus:border-terracotta mb-4"
      />

      {error && (
        <p className="font-sans text-sm text-terracotta-dark mb-4">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-terracotta px-6 py-3 font-sans text-sm font-medium text-white hover:bg-terracotta-dark transition-colors disabled:opacity-50"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-paper flex items-center justify-center px-6">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
