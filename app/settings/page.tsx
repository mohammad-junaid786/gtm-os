import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <PagePlaceholder
      title="Settings"
      description="Workspace and application preferences will live here. This section is reserved for a later phase."
    />
  );
}
