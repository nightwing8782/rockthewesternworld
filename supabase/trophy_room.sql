-- Supabase Schema for The Trophy Room (Rock The Western World)
-- Tables: trophy_books & trophy_progress

-- 1. Table: trophy_books (Library Catalog)
CREATE TABLE IF NOT EXISTS public.trophy_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    title TEXT NOT NULL,
    series TEXT NOT NULL DEFAULT 'Standalone',
    issue_number NUMERIC NOT NULL DEFAULT 1,
    format TEXT NOT NULL CHECK (format IN ('cbz', 'epub', 'pdf')),
    file_key TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    cover_key TEXT,
    cover_url TEXT,
    author TEXT,
    description TEXT,
    reading_direction TEXT NOT NULL DEFAULT 'ltr' CHECK (reading_direction IN ('ltr', 'rtl')),
    page_count INTEGER NOT NULL DEFAULT 0,
    tags TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trophy_books_user_id ON public.trophy_books(user_id);
CREATE INDEX IF NOT EXISTS idx_trophy_books_series ON public.trophy_books(series);
CREATE INDEX IF NOT EXISTS idx_trophy_books_format ON public.trophy_books(format);
CREATE INDEX IF NOT EXISTS idx_trophy_books_updated_at ON public.trophy_books(updated_at DESC);

-- Automatic updated_at timestamp trigger
DROP TRIGGER IF EXISTS set_trophy_books_updated_at ON public.trophy_books;
CREATE TRIGGER set_trophy_books_updated_at
    BEFORE UPDATE ON public.trophy_books
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 2. Table: trophy_progress (Cross-Device Bookmarks & Reading Progress)
CREATE TABLE IF NOT EXISTS public.trophy_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES public.trophy_books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    last_page INTEGER NOT NULL DEFAULT 1,
    total_pages INTEGER NOT NULL DEFAULT 1,
    percent_read NUMERIC NOT NULL DEFAULT 0,
    current_cfi TEXT,
    completed BOOLEAN NOT NULL DEFAULT false,
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT trophy_progress_book_user_unique UNIQUE (book_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_trophy_progress_user_id ON public.trophy_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_trophy_progress_last_read_at ON public.trophy_progress(last_read_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.trophy_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trophy_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trophy_books
DROP POLICY IF EXISTS "Users can view own trophy books" ON public.trophy_books;
CREATE POLICY "Users can view own trophy books"
    ON public.trophy_books
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own trophy books" ON public.trophy_books;
CREATE POLICY "Users can insert own trophy books"
    ON public.trophy_books
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own trophy books" ON public.trophy_books;
CREATE POLICY "Users can update own trophy books"
    ON public.trophy_books
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own trophy books" ON public.trophy_books;
CREATE POLICY "Users can delete own trophy books"
    ON public.trophy_books
    FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for trophy_progress
DROP POLICY IF EXISTS "Users can view own trophy progress" ON public.trophy_progress;
CREATE POLICY "Users can view own trophy progress"
    ON public.trophy_progress
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own trophy progress" ON public.trophy_progress;
CREATE POLICY "Users can insert own trophy progress"
    ON public.trophy_progress
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own trophy progress" ON public.trophy_progress;
CREATE POLICY "Users can update own trophy progress"
    ON public.trophy_progress
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own trophy progress" ON public.trophy_progress;
CREATE POLICY "Users can delete own trophy progress"
    ON public.trophy_progress
    FOR DELETE
    USING (auth.uid() = user_id);
