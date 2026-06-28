// scripts/migrate-ad-link-optional.mjs
// Migração: remove a restrição NOT NULL da coluna link_url na tabela
// advertisements, permitindo anúncios sem link de destino (imagem
// estática, não clicável).
// Uso: node scripts/migrate-ad-link-optional.mjs

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

const { sql } = await import("@vercel/postgres");

async function main() {
  await sql`ALTER TABLE advertisements ALTER COLUMN link_url DROP NOT NULL;`;
  console.log("Coluna link_url agora aceita valores nulos.");
}

main().catch((err) => {
  console.error("Erro na migração:", err);
  process.exit(1);
});
