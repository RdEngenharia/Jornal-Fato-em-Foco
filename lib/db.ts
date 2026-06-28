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

export async function publishArticle(
  id: number,
  editedTitle: string,
  editedLead: string,
  editedBody: string
) {
  await sql`
    UPDATE articles
    SET title = ${editedTitle},
        lead = ${editedLead},
        body = ${editedBody},
        status = 'published',
        reviewed_at = now(),
        published_at = now()
    WHERE id = ${id};
  `;
}

export async function rejectArticle(id: number) {
  await sql`
    UPDATE articles
    SET status = 'rejected', reviewed_at = now()
    WHERE id = ${id};
  `;
}

export async function getPublishedArticles(): Promise<Article[]> {
  const { rows } = await sql<Article>`
    SELECT * FROM articles
    WHERE status = 'published'
    ORDER BY published_at DESC;
  `;
  return rows;
}
