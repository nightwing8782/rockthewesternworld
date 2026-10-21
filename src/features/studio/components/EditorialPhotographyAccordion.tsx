'use client';

import EditorialMediaHub from './media/EditorialMediaHub';
import { EntryMetadata } from '@/types/database';

interface EditorialPhotographyAccordionProps {
  metadata: EntryMetadata;
  entryId?: string;
  onMetadataChange: (newMeta: Partial<EntryMetadata>) => void;
}

export default function EditorialPhotographyAccordion({
  metadata,
  entryId,
  onMetadataChange,
}: EditorialPhotographyAccordionProps) {
  return (
    <EditorialMediaHub
      metadata={metadata}
      entryId={entryId}
      onMetadataChange={onMetadataChange}
    />
  );
}
