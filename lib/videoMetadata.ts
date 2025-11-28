// Video metadata extraction using browser's video element

export interface VideoMetadata {
  fileHandle: FileSystemFileHandle;
  fileName: string;
  width: number;
  height: number;
  durationMs: number;
  error?: string;
}

export function getFingerprint(metadata: VideoMetadata): string {
  return `${metadata.width}x${metadata.height}_${metadata.durationMs}`;
}

export async function extractVideoMetadata(
  fileHandle: FileSystemFileHandle,
  onProgress?: (fileName: string) => void
): Promise<VideoMetadata | null> {
  try {
    if (onProgress) {
      onProgress(fileHandle.name);
    }

    const file = await fileHandle.getFile();
    const url = URL.createObjectURL(file);

    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        const metadata: VideoMetadata = {
          fileHandle,
          fileName: fileHandle.name,
          width: video.videoWidth,
          height: video.videoHeight,
          durationMs: Math.round(video.duration * 1000),
        };

        URL.revokeObjectURL(url);
        resolve(metadata);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({
          fileHandle,
          fileName: fileHandle.name,
          width: 0,
          height: 0,
          durationMs: 0,
          error: 'Failed to load video metadata',
        });
      };

      video.src = url;
    });
  } catch (err) {
    console.error(`Error extracting metadata from ${fileHandle.name}:`, err);
    return {
      fileHandle,
      fileName: fileHandle.name,
      width: 0,
      height: 0,
      durationMs: 0,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

export async function extractBatchMetadata(
  fileHandles: FileSystemFileHandle[],
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<VideoMetadata[]> {
  const results: VideoMetadata[] = [];

  for (let i = 0; i < fileHandles.length; i++) {
    const fileHandle = fileHandles[i];
    if (onProgress) {
      onProgress(i + 1, fileHandles.length, fileHandle.name);
    }

    const metadata = await extractVideoMetadata(fileHandle);
    if (metadata && !metadata.error) {
      results.push(metadata);
    }
  }

  return results;
}
