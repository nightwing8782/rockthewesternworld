-- Migration: 20261020_editorial_media_library.sql
-- Description: Create editorial_media asset library and entry_media junction table

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create Editorial Media Table
CREATE TABLE IF NOT EXISTS public.editorial_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    
    -- Asset Delivery URLs (Supabase Storage)
    image_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    storage_path TEXT NOT NULL, -- Path within 'editorial-media' bucket
    sha256_hash TEXT, -- For client-side duplicate detection
    
    -- Technical Specifications
    width INTEGER,
    height INTEGER,
    file_size_bytes BIGINT,
    mime_type TEXT NOT NULL DEFAULT 'image/webp',
    
    -- Provenance & Legal Attribution
    source_type TEXT NOT NULL DEFAULT 'upload' CHECK (source_type IN ('upload', 'public_domain', 'review_cover', 'url_import')),
    creator TEXT,
    source TEXT NOT NULL DEFAULT 'Editorial Studio',
    source_url TEXT,
    license TEXT NOT NULL DEFAULT 'Author Provided / Fair Use',
    attribution_text TEXT,
    
    -- Flexible Editorial Taxonomy
    category TEXT NOT NULL DEFAULT 'General', -- Free-text (Americana, Literature, Jazz, Cinema, etc.)
    tags TEXT[] DEFAULT '{}',
    moods TEXT[] DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Create Junction Table: entry_media
CREATE TABLE IF NOT EXISTS public.entry_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID REFERENCES public.entries(id) ON DELETE CASCADE NOT NULL,
    media_id UUID REFERENCES public.editorial_media(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'cover' CHECK (role IN ('cover', 'inline', 'social_card')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_entry_media_role UNIQUE (entry_id, media_id, role)
);

-- 3. Indexes for Search and Relational Queries
CREATE INDEX IF NOT EXISTS idx_editorial_media_sha256 ON public.editorial_media(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_editorial_media_source_type ON public.editorial_media(source_type);
CREATE INDEX IF NOT EXISTS idx_editorial_media_category ON public.editorial_media(category);
CREATE INDEX IF NOT EXISTS idx_editorial_media_tags ON public.editorial_media USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_editorial_media_created_at ON public.editorial_media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entry_media_entry_id ON public.entry_media(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_media_media_id ON public.entry_media(media_id);

-- 4. Row Level Security Policies
ALTER TABLE public.editorial_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for editorial media" ON public.editorial_media;
CREATE POLICY "Public read access for editorial media"
    ON public.editorial_media FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage editorial media" ON public.editorial_media;
CREATE POLICY "Authenticated users can manage editorial media"
    ON public.editorial_media FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read access for entry media junction" ON public.entry_media;
CREATE POLICY "Public read access for entry media junction"
    ON public.entry_media FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage entry media junction" ON public.entry_media;
CREATE POLICY "Authenticated users can manage entry media junction"
    ON public.entry_media FOR ALL TO authenticated USING (true) WITH CHECK (true);
