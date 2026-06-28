// scripts/debug-check-media.mjs
// Script de diagnóstico: consulta diretamente o banco para confirmar
// se as imagens de uma matéria específica foram gravadas na tabela
// article_media. Uso: node scripts/debug-check-media.mjs 77

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

const { sql } = await import("@vercel/postgres");

const articleId = process.argv[2];

if (!articleId) {
  console.error("Uso: node scripts/debug-check-media.mjs <id_da_materia>");
  process.exit(1);
}

async function main() {
  console.log(`\n🔍 Consultando matéria id=${articleId}...\n`);

  const { rows: articleRows } = await sql`
    SELECT id, title, status FROM articles WHERE id = ${articleId};
  `;
  console.log("📄 Matéria:", articleRows[0] ?? "NÃO ENCONTRADA");

  const { rows: mediaRows } = await sql`
    SELECT * FROM article_media WHERE article_id = ${articleId} ORDER BY display_order ASC;
  `;
  console.log(`\n🖼️  Mídia encontrada (${mediaRows.length} item(ns)):`);
  console.log(JSON.stringify(mediaRows, null, 2));
}

main().catch((err) => {
  console.error("Erro na consulta:", err);
  process.exit(1);
});
