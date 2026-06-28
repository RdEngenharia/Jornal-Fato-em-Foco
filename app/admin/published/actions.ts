"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { unpublishArticle } from "@/lib/db";

export async function unpublishAction(formData: FormData) {
  const id = Number(formData.get("id"));
  await unpublishArticle(id);
  revalidatePath("/admin/published");
  revalidatePath("/");
  redirect("/admin/published?removed=" + id);
}
