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

// Alguns sites (atrás de Cloudflare ou proteção similar) bloqueiam
// requisições sem um User-Agent que pareça vir de um navegador real,
// especialmente vindas de IPs de datacenter (como os do GitHub Actions).
// Esse header reduz a chance de bloqueio 403, embora não elimine o risco
// por completo em sites com proteção anti-bot mais sofisticada.
//
// NOTA: já tentamos expandir para um conjunto mais completo de headers
// (Accept-Language, Sec-Fetch-*, etc.), mas isso causou regressão em
// feeds que antes funcionavam normalmente (provavelmente algum desses
// servidores reagindo mal a headers que não esperava). Voltamos para a
// versão simples e testada.
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const BROWSER_HEADERS = {
  "User-Agent": BROWSER_USER_AGENT,
  Accept: "application/rss+xml, application/xml, text/xml, */*",
};

const parser = new Parser({
  headers: BROWSER_HEADERS,
});

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
    defaultCategory: "geral",
  },
  {
    name: "Namidia News",
    type: "portal_regional",
    url: "https://namidia.news/feed/",
    defaultCategory: "geral",
  },
  {
    name: "Hoje Bahia - Municípios",
    type: "portal_regional",
    url: "https://hojebahia.com.br/feed/19/municipios/",
    defaultCategory: "geral",
  },
  {
    name: "TSE - Tribunal Superior Eleitoral",
    type: "oficial",
    url: "https://www.tse.jus.br/rss",
    defaultCategory: "politica",
  },
  {
    name: "Agência Sebrae de Notícias - Bahia",
    type: "oficial",
    url: "https://ba.agenciasebrae.com.br/feed/",
    defaultCategory: "economia",
  },
  {
    name: "Agência Brasil - Política",
    type: "oficial",
    url: "http://agenciabrasil.ebc.com.br/rss/politica/feed.xml",
    defaultCategory: "politica",
  },
  {
    name: "Governo da Bahia - SECOM",
    type: "oficial",
    url: "https://www.ba.gov.br/comunicacao/feed",
    defaultCategory: "geral",
  },
  {
    // Fonte com linha editorial declarada (não-neutra). Mantida no
    // pipeline a pedido do editor, mas marcada com tipo diferenciado
    // para reforçar o cuidado na revisão manual — ver orientação no
    // prompt do Redator sobre como tratar fontes deste tipo.
    name: "Revista Oeste",
    type: "editorial_partidario",
    url: "https://revistaoeste.com/feed/",
    defaultCategory: "politica",
  },
];

const RELIABILITY_THRESHOLD = 50; // matérias abaixo disso não vão para o Redator

// ----------------------------------------------------------------
// 2) SCRAPER — coleta e normaliza itens de todos os feeds
// ----------------------------------------------------------------

// Alguns feeds (como o do TSE) usam o formato RDF/RSS 1.0, que o
// rss-parser não reconhece nativamente. Esse fallback faz uma extração
// simples via regex, suficiente para pegar título, link e data de cada
// <item> do XML, sem precisar de uma lib adicional.
function parseRdfFeed(xml) {
  const items = [];
  const itemBlocks = xml.split("<item ").slice(1);

  for (const block of itemBlocks) {
    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/);
    const dateMatch = block.match(/<dc:date>([\s\S]*?)<\/dc:date>/);
    // A descrição costuma vir em múltiplos blocos CDATA; pega o primeiro
    // como resumo (geralmente é a linha-fina/subtítulo da notícia).
    const descMatch = block.match(/<!\[CDATA\[\s*<p>([\s\S]*?)<\/p>\s*\]\]>/);

    if (titleMatch && linkMatch) {
      items.push({
        title: titleMatch[1].trim(),
        link: linkMatch[1].trim(),
        contentSnippet: descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim() : "",
        pubDate: dateMatch ? dateMatch[1].trim() : new Date().toISOString(),
      });
    }
  }

  return items;
}

