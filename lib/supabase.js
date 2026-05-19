import { createClient } from '@supabase/supabase-js';

// ── Lazy clients ────────────────────────────────────────────────────────────
let _supabase = null;
let _supabaseAdmin = null;

export function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Supabase env vars not set');
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase service role env vars not set');
    _supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabaseAdmin;
}

const MAX_POSTS = parseInt(process.env.MAX_POSTS_PER_SITE || '30', 10);
const SITE_NAME = process.env.NICHE || 'cricket';

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Check if a post with this slug already exists. Uses maybeSingle — never throws on missing. */
export async function postExists(slug) {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('posts')
    .select('id')
    .eq('slug', slug)
    .eq('site', SITE_NAME)
    .maybeSingle();
  if (error) {
    console.error('[supabase] postExists error:', error.message);
    return false;
  }
  return !!data;
}

/** Save a generated post to the database. */
export async function savePost(post) {
  const db = getSupabaseAdmin();

  const record = {
    slug: post.slug,
    site: SITE_NAME,
    title: post.title,
    meta_title: post.metaTitle || post.title,
    meta_description: post.metaDescription || '',
    excerpt: post.excerpt || '',
    content: typeof post.content === 'string' ? post.content : JSON.stringify(post.content),
    image_url: post.imageUrl || '',
    image_alt: post.imageAlt || post.title,
    category: post.category || 'ipl-news',
    tags: post.tags || [],
    author: post.author || 'Vikram Sharma',
    published_at: post.publishedAt || new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const { data, error } = await db.from('posts').insert(record).select().single();
  if (error) {
    console.error('[supabase] savePost error:', error.message);
    throw error;
  }

  // Enforce post limit after every insert
  await enforcePostLimit();

  return data;
}

/** Delete oldest posts when count exceeds MAX_POSTS_PER_SITE. */
export async function enforcePostLimit() {
  const db = getSupabaseAdmin();

  const { count } = await db
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('site', SITE_NAME);

  if (count && count > MAX_POSTS) {
    const excess = count - MAX_POSTS;
    const { data: oldest } = await db
      .from('posts')
      .select('id')
      .eq('site', SITE_NAME)
      .order('published_at', { ascending: true })
      .limit(excess);

    if (oldest && oldest.length > 0) {
      const ids = oldest.map((p) => p.id);
      await db.from('posts').delete().in('id', ids);
      console.log(`[supabase] enforcePostLimit: deleted ${ids.length} old posts`);
    }
  }
}

/** Get all posts (for homepage / listing). */
export async function getPosts({ limit = 20, category = null, search = null } = {}) {
  try {
    const db = getSupabase();
    let query = db
      .from('posts')
      .select('id, slug, title, excerpt, image_url, image_alt, category, tags, author, published_at')
      .eq('site', SITE_NAME)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (category) query = query.eq('category', category);
    if (search) query = query.ilike('title', `%${search}%`);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[supabase] getPosts error:', err.message);
    return [];
  }
}

/** Get a single post by slug. Parses content JSON if stored as string. */
export async function getPostBySlug(slug) {
  try {
    const db = getSupabase();
    const { data, error } = await db
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .eq('site', SITE_NAME)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    // Parse content if it was stored as a JSON string
    if (typeof data.content === 'string') {
      try {
        data.content = JSON.parse(data.content);
      } catch {
        // Not JSON — leave as raw string
      }
    }

    return data;
  } catch (err) {
    console.error('[supabase] getPostBySlug error:', err.message);
    return null;
  }
}

/** Get posts for sitemap — just slug + published_at. */
export async function getPostsForSitemap() {
  try {
    const db = getSupabase();
    const { data } = await db
      .from('posts')
      .select('slug, published_at')
      .eq('site', SITE_NAME)
      .order('published_at', { ascending: false })
      .limit(200);
    return data || [];
  } catch {
    return [];
  }
}

/** Update excerpt for a post by ID (used by fix-excerpts route). */
export async function updateExcerpt(id, excerpt) {
  const db = getSupabaseAdmin();
  const { error } = await db.from('posts').update({ excerpt }).eq('id', id);
  if (error) console.error('[supabase] updateExcerpt error:', error.message);
}

/** Get posts with missing or short excerpts. */
export async function getPostsMissingExcerpts(limit = 20) {
  try {
    const db = getSupabaseAdmin();
    const { data } = await db
      .from('posts')
      .select('id, title, meta_description, content')
      .eq('site', SITE_NAME)
      .or('excerpt.is.null,excerpt.eq.')
      .limit(limit);
    return data || [];
  } catch {
    return [];
  }
}
