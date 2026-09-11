"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { LeadForm } from "./lead-form";
import type { LeadRow } from "@/lib/leads/types";
import { archiveLeadAction } from "@/lib/leads/actions";

export function LeadList({
  productId,
  leads: initialLeads,
}: {
  productId: string;
  leads: LeadRow[];
}) {
  const [leads, setLeads] = useState<LeadRow[]>(initialLeads);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  async function handleArchive(leadId: string) {
    setArchivingId(leadId);
    const result = await archiveLeadAction(productId, leadId);
    setArchivingId(null);
    if (result.ok) {
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
    } else {
      alert(`Failed to archive lead: ${result.error.message}`);
    }
  }

  function handleCreated(newLead: LeadRow) {
    setLeads((prev) => [...prev, newLead]);
    setIsCreating(false);
  }

  function handleUpdated(updatedLead: LeadRow) {
    setLeads((prev) =>
      prev.map((l) => (l.id === updatedLead.id ? updatedLead : l))
    );
    setEditingId(null);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-foreground">Leads ({leads.length})</h2>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Lead
          </button>
        )}
      </div>

      {isCreating && (
        <div className="rounded-md border border-border bg-surface p-6 shadow-sm">
          <h3 className="mb-6 text-sm font-medium text-foreground">Create New Lead</h3>
          <LeadForm
            productId={productId}
            onSuccess={handleCreated}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      )}

      {leads.length === 0 && !isCreating && (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted">No leads added yet.</p>
          <button onClick={() => setIsCreating(true)} className="mt-4 text-sm font-medium text-primary hover:underline">
            Add your first lead
          </button>
        </div>
      )}

      <div className="grid gap-4">
        {leads.map((lead) =>
          editingId === lead.id ? (
            <div key={lead.id} className="rounded-md border border-border bg-surface p-6 shadow-sm">
              <h3 className="mb-6 text-sm font-medium text-foreground">Edit Lead</h3>
              <LeadForm
                productId={productId}
                lead={lead}
                onSuccess={handleUpdated}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <div key={lead.id} className="flex items-center justify-between rounded-md border border-border bg-surface p-4">
              <div>
                <div className="font-medium text-foreground">{lead.company} — {lead.contact}</div>
                <div className="text-sm text-muted">{lead.role || "No role"} | {lead.email || "No email"} | {lead.status}</div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setEditingId(lead.id)} className="text-sm text-muted hover:text-foreground">
                  Edit
                </button>
                <button
                  onClick={() => handleArchive(lead.id)}
                  disabled={archivingId === lead.id}
                  className="text-sm text-red-500 hover:text-red-600 disabled:opacity-50"
                >
                  {archivingId === lead.id ? "Archiving..." : "Archive"}
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
