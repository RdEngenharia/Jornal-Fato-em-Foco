import { getActiveFeaturedScore } from "@/lib/db";

const STATUS_DISPLAY: Record<string, { label: string; color: string }> = {
  scheduled: { label: "EM BREVE", color: "text-mute" },
  live: { label: "AO VIVO", color: "text-terracotta" },
  finished: { label: "FINALIZADO", color: "text-mute" },
};

export default async function FeaturedScoreCard() {
  const score = await getActiveFeaturedScore();
  if (!score) return null;

  const statusInfo = STATUS_DISPLAY[score.status] ?? STATUS_DISPLAY.scheduled;
  const hasScore = score.score_home !== null && score.score_away !== null;

  return (
    <div className="bg-ink text-white">
      <div className="mx-auto max-w-6xl px-5 sm:px-10 py-2 flex items-center justify-center gap-3">
        {score.status === "live" && (
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-terracotta opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-terracotta" />
          </span>
        )}
        <span className={`font-sans text-[10px] font-bold tracking-wider shrink-0 ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
        {score.competition && (
          <span className="font-sans text-[11px] text-white/60 hidden sm:inline shrink-0">
            {score.competition} ·
          </span>
        )}
        <span className="font-sans text-sm font-semibold truncate">
          {score.team_home} {hasScore ? score.score_home : ""}{" "}
          <span className="text-white/50">x</span>{" "}
          {hasScore ? score.score_away : ""} {score.team_away}
        </span>
        {score.match_time && (
          <span className="font-sans text-[11px] text-white/60 shrink-0">
            {score.match_time}
          </span>
        )}
      </div>
    </div>
  );
}
