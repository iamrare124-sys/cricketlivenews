export const dynamic = 'force-dynamic';

import { verifySitePassword } from '@/lib/security';
import { getPostsMissingExcerpts, updateExcerpt } from '@/lib/supabase';

function extractExcerpt(post) {
  // 1. meta_description
  if (post.meta_description && post.meta_description.length > 30) {
    return post.meta_description.slice(0, 300);
  }

  // 2. Parse content
  let content = post.content;
  if (typeof content === 'string') {
    try { content = JSON.parse(content); } catch {}
  }

  if (content && typeof content === 'object') {
    // hook
    if (content.hook && content.hook.length > 20) return content.hook.slice(0, 300);
    // first section body
    const firstBody = content.sections?.[0]?.body;
    if (firstBody) {
      const sentence = firstBody.split(/[.!?]/)[0];
      if (sentence && sentence.length > 20) return sentence.slice(0, 300) + '.';
    }
    // rawContent
    if (content.rawContent && content.rawContent.length > 20) {
      return content.rawContent.split('\n\n')[0].slice(0, 300);
    }
  }

  // 3. title + tagline
  return `${post.title} — Live IPL Scores & Cricket News India`;
}

export async function GET(request) {
  if (!verifySitePassword(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const posts = await getPostsMissingExcerpts(50);
    let fixed = 0;

    for (const post of posts) {
      const excerpt = extractExcerpt(post);
      await updateExcerpt(post.id, excerpt);
      fixed++;
    }

    return Response.json({ success: true, fixed, total: posts.length });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
