import Link from "next/link";
import { Briefcase, FileText, ListChecks, Sparkles, ArrowRight } from "lucide-react";
import { getProfile, isProfileUsable } from "@/lib/server/collections/profile";
import { listCvs } from "@/lib/server/collections/cvs";
import { listJobs } from "@/lib/server/collections/jobs";
import { listApplications } from "@/lib/server/collections/applications";
import { getLatestMatch } from "@/lib/server/collections/matches";
import { ScoreGauge } from "@/components/ScoreGauge";

export default function DashboardPage() {
  const profile = getProfile();
  const cvs = listCvs();
  const jobs = listJobs().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const applications = listApplications();
  const usable = isProfileUsable(profile);

  const latestMatchedJob = jobs.map((j) => ({ job: j, match: getLatestMatch(j.id) })).find((x) => x.match);

  return (
    <div className="flex flex-col gap-8 cf-fade-in">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="font-serif-display text-3xl font-semibold" style={{ color: "var(--ink)" }}>
          Welcome back{profile.personalInfo.name ? `, ${profile.personalInfo.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
          Your private AI career assistant. Everything below runs locally — nothing leaves this device.
        </p>
      </div>

      {!usable && (
        <div className="card flex items-start gap-4 p-5" style={{ borderColor: "var(--accent)" }}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--accent-soft)" }}>
            <Sparkles size={18} style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <p className="font-medium" style={{ color: "var(--ink)" }}>
              Start with your Career Profile
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
              Job matching compares your structured Career Profile against a job description — not just
              an uploaded CV — so evidence can be traced back to specific entries. Build it directly, or
              upload a CV first and import from it.
            </p>
            <div className="mt-3 flex gap-3">
              <Link href="/profile" className="rounded-lg px-3 py-1.5 text-sm font-medium text-white" style={{ background: "var(--accent)" }}>
                Build my profile
              </Link>
              <Link href="/cvs" className="rounded-lg px-3 py-1.5 text-sm font-medium" style={{ background: "var(--surface-2)", color: "var(--ink)" }}>
                Upload a CV instead
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={UserIconGlyph} label="Employment entries" value={profile.employment.length} />
        <StatCard icon={SkillIconGlyph} label="Skills recorded" value={profile.skills.length} />
        <StatCard icon={FileText} label="CVs uploaded" value={cvs.length} />
        <StatCard icon={ListChecks} label="Applications tracked" value={applications.length} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="card col-span-2 p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold" style={{ color: "var(--ink)" }}>
              <Briefcase size={16} style={{ color: "var(--accent)" }} />
              Job Matches
            </h2>
            <Link href="/jobs/new" className="flex items-center gap-1 text-sm font-medium" style={{ color: "var(--accent)" }}>
              Analyse a new job <ArrowRight size={14} />
            </Link>
          </div>
          {jobs.length === 0 ? (
            <p className="mt-3 text-sm" style={{ color: "var(--ink-muted)" }}>
              No jobs analysed yet.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-1">
              {jobs.slice(0, 5).map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm"
                    style={{ transition: "background 140ms" }}
                  >
                    <span style={{ color: "var(--ink)" }}>
                      {job.title || "Untitled role"}
                      {job.company ? ` — ${job.company}` : ""}
                    </span>
                    <span style={{ color: "var(--ink-muted)" }}>{new Date(job.createdAt).toLocaleDateString()}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card flex flex-col items-center justify-center p-5 text-center">
          {latestMatchedJob?.match ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-muted)" }}>
                Latest match
              </p>
              <div className="mt-2">
                <ScoreGauge score={latestMatchedJob.match.overallScore} label="Overall" />
              </div>
              <p className="mt-2 text-sm font-medium" style={{ color: "var(--ink)" }}>
                {latestMatchedJob.job.title || "Untitled role"}
              </p>
              <Link href={`/jobs/${latestMatchedJob.job.id}`} className="mt-1 text-xs font-medium" style={{ color: "var(--accent)" }}>
                View details →
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
                Run your first job match to see a score here.
              </p>
              <Link href="/jobs/new" className="mt-2 text-sm font-medium" style={{ color: "var(--accent)" }}>
                Analyse a job →
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function UserIconGlyph(props: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={props.size ?? 16} height={props.size ?? 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={props.style}>
      <path d="M20 21a8 8 0 0 0-16 0" strokeLinecap="round" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SkillIconGlyph(props: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={props.size ?? 16} height={props.size ?? 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={props.style}>
      <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" strokeLinejoin="round" />
    </svg>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; label: string; value: number }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <p className="text-2xl font-bold" style={{ color: "var(--ink)" }}>
          {value}
        </p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--accent-soft)" }}>
          <Icon size={15} style={{ color: "var(--accent)" }} />
        </div>
      </div>
      <p className="mt-1 text-xs" style={{ color: "var(--ink-muted)" }}>
        {label}
      </p>
    </div>
  );
}
