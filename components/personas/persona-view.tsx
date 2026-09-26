import { UserCircle2 } from "lucide-react";
import type { PersonaRow } from "@/lib/personas/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Renders a list of tag-badges for a single persona attribute.
 * Returns null when empty, so no empty sections appear.
 */
function TagGroup({
  label,
  tags,
}: {
  label: string;
  tags: string[] | null;
}) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t, i) => (
          <Badge
            key={i}
            variant="secondary"
            className="text-[11px] font-normal px-2 py-0.5"
          >
            {t}
          </Badge>
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
    <div className="flex flex-col rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
      {/* Card Header — full width primary blue band */}
      <div className="flex items-start justify-between bg-primary px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white border border-white/20">
            <UserCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white leading-tight tracking-tight">
              {persona.name}
            </h3>
            {persona.role && (
              <p className="mt-0.5 text-[11px] font-medium text-white/80 uppercase tracking-widest">
                {persona.role}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-4">
          <Button variant="outline" size="sm" onClick={onEdit} className="h-7 px-3 text-xs bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white">
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onArchive}
            disabled={isArchiving}
            className="h-7 px-3 text-xs text-white/70 hover:text-white hover:bg-white/10"
          >
            {isArchiving ? "…" : "Archive"}
          </Button>
        </div>
      </div>

      {/* Card Body — 2-column content grid on sm+ */}
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          {/* LEFT column */}
          <div className="space-y-5">
            <TagGroup label="Goals" tags={persona.goals} />
            <TagGroup label="Motivations" tags={persona.motivations} />
            <TagGroup label="Decision Criteria" tags={persona.decision_criteria} />
            <TagGroup label="Messaging Angles" tags={persona.messaging_angles} />
          </div>

          {/* RIGHT column */}
          <div className="space-y-5">
            <TagGroup label="Pain Points" tags={persona.pain_points} />
            <TagGroup label="Common Objections" tags={persona.objections} />
            <TagGroup label="Preferred Channels" tags={persona.preferred_channels} />
          </div>
        </div>
      </div>
    </div>
  );
}
