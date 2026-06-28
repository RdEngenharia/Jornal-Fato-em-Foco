// lib/plagiarism-check.ts
// Detecta trechos copiados literalmente (não paráfrase) comparando o
// corpo da matéria gerada com o texto das fontes originais. Funciona
// por comparação de n-gramas: sequências de N palavras consecutivas.
// Se uma sequência de N palavras do texto gerado aparece, idêntica, em
// alguma fonte, isso é um forte indício de cópia literal — paráfrase
// real quase nunca reproduz 8+ palavras seguidas por acaso.

const NGRAM_SIZE = 8;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^\w\s]/g, " ") // remove pontuação
    .replace(/\s+/g, " ")
    .trim();
}

function getNgrams(text: string, size: number): Set<string> {
  const words = normalize(text).split(" ").filter(Boolean);
  const ngrams = new Set<string>();
  for (let i = 0; i <= words.length - size; i++) {
    ngrams.add(words.slice(i, i + size).join(" "));
  }
  return ngrams;
}

export type PlagiarismResult = {
  /** Porcentagem (0-100) de n-gramas do texto gerado que aparecem literalmente em alguma fonte. */
  matchPercentage: number;
  /** Alguns trechos literais encontrados, para mostrar como exemplo na revisão. */
  matchedPhrases: string[];
  /** Classificação simples para exibição: baixo risco, atenção, ou alto risco. */
  riskLevel: "baixo" | "atencao" | "alto";
};

export function checkPlagiarism(
  generatedBody: string,
  sourceTexts: string[]
): PlagiarismResult {
  const generatedNgrams = getNgrams(generatedBody, NGRAM_SIZE);

  if (generatedNgrams.size === 0) {
    return { matchPercentage: 0, matchedPhrases: [], riskLevel: "baixo" };
  }

  const sourceNgrams = new Set<string>();
  for (const text of sourceTexts) {
    for (const ngram of getNgrams(text, NGRAM_SIZE)) {
      sourceNgrams.add(ngram);
    }
  }

  const matched: string[] = [];
  for (const ngram of generatedNgrams) {
    if (sourceNgrams.has(ngram)) {
      matched.push(ngram);
    }
  }

  const matchPercentage = Math.round((matched.length / generatedNgrams.size) * 100);

  let riskLevel: PlagiarismResult["riskLevel"] = "baixo";
  if (matchPercentage >= 25) riskLevel = "alto";
  else if (matchPercentage >= 10) riskLevel = "atencao";

  // Mostra só algumas frases de exemplo (não a lista inteira), suficiente
  // para o revisor humano entender onde está o problema.
  const matchedPhrases = matched.slice(0, 5);

  return { matchPercentage, matchedPhrases, riskLevel };
}
