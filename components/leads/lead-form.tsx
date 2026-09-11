"use client";

import { useState, useTransition } from "react";
import { createLeadAction, updateLeadAction } from "@/lib/leads/actions";
import { LEAD_STATUSES } from "@/lib/leads/types";
import type { LeadRow, LeadStatus } from "@/lib/leads/types";
import { cn } from "@/lib/utils";

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium tracking-wide text-muted uppercase">
      {children}
    </label>
  );
}

function TextInput({
  id,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        "w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted",
        "focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50",
      )}
    />
  );
}

function Select({
  id,
  value,
  onChange,
  options,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  disabled?: boolean;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground",
        "focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50",
      )}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

export function LeadForm({
  productId,
  lead,
  onSuccess,
  onCancel,
}: {
  productId: string;
  lead?: LeadRow;
  onSuccess: (lead: LeadRow) => void;
  onCancel: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [company, setCompany] = useState(lead?.company ?? "");
  const [contact, setContact] = useState(lead?.contact ?? "");
  const [role, setRole] = useState(lead?.role ?? "");
  const [email, setEmail] = useState(lead?.email ?? "");
  const [status, setStatus] = useState<LeadStatus>((lead?.status as LeadStatus) ?? "New");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedCompany = company.trim();
    const trimmedContact = contact.trim();

    if (!trimmedCompany || !trimmedContact) {
      setErrorMsg("Company and Contact names are required.");
      return;
    }

    startTransition(async () => {
      const input = {
        company: trimmedCompany,
        contact: trimmedContact,
        role: role.trim() || undefined,
        email: email.trim() || undefined,
        status,
      };

      if (lead) {
        const result = await updateLeadAction(productId, lead.id, input);
        if (result.ok) onSuccess(result.data);
        else setErrorMsg(result.error.message);
      } else {
        const result = await createLeadAction(productId, input);
        if (result.ok) onSuccess(result.data);
        else setErrorMsg(result.error.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="rounded-sm border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600">
          {errorMsg}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="company">Company</Label>
          <TextInput id="company" value={company} onChange={setCompany} disabled={isPending} placeholder="Acme Corp" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact">Contact Name</Label>
          <TextInput id="contact" value={contact} onChange={setContact} disabled={isPending} placeholder="Jane Doe" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role">Role</Label>
          <TextInput id="role" value={role} onChange={setRole} disabled={isPending} placeholder="CTO" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <TextInput id="email" value={email} onChange={setEmail} disabled={isPending} placeholder="jane@acme.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select id="status" value={status} onChange={(v) => setStatus(v as LeadStatus)} options={LEAD_STATUSES} disabled={isPending} />
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <button type="button" onClick={onCancel} disabled={isPending} className="px-4 py-2 text-sm text-foreground hover:bg-surface rounded-sm">
          Cancel
        </button>
        <button type="submit" disabled={isPending} className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm">
          {isPending ? "Saving..." : lead ? "Save Changes" : "Create Lead"}
        </button>
      </div>
    </form>
  );
}
