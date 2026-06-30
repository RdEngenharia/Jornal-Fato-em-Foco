// lib/instagram-card.ts
// Gera, no navegador (via Canvas), um card de notícia pronto para
// Instagram: foto de fundo + faixa de categoria + título + lide
// sobrepostos, no formato quadrado (1080x1080).

const CATEGORY_LABELS: Record<string, string> = {
  geral: "Geral",
  politica: "Política",
  economia: "Economia",
  policia: "Polícia",
  justica: "Justiça",
  cultura: "Cultura",
  esporte: "Esporte",
  saude: "Saúde",
  turismo: "Turismo",
  educacao: "Educação",
};

const CATEGORY_COLORS: Record<string, string> = {
  geral: "#C1502E",
  politica: "#5C7A5E",
  economia: "#1A1A18",
  policia: "#8F3A1F",
  justica: "#5C7A5E",
  cultura: "#C1502E",
  esporte: "#5C7A5E",
  saude: "#8F3A1F",
  turismo: "#C1502E",
  educacao: "#2E4F8F",
};

const SIZE = 1080;

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = source;
  });
}

// Quebra um texto em múltiplas linhas que respeitem uma largura máxima,
// dado um contexto de canvas já com a fonte configurada.
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export async function generateInstagramCard(
  imageUrl: string,
  title: string,
  lead: string,
  category: string
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas não disponível.");

  // Fundo: a foto da matéria, cobrindo o quadrado inteiro.
  const img = await loadImage(imageUrl);
  const scale = Math.max(SIZE / img.width, SIZE / img.height);
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;
  ctx.drawImage(
    img,
    (SIZE - drawWidth) / 2,
    (SIZE - drawHeight) / 2,
    drawWidth,
    drawHeight
  );

  // Gradiente escuro subindo da base, para o texto ficar legível sobre
  // qualquer foto.
  const gradient = ctx.createLinearGradient(0, SIZE * 0.35, 0, SIZE);
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.82)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const padding = 56;
  const maxTextWidth = SIZE - padding * 2;

  // Faixa de categoria (pill colorido), próxima à base.
  const categoryLabel = CATEGORY_LABELS[category] ?? "Geral";
  const categoryColor = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.geral;
  ctx.font = "700 28px sans-serif";
  const pillTextWidth = ctx.measureText(categoryLabel.toUpperCase()).width;
  const pillPaddingX = 22;
  const pillHeight = 50;
  const pillY = SIZE - 320;

  ctx.fillStyle = categoryColor;
  const pillWidth = pillTextWidth + pillPaddingX * 2;
  ctx.beginPath();
  ctx.roundRect(padding, pillY, pillWidth, pillHeight, 25);
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.textBaseline = "middle";
  ctx.fillText(categoryLabel.toUpperCase(), padding + pillPaddingX, pillY + pillHeight / 2 + 2);

  // Título: fonte grande, em até 4 linhas.
  ctx.font = "700 52px sans-serif";
  ctx.fillStyle = "#FFFFFF";
  const titleLines = wrapText(ctx, title, maxTextWidth).slice(0, 4);
  let currentY = pillY + pillHeight + 50;
  for (const line of titleLines) {
    ctx.fillText(line, padding, currentY);
    currentY += 60;
  }

  // Lide: fonte menor, até 2 linhas, abaixo do título.
  if (lead) {
    currentY += 14;
    ctx.font = "400 32px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    const leadLines = wrapText(ctx, lead, maxTextWidth).slice(0, 2);
    for (const line of leadLines) {
      ctx.fillText(line, padding, currentY);
      currentY += 40;
    }
  }

  // Marca, no canto inferior.
  ctx.font = "600 26px sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillText("RD Notícias", padding, SIZE - padding + 10);

  return canvas.toDataURL("image/jpeg", 0.92);
}
