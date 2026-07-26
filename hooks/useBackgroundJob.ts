"use client";

import { useEffect, useRef, useState } from "react";
import type { BackgroundJob } from "@/lib/server/types";

const POLL_MS = 1500;

/**
 * Polls a background job until it finishes. Because the job itself runs server-side
 * independent of any particular page being mounted, this hook naturally "resumes" —
 * pass in a job that was already running (e.g. discovered on page load) and it picks up
 * polling immediately, whether or not this browser tab was the one that started it.
 */
export function useBackgroundJob(
  jobId: number | null,
  onSettled?: (job: BackgroundJob) => void
): BackgroundJob | null {
  const [job, setJob] = useState<BackgroundJob | null>(null);
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(`/api/background-jobs/${jobId}`);
        if (!res.ok || cancelled) return;
        const data: BackgroundJob = await res.json();
        if (cancelled) return;
        setJob(data);
        if (data.status === "running") {
          timer = setTimeout(poll, POLL_MS);
        } else {
          onSettledRef.current?.(data);
        }
      } catch {
        if (!cancelled) timer = setTimeout(poll, POLL_MS);
      }
    }
    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [jobId]);

  return job;
}
