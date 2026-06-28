# Portal de Notícias Automatizado — Versão de Teste

Pipeline: Scraper (RSS) → Validador (IA classificadora) → Redator (IA geradora) → Painel de revisão → Publicação manual.

## O que já está pronto neste esqueleto

- Painel admin em Next.js (lista de rascunhos + página de revisão individual)
- Schema do banco (`scripts/schema.sql`)
- Script que aplica o schema no banco (`scripts/init-db.mjs`)
- Script do pipeline completo (`scripts/pipeline.mjs`)
- Workflow do GitHub Actions já configurado para rodar 2x ao dia (`.github/workflows/pipeline.yml`)

## Passo a passo para rodar — do zero

### 1. Criar o banco de dados (Vercel Postgres)

1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard) e entre no seu projeto (ou crie um novo).
2. Vá na aba **Storage** → **Create Database** → escolha **Postgres** (Neon).
3. Depois de criado, clique em **Connect Project** e selecione este projeto.
   - Isso cria automaticamente a variável `POSTGRES_URL` no seu projeto da Vercel.
4. No seu computador, copie essa mesma `POSTGRES_URL` (aparece em Storage → seu banco → `.env.local` tab) e cole no arquivo `.env.local` (copie de `.env.example`).

### 2. Pegar uma chave da Groq (gratuita)

1. Acesse [console.groq.com](https://console.groq.com) e crie uma conta (sem cartão de crédito).
2. Gere uma API key e cole em `GROQ_API_KEY` no seu `.env.local`.

### 3. Instalar dependências e aplicar o schema

```bash
npm install
npm run db:init
```

Isso cria as 3 tabelas (`articles`, `sources`, `validation_log`) no seu banco.

### 4. Configurar as fontes (feeds) reais

Abra `scripts/pipeline.mjs` e edite o array `FEEDS` no topo do arquivo, trocando pelas URLs reais dos feeds RSS que você quer monitorar (diários oficiais, portais regionais, etc).

> Dica: muitos diários oficiais municipais e portais de notícia têm uma URL de feed do tipo `/feed` ou `/rss`. Se um site não tiver RSS, a versão de teste não faz scraping de HTML puro ainda — isso fica para uma v2 (posso te ajudar a adicionar quando chegar a hora).

### 5. Testar o pipeline localmente

```bash
npm run pipeline
```

Isso vai: coletar os feeds → agrupar por evento → validar com a IA → redigir as matérias aprovadas → salvar como rascunho no banco.

### 6. Rodar o painel localmente

```bash
npm run dev
```

Acesse `http://localhost:3000` — você verá a lista de rascunhos pendentes (se o passo 5 já tiver gerado algum). Clique em uma matéria para revisar, editar e publicar.

### 7. Subir para o GitHub e conectar à Vercel

```bash
git init
git add .
git commit -m "Esqueleto inicial do portal de notícias"
```

Crie um repositório no GitHub e suba (`git remote add origin ...` + `git push`).

Depois:
1. Na Vercel, importe esse repositório como novo projeto (se ainda não tiver feito).
2. Em **Settings → Environment Variables**, confirme que `POSTGRES_URL` já está lá (vem da conexão do banco) e adicione `GROQ_API_KEY` manualmente.
3. Em **Settings → Secrets and variables → Actions** do **GitHub** (não da Vercel), adicione os mesmos dois secrets (`POSTGRES_URL` e `GROQ_API_KEY`) — é o GitHub Actions que vai rodar o pipeline automaticamente, não a Vercel.

### 8. Ativar o agendamento automático

O arquivo `.github/workflows/pipeline.yml` já está configurado para rodar 2x ao dia. Depois do push, vá na aba **Actions** do seu repositório no GitHub — você pode rodar manualmente pela primeira vez clicando em **Run workflow** para testar.

## Próximos passos sugeridos (quando estiver confortável com essa versão)

- Trocar o clustering por similaridade de título (atual, simples) por embeddings.
- Adicionar scraping de HTML para sites sem RSS (com Cheerio ou Playwright).
- Adicionar autenticação no painel admin (hoje ele está aberto — para uso pessoal de teste está OK, mas antes de expor publicamente é importante proteger `/` e `/review`).
- Criar a página pública do site (`/noticias`) que lê só os artigos com `status = 'published'`.
