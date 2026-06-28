// scripts/migrate-add-gallery.mjs
// Migração: cria a tabela article_media (galeria de imagens + vídeos
// embutidos) e migra qualquer image_url existente para o novo formato.
// Uso: node scripts/migrate-add-gallery.mjs

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

const { sql } = await import("@vercel/postgres");

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS article_media (
      id SERIAL PRIMARY KEY,
      article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
      media_type TEXT NOT NULL,
      url TEXT NOT NULL,
      embed_url TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  console.log("Tabela article_media criada (ou já existia).");

  await sql`CREATE INDEX IF NOT EXISTS idx_article_media_article_id ON article_media(article_id);`;

  // Se a coluna antiga image_url existir e tiver valores, migra cada um
  // para a nova tabela como a primeira imagem (display_order = 0).
  const { rows: hasColumn } = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'image_url';
  `;

  if (hasColumn.length > 0) {
    const { rows: existing } = await sql`
      SELECT id, image_url FROM articles WHERE image_url IS NOT NULL AND image_url != '';
    `;

    for (const row of existing) {
      await sql`
        INSERT INTO article_media (article_id, media_type, url, display_order)
        VALUES (${row.id}, 'image', ${row.image_url}, 0);
      `;
      console.log(`Migrada imagem da matéria id=${row.id}`);
    }

    console.log(`${existing.length} imagem(ns) migrada(s) para article_media.`);
  } else {
    console.log("Coluna image_url não existe (projeto novo) — nada a migrar.");
  }
}

main().catch((err) => {
  console.error("Erro na migração:", err);
  process.exit(1);
});
