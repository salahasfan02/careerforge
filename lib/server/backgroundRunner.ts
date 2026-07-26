import { createBackgroundJob, completeBackgroundJob, failBackgroundJob } from "./collections/backgroundJobs";
import type { BackgroundJob, BackgroundJobKind, BackgroundJobResultRef } from "./types";

/**
 * Starts a long-running AI task and returns immediately with a job record the client can
 * poll — the task itself keeps running after the HTTP response is sent, because this app
 * runs as a persistent local Node server (`next dev`/`next start`), not a serverless/edge
 * function that gets torn down after each request. This is what makes generation survive
 * the user switching tabs or navigating elsewhere: the work isn't tied to the request/response
 * lifecycle at all, just to this process staying alive.
 */
export async function startBackgroundJob(params: {
  kind: BackgroundJobKind;
  label: string;
  refTable?: string;
  refId?: number;
  task: () => Promise<BackgroundJobResultRef>;
}): Promise<BackgroundJob> {
  const job = await createBackgroundJob({
    kind: params.kind,
    label: params.label,
    refTable: params.refTable ?? null,
    refId: params.refId ?? null,
  });

  params
    .task()
    .then((resultRef) => completeBackgroundJob(job.id, resultRef))
    .catch((err: unknown) => failBackgroundJob(job.id, err instanceof Error ? err.message : String(err)));

  return job;
}