async function collectFeeds() {
  const allItems = [];

  for (const feed of FEEDS) {
    try {
      let items;
      try {
        const parsed = await parser.parseURL(feed.url);
        items = parsed.items;
      } catch (err) {
        // Se o rss-parser não reconheceu o formato, tenta o fallback RDF
        // antes de desistir do feed por completo.
        if (err.message.includes("not recognized as RSS")) {
          const res = await fetch(feed.url, {
            headers: BROWSER_HEADERS,
          });
          const xml = await res.text();
          items = parseRdfFeed(xml);
        } else {
          throw err;
        }
      }

      for (const item of items) {
        allItems.push({
          sourceName: feed.name,
          sourceType: feed.type,
          title: item.title ?? "(sem título)",
          excerpt: item.contentSnippet ?? item.content ?? "",
          url: item.link ?? "",
          publishedAt: item.pubDate ?? new Date().toISOString(),
          defaultCategory: feed.defaultCategory ?? "geral",
        });
      }
    } catch (err) {
      console.warn(`⚠️  Falha ao ler feed "${feed.name}":`, err.message);
    }
  }

  return allItems;
}

// ----------------------------------------------------------------
// 2.1) FILTROS DE RELEVÂNCIA
// Aplicados antes do clustering/validação, para não gastar tokens da
// IA com conteúdo que será descartado de qualquer forma.
// ----------------------------------------------------------------

// Cidades e localidades do extremo sul da Bahia / Costa do Descobrimento.
// Adicione outras conforme notar que faltou alguma na sua região.
const REGION_KEYWORDS = [
  "porto seguro",
  "eunápolis",
  "eunapolis",
  "trancoso",
  "arraial d'ajuda",
  "arraial d ajuda",
  "caraíva",
  "caraiva",
  "santa cruz cabrália",
  "santa cruz cabralia",
  "cabrália",
  "cabralia",
  "belmonte",
  "itabela",
  "itagimirim",
  "itamaraju",
  "prado",
  "guaratinga",
  "vera cruz",
  "costa do descobrimento",
  "extremo sul",
];

function textMatchesAny(text, keywords) {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // remove acentos para comparação mais tolerante
  return keywords.some((kw) => {
    const normalizedKw = kw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return normalized.includes(normalizedKw);
  });
}

// Descarta itens cuja data de publicação original seja mais antiga que
// o limite — protege contra feeds que, por bug ou republicação, ainda
// listam notícias velhas (ex: um item de abril aparecendo num feed em
// junho). Itens sem data parseável (NaN) são deixados passar, para não
// perder conteúdo legítimo por falha de parsing de data.
const MAX_AGE_DAYS = 7;

function isRecentEnough(item) {
  const published = new Date(item.publishedAt ?? item.pubDate);
  if (Number.isNaN(published.getTime())) return true; // data inválida: não descarta por idade

  const ageInDays = (Date.now() - published.getTime()) / (1000 * 60 * 60 * 24);
  return ageInDays <= MAX_AGE_DAYS;
}

// Filtro só geográfico aqui — decisão sobre política nacional x local x
// relevante fica a cargo do Redator (julgamento mais sutil, ver prompt
// de writeArticle), não de uma lista fixa de palavras.
function isRelevant(item) {
  const text = `${item.title} ${item.excerpt}`;

  // Fontes hiper-regionais (Radar News, Namidia News) já cobrem só a
  // região por natureza — não exigimos menção explícita da cidade nelas,
  // senão perderíamos notícias legítimas que não citam o nome da cidade
  // no título/resumo. Para fontes mais amplas (Hoje Bahia, Sebrae, TSE),
  // exigimos menção explícita à região OU deixamos passar para o Redator
  // decidir no caso de conteúdo nacional com possível relevância (ex:
  // eleição presidencial) — por isso o TSE não é descartado aqui.
  if (item.sourceType === "portal_regional" && (item.sourceName === "Radar News" || item.sourceName === "Namidia News")) {
    return true;
  }

  // Fontes nacionais/estaduais institucionais: o filtro mecânico não
  // exige menção explícita à região (uma notícia estadual relevante,
  // como abertura de edital de concurso, raramente cita a cidade
  // específica no resumo do RSS), deixando o julgamento de relevância
  // (local x nacional/estadual com impacto real) a cargo do Redator —
  // ver critério no prompt de writeArticle.
  const INSTITUTIONAL_SOURCES = [
    "TSE - Tribunal Superior Eleitoral",
    "Agência Brasil - Política",
    "Governo da Bahia - SECOM",
  ];
  if (INSTITUTIONAL_SOURCES.includes(item.sourceName)) {
    return true;
  }

  return textMatchesAny(text, REGION_KEYWORDS);
}

