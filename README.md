# CareerForge

A private, local-first AI career platform — CV analysis, job matching, tailored CV generation,
cover letters, interview prep, and application tracking. All AI runs locally through
[Ollama](https://ollama.com); no cloud calls, no data leaves your device.

## Why local-first

Your CV, career history, and job search data are sensitive. CareerForge never sends any of it
to a cloud AI provider — every extraction, match, and generation call runs against a local model
via Ollama. You can inspect, back up, or delete your data at any time since it's just JSON files
on disk (`data/`).

## Features

- **Career Profile** — a structured, evidence-backed record of your employment, skills,
  education, projects, and certifications. This is the single source of truth for matching —
  not a CV file — so every claim can be traced back to a specific entry.
- **CV Analysis** — upload a CV for ATS compatibility scoring, writing-quality feedback, and
  structural risk detection (tables, text boxes, images that break parsers).
- **Job Matching** — paste or upload a job description; the app extracts requirements and scores
  your profile against it (required skills, preferred skills, experience, education,
  responsibilities, keywords, achievements) with an evidence citation for every match.
- **Ideal CV Blueprint** — an illustrative, clearly-labeled example of what a strong candidate's
  CV for that specific role might look like, plus a gap analysis against your own profile.
- **CV Builder** — generate a CV in three modes (improve an existing CV, tailor to a specific job,
  or build fresh from your profile), across six ATS-safe templates, with PDF/DOCX export.
- **Cover Letters & Supporting Statements** — drafted from your verified profile, with
  length/tone/STAR controls. Always flagged as an AI draft to review before sending.
- **Interview Preparation** — likely questions, STAR answer drafting, and a mock-interview mode
  with AI feedback on relevance, clarity, structure, and evidence.
- **Application Tracker** — track company, role, status, CV version used, and cover letter used
  per application.

All long-running AI generation runs as a background job on the server — switching pages or tabs
never interrupts it, and a small indicator shows anything still in progress.

## Tech stack

- Next.js 15 (App Router) + TypeScript + Tailwind v4
- Local JSON-file storage (no database server required)
- Ollama for all AI: a reasoning model (default `qwen2.5:14b`), an embedding model
  (`nomic-embed-text`) for semantic matching, and a vision model (`granite3.2-vision`) for
  scanned-CV OCR — all configurable from the Settings page
- `@react-pdf/renderer` + `docx` for CV export

## Getting started

Requires [Ollama](https://ollama.com) running locally with at least a reasoning model and an
embedding model pulled (e.g. `ollama pull qwen2.5:14b && ollama pull nomic-embed-text`).

```bash
npm install
npm run dev
```

Open http://localhost:3400.

## Project structure

```
app/            Next.js routes (pages + API route handlers)
components/     React components
lib/ai/         Ollama provider, structured-output helper, embeddings
lib/parsing/    PDF/DOCX/image/text extraction
lib/pipeline/   The AI pipeline stages (extraction, matching, generation)
lib/server/     JSON-file collections (the data layer) + background job runner
data/           Local data store (gitignored — this is where your data actually lives)
```
