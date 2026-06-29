"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { setSetting } from "@/lib/db";

export async function updateWhatsAppAction(formData: FormData) {
  const rawNumber = String(formData.get("whatsappNumber") || "").trim();

  // Remove tudo que não for dígito.
  let digitsOnly = rawNumber.replace(/\D/g, "");

  // O campo é exibido e editado sem o código de país (só DDD + número),
  // então aceitamos o usuário digitando apenas isso (10-11 dígitos) e
  // adicionamos o "55" automaticamente. Também aceitamos se o usuário
  // já incluir o 55 manualmente.
  if (digitsOnly.length === 10 || digitsOnly.length === 11) {
    digitsOnly = "55" + digitsOnly;
  }

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