// ----------------------------------------------------------------
// 3) CLUSTERING simples — agrupa itens que parecem ser o mesmo evento
// Versão de teste: agrupa por similaridade de título (Jaccard simples).
// Numa v2, troque por embeddings.
// ----------------------------------------------------------------
// Palavras muito comuns no contexto regional do jornal — aparecem em
// quase todo título (nome de cidades, conectivos), então não devem
// contar como sinal de "mesmo assunto" na checagem de similaridade.
// Sem isso, dois títulos sobre fatos completamente diferentes mas que
// mencionam "Porto Seguro" e "prefeitura" ficavam com similaridade
// artificialmente alta.
const STOPWORDS = new Set([
  "a", "o", "as", "os", "de", "da", "do", "das", "dos", "em", "no", "na", "nos", "nas",
  "para", "por", "com", "sem", "e", "ou", "que", "um", "uma", "uns", "umas", "é", "foi",
  "porto", "seguro", "bahia", "ba", "região", "cidade", "município",
]);

function normalizeForSimilarity(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function similarity(a, b) {
  const setA = new Set(normalizeForSimilarity(a));
  const setB = new Set(normalizeForSimilarity(b));
  if (setA.size === 0 || setB.size === 0) return 0;
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
// 3.1) CHECAGEM DE DUPLICADOS
// Busca títulos de matérias já salvas (rascunho, publicadas ou
// rejeitadas) nos últimos dias, para não gerar de novo algo que já
// existe no banco — útil porque os mesmos itens tendem a continuar
// aparecendo no RSS por alguns dias após a publicação original.
// ----------------------------------------------------------------
const DUPLICATE_CHECK_WINDOW_DAYS = 5;
const DUPLICATE_SIMILARITY_THRESHOLD = 0.45;

async function getRecentTitles() {
  const { rows } = await sql.query(
    `SELECT title FROM articles WHERE created_at > now() - ($1 || ' days')::interval;`,
    [DUPLICATE_CHECK_WINDOW_DAYS]
  );
  return rows.map((r) => r.title);
}

function findDuplicateMatch(clusterTitle, existingTitles) {
  let best = null;
  for (const existing of existingTitles) {
    const score = similarity(clusterTitle, existing);
    if (score > DUPLICATE_SIMILARITY_THRESHOLD && (!best || score > best.score)) {
      best = { title: existing, score };
    }
  }
  return best;
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
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  });

  let parsed;
  try {
    parsed = JSON.parse(completion.choices[0].message.content);
  } catch {
    parsed = { score: 0, confidence: "baixa", contradictions: [], reasoning: "Falha ao interpretar resposta do classificador." };
  }

  // NOTA DE CALIBRAÇÃO: com poucas fontes cadastradas ainda (fase de teste),
  // a maioria dos clusters tem só 1 fonte por evento, então o ruleScore fica
  // sempre baixo (~15) mesmo para notícias legítimas. Por isso, nesta fase,
  // damos peso maior ao julgamento do LLM (70%) do que à contagem de fontes
  // (30%). Quando houver mais feeds reais cruzando o mesmo evento regularmente,
  // ajuste esses pesos para 50/50 — o objetivo final do projeto é que o
  // cruzamento de múltiplas fontes pese mais, não menos.
  const finalScore = Math.round(ruleScore * 0.3 + parsed.score * 0.7);

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
const VALID_CATEGORIES = ["geral", "politica", "justica", "economia", "policia", "cultura", "esporte", "saude", "turismo"];

async function writeArticle(cluster) {
  const sourcesText = cluster
    .map((i) => `- [${i.sourceType}] ${i.sourceName} ("${i.title}"): ${i.excerpt}`)
    .join("\n");

  // A categoria sugerida pela fonte (ex: feed do TSE -> "politica") serve
  // como forte indício, mas o LLM decide a categoria final com base no
  // conteúdo real — uma notícia do feed do Sebrae pode, por exemplo, ser
  // mais sobre "turismo" do que "economia" dependendo do assunto.
  const suggestedCategory = cluster[0]?.defaultCategory ?? "geral";

  const prompt = `Você é redator de um jornal local digital focado no extremo sul da Bahia (Porto Seguro, Eunápolis, Trancoso, Arraial d'Ajuda, Costa do Descobrimento e região). Escreva uma matéria jornalística clara, objetiva e bem estruturada com base EXCLUSIVAMENTE nas informações das fontes abaixo. Cite as fontes pelo nome no corpo do texto (ex: "segundo o Diário Oficial..."). Não invente fatos que não estejam nas fontes.

CRITÉRIO EDITORIAL SOBRE POLÍTICA: este jornal publica política e eleições, mas com um filtro de relevância:
- Política/gestão LOCAL (prefeito, câmara de vereadores, decisões administrativas da região) -> SEMPRE relevante, pode escrever.
- Eleições/política NACIONAL ou ESTADUAL (presidência, governo do estado, TSE, partidos em Brasília) -> só é relevante se tiver IMPACTO DIRETO E CONCRETO no dia a dia do leitor local (ex: nova lei eleitoral que muda prazo de votação, decisão do TSE que afeta todos os eleitores). Bastidores partidários, disputas internas de partido, fofoca política, ou burocracia administrativa interna (sistemas internos do TSE, prestação de contas de partidos, recesso forense) NÃO são relevantes para esse jornal.
- Se as fontes forem sobre política nacional SEM relevância direta para o leitor local, responda apenas com {"skip": true} e nada mais.

CRITÉRIO EDITORIAL SOBRE CONCURSOS PÚBLICOS E EDITAIS: notícias do Governo do Estado da Bahia sobre autorização, abertura, ou retomada de concurso público (qualquer órgão estadual) são SEMPRE relevantes para este jornal, mesmo sem menção direta à região — vagas de concurso estadual podem ser disputadas por qualquer morador da Bahia, incluindo o extremo sul. Use categoria "geral" ou "economia" para esse tipo de matéria, e inclua no corpo, quando disponível na fonte: órgão responsável, número de vagas, cargo, e se há data prevista para o edital.

CRITÉRIO SOBRE A CATEGORIA "justica" x "politica": use "justica" para matérias cujo fato central é uma decisão judicial, processo, julgamento, ou ato de um órgão do Poder Judiciário (STF, STJ, TJ-BA, varas federais/estaduais, Ministério Público) — por exemplo, decisões sobre disputas de terra, ordens de desocupação, sentenças, prisões decretadas pela Justiça. Use "politica" para matérias sobre atuação de políticos eleitos, partidos, eleições, e atos do Poder Executivo ou Legislativo (prefeito, câmara, governo do estado, congresso). Uma notícia pode envolver os dois poderes — nesse caso, classifique pelo fato central da matéria (ex: "STF suspende decisão sobre terra indígena" é "justica", mesmo envolvendo um tema com repercussão política).

CUIDADO COM FONTES DE TIPO "editorial_partidario": se alguma das fontes do cluster abaixo for do tipo "editorial_partidario", redobre a separação entre fato e opinião. Escreva SOMENTE o que é fato verificável (quem, o quê, quando, onde) e remova qualquer linguagem de interpretação, especulação sobre intenção política, ou enquadramento favorável/desfavorável a qualquer lado presente no texto original. Se, depois de remover a especulação, não sobrar nenhum fato concreto e verificável para relatar (ex: a matéria é só análise/opinião do início ao fim, sem nenhum evento real relatado), responda apenas com {"skip": true}.

Fontes:
${sourcesText}

Categoria sugerida pela origem das fontes: "${suggestedCategory}" (use como indício, mas escolha a categoria que melhor descreve o CONTEÚDO real da matéria).

Categorias válidas: ${VALID_CATEGORIES.join(", ")}.

Responda SOMENTE com um JSON válido no formato:
{"title": "<título da matéria>", "lead": "<linha de resumo, 1-2 frases>", "body": "<corpo completo da matéria, 3-5 parágrafos>", "category": "<uma das categorias válidas>"}`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  });

  const rawContent = completion.choices[0].message.content;

  try {
    const parsed = JSON.parse(rawContent);
    if (parsed.skip) {
      return null;
    }
    if (!VALID_CATEGORIES.includes(parsed.category)) {
      parsed.category = suggestedCategory;
    }
    return parsed;
  } catch (err) {
    console.warn("   ⚠️  Falha ao interpretar JSON do Redator. Resposta crua:");
    console.warn("   ", rawContent?.slice(0, 300));
    return null;
  }
}

