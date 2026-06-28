"use client";

import { useEffect, useState } from "react";

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "agora mesmo";
  if (diffMinutes < 60) return `há ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `há ${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "há 1 dia";
  return `há ${diffDays} dias`;
}

export default function LastUpdatedBadge({ lastPublishedAt }: { lastPublishedAt: string | null }) {
  // Recalcula no cliente a cada minuto, para o texto ficar sempre atual
  // sem precisar recarregar a página.
  const [label, setLabel] = useState<string | null>(
    lastPublishedAt ? formatRelativeTime(lastPublishedAt) : null
  );

  useEffect(() => {
    if (!lastPublishedAt) return;
    const interval = setInterval(() => {
      setLabel(formatRelativeTime(lastPublishedAt));
    }, 60000);
    return () => clearInterval(interval);
  }, [lastPublishedAt]);

  if (!label) return null;

  return (
    <div className="flex items-center gap-1.5 font-sans text-xs text-mute">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage opacity-60" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-sage" />
      </span>
      Atualizado {label}
    </div>
  );
}
