export const dynamic    = 'force-dynamic'
export const maxDuration = 300

import { verifyCronSecret }                            from '@/lib/security'
import { fetchAllSources, selectBestStory, pickRandomFromTop } from '@/lib/rss-fetcher'
import { generatePost, generateSlug }                  from '@/lib/blog-generator'
import { savePost, postExists }                        from '@/lib/supabase'
import { fetchImage }                                  from '@/lib/image-fetcher'
import siteConfig                                      from '@/config/site.config'

const SITE_URL      = process.env.NEXT_PUBLIC_SITE_URL || 'https://cricketlivenews.in'
const POSTS_PER_RUN = parseInt(process.env.POSTS_PER_RUN || '3', 10)

// ── Fire-and-forget IndexNow ping ─────────────────────────────────────────────
async function pingIndexNow(slug) {
  const key = process.env.INDEX_NOW_KEY
  if (!key) return
  try {
    await fetch(
      `https://api.indexnow.org/indexnow?url=${encodeURIComponent(`${SITE_URL}/${slug}`)}&key=${key}`,
      { method: 'GET', signal: AbortSignal.timeout(5000) }
    )
    console.log(`[cron] IndexNow pinged: ${slug}`)
  } catch { /* fire and forget */ }
}

// ── Excerpt builder — 4-level fallback chain ──────────────────────────────────
function buildExcerpt(generated, story) {
  // 1. metaDescription (best — already SEO-optimised)
  if (generated.metaDescription?.length > 30) {
    return generated.metaDescription.slice(0, 300)
  }
  // 2. content.hook (first line of article)
  if (generated.content?.hook?.length > 20) {
    return generated.content.hook.slice(0, 300)
  }
  // 3. First sentence of first section body
  const firstBody = generated.content?.sections?.[0]?.body
  if (firstBody) {
    const sentence = firstBody.split(/[.!?]/)[0]
    if (sentence?.length > 20) return sentence.slice(0, 300) + '.'
  }
  // 4. Title + tagline last resort
  return `${generated.title || story.title} — ${siteConfig.tagline || 'Latest News'}`
}

// ── Cron handler ──────────────────────────────────────────────────────────────
export async function GET(request) {
  const startTime = Date.now()

  // Auth — checks Bearer header, ?secret=, and x-cron-secret
  if (!verifyCronSecret(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = { published: [], errors: [] }

  try {
    // 1. Fetch stories from all RSS sources
    console.log(`[cron] Starting run for site: ${process.env.SITE_NAME || 'cricket'}`)
    const stories = await fetchAllSources()
    console.log(`[cron] ${stories.length} fresh stories found`)

    if (stories.length === 0) {
      return Response.json({
        success: true,
        site: process.env.SITE_NAME,
        requested: POSTS_PER_RUN,
        published: 0,
        duration_seconds: ((Date.now() - startTime) / 1000).toFixed(1),
        posts: [],
        errors: ['No fresh stories found — check RSS sources and MAX_AGE filter'],
      })
    }

    // 2. Generate posts
    let published = 0
    const usedTitles = new Set()

    for (let i = 0; i < POSTS_PER_RUN; i++) {
      // Pick unused story from top pool
      const available = stories.filter(s => !usedTitles.has(s.title?.slice(0, 60)))
      const story = pickRandomFromTop(available, Math.min(10, available.length))
               || selectBestStory(stories)

      if (!story) {
        results.errors.push(`Run ${i + 1}: No story available`)
        continue
      }

      usedTitles.add(story.title?.slice(0, 60))

      try {
        // Check for duplicate by source URL (gold standard dedup method)
        const isDupe = await postExists(story.link || '')
        if (isDupe) {
          console.log(`[cron] Skipping duplicate source: ${story.link}`)
          results.errors.push(`Run ${i + 1}: Duplicate source URL`)
          continue
        }

        // Generate AI post
        console.log(`[cron] Generating post ${i + 1}: "${story.title?.slice(0, 55)}"`)
        const generated = await generatePost(story)

        if (!generated?.title) {
          results.errors.push(`Run ${i + 1}: Generation returned no title`)
          continue
        }

        const slug = generateSlug(generated.title)

        // Fetch cover image
        const image = await fetchImage(generated.title)

        // Build excerpt (4-level fallback)
        const excerpt = buildExcerpt(generated, story)

        // Compute reading time
        const wordCount  = (generated.rawContent || '').split(/\s+/).length
        const readingTime = Math.max(1, Math.ceil(wordCount / 200))

        // Save to DB — savePost() injects site_name automatically
        await savePost({
          slug,
          title:            generated.title,
          excerpt,
          content:          { ...generated.content, rawContent: generated.rawContent || '' },
          category:         generated.category  || 'ipl-news',
          tags:             generated.tags       || [],

          // Cover image — correct column names matching schema
          cover_image:      image?.url   || '',
          cover_image_alt:  image?.alt   || generated.title,

          // Author from config
          author_name:      siteConfig.author?.name  || 'Vikram Sharma',
          author_title:     siteConfig.author?.title || 'Cricket Analyst',

          // SEO
          meta_title:       generated.metaTitle      || generated.title,
          meta_description: generated.metaDescription|| excerpt,

          // Stats
          word_count:       wordCount,
          reading_time:     readingTime,
          ai_score:         10,

          // Source tracking — used by postExists() for future dedup
          source_url:       story.link        || '',
          source_headline:  story.title       || '',

          published:        true,
          published_at:     new Date().toISOString(),
        })

        results.published.push({ slug, title: generated.title, category: generated.category })
        published++
        console.log(`[cron] ✓ Saved: ${slug}`)

        // Ping IndexNow (fire and forget)
        pingIndexNow(slug)

        // Rate limit buffer between posts
        if (i < POSTS_PER_RUN - 1) {
          await new Promise(r => setTimeout(r, 2000))
        }

      } catch (err) {
        console.error(`[cron] Error on post ${i + 1}:`, err.message)
        results.errors.push(`Run ${i + 1}: ${err.message}`)
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`[cron] Done — ${published}/${POSTS_PER_RUN} published in ${duration}s`)

    return Response.json({
      success: true,
      site: process.env.SITE_NAME,
      requested: POSTS_PER_RUN,
      published,
      duration_seconds: parseFloat(duration),
      posts: results.published,
      errors: results.errors,
    })

  } catch (err) {
    console.error('[cron] Fatal error:', err)
    return Response.json({
      success: false,
      error: err.message,
      duration_seconds: ((Date.now() - startTime) / 1000).toFixed(1),
    }, { status: 500 })
  }
}
