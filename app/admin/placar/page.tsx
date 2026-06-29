import Link from "next/link";
import { getAllFeaturedScores } from "@/lib/db";
import { createScoreAction, updateScoreAction, toggleScoreAction, deleteScoreAction } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendado",
  live: "Ao vivo",
  finished: "Finalizado",
};

export default async function ScoreAdminPage({
  searchParams,
}: {
  searchParams: { created?: string; updated?: string; deleted?: string; error?: string };
}) {
  const scores = await getAllFeaturedScores();

  return (
    <main className="min-h-screen bg-paper px-6 py-10 sm:px-10">
      <header className="mx-auto max-w-2xl mb-8">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl font-semibold text-ink">Placar em destaque</h1>
          <Link
            href="/admin"
            className="font-sans text-sm text-mute hover:text-terracotta transition-colors underline"
          >
            ← Painel
          </Link>
        </div>
        <p className="font-sans text-sm text-mute mt-2">
          Card exibido no cabeçalho do site quando ativo. Use para jogos
          pontuais relevantes (seleção brasileira, Copa do Mundo, etc) —
          atualize manualmente conforme o jogo evolui.
        </p>
      </header>

      <div className="mx-auto max-w-2xl space-y-6">
        {searchParams.error === "times_obrigatorios" && (
          <div className="rounded-md bg-terracotta/10 border border-terracotta/30 px-4 py-3">
            <p className="font-sans text-sm text-terracotta-dark">
              Preencha o nome dos dois times.
            </p>
          </div>
        )}
        {(searchParams.created || searchParams.updated || searchParams.deleted) && (
          <div className="rounded-md bg-sage/10 border border-sage/30 px-4 py-3">
            <p className="font-sans text-sm text-sage">Salvo com sucesso.</p>
          </div>
        )}

        <form action={createScoreAction} className="rounded-lg border border-ink/10 bg-white p-5 space-y-3">
          <h3 className="font-display text-lg font-semibold text-ink">Novo placar</h3>

          <div>
            <label className="font-sans text-xs text-mute block mb-1">
              Competição (opcional)
            </label>
            <input
              name="competition"
              placeholder="Ex: Copa do Mundo 2026"
              className="w-full font-sans text-sm bg-paper border border-ink/10 rounded-md px-3 py-2 focus:border-terracotta"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-sans text-xs text-mute block mb-1">Time da casa</label>
              <input
                name="teamHome"
                required
                placeholder="Brasil"
                className="w-full font-sans text-sm bg-paper border border-ink/10 rounded-md px-3 py-2 focus:border-terracotta"
              />
            </div>
            <div>
              <label className="font-sans text-xs text-mute block mb-1">Time visitante</label>
              <input
                name="teamAway"
                required
                placeholder="Japão"
                className="w-full font-sans text-sm bg-paper border border-ink/10 rounded-md px-3 py-2 focus:border-terracotta"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-sans text-xs text-mute block mb-1">
                Gols casa (deixe vazio se ainda não começou)
              </label>
              <input
                name="scoreHome"
                type="number"
                min="0"
                placeholder="0"
                className="w-full font-sans text-sm bg-paper border border-ink/10 rounded-md px-3 py-2 focus:border-terracotta"
              />
            </div>
            <div>
              <label className="font-sans text-xs text-mute block mb-1">Gols visitante</label>
              <input
                name="scoreAway"
                type="number"
                min="0"
                placeholder="0"
                className="w-full font-sans text-sm bg-paper border border-ink/10 rounded-md px-3 py-2 focus:border-terracotta"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-sans text-xs text-mute block mb-1">Status</label>
              <select
                name="status"
                defaultValue="scheduled"
                className="w-full font-sans text-sm bg-paper border border-ink/10 rounded-md px-3 py-2 focus:border-terracotta"
              >
                <option value="scheduled">Agendado (ainda não começou)</option>
                <option value="live">Ao vivo</option>
                <option value="finished">Finalizado</option>
              </select>
            </div>
            <div>
              <label className="font-sans text-xs text-mute block mb-1">
                Texto de horário/tempo (opcional)
              </label>
              <input
                name="matchTime"
                placeholder="Hoje, 16h ou 2º tempo"
                className="w-full font-sans text-sm bg-paper border border-ink/10 rounded-md px-3 py-2 focus:border-terracotta"
              />
            </div>
          </div>

          <button
            type="submit"
            className="rounded-md bg-terracotta px-5 py-2.5 font-sans text-sm font-medium text-white hover:bg-terracotta-dark transition-colors"
          >
            Criar placar
          </button>
        </form>

        <div className="space-y-3">
          {scores.length === 0 && (
            <p className="font-sans text-sm text-mute text-center py-6">
              Nenhum placar cadastrado ainda.
            </p>
          )}

          {scores.map((score) => (
            <div key={score.id} className="rounded-lg border border-ink/10 bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  {score.competition && (
                    <p className="font-sans text-[11px] text-mute uppercase tracking-wide">
                      {score.competition}
                    </p>
                  )}
                  <p className="font-display text-lg font-semibold text-ink">
                    {score.team_home} {score.score_home ?? "-"} x {score.score_away ?? "-"} {score.team_away}
                  </p>
                  <p className="font-sans text-xs text-mute">
                    {STATUS_LABELS[score.status]}
                    {score.match_time && ` · ${score.match_time}`}
                  </p>
                </div>
                <span
                  className={`font-sans text-[10px] px-2 py-1 rounded-full ${
                    score.active ? "bg-sage/15 text-sage" : "bg-mute/15 text-mute"
                  }`}
                >
                  {score.active ? "Ativo no site" : "Inativo"}
                </span>
              </div>

              <details className="mb-2">
                <summary className="font-sans text-xs text-terracotta cursor-pointer">
                  Editar placar
                </summary>
                <form action={updateScoreAction} className="mt-3 space-y-2">
                  <input type="hidden" name="id" value={score.id} />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      name="teamHome"
                      defaultValue={score.team_home}
                      className="font-sans text-sm bg-paper border border-ink/10 rounded-md px-2 py-1.5"
                    />
                    <input
                      name="teamAway"
                      defaultValue={score.team_away}
                      className="font-sans text-sm bg-paper border border-ink/10 rounded-md px-2 py-1.5"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      name="scoreHome"
                      type="number"
                      min="0"
                      defaultValue={score.score_home ?? ""}
                      placeholder="Gols casa"
                      className="font-sans text-sm bg-paper border border-ink/10 rounded-md px-2 py-1.5"
                    />
                    <input
                      name="scoreAway"
                      type="number"
                      min="0"
                      defaultValue={score.score_away ?? ""}
                      placeholder="Gols visitante"
                      className="font-sans text-sm bg-paper border border-ink/10 rounded-md px-2 py-1.5"
                    />
                  </div>
                  <input
                    name="competition"
                    defaultValue={score.competition ?? ""}
                    placeholder="Competição"
                    className="w-full font-sans text-sm bg-paper border border-ink/10 rounded-md px-2 py-1.5"
                  />
                  <select
                    name="status"
                    defaultValue={score.status}
                    className="w-full font-sans text-sm bg-paper border border-ink/10 rounded-md px-2 py-1.5"
                  >
                    <option value="scheduled">Agendado</option>
                    <option value="live">Ao vivo</option>
                    <option value="finished">Finalizado</option>
                  </select>
                  <input
                    name="matchTime"
                    defaultValue={score.match_time ?? ""}
                    placeholder="Texto de horário/tempo"
                    className="w-full font-sans text-sm bg-paper border border-ink/10 rounded-md px-2 py-1.5"
                  />
                  <button
                    type="submit"
                    className="font-sans text-xs bg-terracotta text-white px-3 py-1.5 rounded-md hover:bg-terracotta-dark transition-colors"
                  >
                    Salvar atualização
                  </button>
                </form>
              </details>

              <div className="flex items-center gap-2">
                <form action={toggleScoreAction}>
                  <input type="hidden" name="id" value={score.id} />
                  <input type="hidden" name="active" value={(!score.active).toString()} />
                  <button
                    type="submit"
                    className="font-sans text-xs px-3 py-1.5 rounded-md border border-ink/15 text-ink hover:bg-ink/5 transition-colors"
                  >
                    {score.active ? "Desativar" : "Ativar"}
                  </button>
                </form>
                <form action={deleteScoreAction}>
                  <input type="hidden" name="id" value={score.id} />
                  <button
                    type="submit"
                    className="font-sans text-xs px-3 py-1.5 rounded-md border border-terracotta/30 text-terracotta-dark hover:bg-terracotta/10 transition-colors"
                  >
                    Remover
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
