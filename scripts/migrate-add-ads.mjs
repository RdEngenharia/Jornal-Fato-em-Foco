// scripts/migrate-add-ads.mjs
// Migração: cria a tabela advertisements, usada para anúncios vendidos
// diretamente a empresas (espaço pago fixo mensal), exibidos nos
// AdSlots do site.
// Uso: node scripts/migrate-add-ads.mjs

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

const { sql } = await import("@vercel/postgres");

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS advertisements (
      id SERIAL PRIMARY KEY,
      advertiser_name TEXT NOT NULL,
      image_url TEXT NOT NULL,
      link_url TEXT NOT NULL,
      slot_ids TEXT[] NOT NULL,
      active BOOLEAN NOT NULL DEFAULT true,
      starts_at TIMESTAMPTZ,
      ends_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_advertisements_active ON advertisements(active);`;
  console.log("Tabela advertisements criada (ou já existia).");
}

main().catch((err) => {
  console.error("Erro na migração:", err);
  process.exit(1);
});
