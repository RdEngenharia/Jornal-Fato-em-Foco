"use client";

import { useState } from "react";

type Props = {
  blurredUrl: string;
  originalUrl: string;
  alt: string;
  className?: string;
};

export default function SensitiveImage({ blurredUrl, originalUrl, alt, className }: Props) {
  const [revealed, setRevealed] = useState(false);

  if (revealed) {
    return <img src={originalUrl} alt={alt} className={className} />;
  }

  return (
    <div className={`relative ${className}`}>
      <img src={blurredUrl} alt={alt} className="w-full h-full object-cover" />
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/70 hover:bg-ink/60 transition-colors text-white"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span className="font-sans text-sm font-medium">Conteúdo sensível</span>
        <span className="font-sans text-xs text-white/80 underline">
          Clique para visualizar
        </span>
      </button>
    </div>
  );
}
