// scripts/init-db.mjs
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

const { sql } = await import("@vercel/postgres");
const { readFileSync } = await import("fs");

async function main() {
  const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8");
  const statements = schema.split(";").map((s) => s.trim()).filter((s) => s.length > 0);
  for (const statement of statements) {
    console.log(`Executando: ${statement.slice(0, 60)}...`);
    await sql.query(statement);
  }
  console.log("Schema aplicado com sucesso.");
}

main().catch((err) => {
  console.error("Erro ao aplicar schema:", err);
  process.exit(1);
});
