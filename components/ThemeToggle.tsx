"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

type ThemePref = "system" | "light" | "dark";

const CYCLE: Record<ThemePref, ThemePref> = { system: "light", light: "dark", dark: "system" };
const ICON = { system: Monitor, light: Sun, dark: Moon } as const;
const LABEL = { system: "System theme", light: "Light theme", dark: "Dark theme" } as const;

export function ThemeToggle() {
  const [pref, setPref] = useState<ThemePref>("system");

  useEffect(() => {
    const stored = localStorage.getItem("cf-theme") as ThemePref | null;
    if (stored === "light" || stored === "dark") setPref(stored);
  }, []);

  function apply(next: ThemePref) {
    setPref(next);
    if (next === "system") {
      localStorage.removeItem("cf-theme");
      document.documentElement.removeAttribute("data-theme");
    } else {
      localStorage.setItem("cf-theme", next);
      document.documentElement.setAttribute("data-theme", next);
    }
  }

  const Icon = ICON[pref];

  return (
    <button
      onClick={() => apply(CYCLE[pref])}
      title={`${LABEL[pref]} — click to change`}
      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium"
      style={{ color: "var(--ink-muted)" }}
    >
      <Icon size={14} />
      {LABEL[pref]}
    </button>
  );
}
