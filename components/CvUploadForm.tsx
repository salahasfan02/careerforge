"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function CvUploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/cvs", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      router.push(`/cvs/${data.id}`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="card p-6">
      <p className="font-medium" style={{ color: "var(--ink)" }}>
        Upload a CV
      </p>
      <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
        PDF, DOCX, TXT, or an image (PNG/JPG) of a scanned CV. Everything is processed locally.
      </p>
      <div className="mt-3 flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          style={{ background: "var(--accent)" }}
        >
          {uploading ? "Processing…" : "Choose file"}
        </button>
        {error && (
          <span className="text-sm" style={{ color: "var(--danger)" }}>
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
