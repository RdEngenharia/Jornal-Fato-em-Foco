import { sql } from "@vercel/postgres";

export type Article = {
  id: number;
  cluster_id: string;
  title: string;
  lead: string | null;
  body: string;
  category: string;
  reliability_score: number;
  status: "pending_review" | "published" | "rejected" | "archived";
  created_at: string;
  reviewed_at: string | null;
  published_at: string | null;
};

export type ArticleMedia = {
  id: number;
  article_id: number;
  media_type: "image" | "video_embed";
  url: string;
  embed_url: string | null;
  original_url: string | null;
  is_sensitive: boolean;
  display_order: number;
};

export type Source = {
  id: number;
  article_id: number;
  source_name: string;
  source_type: string;
  url: string;
  raw_excerpt: string | null;
};

export type ValidationLog = {
  id: number;
  article_id: number;
  score: number;
  confidence: string;
  contradictions: string[];
  reasoning: string | null;
  rule_based_score: number | null;
  llm_score: number | null;
};

export async function getPendingArticles(): Promise<Article[]> {
  const { rows } = await sql<Article>`
    SELECT * FROM articles
    WHERE status = 'pending_review'
    ORDER BY created_at DESC;
  `;
  return rows;
}

export async function getArticleById(id: number): Promise<Article | null> {
  const { rows } = await sql<Article>`
    SELECT * FROM articles WHERE id = ${id};
  `;
  return rows[0] ?? null;
}

export async function getSourcesByArticleId(id: number): Promise<Source[]> {
  const { rows } = await sql<Source>`
    SELECT * FROM sources WHERE article_id = ${id} ORDER BY id ASC;
  `;
  return rows;
}

export async function getValidationLogByArticleId(
  id: number
): Promise<ValidationLog | null> {
  const { rows } = await sql<ValidationLog>`
    SELECT * FROM validation_log WHERE article_id = ${id} ORDER BY id DESC LIMIT 1;
  `;
  return rows[0] ?? null;
}

export async function getMediaByArticleId(id: number): Promise<ArticleMedia[]> {
  const { rows } = await sql<ArticleMedia>`
    SELECT * FROM article_media WHERE article_id = ${id} ORDER BY display_order ASC, id ASC;
  `;
  return rows;
}

// Retorna só a primeira imagem (capa) de uma matéria — usado nos cards
// e na manchete do site público, onde só uma imagem é exibida.
export async function getCoverImageByArticleId(id: number): Promise<string | null> {
  const { rows } = await sql<{ url: string }>`
    SELECT url FROM article_media
    WHERE article_id = ${id} AND media_type = 'image'
    ORDER BY display_order ASC, id ASC
    LIMIT 1;
  `;
  return rows[0]?.url ?? null;
}

// Busca a capa de várias matérias de uma vez (evita 1 query por card na
// listagem). Retorna um mapa article_id -> url da primeira imagem.
export async function getCoverImagesForArticles(
  articleIds: number[]
): Promise<Record<number, string>> {
  if (articleIds.length === 0) return {};

  const { rows } = await sql.query(
    `SELECT DISTINCT ON (article_id) article_id, url
     FROM article_media
     WHERE article_id = ANY($1::int[]) AND media_type = 'image'
     ORDER BY article_id, display_order ASC, id ASC;`,
    [articleIds]
  );

  const map: Record<number, string> = {};
  for (const row of rows) {
    map[row.article_id] = row.url;
  }
  return map;
}

type MediaInput = {
  type: "image" | "video_embed";
  url: string;
  embedUrl?: string | null;
  originalUrl?: string | null;
  isSensitive?: boolean;
};

export async function publishArticle(
  id: number,
  editedTitle: string,
  editedLead: string,
  editedBody: string,
  category: string,
  media: MediaInput[]
) {
  await sql`
    UPDATE articles
    SET title = ${editedTitle},
        lead = ${editedLead},
        body = ${editedBody},
        category = ${category},
        status = 'published',
        reviewed_at = now(),
        published_at = now()
    WHERE id = ${id};
  `;

  // Substitui a mídia existente pela lista atual enviada no formulário,
  // simples de implementar e correto para o volume desse projeto.
  await sql`DELETE FROM article_media WHERE article_id = ${id};`;

  let order = 0;
  for (const item of media) {
    await sql`
      INSERT INTO article_media (article_id, media_type, url, embed_url, original_url, is_sensitive, display_order)
      VALUES (${id}, ${item.type}, ${item.url}, ${item.embedUrl ?? null}, ${item.originalUrl ?? null}, ${item.isSensitive ?? false}, ${order});
    `;
    order++;
  }
}

export async function rejectArticle(id: number) {
  await sql`
    UPDATE articles
    SET status = 'rejected', reviewed_at = now()
    WHERE id = ${id};
  `;
}

// Rejeita em massa todos os rascunhos pendentes criados há mais de
// `daysOld` dias — útil para limpar rascunhos que perderam relevância
// (notícia velha) sem precisar rejeitar um por um. Retorna quantos
// foram afetados.
export async function rejectOldPendingArticles(daysOld: number): Promise<number> {
  const { rowCount } = await sql`
    UPDATE articles
    SET status = 'rejected', reviewed_at = now()
    WHERE status = 'pending_review'
      AND created_at < now() - (${daysOld} || ' days')::interval;
  `;
  return rowCount ?? 0;
}

const ARTICLES_PER_PAGE = 18;

