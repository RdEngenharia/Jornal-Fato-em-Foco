import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

// Serve imagens guardadas no Blob Store privado deste projeto. Como o
// store está configurado como "private", as imagens não têm uma URL
// pública direta — essa rota busca o arquivo de forma autenticada (usando
// o BLOB_READ_WRITE_TOKEN do servidor) e devolve o conteúdo ao navegador.
// Para o visitante do site, o resultado é idêntico a uma imagem pública:
// ele só vê "/api/image?pathname=materias%2F123.jpg".
export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("pathname");

  if (!pathname) {
    return NextResponse.json({ error: "Parâmetro pathname ausente." }, { status: 400 });
  }

  try {
    const result = await get(pathname, { access: "private" });

    if (!result || result.statusCode !== 200) {
      return new NextResponse("Imagem não encontrada.", { status: 404 });
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType ?? "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-cache",
      },
    });
  } catch {
    return new NextResponse("Imagem não encontrada.", { status: 404 });
  }
}
