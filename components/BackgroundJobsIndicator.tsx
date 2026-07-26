"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { BackgroundJob } from "@/lib/server/types";

const POLL_MS = 2500;

/**
 * Global "something is still running" indicator, visible from any page. Generation keeps
 * going server-side regardless of which page is open — this just gives visibility into
 * that from anywhere, so switching pages never feels like work was lost.
 */
export function BackgroundJobsIndicator() {
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch("/api/background-jobs");
        if (!cancelled && res.ok) setJobs(await res.json());
      } finally {
        if (!cancelled) timer = setTimeout(poll, POLL_MS);
      }
    }
    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  if (jobs.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium"
        style={{ background: "var(--accent-soft)", color: "var(--accent-strong)" }}
      >
        <Loader2 size={13} className="animate-spin" />
        {jobs.length} task{jobs.length > 1 ? "s" : ""} running
      </button>
      {open && (
        <div
          className="absolute bottom-full left-0 mb-2 w-72 rounded-lg p-2 text-xs shadow-lg"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          {jobs.map((job) => (
            <div key={job.id} className="flex items-center gap-2 rounded-md px-2 py-1.5" style={{ color: "var(--ink-2)" }}>
              <Loader2 size={12} className="animate-spin shrink-0" style={{ color: "var(--accent)" }} />
              {job.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
