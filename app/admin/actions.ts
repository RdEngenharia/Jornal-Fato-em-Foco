"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { rejectOldPendingArticles, createManualDraft } from "@/lib/db";

export async function cleanupOldDraftsAction(formData: FormData) {
  const daysOld = Number(formData.get("daysOld")) || 3;

  const count = await rejectOldPendingArticles(daysOld);

  revalidatePath("/admin");
  redirect(`/admin?cleaned=${count}`);
}

export async function createManualDraftAction() {
  const id = await createManualDraft();
  revalidatePath("/admin");
  redirect(`/admin/review/${id}`);
}
