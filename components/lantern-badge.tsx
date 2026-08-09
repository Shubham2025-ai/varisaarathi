// The signature visual element per UI/UX Design Brief §1/§6 — used
// consistently for risk badges, alert markers, and the ID card. Never
// color-only: shape + label always accompany the color.

type RiskLevel = "GREEN" | "AMBER" | "RED";

const COLOR_MAP: Record<RiskLevel, string> = {
  GREEN: "#3C8248",
  AMBER: "#E8A93A",
  RED: "#C81E3A",
};

const LABEL_MAP: Record<RiskLevel, string> = {
  GREEN: "Low risk",
  AMBER: "Moderate risk",
  RED: "High risk",
};

export function LanternBadge({ level, showLabel = true, size = 18 }: { level: RiskLevel; showLabel?: boolean; size?: number }) {
  const color = COLOR_MAP[level];
  const height = Math.round(size * 1.22);

  return (
    <span className="inline-flex items-center gap-1.5" role="img" aria-label={LABEL_MAP[level]}>
      <svg width={size} height={height} viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 0L11 3H7L9 0Z" fill={color} />
        <rect x="4" y="3" width="10" height="13" rx="3" fill={color} fillOpacity="0.85" stroke={color} strokeWidth="1.2" />
        <line x1="9" y1="16" x2="9" y2="21" stroke={color} strokeWidth="1.5" />
        <line x1="4" y1="8" x2="14" y2="8" stroke="white" strokeOpacity="0.5" strokeWidth="1" />
      </svg>
      {showLabel && <span className="font-body text-sm font-medium">{LABEL_MAP[level]}</span>}
    </span>
  );
}