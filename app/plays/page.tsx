import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Plays" };

export default function PlaysPage() {
  return (
    <PagePlaceholder
      title="Plays"
      description="Repeatable go-to-market plays will live here. This section is reserved for a later phase."
    />
  );
}
