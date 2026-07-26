function scoreColor(score: number): string {
  if (score >= 80) return "var(--strong)";
  if (score >= 55) return "var(--partial)";
  return "var(--underdeveloped)";
}

export function ScoreGauge({ score, size = 128, label }: { score: number; size?: number; label?: string }) {
  const stroke = size * 0.09;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const color = scoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 500ms ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-bold" style={{ color, fontSize: size * 0.26 }}>
          {score}
        </span>
        {label && (
          <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--ink-muted)" }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
