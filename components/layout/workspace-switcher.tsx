"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { switchWorkspaceAction } from "@/lib/actions/workspace-actions";
import { ChevronDown, Plus } from "lucide-react";

export type WorkspaceSwitcherProps = {
  workspaces: { id: string; name: string; slug: string }[];
  currentWorkspaceId?: string;
  currentProductSlug?: string;
  productName?: string;
};

export function WorkspaceSwitcher({ workspaces, currentWorkspaceId, currentProductSlug, productName }: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId) || workspaces[0];

  async function handleSwitch(workspaceId: string) {
    if (workspaceId === currentWorkspaceId) return;
    setLoadingId(workspaceId);
    try {
      const result = await switchWorkspaceAction(workspaceId, currentProductSlug);
      if (result.url) {
        router.push(result.url);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  }

  function handleCreate() {
    router.push("/onboarding?mode=create-workspace");
  }

  if (!currentWorkspace) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex py-3.5 w-full items-center justify-between border-b border-border-subtle px-5 hover:bg-muted/50 transition-colors focus:outline-none text-left"
          aria-label="Select workspace"
        >
          <div className="flex flex-col gap-0.5 truncate">
            <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Workspace
            </span>
            <span className="truncate font-display text-sm font-semibold tracking-tight text-foreground">
              {currentWorkspace.name}
            </span>
            {productName && (
              <span className="truncate text-xs font-medium text-foreground-secondary mt-0.5">
                {productName}
              </span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start" alignOffset={16}>
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onSelect={() => handleSwitch(ws.id)}
            className="flex items-center justify-between cursor-pointer"
            disabled={loadingId === ws.id}
          >
            <span className="truncate">{ws.name}</span>
            {loadingId === ws.id && (
              <span className="flex h-2 w-2 rounded-full bg-muted-foreground animate-pulse" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleCreate} className="cursor-pointer text-muted-foreground">
          <Plus className="mr-2 h-4 w-4" />
          <span>Create workspace</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
