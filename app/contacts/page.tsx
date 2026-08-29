import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Contacts" };

export default function ContactsPage() {
  return (
    <PagePlaceholder
      title="Contacts"
      description="People associated with accounts will live here. This section is reserved for a later phase."
    />
  );
}
