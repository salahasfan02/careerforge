"use client";

import { useState } from "react";
import type {
  CareerProfile,
  CertificationEntry,
  EducationEntry,
  EmploymentEntry,
  HighlightType,
  ProjectEntry,
  SkillEntry,
  SkillLevel,
} from "@/lib/server/types";

async function api(path: string, method: string, body?: unknown) {
  const res = await fetch(`/api/profile${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Request failed");
  return res.json() as Promise<CareerProfile>;
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="card p-6">
      <h2 className="text-lg font-semibold" style={{ color: "var(--ink)" }}>
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
          {description}
        </p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-md border px-3 py-1.5 text-sm outline-none"
      style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full rounded-md border px-3 py-1.5 text-sm outline-none"
      style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
    />
  );
}

function Button({ variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const styles = {
    primary: { background: "var(--accent)", color: "white" },
    ghost: { background: "var(--surface-2)", color: "var(--ink)" },
    danger: { background: "transparent", color: "var(--danger)" },
  }[variant];
  return (
    <button
      {...props}
      className="rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50"
      style={styles}
    />
  );
}

export function ProfileEditor({ initialProfile }: { initialProfile: CareerProfile }) {
  const [profile, setProfile] = useState(initialProfile);

  return (
    <div className="flex flex-col gap-6">
      <PersonalInfoSection profile={profile} setProfile={setProfile} />
      <EmploymentSection profile={profile} setProfile={setProfile} />
      <SkillsSection profile={profile} setProfile={setProfile} />
      <EducationSection profile={profile} setProfile={setProfile} />
      <ProjectsSection profile={profile} setProfile={setProfile} />
      <CertificationsSection profile={profile} setProfile={setProfile} />
    </div>
  );
}

type SetProfile = React.Dispatch<React.SetStateAction<CareerProfile>>;

function PersonalInfoSection({ profile, setProfile }: { profile: CareerProfile; setProfile: SetProfile }) {
  const [form, setForm] = useState(profile.personalInfo);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const updated = await res.json();
      setProfile(updated);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Personal Information">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextInput placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <TextInput placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <TextInput placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <TextInput placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <TextInput placeholder="LinkedIn URL" value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
        <TextInput placeholder="GitHub URL" value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} />
        <TextInput placeholder="Portfolio URL" value={form.portfolio} onChange={(e) => setForm({ ...form, portfolio: e.target.value })} />
        <TextInput placeholder="Personal website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
      </div>
      <div className="mt-3">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </SectionCard>
  );
}

const EMPTY_EMPLOYMENT = { company: "", jobTitle: "", location: "", startDate: "", endDate: "" };
const HIGHLIGHT_TYPES: HighlightType[] = ["responsibility", "achievement", "technology", "project"];

function EmploymentSection({ profile, setProfile }: { profile: CareerProfile; setProfile: SetProfile }) {
  const [form, setForm] = useState(EMPTY_EMPLOYMENT);
  const [highlightDrafts, setHighlightDrafts] = useState<Record<number, { type: HighlightType; text: string }>>({});

  async function addEmployment() {
    if (!form.company.trim()) return;
    const updated = await api("/employment", "POST", form);
    setProfile(updated);
    setForm(EMPTY_EMPLOYMENT);
  }

  async function removeEmployment(id: number) {
    setProfile(await api(`/employment/${id}`, "DELETE"));
  }

  async function addHighlight(employmentId: number) {
    const draft = highlightDrafts[employmentId];
    if (!draft?.text.trim()) return;
    const updated = await api(`/employment/${employmentId}/highlights`, "POST", draft);
    setProfile(updated);
    setHighlightDrafts({ ...highlightDrafts, [employmentId]: { type: "responsibility", text: "" } });
  }

  async function removeHighlight(employmentId: number, highlightId: number) {
    setProfile(await api(`/employment/${employmentId}/highlights/${highlightId}`, "DELETE"));
  }

  return (
    <SectionCard title="Employment History" description="For each job, add responsibilities, achievements, technologies, and projects as separate highlights.">
      <div className="flex flex-col gap-4">
        {profile.employment.map((job: EmploymentEntry) => (
          <div key={job.id} className="rounded-lg border p-4" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium" style={{ color: "var(--ink)" }}>
                  {job.jobTitle} — {job.company}
                </p>
                <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                  {job.location} · {job.startDate} – {job.endDate || "Present"}
                </p>
              </div>
              <Button variant="danger" onClick={() => removeEmployment(job.id)}>
                Remove
              </Button>
            </div>

            <ul className="mt-3 flex flex-col gap-1.5">
              {job.highlights.map((h) => (
                <li key={h.id} className="flex items-center justify-between rounded-md px-2 py-1 text-sm" style={{ background: "var(--surface-2)" }}>
                  <span>
                    <span className="mr-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase" style={{ background: "var(--accent-soft)", color: "var(--accent-strong)" }}>
                      {h.type}
                    </span>
                    {h.text}
                  </span>
                  <button onClick={() => removeHighlight(job.id, h.id)} style={{ color: "var(--danger)" }} className="text-xs">
                    ✕
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-2 flex gap-2">
              <select
                className="rounded-md border px-2 py-1.5 text-sm"
                style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
                value={highlightDrafts[job.id]?.type ?? "responsibility"}
                onChange={(e) =>
                  setHighlightDrafts({
                    ...highlightDrafts,
                    [job.id]: { type: e.target.value as HighlightType, text: highlightDrafts[job.id]?.text ?? "" },
                  })
                }
              >
                {HIGHLIGHT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <TextInput
                placeholder="Describe a responsibility, achievement, technology, or project"
                value={highlightDrafts[job.id]?.text ?? ""}
                onChange={(e) =>
                  setHighlightDrafts({
                    ...highlightDrafts,
                    [job.id]: { type: highlightDrafts[job.id]?.type ?? "responsibility", text: e.target.value },
                  })
                }
              />
              <Button variant="ghost" onClick={() => addHighlight(job.id)}>
                Add
              </Button>
            </div>
          </div>
        ))}

        <div className="rounded-lg border border-dashed p-4" style={{ borderColor: "var(--border)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <TextInput placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            <TextInput placeholder="Job title" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
            <TextInput placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <div className="flex gap-2">
              <TextInput placeholder="Start (e.g. 2021-06)" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              <TextInput placeholder="End (blank = present)" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div className="mt-2">
            <Button onClick={addEmployment}>+ Add employment</Button>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

const SKILL_LEVELS: SkillLevel[] = ["beginner", "intermediate", "advanced", "expert"];

function SkillsSection({ profile, setProfile }: { profile: CareerProfile; setProfile: SetProfile }) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState<SkillLevel>("intermediate");
  const [evidenceDrafts, setEvidenceDrafts] = useState<Record<number, string>>({});

  async function addSkill() {
    if (!name.trim()) return;
    setProfile(await api("/skills", "POST", { name, level }));
    setName("");
  }

  async function removeSkill(id: number) {
    setProfile(await api(`/skills/${id}`, "DELETE"));
  }

  async function addEvidence(skillId: number) {
    const text = evidenceDrafts[skillId];
    if (!text?.trim()) return;
    setProfile(await api(`/skills/${skillId}/evidence`, "POST", { text, where: "employment", verified: false }));
    setEvidenceDrafts({ ...evidenceDrafts, [skillId]: "" });
  }

  async function removeEvidence(skillId: number, evidenceId: number) {
    setProfile(await api(`/skills/${skillId}/evidence/${evidenceId}`, "DELETE"));
  }

  return (
    <SectionCard title="Skills" description="Add supporting evidence for each skill — matching relies on this to distinguish a strong match from an unsupported claim.">
      <div className="flex flex-col gap-3">
        {profile.skills.map((skill: SkillEntry) => (
          <div key={skill.id} className="rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between">
              <p className="font-medium" style={{ color: "var(--ink)" }}>
                {skill.name}{" "}
                <span className="text-xs font-normal" style={{ color: "var(--ink-muted)" }}>
                  ({skill.level})
                </span>
              </p>
              <Button variant="danger" onClick={() => removeSkill(skill.id)}>
                Remove
              </Button>
            </div>
            <ul className="mt-2 flex flex-col gap-1">
              {skill.evidence.map((ev) => (
                <li key={ev.id} className="flex items-center justify-between rounded-md px-2 py-1 text-xs" style={{ background: "var(--surface-2)" }}>
                  {ev.text}
                  <button onClick={() => removeEvidence(skill.id, ev.id)} style={{ color: "var(--danger)" }}>
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <TextInput
                placeholder="Evidence, e.g. Built ML models using Python and scikit-learn"
                value={evidenceDrafts[skill.id] ?? ""}
                onChange={(e) => setEvidenceDrafts({ ...evidenceDrafts, [skill.id]: e.target.value })}
              />
              <Button variant="ghost" onClick={() => addEvidence(skill.id)}>
                Add
              </Button>
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <TextInput placeholder="Skill name" value={name} onChange={(e) => setName(e.target.value)} />
          <select
            className="rounded-md border px-2 py-1.5 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
            value={level}
            onChange={(e) => setLevel(e.target.value as SkillLevel)}
          >
            {SKILL_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <Button onClick={addSkill}>+ Add skill</Button>
        </div>
      </div>
    </SectionCard>
  );
}

const EMPTY_EDUCATION = { institution: "", degree: "", subject: "", grade: "", startDate: "", endDate: "", modules: "", projects: "" };

function EducationSection({ profile, setProfile }: { profile: CareerProfile; setProfile: SetProfile }) {
  const [form, setForm] = useState(EMPTY_EDUCATION);

  async function add() {
    if (!form.institution.trim()) return;
    setProfile(await api("/education", "POST", form));
    setForm(EMPTY_EDUCATION);
  }
  async function remove(id: number) {
    setProfile(await api(`/education/${id}`, "DELETE"));
  }

  return (
    <SectionCard title="Education">
      <div className="flex flex-col gap-3">
        {profile.education.map((edu: EducationEntry) => (
          <div key={edu.id} className="flex items-start justify-between rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
            <div>
              <p className="font-medium" style={{ color: "var(--ink)" }}>
                {edu.degree} in {edu.subject}
              </p>
              <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                {edu.institution} · {edu.grade} · {edu.startDate} – {edu.endDate}
              </p>
            </div>
            <Button variant="danger" onClick={() => remove(edu.id)}>
              Remove
            </Button>
          </div>
        ))}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border border-dashed p-4" style={{ borderColor: "var(--border)" }}>
          <TextInput placeholder="Institution" value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
          <TextInput placeholder="Degree" value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} />
          <TextInput placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <TextInput placeholder="Grade" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
          <TextInput placeholder="Start" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          <TextInput placeholder="End" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          <TextArea placeholder="Relevant modules" value={form.modules} onChange={(e) => setForm({ ...form, modules: e.target.value })} />
          <TextArea placeholder="Projects" value={form.projects} onChange={(e) => setForm({ ...form, projects: e.target.value })} />
          <div className="col-span-2">
            <Button onClick={add}>+ Add education</Button>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

const EMPTY_PROJECT = { name: "", description: "", technologies: "", responsibilities: "", results: "", metrics: "", links: "" };

function ProjectsSection({ profile, setProfile }: { profile: CareerProfile; setProfile: SetProfile }) {
  const [form, setForm] = useState(EMPTY_PROJECT);

  async function add() {
    if (!form.name.trim()) return;
    setProfile(await api("/projects", "POST", form));
    setForm(EMPTY_PROJECT);
  }
  async function remove(id: number) {
    setProfile(await api(`/projects/${id}`, "DELETE"));
  }

  return (
    <SectionCard title="Projects">
      <div className="flex flex-col gap-3">
        {profile.projects.map((p: ProjectEntry) => (
          <div key={p.id} className="flex items-start justify-between rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
            <div>
              <p className="font-medium" style={{ color: "var(--ink)" }}>
                {p.name}
              </p>
              <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                {p.description}
              </p>
            </div>
            <Button variant="danger" onClick={() => remove(p.id)}>
              Remove
            </Button>
          </div>
        ))}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border border-dashed p-4" style={{ borderColor: "var(--border)" }}>
          <TextInput placeholder="Project name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextInput placeholder="Technologies" value={form.technologies} onChange={(e) => setForm({ ...form, technologies: e.target.value })} />
          <TextArea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <TextArea placeholder="Results / metrics" value={form.results} onChange={(e) => setForm({ ...form, results: e.target.value })} />
          <TextInput placeholder="Links" value={form.links} onChange={(e) => setForm({ ...form, links: e.target.value })} />
          <div>
            <Button onClick={add}>+ Add project</Button>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

const EMPTY_CERT = { name: "", organisation: "", date: "", expiryDate: "", certificateNumber: "" };

function CertificationsSection({ profile, setProfile }: { profile: CareerProfile; setProfile: SetProfile }) {
  const [form, setForm] = useState(EMPTY_CERT);

  async function add() {
    if (!form.name.trim()) return;
    setProfile(await api("/certifications", "POST", form));
    setForm(EMPTY_CERT);
  }
  async function remove(id: number) {
    setProfile(await api(`/certifications/${id}`, "DELETE"));
  }

  return (
    <SectionCard title="Certifications">
      <div className="flex flex-col gap-3">
        {profile.certifications.map((c: CertificationEntry) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--ink)" }}>
              {c.name} — {c.organisation}
            </p>
            <Button variant="danger" onClick={() => remove(c.id)}>
              Remove
            </Button>
          </div>
        ))}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border border-dashed p-4" style={{ borderColor: "var(--border)" }}>
          <TextInput placeholder="Certification name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextInput placeholder="Organisation" value={form.organisation} onChange={(e) => setForm({ ...form, organisation: e.target.value })} />
          <TextInput placeholder="Date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <TextInput placeholder="Expiry date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
          <div className="col-span-2">
            <Button onClick={add}>+ Add certification</Button>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
