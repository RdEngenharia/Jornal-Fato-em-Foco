// lib/image-processing.ts
// Processamento de imagem feito no navegador (via Canvas), antes do
// upload — assim a imagem já sai do dispositivo do usuário com a marca
// d'água aplicada (ou desfocada), sem precisar de processamento no
// servidor.

const WATERMARK_TEXT = "RD Notícias";

/**
 * Aplica uma marca d'água discreta no canto inferior direito da imagem.
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

  // Tamanho da fonte proporcional à imagem, com mínimo legível.
  const fontSize = Math.max(14, Math.round(img.width * 0.022));
  ctx.font = `600 ${fontSize}px sans-serif`;
  const textWidth = ctx.measureText(WATERMARK_TEXT).width;
  const paddingX = fontSize * 0.8;
  const paddingY = fontSize * 0.6;

  const x = img.width - textWidth - paddingX * 2;
  const y = img.height - fontSize - paddingY;
  const boxWidth = textWidth + paddingX * 2;
  const boxHeight = fontSize + paddingY * 1.4;

  // Fundo semi-transparente para garantir legibilidade em qualquer foto.
  ctx.fillStyle = "rgba(26, 26, 24, 0.55)";
  roundedRect(ctx, x, y, boxWidth, boxHeight, 6);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.textBaseline = "middle";
  ctx.fillText(WATERMARK_TEXT, x + paddingX, y + boxHeight / 2);

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

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
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
