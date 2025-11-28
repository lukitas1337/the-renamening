'use client';

import { VideoMatch } from '@/lib/matching';
import { formatDuration, formatResolution } from '@/lib/matching';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileVideo, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface MatchesTableProps {
  matches: VideoMatch[];
}

export default function MatchesTable({ matches }: MatchesTableProps) {
  if (matches.length === 0) {
    return (
      <div data-component="matches-table-empty" className="text-center py-8 sm:py-12 px-4">
        <FileVideo className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-[#787878]" />
        <p data-element="empty-state-title" className="mt-4 font-medium text-sm sm:text-base text-[#787878]">No matches to display</p>
        <p data-element="empty-state-description" className="mt-2 text-xs sm:text-sm text-[#787878]">Select folders and analyze to see video matches</p>
      </div>
    );
  }

  const getRowColor = (matchType: string) => {
    switch (matchType) {
      case 'match':
        return 'border-l-2 border-l-green-500';
      case 'ambiguous':
        return 'border-l-2 border-l-yellow-500';
      case 'collision':
        return 'border-l-2 border-l-orange-500';
      case 'no_match':
        return 'border-l-2 border-l-red-500';
      default:
        return '';
    }
  };

  const getStatusBadge = (match: VideoMatch) => {
    switch (match.matchType) {
      case 'match':
        return (
          <Badge variant="success" className="gap-1 border-[#04df72] bg-transparent text-[#fafafa] hover:bg-transparent">
            <CheckCircle2 className="h-3 w-3 text-[#04df72]" />
            Match
          </Badge>
        );
      case 'ambiguous':
        return (
          <Badge variant="warning" className="gap-1 border-[#f0b100] bg-transparent text-[#fafafa] hover:bg-transparent" title={`${match.inputVideos.length} inputs match this output`}>
            <AlertCircle className="h-3 w-3 text-[#f0b100]" />
            Ambiguous ({match.inputVideos.length} inputs)
          </Badge>
        );
      case 'collision':
        return (
          <Badge variant="warning" className="gap-1 border-[#f0b100] bg-transparent text-[#fafafa] hover:bg-transparent" title="Multiple outputs would have the same filename">
            <AlertCircle className="h-3 w-3 text-[#f0b100]" />
            Collision
          </Badge>
        );
      case 'no_match':
        return (
          <Badge variant="error" className="gap-1 border-[#fb2b37] bg-transparent text-[#fafafa] hover:bg-transparent">
            <XCircle className="h-3 w-3 text-[#fb2b37]" />
            No Match
          </Badge>
        );
      default:
        return null;
    }
  };

  const getInputDisplay = (match: VideoMatch) => {
    if (match.inputVideos.length === 0) {
      return <span className="text-muted-foreground">-</span>;
    } else if (match.inputVideos.length === 1) {
      return <span>{match.inputVideos[0].fileName}</span>;
    } else {
      // Show all matching inputs for ambiguous cases
      return (
        <div className="space-y-1">
          {match.inputVideos.map((input, idx) => (
            <div key={idx} className="text-sm">
              {idx + 1}. {input.fileName}
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div data-component="matches-table" className="rounded-md border border-[#323232] overflow-x-auto">
      <Table className="[&_tr]:border-[#323232] min-w-[800px]">
        <TableHeader data-element="matches-table-header" className="bg-[#262626] [&_th]:text-[#fafafa] [&_th]:text-xs [&_th]:sm:text-sm">
          <TableRow className="hover:bg-[#262626]">
            <TableHead data-column="input-video">Input Video</TableHead>
            <TableHead data-column="output-video">Output Video</TableHead>
            <TableHead data-column="resolution">Resolution</TableHead>
            <TableHead data-column="duration">Duration</TableHead>
            <TableHead data-column="status">Status</TableHead>
            <TableHead data-column="new-name">New Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody data-element="matches-table-body" className="bg-[#0a0a0a] text-[#fafafa] [&_td]:text-xs [&_td]:sm:text-sm">
          {matches.map((match, index) => (
            <TableRow
              key={index}
              data-element="match-row"
              data-match-type={match.matchType}
              className={`${getRowColor(match.matchType)} hover:bg-[#171717]`}
            >
              <TableCell data-cell="input-video">{getInputDisplay(match)}</TableCell>
              <TableCell data-cell="output-video">{match.outputVideo.fileName}</TableCell>
              <TableCell data-cell="resolution">
                {formatResolution(match.outputVideo.width, match.outputVideo.height)}
              </TableCell>
              <TableCell data-cell="duration">{formatDuration(match.outputVideo.durationMs)}</TableCell>
              <TableCell data-cell="status">{getStatusBadge(match)}</TableCell>
              <TableCell data-cell="new-name" className="font-medium">
                {match.newName || <span className="text-muted-foreground">-</span>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
