"use client";

import { useState } from "react";
import type { BackgroundJob, InterviewSession } from "@/lib/server/types";
import { useBackgroundJob } from "@/hooks/useBackgroundJob";
import { GeneratingBanner } from "./GeneratingBanner";

const CATEGORY_COLOR: Record<string, string> = {
  behavioral: "var(--accent)",
  technical: "var(--strong)",
  situational: "var(--partial)",
  general: "var(--ink-muted)",
};

export function InterviewPrepPanel({
  jobId,
  initialSession,
  initialActiveQuestionsJob,
  initialActiveSessionJob,
}: {
  jobId: number;
  initialSession: InterviewSession | null;
  initialActiveQuestionsJob: BackgroundJob | null;
  initialActiveSessionJob: BackgroundJob | null;
}) {
  const [session, setSession] = useState(initialSession);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"prep" | "mock">("prep");
  const [mockIndex, setMockIndex] = useState(0);
  const [mockAnswer, setMockAnswer] = useState("");

  const [questionsJobId, setQuestionsJobId] = useState<number | null>(initialActiveQuestionsJob?.id ?? null);
  const questionsJob = useBackgroundJob(questionsJobId, async (finished) => {
    setQuestionsJobId(null);
    if (finished.status === "error") {
      setError(finished.error);
      return;
    }
    const res = await fetch(`/api/jobs/${jobId}/interview`);
    setSession(await res.json());
  });

  // STAR-drafting and mock-feedback both mutate the same session, so they share one polling slot.
  const [sessionJobId, setSessionJobId] = useState<number | null>(initialActiveSessionJob?.id ?? null);
  const sessionJob = useBackgroundJob(sessionJobId, async (finished) => {
    setSessionJobId(null);
    if (finished.status === "error") {
      setError(finished.error);
      return;
    }
    if (session) {
      const res = await fetch(`/api/interview-sessions/${session.id}`);
      setSession(await res.json());
    }
  });

  async function generateQuestions() {
    setError(null);
    const res = await fetch(`/api/jobs/${jobId}/interview`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Generation failed");
      return;
    }
    setQuestionsJobId(data.id);
  }

  async function prepareStar(questionId: number) {
    if (!session) return;
    setError(null);
    const res = await fetch(`/api/interview-sessions/${session.id}/star`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to draft a STAR answer");
      return;
    }
    setSessionJobId(data.id);
  }

  async function submitMockAnswer() {
    if (!session) return;
    const question = session.questions[mockIndex];
    setError(null);
    const res = await fetch(`/api/interview-sessions/${session.id}/mock-turn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: question.id, answer: mockAnswer }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to get feedback");
      return;
    }
    setSessionJobId(data.id);
  }

  const questionsLoading = questionsJob?.status === "running";
  const sessionBusy = sessionJob?.status === "running";

  if (!session) {
    return (
      <div className="flex flex-col gap-4">
        {questionsJob && <GeneratingBanner job={questionsJob} />}
        <div className="card p-6">
          <p className="font-medium" style={{ color: "var(--ink)" }}>
            Generate interview questions
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
            Based on this job's requirements — a mix of behavioral, technical, situational, and general questions.
          </p>
          <button
            onClick={generateQuestions}
            disabled={questionsLoading}
            className="mt-3 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ background: "var(--accent)" }}
          >
            {questionsLoading ? "Generating…" : "Generate questions"}
          </button>
          {error && (
            <p className="mt-2 text-sm" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {sessionJob && <GeneratingBanner job={sessionJob} />}
      {error && (
        <p className="text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setMode("prep")}
          className="rounded-md px-3 py-1.5 text-sm font-medium"
          style={{ background: mode === "prep" ? "var(--accent)" : "var(--surface-2)", color: mode === "prep" ? "white" : "var(--ink)" }}
        >
          Question Prep
        </button>
        <button
          onClick={() => setMode("mock")}
          className="rounded-md px-3 py-1.5 text-sm font-medium"
          style={{ background: mode === "mock" ? "var(--accent)" : "var(--surface-2)", color: mode === "mock" ? "white" : "var(--ink)" }}
        >
          Mock Interview
        </button>
      </div>

      {mode === "prep" && (
        <div className="flex flex-col gap-3">
          {session.questions.map((q) => (
            <div key={q.id} className="card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                  {q.question}
                </p>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                  style={{ background: "var(--surface-2)", color: CATEGORY_COLOR[q.category] }}
                >
                  {q.category}
                </span>
              </div>
              {q.starAnswer ? (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs" style={{ color: "var(--ink-2)" }}>
                  <p>
                    <strong>Situation:</strong> {q.starAnswer.situation}
                  </p>
                  <p>
                    <strong>Task:</strong> {q.starAnswer.task}
                  </p>
                  <p>
                    <strong>Action:</strong> {q.starAnswer.action}
                  </p>
                  <p>
                    <strong>Result:</strong> {q.starAnswer.result}
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => prepareStar(q.id)}
                  disabled={sessionBusy}
                  className="mt-2 text-xs font-medium disabled:opacity-60"
                  style={{ color: "var(--accent)" }}
                >
                  {sessionBusy ? "Drafting…" : "Draft a STAR answer"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {mode === "mock" && (
        <div className="card p-6">
          <p className="text-xs font-semibold uppercase" style={{ color: "var(--ink-muted)" }}>
            Question {mockIndex + 1} of {session.questions.length}
          </p>
          <p className="mt-1 text-lg font-medium" style={{ color: "var(--ink)" }}>
            {session.questions[mockIndex].question}
          </p>
          <textarea
            className="mt-3 h-28 w-full rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
            placeholder="Type your answer…"
            value={mockAnswer}
            onChange={(e) => setMockAnswer(e.target.value)}
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={submitMockAnswer}
              disabled={sessionBusy || !mockAnswer.trim()}
              className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              style={{ background: "var(--accent)" }}
            >
              {sessionBusy ? "Getting feedback…" : "Submit answer"}
            </button>
            <button
              onClick={() => {
                setMockIndex((i) => Math.min(i + 1, session.questions.length - 1));
                setMockAnswer("");
              }}
              disabled={mockIndex >= session.questions.length - 1}
              className="rounded-md px-4 py-2 text-sm font-medium disabled:opacity-40"
              style={{ background: "var(--surface-2)", color: "var(--ink)" }}
            >
              Next question →
            </button>
          </div>

          {[...session.mockTurns]
            .reverse()
            .filter((t) => t.questionId === session.questions[mockIndex].id)
            .slice(0, 1)
            .map((turn, i) => (
              <div key={i} className="mt-4 rounded-lg p-3" style={{ background: "var(--surface-2)" }}>
                <p className="text-xs font-semibold" style={{ color: "var(--ink)" }}>
                  Feedback
                </p>
                {turn.feedback && (
                  <ul className="mt-1 flex flex-col gap-1 text-xs" style={{ color: "var(--ink-2)" }}>
                    <li>
                      <strong>Relevance:</strong> {turn.feedback.relevance}
                    </li>
                    <li>
                      <strong>Clarity:</strong> {turn.feedback.clarity}
                    </li>
                    <li>
                      <strong>Structure:</strong> {turn.feedback.structure}
                    </li>
                    <li>
                      <strong>Evidence:</strong> {turn.feedback.evidence}
                    </li>
                    <li>
                      <strong>Missing details:</strong> {turn.feedback.missingDetails}
                    </li>
                  </ul>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
