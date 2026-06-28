// lib/video-embed.ts
// Detecta links de YouTube ou Instagram e gera a URL de embed (iframe)
// correspondente. Retorna null se o link não for reconhecido.

export type VideoEmbedResult = {
  platform: "youtube" | "instagram";
  embedUrl: string;
};

export function parseVideoUrl(rawUrl: string): VideoEmbedResult | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");

  // YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID
  if (host === "youtube.com" || host === "m.youtube.com") {
    let videoId = url.searchParams.get("v");
    if (!videoId && url.pathname.startsWith("/shorts/")) {
      videoId = url.pathname.split("/")[2];
    }
    if (videoId) {
      return { platform: "youtube", embedUrl: `https://www.youtube.com/embed/${videoId}` };
    }
  }

  if (host === "youtu.be") {
    const videoId = url.pathname.slice(1);
    if (videoId) {
      return { platform: "youtube", embedUrl: `https://www.youtube.com/embed/${videoId}` };
    }
  }

  // Instagram: instagram.com/p/ID/ or /reel/ID/
  if (host === "instagram.com") {
    const match = url.pathname.match(/\/(p|reel)\/([^/]+)/);
    if (match) {
      const [, type, id] = match;
      return {
        platform: "instagram",
        embedUrl: `https://www.instagram.com/${type}/${id}/embed`,
      };
    }
  }

  return null;
}
