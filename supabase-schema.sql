-- ============================================================
-- SyndicateHub / CricketLiveNews — Supabase Schema
-- ONE table for ALL 10 sites — site_name column isolates data
-- Run this once in Supabase SQL Editor
-- Safe to re-run (all IF NOT EXISTS)
-- ============================================================

-- Use gen_random_uuid() — no extension needed on Supabase
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- only if uuid fails

-- ── Drop old table if migrating from wrong schema ────────────────────────────
-- Uncomment ONLY if you need to reset (DESTROYS ALL DATA):
-- DROP TABLE IF EXISTS public.posts CASCADE;

-- ── posts table ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.posts (
  id                uuid          DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Multi-site isolation (CRITICAL — every query filters by this)
  site_name         TEXT          NOT NULL DEFAULT 'default',

  -- Core content
  slug              TEXT          NOT NULL,
  title             TEXT          NOT NULL,
  excerpt           TEXT,
  content           JSONB,                          -- structured sections + rawContent
  category          TEXT          NOT NULL DEFAULT 'general',
  tags              TEXT[]        DEFAULT '{}',

  -- Images
  cover_image       TEXT,
  cover_image_alt   TEXT,

  -- Author
  author_name       TEXT,
  author_title      TEXT,

  -- SEO
  meta_title        TEXT,
  meta_description  TEXT,
  schema_json       JSONB,                          -- NewsArticle / FAQPage schema

  -- Live data (optional — for finance/sports niches)
  live_data         JSONB,

  -- Stats
  reading_time      INT           DEFAULT 5,
  word_count        INT           DEFAULT 800,
  ai_score          INT           DEFAULT 7,
  views             INT           DEFAULT 0,

  -- Status
  published         BOOLEAN       DEFAULT true,
  tweeted           BOOLEAN       DEFAULT false,

  -- Source tracking (used by postExists() to prevent duplicates)
  source_url        TEXT,
  source_headline   TEXT,

  -- Timestamps
  published_at      TIMESTAMPTZ   DEFAULT now(),
  created_at        TIMESTAMPTZ   DEFAULT now(),
  updated_at        TIMESTAMPTZ   DEFAULT now()
);

-- ── UNIQUE constraint: same slug can exist on different sites ─────────────────
-- (e.g. "ipl-2026-preview" on cricket site AND forex site)
CREATE UNIQUE INDEX IF NOT EXISTS posts_site_name_slug_idx
  ON public.posts (site_name, slug);

-- ── Performance indexes ───────────────────────────────────────────────────────
-- Main listing query: site + published + recency
CREATE INDEX IF NOT EXISTS posts_site_name_idx
  ON public.posts (site_name);

-- Category filtering
CREATE INDEX IF NOT EXISTS posts_category_idx
  ON public.posts (site_name, category, created_at DESC);

-- Recency ordering
CREATE INDEX IF NOT EXISTS posts_created_idx
  ON public.posts (created_at DESC);

-- Published filter
CREATE INDEX IF NOT EXISTS posts_published_idx
  ON public.posts (published);

-- Duplicate detection via source URL
CREATE INDEX IF NOT EXISTS posts_source_url_idx
  ON public.posts (source_url);

-- Trending / views
CREATE INDEX IF NOT EXISTS posts_views_idx
  ON public.posts (views DESC);

-- ── updated_at auto-trigger ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_posts_updated_at ON public.posts;
CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist (safe re-run)
DROP POLICY IF EXISTS "Public read published"          ON public.posts;
DROP POLICY IF EXISTS "Service full access"            ON public.posts;
DROP POLICY IF EXISTS "Public can read posts"          ON public.posts;
DROP POLICY IF EXISTS "Anon cannot insert posts"       ON public.posts;
DROP POLICY IF EXISTS "Anon cannot update posts"       ON public.posts;
DROP POLICY IF EXISTS "Anon cannot delete posts"       ON public.posts;

-- Policy 1: Anyone (anon key) can READ published posts
CREATE POLICY "Public read published"
  ON public.posts
  FOR SELECT
  USING (published = true);

-- Policy 2: Service role has FULL access (cron uses service role key)
-- Supabase service_role bypasses RLS automatically, but explicit policy is good practice
CREATE POLICY "Service full access"
  ON public.posts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ── Optional: Full-text search helper function ────────────────────────────────
CREATE OR REPLACE FUNCTION public.search_posts(
  query     TEXT,
  p_site    TEXT,
  lim       INT DEFAULT 20
)
RETURNS SETOF public.posts AS $$
  SELECT *
  FROM public.posts
  WHERE site_name = p_site
    AND published = true
    AND (
      to_tsvector('english', title) @@ plainto_tsquery('english', query)
      OR title ILIKE '%' || query || '%'
    )
  ORDER BY created_at DESC
  LIMIT lim;
$$ LANGUAGE sql STABLE;

-- ── Migration helpers (run if upgrading from old schema) ──────────────────────
-- If you had the old 'site' column instead of 'site_name', run this:
-- ALTER TABLE public.posts RENAME COLUMN site TO site_name;

-- If you had image_url instead of cover_image:
-- ALTER TABLE public.posts RENAME COLUMN image_url TO cover_image;
-- ALTER TABLE public.posts RENAME COLUMN image_alt TO cover_image_alt;

-- If you had author instead of author_name:
-- ALTER TABLE public.posts RENAME COLUMN author TO author_name;

-- ── Verify ────────────────────────────────────────────────────────────────────
-- Run these to confirm setup:
-- SELECT COUNT(*) FROM public.posts;
-- SELECT site_name, COUNT(*) FROM public.posts GROUP BY site_name;
-- SELECT indexname FROM pg_indexes WHERE tablename = 'posts';

-- ============================================================
-- Done. Schema supports 10 sites with shared table.
-- ============================================================
