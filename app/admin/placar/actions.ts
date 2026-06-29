"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createFeaturedScore,
  updateFeaturedScore,
  toggleFeaturedScore,
  deleteFeaturedScore,
} from "@/lib/db";

function parseScoreForm(formData: FormData) {
  const competition = String(formData.get("competition") || "").trim() || null;
  const teamHome = String(formData.get("teamHome") || "").trim();
  const teamAway = String(formData.get("teamAway") || "").trim();
  const scoreHomeRaw = String(formData.get("scoreHome") || "").trim();
  const scoreAwayRaw = String(formData.get("scoreAway") || "").trim();
  const status = String(formData.get("status") || "scheduled") as "scheduled" | "live" | "finished";
  const matchTime = String(formData.get("matchTime") || "").trim() || null;

  return {
    competition,
    teamHome,
    teamAway,
    scoreHome: scoreHomeRaw === "" ? null : Number(scoreHomeRaw),
    scoreAway: scoreAwayRaw === "" ? null : Number(scoreAwayRaw),
    status,
    matchTime,
  };
}

export async function createScoreAction(formData: FormData) {
  const data = parseScoreForm(formData);

  if (!data.teamHome || !data.teamAway) {
    redirect("/admin/placar?error=times_obrigatorios");
  }

  await createFeaturedScore(data);
  revalidatePath("/");
  revalidatePath("/admin/placar");
  redirect("/admin/placar?created=1");
}

export async function updateScoreAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const data = parseScoreForm(formData);

  if (!data.teamHome || !data.teamAway) {
    redirect(`/admin/placar?error=times_obrigatorios`);
  }

  await updateFeaturedScore(id, data);
  revalidatePath("/");
  revalidatePath("/admin/placar");
  redirect("/admin/placar?updated=1");
}

export async function toggleScoreAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const active = formData.get("active") === "true";
  await toggleFeaturedScore(id, active);
  revalidatePath("/");
  revalidatePath("/admin/placar");
  redirect("/admin/placar");
}

export async function deleteScoreAction(formData: FormData) {
  const id = Number(formData.get("id"));
  await deleteFeaturedScore(id);
  revalidatePath("/");
  revalidatePath("/admin/placar");
  redirect("/admin/placar?deleted=1");
}
