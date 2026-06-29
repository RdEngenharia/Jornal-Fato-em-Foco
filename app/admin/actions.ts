"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { rejectOldPendingArticles } from "@/lib/db";

export async function cleanupOldDraftsAction(formData: FormData) {
  const daysOld = Number(formData.get("daysOld")) || 3;

  const count = await rejectOldPendingArticles(daysOld);

  revalidatePath("/admin");
  redirect(`/admin?cleaned=${count}`);
}
