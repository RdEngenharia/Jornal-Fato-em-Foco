import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { sql } from "@vercel/postgres";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const VALID_CATEGORIES = ["geral", "politica", "justica", "negocios", "policia", "cultura", "esporte", "saude", "turismo"];

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Nenhum arquivo de áudio enviado." }, { status: 400 });
  }

  const maxSizeBytes = 24 * 1024 * 1024; // 24MB (limite do Whisper free tier é 25MB)
  if (file.size > maxSizeBytes) {
    return NextResponse.json(
      { error: "Áudio muito grande. Limite de 24MB." },
      { status: 400 }
    );
  }

  try {
    // 1) Transcrição do áudio via Whisper (Groq).
    const transcription = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
      language: "pt",
      response_format: "text",
    });

    const transcribedText = String(transcription).trim();

    if (!transcribedText || transcribedText.length < 10) {
      return NextResponse.json(
        { error: "Não foi possível transcrever um conteúdo útil deste áudio." },
        { status: 400 }
      );
    }

    // 2) Redação do rascunho a partir do texto transcrito. Como esta é
    // uma fonte única (relato de ouvinte via áudio, sem cruzamento com
    // outras fontes), o prompt pede ao Redator para tratar isso como
    // um relato a ser apurado, não como fato já confirmado — refletido
    // no texto e no score de confiabilidade mais conservador abaixo.
    const prompt = `Você é redator de um jornal local digital do extremo sul da Bahia (Porto Seguro, Eunápolis, Trancoso, Arraial d'Ajuda, Costa do Descobrimento e região).

Você recebeu um ÁUDIO transcrito de um morador/ouvinte relatando algo que está acontecendo na região. Isso é uma DENÚNCIA OU RELATO NÃO APURADO, não uma fonte jornalística confirmada.

Transcrição do áudio:
"""
${transcribedText}
"""

Escreva um rascunho de matéria que:
- Trate o conteúdo como relato a ser apurado, não como fato 100% confirmado (use expressões como "segundo relato de um morador", "moradores relatam que", etc.)
- Seja objetivo e claro, sem sensacionalismo
- Não invente detalhes que não estejam na transcrição
- Sinalize claramente, no corpo do texto, que a informação ainda carece de confirmação oficial, quando aplicável

Categorias válidas: ${VALID_CATEGORIES.join(", ")}.

Responda SOMENTE com um JSON válido no formato:
{"title": "<título da matéria>", "lead": "<linha de resumo, 1-2 frases>", "body": "<corpo completo do rascunho, 2-4 parágrafos>", "category": "<uma das categorias válidas>"}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });

    const rawContent = completion.choices[0].message.content;
    let article;
    try {
      article = JSON.parse(rawContent ?? "{}");
    } catch {
      return NextResponse.json(
        { error: "Falha ao gerar o rascunho a partir da transcrição." },
        { status: 500 }
      );
    }

    if (!VALID_CATEGORIES.includes(article.category)) {
      article.category = "geral";
    }

    // 3) Salva como rascunho pendente — score conservador (40), abaixo
    // do threshold automático, porque é relato de uma única fonte não
    // verificada. Aparece na lista de revisão para você decidir.
    const clusterId = `audio-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const { rows } = await sql`
      INSERT INTO articles (cluster_id, title, lead, body, category, reliability_score, status)
      VALUES (${clusterId}, ${article.title}, ${article.lead}, ${article.body}, ${article.category}, 40, 'pending_review')
      RETURNING id;
    `;
    const articleId = rows[0].id;

    await sql`
      INSERT INTO sources (article_id, source_name, source_type, url, raw_excerpt)
      VALUES (${articleId}, 'Áudio enviado por ouvinte (WhatsApp)', 'outro', '', ${transcribedText});
    `;

    await sql`
      INSERT INTO validation_log (article_id, score, confidence, contradictions, reasoning, rule_based_score, llm_score)
      VALUES (${articleId}, 40, 'baixa', '[]', 'Relato de fonte única via áudio, não apurado por outras fontes. Revisão humana obrigatória antes de publicar.', 0, 40);
    `;

    return NextResponse.json({ articleId, transcription: transcribedText });
  } catch (err) {
    console.error("Erro ao processar áudio:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro desconhecido ao processar áudio." },
      { status: 500 }
    );
  }
}
