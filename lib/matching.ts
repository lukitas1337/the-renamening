import { VideoMetadata, getFingerprint } from './videoMetadata';

export type MatchType = 'match' | 'ambiguous' | 'collision' | 'no_match';

export interface VideoMatch {
  outputVideo: VideoMetadata;
  inputVideos: VideoMetadata[]; // All matching inputs (can be 0, 1, or many)
  matchType: MatchType;
  newName: string | null;
  collisionGroup?: number; // If multiple outputs would have same new name
}

interface CollisionInfo {
  newName: string;
  outputs: VideoMetadata[];
}

export function matchVideos(
  inputVideos: VideoMetadata[],
  outputVideos: VideoMetadata[]
): VideoMatch[] {
  const matches: VideoMatch[] = [];
  const fingerprintMap = new Map<string, VideoMetadata[]>();

  // Build fingerprint map for input videos
  for (const inputVideo of inputVideos) {
    const fp = getFingerprint(inputVideo);
    if (!fingerprintMap.has(fp)) {
      fingerprintMap.set(fp, []);
    }
    fingerprintMap.get(fp)!.push(inputVideo);
  }

  // First pass: Match each output to input(s)
  for (const outputVideo of outputVideos) {
    const fp = getFingerprint(outputVideo);
    const inputMatches = fingerprintMap.get(fp) || [];

    let matchType: MatchType;
    let newName: string | null = null;

    if (inputMatches.length === 0) {
      // No matching input
      matchType = 'no_match';
    } else if (inputMatches.length === 1) {
      // Exactly one match (might still be a collision with other outputs)
      matchType = 'match';
      const inputVideo = inputMatches[0];
      newName = generateNewName(inputVideo, outputVideo);
    } else {
      // Multiple inputs match this output - ambiguous
      matchType = 'ambiguous';
      // Use first match for preview, but mark as ambiguous
      const inputVideo = inputMatches[0];
      newName = `${generateNewName(inputVideo, outputVideo)} (?)`;
    }

    matches.push({
      outputVideo,
      inputVideos: inputMatches,
      matchType,
      newName,
    });
  }

  // Second pass: Detect collisions (multiple outputs → same new name)
  const newNameMap = new Map<string, VideoMatch[]>();

  for (const match of matches) {
    if (match.newName && match.matchType === 'match') {
      const cleanName = match.newName.replace(' (?)', '');
      if (!newNameMap.has(cleanName)) {
        newNameMap.set(cleanName, []);
      }
      newNameMap.get(cleanName)!.push(match);
    }
  }

  // Mark collisions
  let collisionGroupId = 1;
  for (const [newName, matchesWithSameName] of newNameMap.entries()) {
    if (matchesWithSameName.length > 1) {
      // Multiple outputs would get the same name - collision!
      for (const match of matchesWithSameName) {
        match.matchType = 'collision';
        match.collisionGroup = collisionGroupId;
      }
      collisionGroupId++;
    }
  }

  return matches;
}

function generateNewName(inputVideo: VideoMetadata, outputVideo: VideoMetadata): string {
  const outputExt = outputVideo.fileName.substring(outputVideo.fileName.lastIndexOf('.'));
  const inputBaseName = inputVideo.fileName.substring(0, inputVideo.fileName.lastIndexOf('.'));
  return `${inputBaseName}_done${outputExt}`;
}

export function getMatchStats(matches: VideoMatch[]): {
  total: number;
  matched: number;
  ambiguous: number;
  collisions: number;
  noMatch: number;
  hasIssues: boolean;
} {
  const stats = {
    total: matches.length,
    matched: 0,
    ambiguous: 0,
    collisions: 0,
    noMatch: 0,
    hasIssues: false,
  };

  for (const match of matches) {
    switch (match.matchType) {
      case 'match':
        stats.matched++;
        break;
      case 'ambiguous':
        stats.ambiguous++;
        stats.hasIssues = true;
        break;
      case 'collision':
        stats.collisions++;
        stats.hasIssues = true;
        break;
      case 'no_match':
        stats.noMatch++;
        break;
    }
  }

  return stats;
}

export function formatDuration(durationMs: number): string {
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${seconds}s`;
}

export function formatResolution(width: number, height: number): string {
  return `${width}x${height}`;
}
