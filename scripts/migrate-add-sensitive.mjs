// scripts/migrate-add-sensitive.mjs
// Migração: adiciona as colunas original_url e is_sensitive na tabela
// article_media, para suportar o recurso de "conteúdo sensível, clique
// para visualizar" no site público.
// Uso: node scripts/migrate-add-sensitive.mjs

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

const { sql } = await import("@vercel/postgres");

async function main() {
  await sql`ALTER TABLE article_media ADD COLUMN IF NOT EXISTS original_url TEXT;`;
  await sql`ALTER TABLE article_media ADD COLUMN IF NOT EXISTS is_sensitive BOOLEAN NOT NULL DEFAULT false;`;
  console.log("Colunas original_url e is_sensitive adicionadas (ou já existiam).");
}

main().catch((err) => {
  console.error("Erro na migração:", err);
  process.exit(1);
});
