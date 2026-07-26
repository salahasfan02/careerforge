"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

/**
 * A standalone delete control — never nested inside a Link/anchor (invalid HTML and
 * fragile click handling). Place it as a sibling of the row's link, not a child.
 */
export function DeleteButton({
  url,
  confirmMessage = "Delete this? This can't be undone.",
  onDeleted,
}: {
  url: string;
  confirmMessage?: string;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(confirmMessage)) return;
    setDeleting(true);
    try {
      await fetch(url, { method: "DELETE" });
      if (onDeleted) {
        onDeleted();
      } else {
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      title="Delete"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md disabled:opacity-50"
      style={{ color: "var(--danger)" }}
    >
      <Trash2 size={14} />
    </button>
  );
}
