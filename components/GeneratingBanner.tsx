import { Loader2 } from "lucide-react";
import type { BackgroundJob } from "@/lib/server/types";

/**
 * Shown whenever a background job is running or just failed. The label always reflects
 * that this keeps going even if the user navigates elsewhere — reloading this page (or
 * coming back to it later) will show the same live status, not a stale "not started" state.
 */
export function GeneratingBanner({ job }: { job: BackgroundJob }) {
  if (job.status === "error") {
    return (
      <div className="card p-4 text-sm" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
        {job.label} failed: {job.error}
      </div>
    );
  }

  return (
    <div className="card flex items-center gap-3 p-4" style={{ background: "var(--accent-soft)" }}>
      <Loader2 size={16} className="animate-spin" style={{ color: "var(--accent)" }} />
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--accent-strong)" }}>
          {job.label}
        </p>
        <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
          Running in the background — safe to switch pages, this will keep going.
        </p>
      </div>
    </div>
  );
}
