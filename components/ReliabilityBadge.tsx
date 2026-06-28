type Props = {
  score: number;
  size?: "sm" | "lg";
};

function getTone(score: number) {
  if (score >= 70) return { color: "#5C7A5E", label: "Confiável" };
  if (score >= 40) return { color: "#C1502E", label: "Verificar" };
  return { color: "#8F3A1F", label: "Baixa confiança" };
}

export default function ReliabilityBadge({ score, size = "sm" }: Props) {
  const { color, label } = getTone(score);
  const dimension = size === "lg" ? 56 : 36;
  const stroke = size === "lg" ? 5 : 4;
  const radius = (dimension - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center gap-2">
      <div className="relative" style={{ width: dimension, height: dimension }}>
        <svg width={dimension} height={dimension} className="-rotate-90">
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            stroke="#E8E5DC"
            strokeWidth={stroke}
          />
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center font-sans font-semibold"
          style={{ fontSize: size === "lg" ? 16 : 11, color }}
        >
          {score}
        </span>
      </div>
      {size === "lg" && (
        <span className="font-sans text-sm text-mute">{label}</span>
      )}
    </div>
  );
}
