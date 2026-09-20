-- Migration: Add rich library taxonomy, mediums, and metadata fields to trophy_books

ALTER TABLE trophy_books
  ADD COLUMN IF NOT EXISTS medium text DEFAULT 'comic',
  ADD COLUMN IF NOT EXISTS genres text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS volume_number numeric,
  ADD COLUMN IF NOT EXISTS franchise text,
  ADD COLUMN IF NOT EXISTS illustrator text,
  ADD COLUMN IF NOT EXISTS publisher text,
  ADD COLUMN IF NOT EXISTS published_year text,
  ADD COLUMN IF NOT EXISTS isbn text,
  ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS rating smallint,
  ADD COLUMN IF NOT EXISTS story_arc text,
  ADD COLUMN IF NOT EXISTS collections text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS primary_color text,
  ADD COLUMN IF NOT EXISTS aspect_ratio text DEFAULT 'portrait';

-- Create performant B-tree indexes for swift multi-faceted filtering
CREATE INDEX IF NOT EXISTS idx_trophy_books_medium ON trophy_books(medium);
CREATE INDEX IF NOT EXISTS idx_trophy_books_publisher ON trophy_books(publisher);
CREATE INDEX IF NOT EXISTS idx_trophy_books_franchise ON trophy_books(franchise);
CREATE INDEX IF NOT EXISTS idx_trophy_books_favorite ON trophy_books(is_favorite);
