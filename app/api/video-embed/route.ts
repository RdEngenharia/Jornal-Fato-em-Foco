import { NextRequest, NextResponse } from "next/server";
import { parseVideoUrl } from "@/lib/video-embed";

export async function POST(request: NextRequest) {
  const { url } = await request.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL ausente." }, { status: 400 });
  }

  const result = parseVideoUrl(url);

  if (!result) {
    return NextResponse.json(
      { error: "Link não reconhecido. Use um link do YouTube ou Instagram." },
      { status: 400 }
    );
  }

  return NextResponse.json(result);
}
