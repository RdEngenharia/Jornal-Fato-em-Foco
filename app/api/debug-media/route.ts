import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

// Rota de diagnóstico TEMPORÁRIA. Remover depois de identificar a causa
// do problema de mídia não aparecendo nas matérias.
// Uso: GET /api/debug-media?id=77
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Parâmetro id ausente." }, { status: 400 });
  }

  try {
    const articleResult = await sql`SELECT id, title, status FROM articles WHERE id = ${id};`;
    const mediaResult = await sql`SELECT * FROM article_media WHERE article_id = ${id} ORDER BY display_order ASC;`;

    return NextResponse.json({
      article: articleResult.rows[0] ?? null,
      media: mediaResult.rows,
      mediaCount: mediaResult.rows.length,
      env: {
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        postgresHost: process.env.POSTGRES_URL?.match(/@([^/]+)\//)?.[1] ?? "não encontrado",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
