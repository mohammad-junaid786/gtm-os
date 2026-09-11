import { UserCircle2 } from "lucide-react";
import type { PersonaRow } from "@/lib/personas/types";

function TagList({ label, tags }: { label: string; tags: string[] | null }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-medium uppercase tracking-wide text-muted">{label}</h4>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t, i) => (
          <span
            key={i}
            className="inline-flex items-center rounded-sm bg-foreground/8 px-2 py-0.5 text-xs text-foreground"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function PersonaView({
  persona,
  onEdit,
  onArchive,
  isArchiving,
}: {
  persona: PersonaRow;
  onEdit: () => void;
  onArchive: () => void;
  isArchiving: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-surface p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-foreground">{persona.name}</h3>
            <p className="text-sm text-muted">{persona.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="text-sm text-muted hover:text-foreground"
          >
            Edit
          </button>
          <button
            onClick={onArchive}
            disabled={isArchiving}
            className="text-sm text-red-500 hover:text-red-600 disabled:opacity-50"
          >
            {isArchiving ? "Archiving..." : "Archive"}
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-6">
          <TagList label="Goals" tags={persona.goals} />
          <TagList label="Pain Points" tags={persona.pain_points} />
        </div>
        <div className="space-y-6">
          <TagList label="Motivations" tags={persona.motivations} />
          <TagList label="Common Objections" tags={persona.objections} />
        </div>
        <div className="space-y-6">
          <TagList label="Decision Criteria" tags={persona.decision_criteria} />
          <TagList label="Preferred Channels" tags={persona.preferred_channels} />
          <TagList label="Messaging Angles" tags={persona.messaging_angles} />
        </div>
      </div>
    </div>
  );
}
