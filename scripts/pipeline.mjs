// scripts/pipeline.mjs
// Pipeline completo: Scraper (RSS) -> Validador (Groq, classificador) ->
// Redator (Groq, gerador) -> Persistência (Vercel Postgres)
//
// Roda via: npm run pipeline
// Em produção, é disparado por um workflow do GitHub Actions agendado.

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Carrega o .env.local da raiz do projeto quando rodado localmente.
// No GitHub Actions, as variáveis já vêm injetadas via `env:` no workflow,
// então esse arquivo simplesmente não existe ali — e está tudo bem, dotenv
// não quebra se o arquivo não for encontrado.
config({ path: join(__dirname, "..", ".env.local") });

const Parser = (await import("rss-parser")).default;
const Groq = (await import("groq-sdk")).default;
const { sql } = await import("@vercel/postgres");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const parser = new Parser();

// ----------------------------------------------------------------
// 1) CONFIGURAÇÃO DE FONTES
// Fontes da região de Porto Seguro/BA (Costa do Descobrimento).
// Adicione mais conforme for confirmando outros feeds que funcionam.
// ----------------------------------------------------------------
const FEEDS = [
  {
    name: "Radar News",
    type: "portal_regional",
    url: "https://radar.news/feed/",
  },
  {
    name: "Namidia News",
    type: "portal_regional",
    url: "https://namidia.news/feed/",
  },
  {
    name: "Hoje Bahia - Municípios",
    type: "portal_regional",
    url: "https://hojebahia.com.br/feed/19/municipios/",
  },
];

const RELIABILITY_THRESHOLD = 70; // matérias abaixo disso não vão para o Redator

