interface Host {
  tools: {
    invoke(name: string, args: Record<string, unknown>): Promise<{ stdout: string; stderr: string; exitCode: number }>;
  };
}

export async function execute(
  args: { shortcutName: string; input?: string },
  host: Host,
): Promise<{ output: string; exitCode: number }> {
  const cmdArgs = ['run', args.shortcutName];
  if (args.input) {
    cmdArgs.push('--input-type', 'text', '--input', args.input);
  }

  const result = await host.tools.invoke('system_execute_command', {
    command: 'shortcuts',
    args: cmdArgs,
    reason: `Run macOS Shortcut: ${args.shortcutName}`,
    commandTemplate: 'shortcuts',
    argsTemplate: ['run', '<shortcutName>'],
  });

  return {
    output: result.stdout || result.stderr,
    exitCode: result.exitCode,
  };
}
