"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserRound,
  FileText,
  Briefcase,
  Wand2,
  Mail,
  ScrollText,
  MessagesSquare,
  ListChecks,
  Settings as SettingsIcon,
  ShieldCheck,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { BackgroundJobsIndicator } from "./BackgroundJobsIndicator";

const NAV_GROUPS: { label: string; items: { href: string; label: string; icon: typeof LayoutDashboard }[] }[] = [
  {
    label: "Overview",
    items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Career Data",
    items: [
      { href: "/profile", label: "My Career Profile", icon: UserRound },
      { href: "/cvs", label: "My CVs", icon: FileText },
    ],
  },
  {
    label: "Job Search",
    items: [
      { href: "/jobs", label: "Job Matches", icon: Briefcase },
      { href: "/cv-builder", label: "CV Builder", icon: Wand2 },
      { href: "/cover-letters", label: "Cover Letters", icon: Mail },
      { href: "/supporting-statements", label: "Supporting Statements", icon: ScrollText },
      { href: "/interview-prep", label: "Interview Preparation", icon: MessagesSquare },
      { href: "/applications", label: "Application Tracker", icon: ListChecks },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex h-full w-64 shrink-0 flex-col justify-between overflow-y-auto border-r p-4"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div>
        <div className="mb-6 flex items-center gap-2 px-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-strong))" }}
          >
            CT
          </div>
          <span className="font-serif-display text-lg font-semibold" style={{ color: "var(--ink)" }}>
            CV Tailor
          </span>
        </div>

        <nav className="flex flex-col gap-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-muted)" }}>
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium"
                      style={{
                        background: active ? "var(--accent-soft)" : "transparent",
                        color: active ? "var(--accent-strong)" : "var(--ink-2)",
                      }}
                    >
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full"
                          style={{ background: "var(--accent)" }}
                        />
                      )}
                      <Icon size={16} strokeWidth={2} style={{ opacity: active ? 1 : 0.75 }} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-5 border-t pt-3" style={{ borderColor: "var(--border)" }}>
          <Link
            href="/settings"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium"
            style={{
              background: pathname.startsWith("/settings") ? "var(--accent-soft)" : "transparent",
              color: pathname.startsWith("/settings") ? "var(--accent-strong)" : "var(--ink-2)",
            }}
          >
            <SettingsIcon size={16} strokeWidth={2} />
            Settings
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <BackgroundJobsIndicator />
        <ThemeToggle />
        <div className="rounded-xl p-3 text-xs leading-relaxed" style={{ background: "var(--surface-2)", color: "var(--ink-muted)" }}>
          <p className="mb-1 flex items-center gap-1.5 font-semibold" style={{ color: "var(--ink-2)" }}>
            <ShieldCheck size={14} style={{ color: "var(--accent)" }} />
            Private by default
          </p>
          Your CV, profile, and job data stay on this device — all AI runs locally via Ollama.
        </div>
      </div>
    </aside>
  );
}
