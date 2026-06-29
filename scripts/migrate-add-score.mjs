// scripts/migrate-add-score.mjs
// Migração: cria a tabela featured_score, usada para o card de placar
// em destaque no cabeçalho do site, atualizado manualmente pelo painel.
// Uso: node scripts/migrate-add-score.mjs

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

const { sql } = await import("@vercel/postgres");

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS featured_score (
      id SERIAL PRIMARY KEY,
      competition TEXT,
      team_home TEXT NOT NULL,
      team_away TEXT NOT NULL,
      score_home INTEGER,
      score_away INTEGER,
      status TEXT NOT NULL DEFAULT 'scheduled',
      match_time TEXT,
      active BOOLEAN NOT NULL DEFAULT true,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  console.log("Tabela featured_score criada (ou já existia).");
}

main().catch((err) => {
  console.error("Erro na migração:", err);
  process.exit(1);
});
