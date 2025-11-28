'use client';

import { useState } from 'react';
import BrowserCheck from '@/components/BrowserCheck';
import FolderSelector from '@/components/FolderSelector';
import MatchesTable from '@/components/MatchesTable';
import { selectDirectory, getVideoFiles, renameFile, copyFile, createBackupDirectory } from '@/lib/fileSystem';
import { extractBatchMetadata, VideoMetadata } from '@/lib/videoMetadata';
import { matchVideos, VideoMatch, getMatchStats } from '@/lib/matching';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [inputDir, setInputDir] = useState<FileSystemDirectoryHandle | null>(null);
  const [outputDir, setOutputDir] = useState<FileSystemDirectoryHandle | null>(null);
  const [backupDir, setBackupDir] = useState<FileSystemDirectoryHandle | null>(null);

  const [inputDirName, setInputDirName] = useState<string | null>(null);
  const [outputDirName, setOutputDirName] = useState<string | null>(null);
  const [backupDirName, setBackupDirName] = useState<string | null>(null);

  const [matches, setMatches] = useState<VideoMatch[]>( []);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [backupCreated, setBackupCreated] = useState<FileSystemDirectoryHandle | null>(null);

  const handleSelectInputDir = async () => {
    const dir = await selectDirectory('read');
    if (dir) {
      setInputDir(dir);
      setInputDirName(dir.name);
      setStatus(`Input folder selected: ${dir.name}`);
    }
  };

  const handleSelectOutputDir = async () => {
    const dir = await selectDirectory('readwrite');
    if (dir) {
      setOutputDir(dir);
      setOutputDirName(dir.name);
      setStatus(`Output folder selected: ${dir.name}`);
    }
  };

  const handleSelectBackupDir = async () => {
    const dir = await selectDirectory('readwrite');
    if (dir) {
      setBackupDir(dir);
      setBackupDirName(dir.name);
      setStatus(`Backup location selected: ${dir.name}`);
    }
  };

  const handleAnalyze = async () => {
    if (!inputDir || !outputDir) {
      alert('Please select both input and output folders');
      return;
    }

    setIsAnalyzing(true);
    setMatches([]);
    setStatus('Scanning for video files...');

    try {
      // Get video files
      const inputFiles = await getVideoFiles(inputDir);
      const outputFiles = await getVideoFiles(outputDir);

      setStatus(`Found ${inputFiles.length} input videos and ${outputFiles.length} output videos`);

      if (inputFiles.length === 0) {
        alert('No video files found in input folder');
        setIsAnalyzing(false);
        return;
      }

      if (outputFiles.length === 0) {
        alert('No video files found in output folder');
        setIsAnalyzing(false);
        return;
      }

      // Extract metadata
      setStatus(`Extracting metadata from ${inputFiles.length} input videos...`);
      const inputMetadata = await extractBatchMetadata(inputFiles, (current, total, fileName) => {
        setStatus(`Extracting metadata from input videos: ${current}/${total} (${fileName})`);
      });

      setStatus(`Extracting metadata from ${outputFiles.length} output videos...`);
      const outputMetadata = await extractBatchMetadata(outputFiles, (current, total, fileName) => {
        setStatus(`Extracting metadata from output videos: ${current}/${total} (${fileName})`);
      });

      // Match videos
      setStatus('Matching videos...');
      const foundMatches = matchVideos(inputMetadata, outputMetadata);

      setMatches(foundMatches);

      const stats = getMatchStats(foundMatches);

      let statusParts = [`Found ${stats.total} output videos:`];
      if (stats.matched > 0) statusParts.push(`${stats.matched} ready to rename`);
      if (stats.ambiguous > 0) statusParts.push(`${stats.ambiguous} ambiguous`);
      if (stats.collisions > 0) statusParts.push(`${stats.collisions} collisions`);
      if (stats.noMatch > 0) statusParts.push(`${stats.noMatch} no match`);

      setStatus(statusParts.join(', '));

    } catch (error) {
      console.error('Analysis error:', error);
      setStatus('Error during analysis');
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRename = async () => {
    if (!outputDir || matches.length === 0) {
      return;
    }

    // Check for issues that block renaming
    const stats = getMatchStats(matches);

    if (stats.collisions > 0) {
      alert(
        `❌ Cannot Rename - Collision Detected!\n\n` +
        `${stats.collisions} output video(s) would be renamed to the same filename.\n\n` +
        'Please remove duplicate videos from the output folder first.'
      );
      return;
    }

    if (stats.ambiguous > 0) {
      alert(
        `❌ Cannot Rename - Ambiguous Matches!\n\n` +
        `${stats.ambiguous} output video(s) match multiple input videos.\n\n` +
        'Cannot determine which input name to use. Please resolve conflicts first.'
      );
      return;
    }

    // Only rename videos with matchType === 'match'
    const videosToRename = matches.filter(m => m.matchType === 'match');

    if (videosToRename.length === 0) {
      alert('No videos ready to rename. Please fix issues first.');
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to rename ${videosToRename.length} video(s)?\n\n` +
      (stats.noMatch > 0 ? `${stats.noMatch} video(s) will be skipped (no match).\n\n` : '') +
      'A backup will be created automatically.'
    );

    if (!confirmed) {
      return;
    }

    setIsRenaming(true);
    setStatus('Creating backup...');

    try {
      // Create backup
      const backupLocation = backupDir || outputDir;
      const backupDirHandle = await createBackupDirectory(backupLocation, outputDir.name);

      if (!backupDirHandle) {
        throw new Error('Failed to create backup directory');
      }

      setBackupCreated(backupDirHandle);

      // Backup all output files (even those we won't rename)
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        setStatus(`Creating backup: ${i + 1}/${matches.length}`);
        await copyFile(match.outputVideo.fileHandle, backupDirHandle);
      }

      // Rename only safe matches
      let successCount = 0;
      for (let i = 0; i < videosToRename.length; i++) {
        const match = videosToRename[i];
        setStatus(`Renaming videos: ${i + 1}/${videosToRename.length}`);

        if (match.newName) {
          const success = await renameFile(
            match.outputVideo.fileHandle,
            match.newName,
            outputDir
          );

          if (success) {
            successCount++;
          }
        }
      }

      setStatus(`Successfully renamed ${successCount}/${videosToRename.length} videos`);
      alert(
        `Success! Renamed ${successCount} video(s).\n\n` +
        (stats.noMatch > 0 ? `${stats.noMatch} video(s) skipped (no match).\n\n` : '') +
        `Backup created in: ${backupDirHandle.name}`
      );

      // Clear matches after successful rename
      setMatches([]);

    } catch (error) {
      console.error('Rename error:', error);
      setStatus('Error during rename');
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleClear = () => {
    setInputDir(null);
    setOutputDir(null);
    setBackupDir(null);
    setInputDirName(null);
    setOutputDirName(null);
    setBackupDirName(null);
    setMatches([]);
    setBackupCreated(null);
    setStatus('Ready');
  };

  return (
    <main data-page="home" className="@container/main min-h-screen p-4 sm:p-8 md:p-12">
      <div data-element="page-container" className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div data-section="header" className="mb-8 sm:mb-12 md:mb-[74px] text-center">
          <h1 data-element="page-title" className="text-3xl sm:text-4xl md:text-[48px] leading-tight md:leading-[53px] font-semibold mb-2">THE RENAMENING</h1>
          <p data-element="page-subtitle" className="text-sm sm:text-base md:text-[18px] leading-relaxed md:leading-[28px] font-normal text-[#f7fafc] px-4">
            Match and rename videos based on metadata - blazing fast, no upload required
          </p>
        </div>

        {/* Browser Check */}
        <BrowserCheck />

        {/* Folder Selection */}
        <Card data-section="folder-selection" className="mb-6 bg-gradient-to-b from-[#171717] to-[#222121] shadow-xs border-[#323232]">
          <CardHeader className="px-4 sm:px-8 md:px-12 pt-6 sm:pt-8 md:pt-12 pb-3">
            <CardTitle data-element="section-title">Select Folders</CardTitle>
          </CardHeader>
          <CardContent data-element="folder-selection-content" className="space-y-4 px-4 sm:px-8 md:px-12 pt-3 pb-6 sm:pb-8 md:pb-12">
            <FolderSelector
              label="Input Folder"
              description="Select folder with original videos"
              selectedPath={inputDirName}
              onSelect={handleSelectInputDir}
              disabled={isAnalyzing || isRenaming}
            />
            <FolderSelector
              label="Output Folder"
              description="Select folder with videos to rename"
              selectedPath={outputDirName}
              onSelect={handleSelectOutputDir}
              disabled={isAnalyzing || isRenaming}
            />
            <FolderSelector
              label="Backup Location (Optional)"
              description="Select where to save backups (defaults to output folder)"
              selectedPath={backupDirName}
              onSelect={handleSelectBackupDir}
              disabled={isAnalyzing || isRenaming}
            />
            <div className="flex justify-end pt-4">
              <Button
                data-element="analyze-button"
                onClick={handleAnalyze}
                disabled={!inputDir || !outputDir || isAnalyzing || isRenaming}
                className="bg-[#e5e5e5] hover:bg-[#e5e5e5]/90 font-medium w-[106.63px] h-[40px] text-[14px]"
              >
                Analyze
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Matches Table */}
        <Card data-section="matches-preview" className="mb-6 bg-gradient-to-b from-[#171717] to-[#222121] shadow-xs border-[#323232]">
          <CardHeader className="px-4 sm:px-8 md:px-12 pt-6 sm:pt-8 md:pt-12 pb-3">
            <CardTitle data-element="section-title">Results</CardTitle>
          </CardHeader>
          <CardContent data-element="matches-preview-content" className="px-4 sm:px-8 md:px-12 pt-3 pb-6 sm:pb-8 md:pb-12">
            <MatchesTable matches={matches} />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card data-section="action-buttons" className="bg-transparent border-0 shadow-none">
          <CardContent className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 py-4 sm:py-6 px-4">
            <Button
              data-element="rename-button"
              onClick={handleRename}
              disabled={matches.length === 0 || isRenaming}
              size="lg"
              className="w-full sm:w-auto px-6 sm:px-8 bg-[#e5e5e5] hover:bg-[#e5e5e5]/90 font-medium"
            >
              Rename Videos
            </Button>
            <Button
              data-element="clear-button"
              onClick={handleClear}
              disabled={isAnalyzing || isRenaming}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto px-6 sm:px-8 border border-[#0a0a0a] hover:bg-[#1b1b1b] hover:border-[#f7fafc] transition-all duration-300 ease-in-out font-medium"
            >
              Clear
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
