'use client';

import OpenAccessImageGallery from './OpenAccessImageGallery';
import { EntryMetadata } from '@/types/database';

interface EditorialPhotographyAccordionProps {
  metadata: EntryMetadata;
  onMetadataChange: (newMeta: Partial<EntryMetadata>) => void;
}

export default function EditorialPhotographyAccordion({
  metadata,
  onMetadataChange,
}: EditorialPhotographyAccordionProps) {
  return (
    <OpenAccessImageGallery
      metadata={metadata}
      onMetadataChange={onMetadataChange}
    />
  );
}
