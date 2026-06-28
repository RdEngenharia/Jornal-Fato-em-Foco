import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const file = form.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }

  // Tipo e tamanho são validados aqui no servidor, não só no input do
  // navegador, porque o input do navegador pode ser contornado.
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato não suportado. Use JPG, PNG, WEBP ou GIF." },
      { status: 400 }
    );
  }

  const maxSizeBytes = 8 * 1024 * 1024; // 8MB
  if (file.size > maxSizeBytes) {
    return NextResponse.json(
      { error: "Imagem muito grande. Limite de 8MB." },
      { status: 400 }
    );
  }

  const extension = file.name.split(".").pop();
  const pathname = `materias/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  // O Blob Store deste projeto está configurado como "private", então o
  // upload usa access: "private". A imagem não fica acessível por URL
  // pública direta — em vez disso, salvamos o "pathname" e servimos a
  // imagem através da rota /api/image, que busca o arquivo autenticado
  // e o devolve ao navegador. Para quem visita o site, o resultado visual
  // é idêntico ao de uma imagem pública normal.
  const blob = await put(pathname, file, {
    access: "private",
  });

  return NextResponse.json({ url: `/api/image?pathname=${encodeURIComponent(blob.pathname)}` });
}
