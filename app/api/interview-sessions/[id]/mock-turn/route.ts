import { NextRequest, NextResponse } from "next/server";
import { getSession, appendMockTurn } from "@/lib/server/collections/interviewSessions";
import { getProfile } from "@/lib/server/collections/profile";
import { generateInterviewFeedback } from "@/lib/pipeline/interviewPrep";
import { startBackgroundJob } from "@/lib/server/backgroundRunner";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { questionId, answer } = await req.json();
  const session = getSession(Number(id));
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const question = session.questions.find((q) => q.id === Number(questionId));
  if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  const backgroundJob = await startBackgroundJob({
    kind: "interview_mock_feedback",
    label: `Getting feedback on your answer`,
    refTable: "interview_sessions",
    refId: session.id,
    task: async () => {
      const profile = getProfile();
      const feedback = await generateInterviewFeedback(question.question, answer, profile);
      await appendMockTurn(session.id, { questionId: question.id, question: question.question, answer, feedback });
      return { table: "interview_sessions", id: session.id };
    },
  });

  return NextResponse.json(backgroundJob);
}
