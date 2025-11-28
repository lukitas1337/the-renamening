'use client';

import { Button } from '@/components/ui/button';
import { Folder } from 'lucide-react';

interface FolderSelectorProps {
  label: string;
  description: string;
  selectedPath: string | null;
  onSelect: () => void;
  disabled?: boolean;
}

export default function FolderSelector({
  label,
  description,
  selectedPath,
  onSelect,
  disabled = false,
}: FolderSelectorProps) {
  return (
    <div data-component="folder-selector" className="flex items-center gap-4">
      <div data-element="folder-selector-content" className="flex-1">
        <label data-element="folder-selector-label" className="block text-sm font-medium mb-1">
          {label}
        </label>
        <div data-element="folder-selector-input-row" className="flex items-center gap-3">
          <div data-element="folder-selector-path-display" className="flex-1 px-4 py-2 bg-[#0a0a0a] border border-[#323232] rounded-lg text-sm">
            {selectedPath || description}
          </div>
          <Button
            data-element="folder-selector-browse-button"
            onClick={onSelect}
            disabled={disabled}
            variant="outline"
            className="whitespace-nowrap border border-[#0a0a0a] hover:bg-[#1b1b1b] hover:border-[#f7fafc] transition-all duration-300 ease-in-out font-medium"
          >
            <Folder className="w-4 h-4 mr-2" />
            Browse
          </Button>
        </div>
      </div>
    </div>
  );
}
