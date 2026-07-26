import { readStore, updateStore } from "../store";
import type { InterviewQuestion, InterviewSession, MockInterviewTurn } from "../types";

const FILE = "interviewSessions.json";

interface SessionStore {
  items: InterviewSession[];
  nextId: number;
}

const DEFAULT_STORE: SessionStore = { items: [], nextId: 1 };

export function getLatestSession(jobDescriptionId: number): InterviewSession | null {
  const items = readStore(FILE, DEFAULT_STORE)
    .items.filter((s) => s.jobDescriptionId === jobDescriptionId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return items[0] ?? null;
}

export function getSession(id: number): InterviewSession | null {
  return readStore(FILE, DEFAULT_STORE).items.find((s) => s.id === id) ?? null;
}

export async function createSession(
  jobDescriptionId: number,
  questions: InterviewQuestion[]
): Promise<InterviewSession> {
  let created!: InterviewSession;
  await updateStore(FILE, DEFAULT_STORE, (store) => {
    const id = store.nextId++;
    created = { id, jobDescriptionId, questions, mockTurns: [], createdAt: new Date().toISOString() };
    store.items.push(created);
  });
  return created;
}

export async function appendMockTurn(sessionId: number, turn: MockInterviewTurn): Promise<InterviewSession | null> {
  let updated: InterviewSession | null = null;
  await updateStore(FILE, DEFAULT_STORE, (store) => {
    const session = store.items.find((s) => s.id === sessionId);
    if (!session) return;
    session.mockTurns.push(turn);
    updated = session;
  });
  return updated;
}

export async function setStarAnswer(
  sessionId: number,
  questionId: number,
  starAnswer: InterviewQuestion["starAnswer"]
): Promise<InterviewSession | null> {
  let updated: InterviewSession | null = null;
  await updateStore(FILE, DEFAULT_STORE, (store) => {
    const session = store.items.find((s) => s.id === sessionId);
    const question = session?.questions.find((q) => q.id === questionId);
    if (!session || !question) return;
    question.starAnswer = starAnswer;
    updated = session;
  });
  return updated;
}
