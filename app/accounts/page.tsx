import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Accounts" };

export default function AccountsPage() {
  return (
    <PagePlaceholder
      title="Accounts"
      description="Companies and target accounts will live here. This section is reserved for a later phase."
    />
  );
}
