// scripts/init-db.mjs
// Roda o schema.sql contra o banco Postgres conectado via variáveis de ambiente
// da Vercel (POSTGRES_URL). Uso: npm run db:init

import { sql } from "@vercel/postgres";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8");

  // Vercel Postgres não aceita múltiplos statements numa única chamada,
  // então separamos por ponto-e-vírgula e executamos um a um.
  const statements = schema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    console.log(`Executando: ${statement.slice(0, 60)}...`);
    await sql.query(statement);
  }

  console.log("✅ Schema aplicado com sucesso.");
}

main().catch((err) => {
  console.error("❌ Erro ao aplicar schema:", err);
  process.exit(1);
});
