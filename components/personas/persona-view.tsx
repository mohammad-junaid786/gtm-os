import { UserCircle2 } from "lucide-react";
import type { PersonaRow } from "@/lib/personas/types";
import { Button } from "@/components/ui/button";

function TagList({ label, tags }: { label: string; tags: string[] | null }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</h4>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t, i) => (
          <span
            key={i}
            className="inline-flex items-center bg-foreground/5 px-2 py-0.5 text-xs text-foreground"
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
    <div className="py-2">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10 text-primary">
            <UserCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">{persona.name}</h3>
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">{persona.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onArchive}
            disabled={isArchiving}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            {isArchiving ? "Archiving..." : "Archive"}
          </Button>
        </div>
      </div>

      <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-8">
          <TagList label="Goals" tags={persona.goals} />
          <TagList label="Pain Points" tags={persona.pain_points} />
        </div>
        <div className="space-y-8">
          <TagList label="Motivations" tags={persona.motivations} />
          <TagList label="Common Objections" tags={persona.objections} />
        </div>
        <div className="space-y-8">
          <TagList label="Decision Criteria" tags={persona.decision_criteria} />
          <TagList label="Preferred Channels" tags={persona.preferred_channels} />
          <TagList label="Messaging Angles" tags={persona.messaging_angles} />
        </div>
      </div>
      
      <hr className="mt-10 border-border" />
    </div>
  );
}
