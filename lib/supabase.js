import { createClient } from '@supabase/supabase-js'

// ── Lazy clients ─────────────────────────────────────────────────────────────
let _supabase = null
let _supabaseAdmin = null

// CRITICAL: getSiteName() — used in EVERY query to isolate data per site
const getSiteName = () => process.env.SITE_NAME || 'cricket'

const url  = () => process.env.NEXT_PUBLIC_SUPABASE_URL     || 'https://placeholder.supabase.co'
const anon = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon'
const svc  = () => process.env.SUPABASE_SERVICE_ROLE_KEY     || 'placeholder_service'

export function getSupabase() {
  if (!_supabase) _supabase = createClient(url(), anon())
  return _supabase
}

export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(url(), svc(), {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return _supabaseAdmin
}

const POST_LIMIT = parseInt(process.env.MAX_POSTS_PER_SITE || '30', 10)

// ── Read helpers ─────────────────────────────────────────────────────────────

/** Get posts for homepage / category listing */
export async function getPosts({ limit = 12, offset = 0, category = null, search = null } = {}) {
  try {
    const siteName = getSiteName()
    let query = getSupabase()
      .from('posts')
      .select('id, slug, title, excerpt, category, tags, cover_image, cover_image_alt, author_name, reading_time, created_at, published_at')
      .eq('site_name', siteName)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) query = query.eq('category', category)
    if (search)   query = query.ilike('title', `%${search}%`)

    const { data, error } = await query
    if (error) throw error
    return data || []
  } catch (err) {
    console.error('[supabase] getPosts error:', err.message)
    return []
  }
}

/** Get single post by slug — parses JSONB content if returned as string */
export async function getPostBySlug(slug) {
  try {
    const siteName = getSiteName()
    const { data, error } = await getSupabase()
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .eq('site_name', siteName)
      .eq('published', true)
      .maybeSingle()   // never throws on missing row

    if (error || !data) return null

    // Parse content if stored as JSON string
    if (data.content && typeof data.content === 'string') {
      try { data.content = JSON.parse(data.content) } catch {}
    }

    // Increment views — fire and forget, don't await
    getSupabaseAdmin()
      .from('posts')
      .update({ views: (data.views || 0) + 1 })
      .eq('slug', slug)
      .eq('site_name', siteName)
      .then(() => {})

    return data
  } catch (err) {
    console.error('[supabase] getPostBySlug error:', err.message)
    return null
  }
}

/** Related posts in same category, excluding current slug */
export async function getRelatedPosts(category, currentSlug, limit = 3) {
  try {
    const siteName = getSiteName()
    const { data } = await getSupabase()
      .from('posts')
      .select('slug, title, excerpt, cover_image, reading_time, created_at, category, author_name')
      .eq('site_name', siteName)
      .eq('category', category)
      .eq('published', true)
      .neq('slug', currentSlug)
      .order('created_at', { ascending: false })
      .limit(limit)
    return data || []
  } catch { return [] }
}

/** Top posts sorted by views */
export async function getTrendingPosts(limit = 5) {
  try {
    const siteName = getSiteName()
    const { data } = await getSupabase()
      .from('posts')
      .select('id, slug, title, category, created_at, views, reading_time')
      .eq('site_name', siteName)
      .eq('published', true)
      .order('views', { ascending: false })
      .limit(limit)
    return data || []
  } catch { return [] }
}

/** Get posts for sitemap */
export async function getPostsForSitemap() {
  try {
    const siteName = getSiteName()
    const { data } = await getSupabase()
      .from('posts')
      .select('slug, published_at')
      .eq('site_name', siteName)
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(200)
    return data || []
  } catch { return [] }
}

/** Search posts by title (used by /api/search) */
export async function searchPosts(q, limit = 20) {
  try {
    const siteName = getSiteName()
    const { data } = await getSupabase()
      .from('posts')
      .select('id, slug, title, excerpt, cover_image, category, author_name, published_at')
      .eq('site_name', siteName)
      .eq('published', true)
      .ilike('title', `%${q}%`)
      .order('created_at', { ascending: false })
      .limit(limit)
    return data || []
  } catch { return [] }
}

// ── Write helpers ─────────────────────────────────────────────────────────────

/**
 * Check if a post with this source_url already exists for this site.
 * Uses maybeSingle() — never throws on missing row.
 */
export async function postExists(sourceUrl) {
  if (!sourceUrl) return false
  try {
    const siteName = getSiteName()
    const { data, error } = await getSupabaseAdmin()
      .from('posts')
      .select('id')
      .eq('source_url', sourceUrl)
      .eq('site_name', siteName)
      .maybeSingle()   // CRITICAL: not .single()
    if (error) throw error
    return !!data
  } catch { return false }
}

/**
 * Save a generated post to the database.
 * Automatically injects site_name and enforces post limit after insert.
 */
export async function savePost(postData) {
  // CRITICAL: always inject site_name from env — never trust caller
  const record = {
    ...postData,
    site_name: getSiteName(),  // override whatever caller passed
  }

  const { data, error } = await getSupabaseAdmin()
    .from('posts')
    .insert(record)
    .select()
    .single()

  if (error) {
    console.error('[supabase] savePost error:', error.message)
    throw error
  }

  await enforcePostLimit()
  return data
}

/** Update excerpt for a post (used by /api/fix-excerpts) */
export async function updateExcerpt(id, excerpt) {
  const { error } = await getSupabaseAdmin()
    .from('posts')
    .update({ excerpt })
    .eq('id', id)
  if (error) console.error('[supabase] updateExcerpt error:', error.message)
}

/** Get posts missing excerpts */
export async function getPostsMissingExcerpts(limit = 20) {
  try {
    const siteName = getSiteName()
    const { data } = await getSupabaseAdmin()
      .from('posts')
      .select('id, title, meta_description, content')
      .eq('site_name', siteName)
      .or('excerpt.is.null,excerpt.eq.')
      .limit(limit)
    return data || []
  } catch { return [] }
}

// ── Limit enforcement ─────────────────────────────────────────────────────────

/** Delete oldest posts when site exceeds MAX_POSTS_PER_SITE */
async function enforcePostLimit() {
  try {
    const siteName = getSiteName()

    const { count } = await getSupabaseAdmin()
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('site_name', siteName)
      .eq('published', true)

    if (!count || count <= POST_LIMIT) return

    const { data: oldest } = await getSupabaseAdmin()
      .from('posts')
      .select('id')
      .eq('site_name', siteName)
      .eq('published', true)
      .order('created_at', { ascending: true })
      .limit(count - POST_LIMIT)

    if (oldest?.length) {
      await getSupabaseAdmin()
        .from('posts')
        .delete()
        .in('id', oldest.map(p => p.id))
      console.log(`[supabase] enforcePostLimit: deleted ${oldest.length} old posts for ${siteName}`)
    }
  } catch (err) {
    console.error('[supabase] enforcePostLimit error:', err.message)
  }
}
