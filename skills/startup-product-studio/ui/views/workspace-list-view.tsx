'use client';

import { useState, useCallback } from 'react';
import type { SkillViewProps } from './skill-view-props';
import { StudioWorkspaceCard } from '../components/studio-workspace-card';
import { CreateStudioDialog } from '../components/create-studio-dialog';

/**
 * Entry component for the workspace-list view.
 * Rendered by Seoul's SkillViewHost when viewId === 'workspace-list'.
 */
export function WorkspaceListView({ context }: SkillViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { skillId, workspaces, createWorkspace, navigateToWorkspace } = context;

  const handleCreate = useCallback(
    async (params: Parameters<typeof createWorkspace>[0]) => {
      const ws = await createWorkspace(params);
      return ws;
    },
    [createWorkspace],
  );

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Product Studio</h1>
        <button
          data-testid="new-studio-btn"
          onClick={() => setDialogOpen(true)}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          New Studio
        </button>
      </div>

      {workspaces.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No product studios yet. Create one to get started.
        </p>
      ) : (
        <div data-testid="studio-list" className="space-y-2">
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              onClick={() => navigateToWorkspace(ws.id)}
              className="cursor-pointer"
            >
              <StudioWorkspaceCard workspace={ws} />
            </div>
          ))}
        </div>
      )}

      <CreateStudioDialog
        skillId={skillId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreateWorkspace={handleCreate}
      />
    </div>
  );
}
