interface FileEntry {
  path: string;
  name: string;
  extension: string;
}

interface Host {
  filesystem?: {
    listDirectory(path: string): Promise<Array<{ name: string; type: 'file' | 'directory'; path: string }>>;
  };
  log(level: string, message: string): void;
}

export async function execute(
  args: { directory: string; extensions?: string[] },
  host: Host,
): Promise<{ files: FileEntry[]; totalCount: number; source: string }> {
  const { directory, extensions } = args;

  if (host.filesystem) {
    const entries = await host.filesystem.listDirectory(directory);
    const files = entries
      .filter((e) => e.type === 'file')
      .filter((e) => {
        if (!extensions || extensions.length === 0) return true;
        const ext = e.name.includes('.') ? '.' + e.name.split('.').pop() : '';
        return extensions.includes(ext);
      })
      .map((e) => ({
        path: e.path,
        name: e.name,
        extension: e.name.includes('.') ? '.' + e.name.split('.').pop()! : '',
      }));

    return { files, totalCount: files.length, source: 'bridge' };
  }

  host.log('info', 'Bridge filesystem not available, using browser File System Access API fallback');

  const dirHandle = await (globalThis as unknown as { showDirectoryPicker(): Promise<FileSystemDirectoryHandle> }).showDirectoryPicker();
  const files: FileEntry[] = [];

  for await (const [name, handle] of (dirHandle as unknown as AsyncIterable<[string, FileSystemHandle]>)) {
    if (handle.kind === 'file') {
      const ext = name.includes('.') ? '.' + name.split('.').pop()! : '';
      if (!extensions || extensions.length === 0 || extensions.includes(ext)) {
        files.push({ path: `${directory}/${name}`, name, extension: ext });
      }
    }
  }

  return { files, totalCount: files.length, source: 'browser' };
}
