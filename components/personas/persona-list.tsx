"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PersonaView } from "./persona-view";
import { PersonaForm } from "./persona-form";
import type { PersonaRow } from "@/lib/personas/types";
import { archivePersonaAction } from "@/lib/personas/actions";

export function PersonaList({
  productId,
  icpId,
  personas: initialPersonas,
}: {
  productId: string;
  icpId: string;
  personas: PersonaRow[];
}) {
  const [personas, setPersonas] = useState<PersonaRow[]>(initialPersonas);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  async function handleArchive(personaId: string) {
    setArchivingId(personaId);
    const result = await archivePersonaAction(productId, icpId, personaId);
    setArchivingId(null);
    if (result.ok) {
      setPersonas((prev) => prev.filter((p) => p.id !== personaId));
    } else {
      alert(`Failed to archive persona: ${result.error.message}`);
    }
  }

  function handleCreated(newPersona: PersonaRow) {
    setPersonas((prev) => [...prev, newPersona]);
    setIsCreating(false);
  }

  function handleUpdated(updatedPersona: PersonaRow) {
    setPersonas((prev) =>
      prev.map((p) => (p.id === updatedPersona.id ? updatedPersona : p))
    );
    setEditingId(null);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-foreground">Personas ({personas.length})</h2>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Persona
          </button>
        )}
      </div>

      {isCreating && (
        <div className="rounded-md border border-border bg-surface p-6 shadow-sm">
          <h3 className="mb-6 text-sm font-medium text-foreground">Create New Persona</h3>
          <PersonaForm
            productId={productId}
            icpId={icpId}
            onSuccess={handleCreated}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      )}

      {personas.length === 0 && !isCreating && (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted">No personas defined for this ICP yet.</p>
          <button
            onClick={() => setIsCreating(true)}
            className="mt-4 text-sm font-medium text-primary hover:underline"
          >
            Create your first persona
          </button>
        </div>
      )}

      <div className="grid gap-6">
        {personas.map((persona) =>
          editingId === persona.id ? (
            <div key={persona.id} className="rounded-md border border-border bg-surface p-6 shadow-sm">
              <h3 className="mb-6 text-sm font-medium text-foreground">Edit Persona</h3>
              <PersonaForm
                productId={productId}
                icpId={icpId}
                persona={persona}
                onSuccess={handleUpdated}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <PersonaView
              key={persona.id}
              persona={persona}
              onEdit={() => setEditingId(persona.id)}
              onArchive={() => handleArchive(persona.id)}
              isArchiving={archivingId === persona.id}
            />
          )
        )}
      </div>
    </div>
  );
}
