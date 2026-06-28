// scripts/migrate-add-image.mjs
// Migração pontual: adiciona a coluna image_url na tabela articles,
// para projetos que já rodaram db:init antes dessa funcionalidade existir.
// Uso: node scripts/migrate-add-image.mjs

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

const { sql } = await import("@vercel/postgres");

async function main() {
  await sql`ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_url TEXT;`;
  console.log("Coluna image_url adicionada (ou já existia).");
}

main().catch((err) => {
  console.error("Erro na migração:", err);
  process.exit(1);
});
