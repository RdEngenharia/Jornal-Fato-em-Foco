// scripts/migrate-add-ad-fit-mode.mjs
// Migração: adiciona a coluna fit_mode na tabela advertisements, para
// controlar se a imagem do anúncio preenche o espaço cortando as
// bordas ('cover') ou se ajusta inteira sem cortar ('contain').
// Uso: node scripts/migrate-add-ad-fit-mode.mjs

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

const { sql } = await import("@vercel/postgres");

async function main() {
  await sql`ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS fit_mode TEXT NOT NULL DEFAULT 'cover';`;
  console.log("Coluna fit_mode adicionada (ou já existia).");
}

main().catch((err) => {
  console.error("Erro na migração:", err);
  process.exit(1);
});
