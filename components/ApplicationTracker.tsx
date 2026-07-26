"use client";

import { useState } from "react";
import type { Application, ApplicationStatus } from "@/lib/server/types";

interface Option {
  id: number;
  label: string;
}

const STATUSES: ApplicationStatus[] = ["interested", "preparing", "applied", "interview", "offer", "rejected", "withdrawn"];

const STATUS_COLOR: Record<ApplicationStatus, string> = {
  interested: "var(--ink-muted)",
  preparing: "var(--partial)",
  applied: "var(--accent)",
  interview: "var(--underdeveloped)",
  offer: "var(--strong)",
  rejected: "var(--danger)",
  withdrawn: "var(--ink-muted)",
};

export function ApplicationTracker({
  initialApplications,
  jobs,
  cvBuilds,
  coverLetters,
}: {
  initialApplications: Application[];
  jobs: Option[];
  cvBuilds: Option[];
  coverLetters: Option[];
}) {
  const [applications, setApplications] = useState(initialApplications);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    company: "",
    jobTitle: "",
    jobDescriptionId: "" as number | "",
    cvBuildId: "" as number | "",
    coverLetterId: "" as number | "",
    dateApplied: "",
    status: "interested" as ApplicationStatus,
    interviewDate: "",
    notes: "",
  });

  async function createApplication() {
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        jobDescriptionId: form.jobDescriptionId || null,
        cvBuildId: form.cvBuildId || null,
        coverLetterId: form.coverLetterId || null,
        dateApplied: form.dateApplied || null,
        interviewDate: form.interviewDate || null,
      }),
    });
    const data = await res.json();
    setApplications([data, ...applications]);
    setShowForm(false);
    setForm({ ...form, company: "", jobTitle: "", notes: "" });
  }

  async function updateStatus(id: number, status: ApplicationStatus) {
    const res = await fetch(`/api/applications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setApplications(applications.map((a) => (a.id === id ? data : a)));
  }

  async function remove(id: number) {
    await fetch(`/api/applications/${id}`, { method: "DELETE" });
    setApplications(applications.filter((a) => a.id !== id));
  }

  function label(options: Option[], id: number | null) {
    return options.find((o) => o.id === id)?.label ?? "—";
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-fit rounded-md px-4 py-2 text-sm font-medium text-white"
        style={{ background: "var(--accent)" }}
      >
        {showForm ? "Cancel" : "+ Track a new application"}
      </button>

      {showForm && (
        <div className="card p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              className="rounded-md border px-2 py-1.5 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
              placeholder="Company"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
            <input
              className="rounded-md border px-2 py-1.5 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
              placeholder="Job title"
              value={form.jobTitle}
              onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
            />
            <select
              className="rounded-md border px-2 py-1.5 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
              value={form.jobDescriptionId}
              onChange={(e) => setForm({ ...form, jobDescriptionId: e.target.value ? Number(e.target.value) : "" })}
            >
              <option value="">Link a job analysis (optional)</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.label}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border px-2 py-1.5 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
              value={form.cvBuildId}
              onChange={(e) => setForm({ ...form, cvBuildId: e.target.value ? Number(e.target.value) : "" })}
            >
              <option value="">CV version used (optional)</option>
              {cvBuilds.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border px-2 py-1.5 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
              value={form.coverLetterId}
              onChange={(e) => setForm({ ...form, coverLetterId: e.target.value ? Number(e.target.value) : "" })}
            >
              <option value="">Cover letter used (optional)</option>
              {coverLetters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border px-2 py-1.5 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as ApplicationStatus })}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <label className="flex flex-col gap-1 text-xs" style={{ color: "var(--ink-2)" }}>
              Date applied
              <input
                type="date"
                className="rounded-md border px-2 py-1.5 text-sm"
                style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
                value={form.dateApplied}
                onChange={(e) => setForm({ ...form, dateApplied: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs" style={{ color: "var(--ink-2)" }}>
              Interview date
              <input
                type="date"
                className="rounded-md border px-2 py-1.5 text-sm"
                style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
                value={form.interviewDate}
                onChange={(e) => setForm({ ...form, interviewDate: e.target.value })}
              />
            </label>
          </div>
          <textarea
            className="mt-2 h-16 w-full rounded-md border px-2 py-1.5 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <button
            onClick={createApplication}
            disabled={!form.company.trim()}
            className="mt-2 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ background: "var(--accent)" }}
          >
            Save
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {applications.length === 0 && (
          <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
            No applications tracked yet.
          </p>
        )}
        {applications.map((app) => (
          <div key={app.id} className="card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium" style={{ color: "var(--ink)" }}>
                  {app.jobTitle || "Untitled role"} — {app.company}
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--ink-muted)" }}>
                  CV: {label(cvBuilds, app.cvBuildId)} · Cover letter: {label(coverLetters, app.coverLetterId)}
                </p>
                {app.dateApplied && (
                  <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                    Applied {app.dateApplied}
                    {app.interviewDate ? ` · Interview ${app.interviewDate}` : ""}
                  </p>
                )}
                {app.notes && (
                  <p className="mt-1 text-xs" style={{ color: "var(--ink-2)" }}>
                    {app.notes}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="rounded-full px-2 py-1 text-xs font-semibold"
                  style={{ background: "var(--surface-2)", color: STATUS_COLOR[app.status] }}
                  value={app.status}
                  onChange={(e) => updateStatus(app.id, e.target.value as ApplicationStatus)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button onClick={() => remove(app.id)} className="text-xs" style={{ color: "var(--danger)" }}>
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
