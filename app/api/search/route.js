export const dynamic = 'force-dynamic';

import { getPosts } from '@/lib/supabase';
import { rateLimit } from '@/lib/security';

export async function GET(request) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim() || '';

  if (!q || q.length < 2) {
    return Response.json({ results: [], query: q });
  }

  if (q.length > 200) {
    return Response.json({ error: 'Query too long' }, { status: 400 });
  }

  // Basic rate limiting (10 searches/min per IP)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const { allowed } = rateLimit(`search:${ip}`, 10, 60000);
  if (!allowed) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const results = await getPosts({ limit: 20, search: q });
    return Response.json({ results, query: q, count: results.length });
  } catch (err) {
    console.error('[search] Error:', err.message);
    return Response.json({ error: 'Search failed', results: [] }, { status: 500 });
  }
}
