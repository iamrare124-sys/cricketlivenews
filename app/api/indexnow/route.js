export const dynamic = 'force-dynamic';

import { verifySitePassword } from '@/lib/security';
import { getPostsForSitemap } from '@/lib/supabase';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cricketlivenews.in';
const INDEX_NOW_KEY = process.env.INDEX_NOW_KEY || '';

export async function GET(request) {
  if (!verifySitePassword(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!INDEX_NOW_KEY) {
    return Response.json({ error: 'INDEX_NOW_KEY not set' }, { status: 400 });
  }

  try {
    const posts = await getPostsForSitemap();
    const urls = posts.map((p) => `${SITE_URL}/${p.slug}`);

    if (urls.length === 0) {
      return Response.json({ success: true, submitted: 0, message: 'No URLs to submit' });
    }

    // Submit batch to IndexNow
    const payload = {
      host: new URL(SITE_URL).hostname,
      key: INDEX_NOW_KEY,
      keyLocation: `${SITE_URL}/${INDEX_NOW_KEY}.txt`,
      urlList: urls.slice(0, 10000), // IndexNow max 10k per request
    };

    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });

    return Response.json({
      success: res.ok,
      status: res.status,
      submitted: urls.length,
      urls: urls.slice(0, 5),
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
