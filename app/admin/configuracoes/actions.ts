"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { setSetting } from "@/lib/db";

export async function updateWhatsAppAction(formData: FormData) {
  const rawNumber = String(formData.get("whatsappNumber") || "").trim();

  // Remove tudo que não for dígito, para guardar sempre no formato
  // internacional puro (ex: 5573991317853), igual o WhatsApp espera
  // nos links wa.me.
  const digitsOnly = rawNumber.replace(/\D/g, "");

  if (digitsOnly.length < 12 || digitsOnly.length > 13) {
    redirect("/admin/configuracoes?error=numero_invalido");
  }

  await setSetting("whatsapp_number", digitsOnly);

  // Revalida todas as páginas públicas que usam o número.
  revalidatePath("/");
  revalidatePath("/sobre");
  revalidatePath("/admin/configuracoes");
  redirect("/admin/configuracoes?updated=1");
}
