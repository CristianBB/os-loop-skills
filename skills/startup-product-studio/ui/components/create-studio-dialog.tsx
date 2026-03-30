'use client';

import { useState, useCallback } from 'react';
type UUIDv7 = string;
import type { CreateWorkspaceParams } from '../views/skill-view-props';
import type { StudioState, CodeProjectType, ProjectRecord } from '../types';
import { CODE_PROJECT_TYPE_LABELS } from '../types';

interface CodeProjectEntry {
  name: string;
  type: CodeProjectType;
  techStack: string;
}

interface CreateStudioDialogProps {
  skillId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateWorkspace: (params: CreateWorkspaceParams) => Promise<unknown>;
}

export function CreateStudioDialog({
  skillId,
  open,
  onOpenChange,
  onCreateWorkspace,
}: CreateStudioDialogProps) {
  const [studioName, setStudioName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [codeProjects, setCodeProjects] = useState<CodeProjectEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setStudioName('');
    setProjectName('');
    setProjectDescription('');
    setCodeProjects([]);
    setError(null);
    onOpenChange(false);
  }, [onOpenChange]);

  function addCodeProject() {
    setCodeProjects((prev) => [...prev, { name: '', type: 'web', techStack: '' }]);
  }

  function updateCodeProject(index: number, field: keyof CodeProjectEntry, value: string) {
    setCodeProjects((prev) =>
      prev.map((cp, i) => (i === index ? { ...cp, [field]: value } : cp)),
    );
  }

  function removeCodeProject(index: number) {
    setCodeProjects((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedStudio = studioName.trim();
    const trimmedProject = projectName.trim();
    const trimmedDesc = projectDescription.trim();
    if (!trimmedStudio || !trimmedProject || !trimmedDesc) return;

    setSubmitting(true);
    setError(null);

    const now = new Date().toISOString();
    const projectId = crypto.randomUUID();

    const project: ProjectRecord = {
      id: projectId,
      name: trimmedProject,
      description: trimmedDesc,
      currentPhase: 'discovery',
      completedPhases: [],
      roadmap: null,
      codeProjects: codeProjects
        .filter((cp) => cp.name.trim())
        .map((cp) => ({
          id: crypto.randomUUID(),
          name: cp.name.trim(),
          type: cp.type,
          techStack: cp.techStack.trim(),
          repoPath: null,
          bootstrapStatus: null,
          bootstrapBridgeJobId: null,
        })),
      artifactIds: [],
      businessContext: null,
      targetUsers: [],
      constraints: { timeline: null, budget: null, technical: [], regulatory: [] },
      implementationStatus: null,
      validationHistory: [],
      roadmapVersions: [],
      approvedRoadmapPhases: null,
      approvedRoadmapTopology: null,
      architecturePlanVersions: [],
      approvedArchitecturePlan: null,
      createdAt: now,
      updatedAt: now,
    };

    const state: StudioState = {
      studioName: trimmedStudio,
      projects: [project],
      activeProjectId: projectId,
      createdAt: now,
    };

    try {
      await onCreateWorkspace({
        skillId: skillId as UUIDv7,
        name: trimmedStudio,
        description: trimmedDesc,
        state: state as unknown as Record<string, unknown>,
      });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const canSubmit = studioName.trim() && projectName.trim() && projectDescription.trim() && !submitting;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Create product studio"
    >
      <div
        className="w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">Create Product Studio</h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="studio-name" className="block text-sm font-medium">
              Studio Name
            </label>
            <input
              id="studio-name"
              type="text"
              required
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. HealthTech Studio"
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="project-name" className="block text-sm font-medium">
              First Project Name
            </label>
            <input
              id="project-name"
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. Patient Portal"
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="project-description" className="block text-sm font-medium">
              Project Description
            </label>
            <textarea
              id="project-description"
              required
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Describe the product vision and goals..."
              disabled={submitting}
            />
          </div>

          {/* Code Projects */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Code Projects</span>
              <button
                type="button"
                data-testid="add-code-project"
                onClick={addCodeProject}
                className="text-xs text-primary hover:underline"
                disabled={submitting}
              >
                + Add code project
              </button>
            </div>

            {codeProjects.map((cp, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={cp.name}
                  onChange={(e) => updateCodeProject(idx, 'name', e.target.value)}
                  className="flex-1 rounded-md border bg-transparent px-2 py-1.5 text-sm"
                  placeholder="e.g. my-app-web"
                  disabled={submitting}
                />
                <select
                  value={cp.type}
                  onChange={(e) => updateCodeProject(idx, 'type', e.target.value)}
                  className="rounded-md border bg-transparent px-2 py-1.5 text-sm"
                  disabled={submitting}
                >
                  {Object.entries(CODE_PROJECT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={cp.techStack}
                  onChange={(e) => updateCodeProject(idx, 'techStack', e.target.value)}
                  className="w-28 rounded-md border bg-transparent px-2 py-1.5 text-sm"
                  placeholder="Tech stack"
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => removeCodeProject(idx)}
                  className="text-xs text-destructive hover:underline"
                  disabled={submitting}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="create-studio-submit"
              disabled={!canSubmit}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Studio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}