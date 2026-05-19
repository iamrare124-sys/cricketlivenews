export const dynamic = 'force-dynamic';
export const maxDuration = 300;

import { verifyCronSecret } from '@/lib/security';
import { fetchAllSources, selectBestStory, pickRandomFromTop } from '@/lib/rss-fetcher';
import { generatePost, generateSlug } from '@/lib/blog-generator';
import { savePost, postExists } from '@/lib/supabase';
import { fetchImage } from '@/lib/image-fetcher';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cricketlivenews.in';
const POSTS_PER_RUN = 3;

/** Fire-and-forget IndexNow ping */
async function pingIndexNow(slug) {
  const key = process.env.INDEX_NOW_KEY;
  if (!key) return;
  const url = `${SITE_URL}/${slug}`;
  try {
    await fetch(
      `https://api.indexnow.org/indexnow?url=${encodeURIComponent(url)}&key=${key}`,
      { method: 'GET', signal: AbortSignal.timeout(5000) }
    );
  } catch {
    // fire and forget — ignore errors
  }
}

/** Build excerpt with 3 fallbacks */
function buildExcerpt(generated, story) {
  // 1. metaDescription
  if (generated.metaDescription && generated.metaDescription.length > 30) {
    return generated.metaDescription.slice(0, 300);
  }
  // 2. content.hook
  const hook = generated.content?.hook;
  if (hook && hook.length > 20) {
    return hook.slice(0, 300);
  }
  // 3. sections[0].body first sentence
  const firstBody = generated.content?.sections?.[0]?.body;
  if (firstBody) {
    const sentence = firstBody.split(/[.!?]/)[0];
    if (sentence && sentence.length > 20) return sentence.slice(0, 300) + '.';
  }
  // 4. title + tagline fallback
  return `${generated.title || story.title} — ${process.env.NICHE === 'cricket' ? 'Live IPL Scores & Cricket News India' : 'Latest News'}`;
}

export async function GET(request) {
  const startTime = Date.now();

  // ── Auth ─────────────────────────────────────────────────────────────────
  if (!verifyCronSecret(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = { published: [], errors: [] };

  try {
    // ── 1. Fetch news stories ───────────────────────────────────────────────
    console.log('[cron] Fetching news sources...');
    const stories = await fetchAllSources();
    console.log(`[cron] Found ${stories.length} fresh stories`);

    if (stories.length === 0) {
      return Response.json({
        success: true,
        requested: POSTS_PER_RUN,
        published: 0,
        duration_seconds: ((Date.now() - startTime) / 1000).toFixed(1),
        posts: [],
        errors: ['No fresh stories found in RSS feeds'],
      });
    }

    // ── 2. Generate posts ───────────────────────────────────────────────────
    let published = 0;
    const usedStories = new Set();

    for (let i = 0; i < POSTS_PER_RUN; i++) {
      // Pick a story we haven't used this run
      const story = pickRandomFromTop(
        stories.filter((s) => !usedStories.has(s.title?.slice(0, 60))),
        Math.min(10, stories.length)
      ) || selectBestStory(stories);

      if (!story) {
        results.errors.push(`Run ${i + 1}: No story available`);
        continue;
      }

      usedStories.add(story.title?.slice(0, 60));

      try {
        // ── Generate slug first, check duplicate ───────────────────────────
        const tempSlug = generateSlug(story.title || `cricket-update-${Date.now()}`);

        const exists = await postExists(tempSlug);
        if (exists) {
          console.log(`[cron] Skipping duplicate slug: ${tempSlug}`);
          results.errors.push(`Run ${i + 1}: Duplicate — ${tempSlug}`);
          continue;
        }

        // ── Generate full post ─────────────────────────────────────────────
        console.log(`[cron] Generating post ${i + 1}: ${story.title?.slice(0, 60)}`);
        const generated = await generatePost(story);

        if (!generated || !generated.title) {
          results.errors.push(`Run ${i + 1}: Generation failed — no title`);
          continue;
        }

        const slug = generateSlug(generated.title);

        // Double-check slug after generation (title may differ from story title)
        const slugExists = await postExists(slug);
        if (slugExists) {
          results.errors.push(`Run ${i + 1}: Slug conflict after generation — ${slug}`);
          continue;
        }

        // ── Fetch image ────────────────────────────────────────────────────
        const image = await fetchImage(generated.title);

        // ── Build excerpt ──────────────────────────────────────────────────
        const excerpt = buildExcerpt(generated, story);

        // ── Save to DB ─────────────────────────────────────────────────────
        const saved = await savePost({
          slug,
          title: generated.title,
          metaTitle: generated.metaTitle,
          metaDescription: generated.metaDescription,
          excerpt,
          content: {
            ...generated.content,
            rawContent: generated.rawContent || '',
          },
          imageUrl: image?.url || '',
          imageAlt: image?.alt || generated.title,
          category: generated.category || 'ipl-news',
          tags: generated.tags || [],
          author: process.env.AUTHOR_NAME || 'Vikram Sharma',
          publishedAt: new Date().toISOString(),
        });

        results.published.push({
          slug,
          title: generated.title,
          category: generated.category,
        });

        published++;
        console.log(`[cron] ✓ Published: ${slug}`);

        // ── Ping IndexNow (fire and forget) ───────────────────────────────
        pingIndexNow(slug);

        // Small delay between posts to avoid rate limits
        if (i < POSTS_PER_RUN - 1) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      } catch (err) {
        console.error(`[cron] Error on post ${i + 1}:`, err.message);
        results.errors.push(`Run ${i + 1}: ${err.message}`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[cron] Done. Published ${published}/${POSTS_PER_RUN} in ${duration}s`);

    return Response.json({
      success: true,
      requested: POSTS_PER_RUN,
      published,
      duration_seconds: parseFloat(duration),
      posts: results.published,
      errors: results.errors,
    });
  } catch (err) {
    console.error('[cron] Fatal error:', err);
    return Response.json(
      {
        success: false,
        error: err.message,
        duration_seconds: ((Date.now() - startTime) / 1000).toFixed(1),
      },
      { status: 500 }
    );
  }
}
