import { getSettings } from "@/lib/server/collections/settings";
import { SettingsForm } from "@/components/SettingsForm";

export default function SettingsPage() {
  const settings = getSettings();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>
        Settings
      </h1>
      <SettingsForm initialSettings={settings} />
    </div>
  );
}
