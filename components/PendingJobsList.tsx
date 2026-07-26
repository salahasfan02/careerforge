"use client";

import { useRouter } from "next/navigation";
import type { BackgroundJob } from "@/lib/server/types";
import { useBackgroundJob } from "@/hooks/useBackgroundJob";
import { GeneratingBanner } from "./GeneratingBanner";

function PendingJobWatcher({ job, onDone }: { job: BackgroundJob; onDone: () => void }) {
  const liveJob = useBackgroundJob(job.id, onDone);
  return <GeneratingBanner job={liveJob ?? job} />;
}

/**
 * Renders any jobs that were still running when this page was server-rendered — the work
 * itself never stopped, so this just re-attaches polling and refreshes the list once each
 * one finishes, regardless of whether this browser tab is the one that started it.
 */
export function PendingJobsList({ initialJobs }: { initialJobs: BackgroundJob[] }) {
  const router = useRouter();
  if (initialJobs.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {initialJobs.map((job) => (
        <PendingJobWatcher key={job.id} job={job} onDone={() => router.refresh()} />
      ))}
    </div>
  );
}
