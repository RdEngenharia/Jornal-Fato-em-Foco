"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdvertisement, toggleAdvertisement, deleteAdvertisement } from "@/lib/db";

const ALL_SLOTS = [
  "ad-home-top",
  "ad-home-sidebar-left",
  "ad-home-sidebar-right",
  "ad-home-footer",
  "ad-in-article",
  "ad-article-footer",
];

export async function createAdAction(formData: FormData) {
  const advertiserName = String(formData.get("advertiserName"));
  const imageUrl = String(formData.get("imageUrl"));
  const linkUrl = String(formData.get("linkUrl"));
  const slotIds = ALL_SLOTS.filter((slot) => formData.get(`slot_${slot}`) === "on");

  if (!advertiserName || !imageUrl || !linkUrl || slotIds.length === 0) {
    redirect("/admin/anuncios?error=campos_obrigatorios");
  }

  await createAdvertisement({ advertiserName, imageUrl, linkUrl, slotIds });
  revalidatePath("/");
  revalidatePath("/admin/anuncios");
  redirect("/admin/anuncios?created=1");
}

export async function toggleAdAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const active = formData.get("active") === "true";
  await toggleAdvertisement(id, active);
  revalidatePath("/");
  revalidatePath("/admin/anuncios");
  redirect("/admin/anuncios");
}

export async function deleteAdAction(formData: FormData) {
  const id = Number(formData.get("id"));
  await deleteAdvertisement(id);
  revalidatePath("/");
  revalidatePath("/admin/anuncios");
  redirect("/admin/anuncios?deleted=1");
}
