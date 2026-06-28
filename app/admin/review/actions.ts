"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { publishArticle, rejectArticle, getArticleById } from "@/lib/db";

export async function publishAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const title = String(formData.get("title"));
  const lead = String(formData.get("lead"));
  const body = String(formData.get("body"));
  const category = String(formData.get("category") || "geral");
  const mediaJsonRaw = formData.get("mediaJson");

  // Log temporário de diagnóstico — remover depois de confirmar a causa.
  console.log("[DEBUG publishAction] mediaJsonRaw recebido:", mediaJsonRaw);

  // Verifica se já estava publicada antes de atualizar, para saber para
  // onde redirecionar depois (lista de rascunhos vs. lista de publicadas).
  const existing = await getArticleById(id);
  const wasAlreadyPublished = existing?.status === "published";

  let media: { type: "image" | "video_embed"; url: string; embedUrl: string | null }[] = [];
  try {
    media = mediaJsonRaw ? JSON.parse(String(mediaJsonRaw)) : [];
  } catch (err) {
    console.log("[DEBUG publishAction] erro ao fazer parse do mediaJson:", err);
    media = [];
  }

  console.log("[DEBUG publishAction] media após parse:", media);

  await publishArticle(id, title, lead, body, category, media);
  revalidatePath("/"); // home pública, onde as matérias aparecem
  revalidatePath("/admin");
  revalidatePath("/admin/published");

  if (wasAlreadyPublished) {
    redirect("/admin/published?updated=" + id);
  }
  redirect("/admin?published=" + id);
}

export async function rejectAction(formData: FormData) {
  const id = Number(formData.get("id"));
  await rejectArticle(id);
  revalidatePath("/admin");
  redirect("/admin?rejected=" + id);
}
