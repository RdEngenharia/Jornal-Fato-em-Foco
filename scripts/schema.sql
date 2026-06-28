-- ============================================================
-- SCHEMA: Portal de Notícias Automatizado
-- Banco: Vercel Postgres (Neon)
-- ============================================================

-- Tabela principal: cada linha é uma matéria, do rascunho à publicação
CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  cluster_id TEXT NOT NULL,                  -- agrupa as fontes do mesmo evento
  title TEXT NOT NULL,
  lead TEXT,                                  -- lide / resumo curto
  body TEXT NOT NULL,                         -- corpo da matéria gerado pelo Redator
  category TEXT DEFAULT 'geral',
  reliability_score INTEGER NOT NULL DEFAULT 0,   -- 0-100, vem do Validador
  status TEXT NOT NULL DEFAULT 'pending_review',  -- pending_review | published | rejected | archived
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  reviewed_by TEXT
);

-- Cada matéria pode ter N fontes originais que foram cruzadas
CREATE TABLE IF NOT EXISTS sources (
  id SERIAL PRIMARY KEY,
  article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,                  -- ex: "Diário Oficial do Município de X"
  source_type TEXT NOT NULL DEFAULT 'outro',  -- oficial | portal_regional | rede_social | outro
  url TEXT NOT NULL,
  raw_excerpt TEXT,                           -- trecho original coletado (para auditoria)
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Log de auditoria do processo de validação — por que essa matéria passou/foi rejeitada
CREATE TABLE IF NOT EXISTS validation_log (
  id SERIAL PRIMARY KEY,
  article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  confidence TEXT NOT NULL,                   -- alta | media | baixa
  contradictions JSONB DEFAULT '[]',          -- lista de contradições encontradas entre fontes
  reasoning TEXT,                             -- justificativa textual do classificador LLM
  rule_based_score INTEGER,                   -- score só das regras determinísticas
  llm_score INTEGER,                          -- score que o LLM classificador deu
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para as queries mais comuns do painel admin
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sources_article_id ON sources(article_id);
CREATE INDEX IF NOT EXISTS idx_validation_log_article_id ON validation_log(article_id);
