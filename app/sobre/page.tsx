import Link from "next/link";

export const dynamic = "force-dynamic";

export default function SobrePage() {
  return (
    <main className="min-h-screen bg-paper">
      <header className="sticky top-0 z-10 bg-paper/95 backdrop-blur-sm border-b border-ink/10 px-5 py-4 sm:px-10">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <Link href="/noticias" className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-terracotta" />
            <h1 className="font-display text-2xl font-extrabold text-ink tracking-tight">
              Fato em Foco
            </h1>
          </Link>
          <p className="hidden sm:block font-sans text-xs font-medium uppercase tracking-widest text-mute">
            Porto Seguro · Costa do Descobrimento
          </p>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-12 sm:px-10">
        <Link
          href="/noticias"
          className="font-sans text-sm text-mute hover:text-terracotta transition-colors"
        >
          ← Voltar para as notícias
        </Link>

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink leading-tight mt-6 mb-8">
          Sobre o Fato em Foco
        </h1>

        <div className="space-y-8 font-sans text-base text-ink/85 leading-relaxed">
          <section>
            <h2 className="font-display text-xl font-semibold text-ink mb-3">
              Quem somos
            </h2>
            <p>
              O Fato em Foco é um projeto pessoal de cobertura jornalística do
              extremo sul da Bahia — Porto Seguro, Eunápolis, Trancoso, Arraial
              d&apos;Ajuda e a Costa do Descobrimento. O veículo é mantido e
              editado por <strong>Jonatan Rodrigues</strong>, responsável pela
              curadoria e revisão final de todo o conteúdo publicado.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink mb-3">
              Como produzimos as matérias
            </h2>
            <p className="mb-3">
              O Fato em Foco acompanha portais de notícia regionais e fontes
              institucionais — como o Sebrae e órgãos públicos — para apurar o
              que está acontecendo no extremo sul da Bahia. Em linhas gerais,
              o processo editorial segue estas etapas:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-1">
              <li>
                Acompanhamos diferentes fontes regionais e institucionais em
                busca de fatos relevantes para a região.
              </li>
              <li>
                Cruzamos as informações entre fontes para avaliar a
                consistência de cada notícia antes de publicá-la.
              </li>
              <li>
                As matérias são escritas com base no que as fontes informam,
                sempre citando a origem da informação no texto.
              </li>
              <li>
                Toda matéria passa por revisão editorial antes de ser
                publicada — nada vai ao ar sem essa checagem final.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink mb-3">
              Correções e contato
            </h2>
            <p>
              Encontrou uma informação incorreta ou imprecisa em alguma
              matéria? Quer sugerir uma pauta ou enviar uma informação para
              apuração? Entre em contato:
            </p>
            <p className="mt-3 space-y-1">
              <a
                href="mailto:rodrigues.solar@hotmail.com"
                className="text-terracotta hover:underline font-medium block"
              >
                rodrigues.solar@hotmail.com
              </a>
              <a
                href="https://wa.me/5573991317853"
                target="_blank"
                rel="noopener noreferrer"
                className="text-terracotta hover:underline font-medium block"
              >
                WhatsApp: (73) 99131-7853
              </a>
            </p>
          </section>
        </div>
      </article>

      <footer className="border-t border-ink/10 px-5 py-8 sm:px-10 mt-10">
        <p className="mx-auto max-w-3xl font-sans text-xs text-mute">
          Fato em Foco — conteúdo apurado a partir de fontes públicas e
          portais regionais, com revisão editorial antes da publicação.
        </p>
      </footer>
    </main>
  );
}
