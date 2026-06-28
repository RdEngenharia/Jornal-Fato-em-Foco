// scripts/migrate-add-ad-description.mjs
// Migração: adiciona a coluna description (texto curto opcional) na
// tabela advertisements, para anúncios que já existiam antes desse
// recurso.
// Uso: node scripts/migrate-add-ad-description.mjs

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

const { sql } = await import("@vercel/postgres");

async function main() {
  await sql`ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS description TEXT;`;
  console.log("Coluna description adicionada (ou já existia).");
}

main().catch((err) => {
  console.error("Erro na migração:", err);
  process.exit(1);
});
