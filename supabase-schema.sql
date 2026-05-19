-- ============================================================
-- CricketLiveNews — Supabase Schema
-- Run this once in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── posts table ──────────────────────────────────────────────────────────────
create table if not exists public.posts (
  id              uuid primary key default uuid_generate_v4(),
  slug            text not null,
  site            text not null default 'cricket',
  title           text not null,
  meta_title      text,
  meta_description text,
  excerpt         text,
  content         text,           -- JSON string (sections + rawContent)
  image_url       text,
  image_alt       text,
  category        text not null default 'ipl-news',
  tags            text[] default '{}',
  author          text default 'Vikram Sharma',
  published_at    timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint posts_slug_site_unique unique (slug, site)
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_posts_site_published
  on public.posts (site, published_at desc);

create index if not exists idx_posts_slug
  on public.posts (slug);

create index if not exists idx_posts_category
  on public.posts (site, category, published_at desc);

create index if not exists idx_posts_title_search
  on public.posts using gin (to_tsvector('english', title));

-- ── updated_at trigger ───────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_posts_updated_at on public.posts;
create trigger trg_posts_updated_at
  before update on public.posts
  for each row execute procedure public.set_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.posts enable row level security;

-- Public read: anyone can read published posts
create policy "Public can read posts"
  on public.posts
  for select
  using (true);

-- Service role only can insert / update / delete
-- (Supabase service_role key bypasses RLS automatically)
-- These policies cover anon/authenticated roles:
create policy "Anon cannot insert posts"
  on public.posts
  for insert
  with check (false);

create policy "Anon cannot update posts"
  on public.posts
  for update
  using (false);

create policy "Anon cannot delete posts"
  on public.posts
  for delete
  using (false);

-- ── Optional: full-text search function ──────────────────────────────────────
create or replace function public.search_posts(query text, site_name text, lim int default 20)
returns setof public.posts as $$
  select *
  from public.posts
  where site = site_name
    and (
      to_tsvector('english', title) @@ plainto_tsquery('english', query)
      or title ilike '%' || query || '%'
    )
  order by published_at desc
  limit lim;
$$ language sql stable;

-- ============================================================
-- Done. Check: select count(*) from public.posts;
-- ============================================================
