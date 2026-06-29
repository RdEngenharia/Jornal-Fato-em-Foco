// scripts/migrate-add-settings.mjs
// Migração: cria a tabela site_settings (configurações gerais editáveis
// pelo painel admin) e popula com o número de WhatsApp atual como
// valor inicial.
// Uso: node scripts/migrate-add-settings.mjs

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

const { sql } = await import("@vercel/postgres");

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  // Valor inicial: o número de WhatsApp já usado até agora no código.
  // Só insere se a chave ainda não existir, para não sobrescrever caso
  // a migração seja rodada de novo.
  await sql`
    INSERT INTO site_settings (key, value)
    VALUES ('whatsapp_number', '5573991317853')
    ON CONFLICT (key) DO NOTHING;
  `;

  console.log("Tabela site_settings criada e número de WhatsApp inicial configurado.");
}

main().catch((err) => {
  console.error("Erro na migração:", err);
  process.exit(1);
});
