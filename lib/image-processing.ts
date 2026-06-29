// lib/image-processing.ts
// Processamento de imagem feito no navegador (via Canvas), antes do
// upload — assim a imagem já sai do dispositivo do usuário com a marca
// d'água aplicada (ou desfocada), sem precisar de processamento no
// servidor.

const WATERMARK_LOGO_URL = "/logo.png";
const WATERMARK_TEXT = "RD Notícias";

/**
 * Aplica uma marca d'água elegante no canto inferior direito: a logo
 * (imagem real) ao lado do nome, sobre um gradiente escuro sutil que
 * garante legibilidade sem precisar de uma caixa sólida — efeito mais
 * discreto e profissional do que texto-sobre-retângulo.
 * Recebe um File e devolve um novo File (mesmo tipo MIME) já com a marca.
 */
export async function applyWatermark(file: File): Promise<File> {
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file; // fallback: se Canvas não disponível, devolve original

  ctx.drawImage(img, 0, 0);

  // Gradiente escuro sutil subindo do canto inferior direito — garante
  // contraste para a marca sem precisar de uma caixa sólida visível.
  const gradientHeight = img.height * 0.22;
  const gradient = ctx.createLinearGradient(0, img.height - gradientHeight, 0, img.height);
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.45)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, img.height - gradientHeight, img.width, gradientHeight);

  const fontSize = Math.max(13, Math.round(img.width * 0.02));
  const logoSize = fontSize * 2.2;
  const padding = fontSize * 0.9;

  ctx.font = `500 ${fontSize}px sans-serif`;
  const textWidth = ctx.measureText(WATERMARK_TEXT).width;
  const gap = fontSize * 0.5;

  const totalWidth = logoSize + gap + textWidth;
  const startX = img.width - totalWidth - padding;
  const centerY = img.height - padding - logoSize / 2;

  // Tenta carregar e desenhar a logo real; se falhar (rede, CORS), o
  // texto sozinho ainda funciona como marca d'água válida.
  try {
    const logo = await loadImage(WATERMARK_LOGO_URL);
    ctx.save();
    ctx.beginPath();
    ctx.arc(startX + logoSize / 2, centerY, logoSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(logo, startX, centerY - logoSize / 2, logoSize, logoSize);
    ctx.restore();
  } catch {
    // Sem logo disponível: segue só com o texto, deslocado para a posição da logo.
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.textBaseline = "middle";
  ctx.font = `500 ${fontSize}px sans-serif`;
  ctx.fillText(WATERMARK_TEXT, startX + logoSize + gap, centerY + fontSize * 0.05);

  return canvasToFile(canvas, file);
}

/**
 * Aplica um desfoque forte (pixelização) na imagem inteira — usado para
 * matérias sensíveis (categoria Polícia) onde a cena não deve ser
 * mostrada com nitidez.
 */
export async function applyBlur(file: File): Promise<File> {
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  // Pixelização: desenha em baixa resolução e depois escala para cima,
  // sem suavização — produz um efeito de "censura" forte e óbvio,
  // mais robusto visualmente do que um simples blur gaussiano leve.
  const pixelSize = Math.max(8, Math.round(img.width / 40));
  const smallW = Math.max(1, Math.round(img.width / pixelSize));
  const smallH = Math.max(1, Math.round(img.height / pixelSize));

  const smallCanvas = document.createElement("canvas");
  smallCanvas.width = smallW;
  smallCanvas.height = smallH;
  const smallCtx = smallCanvas.getContext("2d");
  if (!smallCtx) return file;

  smallCtx.drawImage(img, 0, 0, smallW, smallH);

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(smallCanvas, 0, 0, smallW, smallH, 0, 0, img.width, img.height);

  return canvasToFile(canvas, file);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function canvasToFile(canvas: HTMLCanvasElement, originalFile: File): Promise<File> {
  const mimeType = originalFile.type || "image/jpeg";
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Falha ao processar imagem."));
          return;
        }
        resolve(new File([blob], originalFile.name, { type: mimeType }));
      },
      mimeType,
      0.92
    );
  });
}
