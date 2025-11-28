'use client';

import { useEffect, useState } from 'react';
import { checkFileSystemSupport } from '@/lib/fileSystem';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function BrowserCheck() {
  const [support, setSupport] = useState<{ supported: boolean; message: string } | null>(null);

  useEffect(() => {
    setSupport(checkFileSystemSupport());
  }, []);

  if (!support || support.supported) {
    return null;
  }

  return (
    <Alert data-component="browser-check" variant="warning" className="mb-6 bg-[#0a0a0a] border-[#e25455] text-[#e25455]">
      <AlertCircle className="h-4 w-4 text-[#e25455]" />
      <AlertTitle data-element="browser-check-title" className="text-[#e25455]">Browser Not Supported</AlertTitle>
      <AlertDescription data-element="browser-check-description" className="text-[#e25455]">
        <p data-element="browser-check-message" className="mt-2">{support.message}</p>
        <p data-element="browser-check-requirement" className="mt-2">
          This app requires the File System Access API, which is currently only available in:
        </p>
        <ul data-element="browser-check-supported-list" className="list-disc list-inside mt-1 ml-2">
          <li>Google Chrome (version 86+)</li>
          <li>Microsoft Edge (version 86+)</li>
        </ul>
        <p data-element="browser-check-instruction" className="mt-2">
          Please switch to one of these browsers to use this app.
        </p>
      </AlertDescription>
    </Alert>
  );
}
