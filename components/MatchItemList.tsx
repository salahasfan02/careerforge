import type { MatchItem } from "@/lib/server/types";
import { MatchTypeBadge } from "./MatchTypeBadge";

export function MatchItemList({ items }: { items: MatchItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
        No requirements in this category.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.requirementItemId} className="card p-4">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>
              {item.requirementText}
            </p>
            <MatchTypeBadge type={item.matchType} />
          </div>
          {item.evidenceText && (
            <p className="mt-2 text-xs italic" style={{ color: "var(--ink-2)" }}>
              Evidence: “{item.evidenceText}”
            </p>
          )}
          {item.notes && (
            <p className="mt-1 text-xs" style={{ color: "var(--ink-muted)" }}>
              {item.notes}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