// ----------------------------------------------------------------
// 2) SCRAPER — coleta e normaliza itens de todos os feeds
// ----------------------------------------------------------------
async function collectFeeds() {
  const allItems = [];

  for (const feed of FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      for (const item of parsed.items) {
        allItems.push({
          sourceName: feed.name,
          sourceType: feed.type,
          title: item.title ?? "(sem título)",
          excerpt: item.contentSnippet ?? item.content ?? "",
          url: item.link ?? "",
          publishedAt: item.pubDate ?? new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn(`⚠️  Falha ao ler feed "${feed.name}":`, err.message);
    }
  }

  return allItems;
}

// ----------------------------------------------------------------
// 3) CLUSTERING simples — agrupa itens que parecem ser o mesmo evento
// Versão de teste: agrupa por similaridade de título (Jaccard simples).
// Numa v2, troque por embeddings.
// ----------------------------------------------------------------
function similarity(a, b) {
  const setA = new Set(a.toLowerCase().split(/\s+/));
  const setB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = new Set([...setA].filter((w) => setB.has(w)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

function clusterItems(items) {
  const clusters = [];

  for (const item of items) {
    let placed = false;
    for (const cluster of clusters) {
      if (similarity(item.title, cluster[0].title) > 0.3) {
        cluster.push(item);
        placed = true;
        break;
      }
    }
    if (!placed) clusters.push([item]);
  }

  return clusters;
}

// ----------------------------------------------------------------
// 4) VALIDADOR — LLM como classificador (schema JSON forçado)
// ----------------------------------------------------------------
async function validateCluster(cluster) {
  // Score determinístico de regras (peso para fonte oficial + nº de fontes)
  const hasOfficialSource = cluster.some((i) => i.sourceType === "oficial");
  const independentSources = new Set(cluster.map((i) => i.sourceName)).size;

  let ruleScore = 0;
  if (hasOfficialSource) ruleScore += 50;
  ruleScore += Math.min(independentSources * 15, 45);

  const sourcesText = cluster
    .map((i) => `- [${i.sourceType}] ${i.sourceName}: "${i.title}" — ${i.excerpt}`)
    .join("\n");

  const prompt = `Você é um classificador de confiabilidade jornalística. Analise as fontes abaixo, que supostamente descrevem o mesmo evento, e responda SOMENTE com um JSON válido, sem texto adicional.

Fontes:
${sourcesText}

Responda no formato exato:
{"score": <0-100>, "confidence": "<alta|media|baixa>", "contradictions": [<lista de strings, vazia se não houver>], "reasoning": "<justificativa em até 2 frases>"}`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.1,
    messages: [{ role: "user", content: prompt }],
  });

  let parsed;
  try {
    parsed = JSON.parse(completion.choices[0].message.content);
  } catch {
    parsed = { score: 0, confidence: "baixa", contradictions: [], reasoning: "Falha ao interpretar resposta do classificador." };
  }

  const finalScore = Math.round((ruleScore + parsed.score) / 2);

  return {
    finalScore,
    ruleScore,
    llmScore: parsed.score,
    confidence: parsed.confidence,
    contradictions: parsed.contradictions ?? [],
    reasoning: parsed.reasoning ?? "",
  };
}

// ----------------------------------------------------------------
// 5) REDATOR — gera a matéria no tom do "jornal", com atribuição
// ----------------------------------------------------------------
async function writeArticle(cluster) {
  const sourcesText = cluster
    .map((i) => `- ${i.sourceName} ("${i.title}"): ${i.excerpt}`)
    .join("\n");

  const prompt = `Você é redator de um jornal local digital. Escreva uma matéria jornalística clara, objetiva e bem estruturada com base EXCLUSIVAMENTE nas informações das fontes abaixo. Cite as fontes pelo nome no corpo do texto (ex: "segundo o Diário Oficial..."). Não invente fatos que não estejam nas fontes.

Fontes:
${sourcesText}

Responda SOMENTE com um JSON válido no formato:
{"title": "<título da matéria>", "lead": "<linha de resumo, 1-2 frases>", "body": "<corpo completo da matéria, 3-5 parágrafos>"}`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.4,
    messages: [{ role: "user", content: prompt }],
  });

  try {
    return JSON.parse(completion.choices[0].message.content);
  } catch {
    return null;
  }
}

// ----------------------------------------------------------------
// 6) PERSISTÊNCIA — grava no Postgres como rascunho pendente
// ----------------------------------------------------------------
async function saveDraft(cluster, validation, article) {
  const clusterId = `cluster-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const { rows } = await sql`
    INSERT INTO articles (cluster_id, title, lead, body, reliability_score, status)
    VALUES (${clusterId}, ${article.title}, ${article.lead}, ${article.body}, ${validation.finalScore}, 'pending_review')
    RETURNING id;
  `;
  const articleId = rows[0].id;

  for (const item of cluster) {
    await sql`
      INSERT INTO sources (article_id, source_name, source_type, url, raw_excerpt)
      VALUES (${articleId}, ${item.sourceName}, ${item.sourceType}, ${item.url}, ${item.excerpt});
    `;
  }

  await sql`
    INSERT INTO validation_log (article_id, score, confidence, contradictions, reasoning, rule_based_score, llm_score)
    VALUES (${articleId}, ${validation.finalScore}, ${validation.confidence}, ${JSON.stringify(validation.contradictions)}, ${validation.reasoning}, ${validation.ruleScore}, ${validation.llmScore});
  `;

  console.log(`✅ Rascunho salvo (id=${articleId}, score=${validation.finalScore}): "${article.title}"`);
}

// ----------------------------------------------------------------
// MAIN — orquestra o pipeline completo
// ----------------------------------------------------------------
async function main() {
  console.log("🔍 Coletando feeds...");
  const items = await collectFeeds();
  console.log(`   ${items.length} itens coletados.`);

  console.log("🧩 Agrupando por evento...");
  const clusters = clusterItems(items);
  console.log(`   ${clusters.length} clusters formados.`);

  for (const cluster of clusters) {
    console.log(`\n→ Validando cluster: "${cluster[0].title}"`);
    const validation = await validateCluster(cluster);
    console.log(`   Score final: ${validation.finalScore} (regras=${validation.ruleScore}, llm=${validation.llmScore})`);

    if (validation.finalScore < RELIABILITY_THRESHOLD) {
      console.log("   ⛔ Abaixo do threshold — descartado.");
      continue;
    }

    console.log("   ✍️  Redigindo matéria...");
    const article = await writeArticle(cluster);
    if (!article) {
      console.log("   ⚠️  Falha na geração — pulando.");
      continue;
    }

    await saveDraft(cluster, validation, article);
  }

  console.log("\n🏁 Pipeline concluído.");
}

main().catch((err) => {
  console.error("❌ Erro fatal no pipeline:", err);
  process.exit(1);
});
