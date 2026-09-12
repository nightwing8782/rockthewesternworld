-- Supabase Schema for Rock The Western World
-- Table: entries

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    entry_type TEXT NOT NULL CHECK (entry_type IN ('thought', 'book_review', 'comic_review', 'music_review', 'podcast_review', 'essay')),
    status TEXT NOT NULL DEFAULT 'private_log' CHECK (status IN ('private_log', 'draft', 'published')),
    title TEXT,
    slug TEXT UNIQUE,
    body_json JSONB,
    body_html TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON public.entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_status ON public.entries(status);
CREATE INDEX IF NOT EXISTS idx_entries_slug ON public.entries(slug);
CREATE INDEX IF NOT EXISTS idx_entries_entry_type ON public.entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_entries_published_at ON public.entries(published_at DESC);

-- Automatic updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_entries_updated_at ON public.entries;
CREATE TRIGGER set_entries_updated_at
    BEFORE UPDATE ON public.entries
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own entries" ON public.entries;
DROP POLICY IF EXISTS "Users can insert own entries" ON public.entries;
DROP POLICY IF EXISTS "Users can update own entries" ON public.entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON public.entries;
DROP POLICY IF EXISTS "Public can view published entries" ON public.entries;

-- Strict User Policies (auth.uid() = user_id)
CREATE POLICY "Users can view own entries"
    ON public.entries
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries"
    ON public.entries
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries"
    ON public.entries
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries"
    ON public.entries
    FOR DELETE
    USING (auth.uid() = user_id);

-- Public Policy (Public can select only where status = 'published')
CREATE POLICY "Public can view published entries"
    ON public.entries
    FOR SELECT
    USING (status = 'published');

-- Table: subscribers (For The Dispatch newsletter signups)
CREATE TABLE IF NOT EXISTS public.subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers(email);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public subscribe" ON public.subscribers;
CREATE POLICY "Allow public subscribe"
    ON public.subscribers
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow author view subscribers" ON public.subscribers;
CREATE POLICY "Allow author view subscribers"
    ON public.subscribers
    FOR SELECT
    USING (auth.uid() IS NOT NULL);
