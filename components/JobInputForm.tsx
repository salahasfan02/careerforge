"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function JobInputForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitPasted() {
    if (!text.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, company, rawText: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save job description");
      router.push(`/jobs/${data.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitFile(file: File) {
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/jobs", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      router.push(`/jobs/${data.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card p-6">
      <p className="font-medium" style={{ color: "var(--ink)" }}>
        Add a job description
      </p>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          className="rounded-md border px-3 py-1.5 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
          placeholder="Job title (optional — AI will detect it)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="rounded-md border px-3 py-1.5 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
          placeholder="Company (optional)"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>
      <textarea
        className="mt-2 h-40 w-full rounded-md border px-3 py-2 text-sm"
        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
        placeholder="Paste the job description here…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={submitPasted}
          disabled={submitting || !text.trim()}
          className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          style={{ background: "var(--accent)" }}
        >
          {submitting ? "Working…" : "Analyse this job"}
        </button>
        <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
          or
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) submitFile(file);
          }}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={submitting}
          className="rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60"
          style={{ background: "var(--surface-2)", color: "var(--ink)" }}
        >
          Upload file / screenshot
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
