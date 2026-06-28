"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { publishArticle, rejectArticle } from "@/lib/db";

export async function publishAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const title = String(formData.get("title"));
  const lead = String(formData.get("lead"));
  const body = String(formData.get("body"));

  await publishArticle(id, title, lead, body);
  revalidatePath("/");
  redirect("/?published=" + id);
}

export async function rejectAction(formData: FormData) {
  const id = Number(formData.get("id"));
  await rejectArticle(id);
  revalidatePath("/");
  redirect("/?rejected=" + id);
}
