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
    <div className="h-full flex flex-col overflow-hidden min-h-0">
      <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Product Studio</h1>
          <button
            data-testid="new-studio-btn"
            onClick={() => setDialogOpen(true)}
            className="cursor-pointer rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 active:bg-primary/80 transition-colors"
          >
            New Studio
          </button>
        </div>

        {workspaces.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center space-y-3">
            <p className="text-sm font-medium">No product studios yet</p>
            <p className="text-xs text-muted-foreground">
              Create one to get started building your product end-to-end.
            </p>
          </div>
        ) : (
          <div data-testid="studio-list" className="space-y-2">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                onClick={() => navigateToWorkspace(ws.id)}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigateToWorkspace(ws.id); }}
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
    </div>
  );
}
