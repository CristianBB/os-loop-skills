interface Host {
  tools: {
    invoke(name: string, args: Record<string, unknown>): Promise<{ stdout: string; exitCode: number }>;
  };
}

export async function execute(
  args: { workingDirectory: string },
  host: Host,
): Promise<{ branch: string; clean: boolean; output: string }> {
  const result = await host.tools.invoke('system_execute_command', {
    command: 'git',
    args: ['status', '--porcelain', '--branch'],
    workingDirectory: args.workingDirectory,
    reason: 'Check git repository status',
    commandTemplate: 'git',
    argsTemplate: ['status', '--porcelain', '--branch'],
  });

  const lines = result.stdout.trim().split('\n');
  const branchLine = lines[0] ?? '';
  const branchMatch = branchLine.match(/^## (.+?)(?:\.\.\.|\s|$)/);
  const branch = branchMatch?.[1] ?? 'unknown';
  const statusLines = lines.slice(1).filter((l) => l.trim() !== '');
  const clean = statusLines.length === 0;

  return { branch, clean, output: result.stdout };
}
