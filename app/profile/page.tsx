import { getProfile } from "@/lib/server/collections/profile";
import { listActiveJobs } from "@/lib/server/collections/backgroundJobs";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { ProfileCvImportPanel } from "@/components/profile/ProfileCvImportPanel";

export default function ProfilePage() {
  const profile = getProfile();
  // Only resume jobs from this page's own ephemeral upload flow (refTable null) — the
  // CV-detail-page import flow uses the same job kind but has a real cvs refTable/refId.
  const activeImportJob = listActiveJobs("profile_import_suggestion").find((j) => j.refTable === null) ?? null;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>
          My Career Profile
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
          This is the source of truth the AI uses when matching you against jobs — the more detail
          and evidence you add, the better it can distinguish a genuine strong match from a guess.
        </p>
      </div>
      <ProfileCvImportPanel initialActiveJob={activeImportJob} />
      <ProfileEditor initialProfile={profile} />
    </div>
  );
}
