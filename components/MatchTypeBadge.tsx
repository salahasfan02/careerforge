import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import type { MatchType } from "@/lib/server/types";

// Single source of truth for match-type copy. "Missing" must never read as a
// certainty that the candidate lacks the skill — only that it wasn't found in
// their recorded profile.
const MATCH_TYPE_META: Record<
  MatchType,
  { label: string; icon: typeof CheckCircle2; color: string; bg: string; help: string }
> = {
  strong: {
    label: "Strong match",
    icon: CheckCircle2,
    color: "var(--strong)",
    bg: "var(--strong-bg)",
    help: "Clear, direct evidence of this requirement was found in your profile.",
  },
  partial: {
    label: "Partial match",
    icon: AlertTriangle,
    color: "var(--partial)",
    bg: "var(--partial-bg)",
    help: "Related experience exists, but the evidence is weak or incomplete.",
  },
  underdeveloped: {
    label: "Mentioned but underdeveloped",
    icon: AlertTriangle,
    color: "var(--underdeveloped)",
    bg: "var(--underdeveloped-bg)",
    help: "This is on your profile, but there's no supporting evidence recorded yet.",
  },
  missing: {
    label: "Not found in your profile",
    icon: XCircle,
    color: "var(--missing)",
    bg: "var(--missing-bg)",
    help: "May still be true of your experience — it just isn't recorded in your profile yet.",
  },
  unknown: {
    label: "Unknown",
    icon: HelpCircle,
    color: "var(--unknown)",
    bg: "var(--unknown-bg)",
    help: "There isn't enough information in your profile to tell either way.",
  },
};

export function MatchTypeBadge({ type, showHelp = false }: { type: MatchType; showHelp?: boolean }) {
  const meta = MATCH_TYPE_META[type];
  const Icon = meta.icon;
  return (
    <span className="inline-flex flex-col gap-0.5">
      <span
        className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
        style={{ background: meta.bg, color: meta.color }}
      >
        <Icon size={13} strokeWidth={2.25} />
        {meta.label}
      </span>
      {showHelp && (
        <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
          {meta.help}
        </span>
      )}
    </span>
  );
}
