// File System Access API wrapper

export interface FileSystemSupport {
  supported: boolean;
  message: string;
}

export function checkFileSystemSupport(): FileSystemSupport {
  if (typeof window === 'undefined') {
    return { supported: false, message: 'Server-side rendering' };
  }

  if (!('showDirectoryPicker' in window)) {
    return {
      supported: false,
      message: 'File System Access API not supported. Please use Chrome or Edge browser.',
    };
  }

  return { supported: true, message: 'Supported' };
}

export async function selectDirectory(mode: 'read' | 'readwrite' = 'readwrite'): Promise<FileSystemDirectoryHandle | null> {
  try {
    const dirHandle = await window.showDirectoryPicker({
      mode,
    });
    return dirHandle;
  } catch (err) {
    // User cancelled or error occurred
    console.error('Error selecting directory:', err);
    return null;
  }
}

export async function getVideoFiles(dirHandle: FileSystemDirectoryHandle): Promise<FileSystemFileHandle[]> {
  const videoExtensions = [
    '.mp4', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v',
    '.mpeg', '.mpg', '.mpe', '.m2v', '.m4p',
    '.hevc', '.h265', '.265',
    '.webm', '.ogv',
    '.3gp', '.3g2',
    '.vob', '.ts', '.m2ts', '.mts',
    '.divx', '.xvid', '.asf', '.rm', '.rmvb'
  ];
  const files: FileSystemFileHandle[] = [];

  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file') {
      const lowerName = entry.name.toLowerCase();
      if (videoExtensions.some(ext => lowerName.endsWith(ext))) {
        files.push(entry as FileSystemFileHandle);
      }
    }
  }

  return files.sort((a, b) => a.name.localeCompare(b.name));
}

export async function renameFile(
  fileHandle: FileSystemFileHandle,
  newName: string,
  dirHandle: FileSystemDirectoryHandle
): Promise<boolean> {
  try {
    // Read the original file
    const file = await fileHandle.getFile();
    const arrayBuffer = await file.arrayBuffer();

    // Create new file with new name
    const newFileHandle = await dirHandle.getFileHandle(newName, { create: true });
    const writable = await newFileHandle.createWritable();
    await writable.write(arrayBuffer);
    await writable.close();

    // Delete the old file
    await dirHandle.removeEntry(fileHandle.name);

    return true;
  } catch (err) {
    console.error('Error renaming file:', err);
    return false;
  }
}

export async function copyFile(
  sourceHandle: FileSystemFileHandle,
  targetDirHandle: FileSystemDirectoryHandle,
  targetName?: string
): Promise<boolean> {
  try {
    const file = await sourceHandle.getFile();
    const arrayBuffer = await file.arrayBuffer();

    const fileName = targetName || sourceHandle.name;
    const newFileHandle = await targetDirHandle.getFileHandle(fileName, { create: true });
    const writable = await newFileHandle.createWritable();
    await writable.write(arrayBuffer);
    await writable.close();

    return true;
  } catch (err) {
    console.error('Error copying file:', err);
    return false;
  }
}

export async function createBackupDirectory(
  parentDirHandle: FileSystemDirectoryHandle,
  baseName: string
): Promise<FileSystemDirectoryHandle | null> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const backupName = `backup_${baseName}_${timestamp}`;
    const backupDirHandle = await parentDirHandle.getDirectoryHandle(backupName, { create: true });
    return backupDirHandle;
  } catch (err) {
    console.error('Error creating backup directory:', err);
    return null;
  }
}

// Type declarations for File System Access API (in case TypeScript doesn't have them)
declare global {
  interface Window {
    showDirectoryPicker(options?: {
      mode?: 'read' | 'readwrite';
    }): Promise<FileSystemDirectoryHandle>;
  }

  interface FileSystemDirectoryHandle {
    values(): AsyncIterableIterator<FileSystemHandle>;
    getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
    getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
    removeEntry(name: string): Promise<void>;
  }

  interface FileSystemFileHandle {
    getFile(): Promise<File>;
    createWritable(): Promise<FileSystemWritableFileStream>;
    readonly name: string;
  }

  interface FileSystemWritableFileStream {
    write(data: ArrayBuffer | Blob | string): Promise<void>;
    close(): Promise<void>;
  }

  interface FileSystemHandle {
    readonly kind: 'file' | 'directory';
    readonly name: string;
  }
}