// ----------------------------------------------------------------
// 6) PERSISTÊNCIA — grava no Postgres como rascunho pendente
// ----------------------------------------------------------------
async function saveDraft(cluster, validation, article) {
  const clusterId = `cluster-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const { rows } = await sql`
    INSERT INTO articles (cluster_id, title, lead, body, category, reliability_score, status)
    VALUES (${clusterId}, ${article.title}, ${article.lead}, ${article.body}, ${article.category ?? "geral"}, ${validation.finalScore}, 'pending_review')
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

// Limita quantos clusters tentam ser redigidos por execução, para não
// estourar o limite diário de tokens do plano gratuito da Groq quando
// há muitos itens novos de uma vez (ex: testes manuais repetidos no
// mesmo dia). Em uso normal (2x/dia via GitHub Actions), o volume real
// de itens novos por execução tende a ser bem menor que isso.
const MAX_ARTICLES_PER_RUN = 15;

// Pequena pausa entre cada geração, para distribuir as chamadas em vez
// de disparar tudo em sequência muito rápida.
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("🔍 Coletando feeds...");
  const items = await collectFeeds();
  console.log(`   ${items.length} itens coletados.`);

  console.log(`📅 Descartando itens com mais de ${MAX_AGE_DAYS} dias...`);
  const recentItems = items.filter(isRecentEnough);
  if (recentItems.length < items.length) {
    console.log(`   ${items.length - recentItems.length} item(ns) antigo(s) descartado(s).`);
  }

  console.log("🧭 Filtrando por relevância (região + exclusão de política)...");
  const relevantItems = recentItems.filter(isRelevant);
  console.log(`   ${relevantItems.length} de ${recentItems.length} itens são relevantes.`);

  console.log("🧩 Agrupando por evento...");
  const clusters = clusterItems(relevantItems);
  console.log(`   ${clusters.length} clusters formados.`);

  console.log("🔁 Checando duplicados contra matérias já existentes...");
  const existingTitles = await getRecentTitles();
  console.log(`   ${existingTitles.length} matérias recentes no banco para comparação.`);

  let articlesWritten = 0;

  for (const cluster of clusters) {
    if (articlesWritten >= MAX_ARTICLES_PER_RUN) {
      console.log(`\n⏸️  Limite de ${MAX_ARTICLES_PER_RUN} matérias por execução atingido. Os demais clusters serão processados na próxima execução.`);
      break;
    }

    console.log(`\n→ Validando cluster: "${cluster[0].title}"`);

    const duplicateMatch = findDuplicateMatch(cluster[0].title, existingTitles);
    if (duplicateMatch) {
      console.log(
        `   🔁 Descartado como duplicado (similaridade ${(duplicateMatch.score * 100).toFixed(0)}%) de: "${duplicateMatch.title}"`
      );
      continue;
    }

    const validation = await validateCluster(cluster);
    console.log(`   Score final: ${validation.finalScore} (regras=${validation.ruleScore}, llm=${validation.llmScore})`);

    if (validation.finalScore < RELIABILITY_THRESHOLD) {
      console.log("   ⛔ Abaixo do threshold — descartado.");
      continue;
    }

    console.log("   ✍️  Redigindo matéria...");

    let article;
    try {
      article = await writeArticle(cluster);
    } catch (err) {
      if (err.status === 429) {
        console.log("   ⏸️  Limite diário da Groq atingido. Parando aqui — o restante segue na próxima execução.");
        break;
      }
      throw err;
    }

    if (!article) {
      console.log("   ⚠️  Falha na geração — pulando.");
      continue;
    }

    await saveDraft(cluster, validation, article);
    existingTitles.push(article.title);
    articlesWritten++;

    await sleep(2000); // pausa de 2s entre matérias para distribuir as chamadas
  }

  console.log(`\n🏁 Pipeline concluído. ${articlesWritten} matéria(s) gerada(s) nesta execução.`);
}

main().catch((err) => {
  console.error("❌ Erro fatal no pipeline:", err);
  process.exit(1);
});
