// scripts/migrate-rename-negocios-economia.mjs
// Migração: renomeia a categoria "negocios" para "economia" em todas
// as matérias já existentes no banco (publicadas ou rascunhos),
// mantendo consistência com a renomeação feita no código.
// Uso: node scripts/migrate-rename-negocios-economia.mjs

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

const { sql } = await import("@vercel/postgres");

async function main() {
  const { rowCount } = await sql`
    UPDATE articles SET category = 'economia' WHERE category = 'negocios';
  `;
  console.log(`${rowCount ?? 0} matéria(s) atualizada(s) de "negocios" para "economia".`);
}

main().catch((err) => {
  console.error("Erro na migração:", err);
  process.exit(1);
});
