"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { LeadForm } from "./lead-form";
import type { LeadRow } from "@/lib/leads/types";
import { archiveLeadAction } from "@/lib/leads/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageToolbar } from "@/components/ui/page-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function getStatusBadgeVariant(status: string) {
  const s = status.toLowerCase();
  if (s === "qualified" || s === "customer") return "success";
  if (s === "disqualified" || s === "archived") return "neutral";
  if (s === "contacted" || s === "engaged") return "info";
  return "default";
}

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
    <div className="space-y-6">
      <PageToolbar
        start={
          <h2 className="text-lg font-medium text-foreground">
            Leads <span className="text-muted-foreground text-sm font-normal ml-1">({leads.length})</span>
          </h2>
        }
        end={
          !isCreating && (
            <Button onClick={() => setIsCreating(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Lead
            </Button>
          )
        }
      />

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

      {leads.length === 0 && !isCreating ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-16 text-center bg-surface/50">
          <p className="text-sm font-medium text-foreground">No leads added yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Add contacts and accounts to start tracking your outbound pipeline.
          </p>
          <Button onClick={() => setIsCreating(true)} variant="outline" size="sm" className="mt-6">
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact / Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) =>
              editingId === lead.id ? (
                <TableRow key={lead.id}>
                  <TableCell colSpan={5} className="p-0">
                    <div className="border-b border-border bg-surface p-6">
                      <h3 className="mb-6 text-sm font-medium text-foreground">Edit Lead</h3>
                      <LeadForm
                        productId={productId}
                        lead={lead}
                        onSuccess={handleUpdated}
                        onCancel={() => setEditingId(null)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{lead.contact || "—"}</div>
                    <div className="text-sm text-muted-foreground">{lead.company}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lead.role || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lead.email || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(lead.status)}>{lead.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => setEditingId(lead.id)}
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleArchive(lead.id)}
                        disabled={archivingId === lead.id}
                        className="text-sm font-medium text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
                      >
                        {archivingId === lead.id ? "Archiving..." : "Archive"}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