export async function getPublishedArticles(
  category?: string,
  page: number = 1
): Promise<Article[]> {
  const offset = (page - 1) * ARTICLES_PER_PAGE;

  if (category && category !== "todas") {
    const { rows } = await sql<Article>`
      SELECT * FROM articles
      WHERE status = 'published' AND category = ${category}
      ORDER BY published_at DESC
      LIMIT ${ARTICLES_PER_PAGE} OFFSET ${offset};
    `;
    return rows;
  }

  const { rows } = await sql<Article>`
    SELECT * FROM articles
    WHERE status = 'published'
    ORDER BY published_at DESC
    LIMIT ${ARTICLES_PER_PAGE} OFFSET ${offset};
  `;
  return rows;
}

export async function getPublishedArticlesCount(category?: string): Promise<number> {
  if (category && category !== "todas") {
    const { rows } = await sql<{ count: string }>`
      SELECT COUNT(*) as count FROM articles
      WHERE status = 'published' AND category = ${category};
    `;
    return Number(rows[0]?.count ?? 0);
  }

  const { rows } = await sql<{ count: string }>`
    SELECT COUNT(*) as count FROM articles WHERE status = 'published';
  `;
  return Number(rows[0]?.count ?? 0);
}

export async function getPublishedArticleById(id: number): Promise<Article | null> {
  const { rows } = await sql<Article>`
    SELECT * FROM articles WHERE id = ${id} AND status = 'published';
  `;
  return rows[0] ?? null;
}

// Remove a matéria do site público sem apagar do banco (fica arquivada,
// pode ser consultada depois se necessário).
export async function unpublishArticle(id: number) {
  await sql`
    UPDATE articles
    SET status = 'archived'
    WHERE id = ${id};
  `;
}

// Busca uma matéria publicada para fins de edição no painel admin
// (diferente de getPublishedArticleById, que é usada no site público e
// só retorna se status = 'published' — aqui queremos buscar mesmo que
// o status já tenha mudado).
export async function getArticleForAdmin(id: number): Promise<Article | null> {
  return getArticleById(id);
}

export type Advertisement = {
  id: number;
  advertiser_name: string;
  description: string | null;
  image_url: string;
  link_url: string | null;
  fit_mode: "cover" | "contain";
  slot_ids: string[];
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

export async function getAllAdvertisements(): Promise<Advertisement[]> {
  const { rows } = await sql<Advertisement>`
    SELECT * FROM advertisements ORDER BY created_at DESC;
  `;
  return rows;
}

// Busca o anúncio ativo (dentro do período vigente, se houver datas
// definidas) para um slot específico. Se houver mais de um anúncio
// cadastrado para o mesmo slot, retorna o mais recente.
export async function getActiveAdForSlot(slotId: string): Promise<Advertisement | null> {
  const { rows } = await sql<Advertisement>`
    SELECT * FROM advertisements
    WHERE active = true
      AND ${slotId} = ANY(slot_ids)
      AND (starts_at IS NULL OR starts_at <= now())
      AND (ends_at IS NULL OR ends_at >= now())
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  return rows[0] ?? null;
}

export async function createAdvertisement(input: {
  advertiserName: string;
  description?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  fitMode?: "cover" | "contain";
  slotIds: string[];
  startsAt?: string | null;
  endsAt?: string | null;
}): Promise<number> {
  const { rows } = await sql.query(
    `INSERT INTO advertisements (advertiser_name, description, image_url, link_url, fit_mode, slot_ids, starts_at, ends_at)
     VALUES ($1, $2, $3, $4, $5, $6::text[], $7, $8)
     RETURNING id;`,
    [
      input.advertiserName,
      input.description ?? null,
      input.imageUrl,
      input.linkUrl ?? null,
      input.fitMode ?? "cover",
      input.slotIds,
      input.startsAt ?? null,
      input.endsAt ?? null,
    ]
  );
  return rows[0].id;
}

export async function toggleAdvertisement(id: number, active: boolean) {
  await sql`UPDATE advertisements SET active = ${active} WHERE id = ${id};`;
}

export async function updateAdvertisement(
  id: number,
  input: {
    advertiserName: string;
    description?: string | null;
    imageUrl: string;
    linkUrl?: string | null;
    fitMode?: "cover" | "contain";
    slotIds: string[];
    startsAt?: string | null;
    endsAt?: string | null;
  }
) {
  await sql.query(
    `UPDATE advertisements
     SET advertiser_name = $1, description = $2, image_url = $3, link_url = $4,
         fit_mode = $5, slot_ids = $6::text[], starts_at = $7, ends_at = $8
     WHERE id = $9;`,
    [
      input.advertiserName,
      input.description ?? null,
      input.imageUrl,
      input.linkUrl ?? null,
      input.fitMode ?? "cover",
      input.slotIds,
      input.startsAt ?? null,
      input.endsAt ?? null,
      id,
    ]
  );
}

export async function getAdvertisementById(id: number): Promise<Advertisement | null> {
  const { rows } = await sql<Advertisement>`SELECT * FROM advertisements WHERE id = ${id};`;
  return rows[0] ?? null;
}

export async function deleteAdvertisement(id: number) {
  await sql`DELETE FROM advertisements WHERE id = ${id};`;
}

// Configurações gerais do site (chave-valor), editáveis pelo painel.
export async function getSetting(key: string): Promise<string | null> {
  const { rows } = await sql<{ value: string }>`
    SELECT value FROM site_settings WHERE key = ${key};
  `;
  return rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  await sql`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES (${key}, ${value}, now())
    ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = now();
  `;
}

export async function getWhatsAppNumber(): Promise<string> {
  // Fallback para o número original, caso a configuração ainda não
  // tenha sido criada (ex: banco recém-migrado).
  return (await getSetting("whatsapp_number")) ?? "5573991317853";
}
