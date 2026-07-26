"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import type { CvBuild, CvBuildContent, CvSectionType, CvTemplate } from "@/lib/server/types";
import { CV_TEMPLATES, SECTION_LABELS } from "@/lib/cvTemplates";
import { CvPreview } from "./CvPreview";

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-md border px-2 py-1 text-sm outline-none"
      style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
    />
  );
}
function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full rounded-md border px-2 py-1 text-sm outline-none"
      style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
    />
  );
}

export function CvBuilderEditor({ initialBuild }: { initialBuild: CvBuild }) {
  const router = useRouter();
  const [build, setBuild] = useState(initialBuild);
  const [content, setContent] = useState<CvBuildContent>(initialBuild.content);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);

  async function save(nextContent = content, nextTemplate = build.template, nextName = build.name) {
    setSaving(true);
    try {
      const res = await fetch(`/api/cv-builds/${build.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: nextContent, template: nextTemplate, name: nextName }),
      });
      const updated = await res.json();
      setBuild(updated);
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  }

  function moveSection(index: number, dir: -1 | 1) {
    const order = [...content.sectionOrder];
    const target = index + dir;
    if (target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target], order[index]];
    const next = { ...content, sectionOrder: order };
    setContent(next);
    save(next);
  }

  async function exportFile(kind: "pdf" | "docx") {
    setExporting(kind);
    try {
      const res = await fetch(`/api/cv-builds/${build.id}/export/${kind}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${build.name.replace(/[^\w\- ]/g, "")}.${kind}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div className="flex flex-col gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2">
            <Input value={build.name} onChange={(e) => setBuild({ ...build, name: e.target.value })} onBlur={() => save(content, build.template, build.name)} />
          </div>
          <label className="mt-3 flex flex-col gap-1 text-sm">
            <span style={{ color: "var(--ink-2)" }}>Template</span>
            <select
              className="rounded-md border px-2 py-1.5 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
              value={build.template}
              onChange={(e) => {
                const template = e.target.value as CvTemplate;
                setBuild({ ...build, template });
                save(content, template, build.name);
              }}
            >
              {CV_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-2 text-xs" style={{ color: "var(--ink-muted)" }}>
            All templates are single-column with no tables, text boxes, or icons — ATS-safe by construction.
          </p>
        </div>

        <div className="card p-4">
          <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
            Section order
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {content.sectionOrder.map((section, i) => (
              <li key={section} className="flex items-center justify-between rounded-md px-2 py-1 text-sm" style={{ background: "var(--surface-2)" }}>
                {SECTION_LABELS[section]}
                <span className="flex gap-1">
                  <button onClick={() => moveSection(i, -1)} disabled={i === 0} className="disabled:opacity-30">
                    ↑
                  </button>
                  <button onClick={() => moveSection(i, 1)} disabled={i === content.sectionOrder.length - 1} className="disabled:opacity-30">
                    ↓
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-4">
          <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
            Professional Summary
          </p>
          <TextArea
            className="mt-2 h-24"
            value={content.summary}
            onChange={(e) => setContent({ ...content, summary: e.target.value })}
            onBlur={() => save()}
          />
        </div>

        <div className="card p-4">
          <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
            Skills (comma-separated)
          </p>
          <TextArea
            className="mt-2 h-16"
            value={content.skills.join(", ")}
            onChange={(e) => setContent({ ...content, skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
            onBlur={() => save()}
          />
        </div>

        <div className="card p-4">
          <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
            Experience
          </p>
          <div className="mt-2 flex flex-col gap-3">
            {content.experience.map((job, i) => (
              <div key={i} className="rounded-md border p-2" style={{ borderColor: "var(--border)" }}>
                <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                  {job.jobTitle} — {job.company}
                </p>
                <ul className="mt-1 flex flex-col gap-1">
                  {job.bullets.map((b, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <TextArea
                        value={b.text}
                        onChange={(e) => {
                          const next = { ...content };
                          next.experience[i].bullets[j] = { ...b, text: e.target.value };
                          setContent({ ...next });
                        }}
                        onBlur={() => save()}
                      />
                      {!b.evidenceRef && (
                        <span className="mt-1 text-[10px] whitespace-nowrap" style={{ color: "var(--partial)" }}>
                          unverified
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportFile("pdf")}
            disabled={exporting !== null}
            className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ background: "var(--accent)" }}
          >
            {exporting === "pdf" ? "Exporting…" : "Export PDF"}
          </button>
          <button
            onClick={() => exportFile("docx")}
            disabled={exporting !== null}
            className="rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60"
            style={{ background: "var(--surface-2)", color: "var(--ink)" }}
          >
            {exporting === "docx" ? "Exporting…" : "Export DOCX"}
          </button>
          {saving ? (
            <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
              Saving…
            </span>
          ) : (
            savedAt && (
              <span className="text-xs" style={{ color: "var(--strong)" }}>
                Saved
              </span>
            )
          )}
        </div>
      </div>

      <div className="relative overflow-auto rounded-lg" style={{ background: "var(--surface-2)", maxHeight: "85vh" }}>
        <button
          onClick={() => router.push("/cv-builder")}
          title="Close preview"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-sm"
          style={{ background: "var(--surface)", color: "var(--ink-2)", border: "1px solid var(--border)" }}
        >
          <X size={16} />
        </button>
        <div className="p-4">
          <CvPreview content={content} template={build.template} />
        </div>
      </div>
    </div>
  );
}
