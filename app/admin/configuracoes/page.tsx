import Link from "next/link";
import { getWhatsAppNumber } from "@/lib/db";
import { updateWhatsAppAction } from "./actions";

export const dynamic = "force-dynamic";

function formatBrazilianPhone(digits: string): string {
  // Espera formato 55 + DDD (2) + número (8 ou 9 dígitos), ex: 5573991317853
  const withoutCountry = digits.startsWith("55") ? digits.slice(2) : digits;
  const ddd = withoutCountry.slice(0, 2);
  const rest = withoutCountry.slice(2);
  if (rest.length === 9) {
    return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
  }
  return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { updated?: string; error?: string };
}) {
  const currentNumber = await getWhatsAppNumber();

  return (
    <main className="min-h-screen bg-paper px-6 py-10 sm:px-10">
      <header className="mx-auto max-w-2xl mb-8">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl font-semibold text-ink">Configurações</h1>
          <Link
            href="/admin"
            className="font-sans text-sm text-mute hover:text-terracotta transition-colors underline"
          >
            ← Painel
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-6">
        {searchParams.updated && (
          <div className="rounded-md bg-sage/10 border border-sage/30 px-4 py-3">
            <p className="font-sans text-sm text-sage">Número atualizado com sucesso.</p>
          </div>
        )}
        {searchParams.error === "numero_invalido" && (
          <div className="rounded-md bg-terracotta/10 border border-terracotta/30 px-4 py-3">
            <p className="font-sans text-sm text-terracotta-dark">
              Número inválido. Use o formato com DDD, ex: (73) 99131-7853.
            </p>
          </div>
        )}

        <form action={updateWhatsAppAction} className="rounded-lg border border-ink/10 bg-white p-5 space-y-3">
          <h3 className="font-display text-lg font-semibold text-ink">
            WhatsApp principal do jornal
          </h3>
          <p className="font-sans text-xs text-mute">
            Usado no botão de sugestões da home, nas matérias, e na página
            Sobre. Atual: <strong>{formatBrazilianPhone(currentNumber)}</strong>
          </p>

          <div>
            <label className="font-sans text-xs text-mute block mb-1">Novo número (com DDD)</label>
            <input
              name="whatsappNumber"
              required
              defaultValue={formatBrazilianPhone(currentNumber)}
              placeholder="(73) 99131-7853"
              className="w-full font-sans text-sm bg-paper border border-ink/10 rounded-md px-3 py-2 focus:border-terracotta"
            />
            <p className="font-sans text-[11px] text-mute/70 mt-1">
              Pode digitar com ou sem formatação — o sistema ajusta
              automaticamente. Sempre considera DDD + Brasil (+55).
            </p>
          </div>

          <button
            type="submit"
            className="rounded-md bg-terracotta px-5 py-2.5 font-sans text-sm font-medium text-white hover:bg-terracotta-dark transition-colors"
          >
            Salvar número
          </button>
        </form>
      </div>
    </main>
  );
}
