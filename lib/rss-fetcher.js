import siteConfig from '@/config/site.config';

const MAX_AGE = 48 * 60 * 60 * 1000; // 48 hours in milliseconds

// ── XML / RSS parser (no external dep) ──────────────────────────────────────
function parseXml(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const get = (tag) => {
      const r = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
      const m = r.exec(block);
      return m ? (m[1] || m[2] || '').trim() : '';
    };
    items.push({
      title: get('title'),
      link: get('link'),
      pubDate: get('pubDate'),
      description: get('description'),
      source: 'rss',
    });
  }
  return items;
}

// ── Fetch with timeout ───────────────────────────────────────────────────────
async function fetchWithTimeout(url, ms = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// ── Individual source fetchers ───────────────────────────────────────────────

async function fetchGoogleNewsRss(query) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];
    const xml = await res.text();
    return parseXml(xml).map((item) => ({ ...item, source: 'google-news' }));
  } catch (err) {
    console.error('[rss] Google News fetch error:', err.message);
    return [];
  }
}

async function fetchRedditJson(subreddit) {
  const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=10`;
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];
    const json = await res.json();
    const posts = json?.data?.children || [];
    return posts.map((p) => ({
      title: p.data.title,
      link: `https://www.reddit.com${p.data.permalink}`,
      pubDate: new Date(p.data.created_utc * 1000).toUTCString(),
      description: p.data.selftext?.slice(0, 300) || p.data.title,
      source: 'reddit',
    }));
  } catch (err) {
    console.error('[rss] Reddit fetch error:', err.message);
    return [];
  }
}

async function fetchNewsApiRss(query) {
  const key = process.env.NEWS_API_KEY;
  if (!key) return [];
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${key}`;
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];
    const json = await res.json();
    return (json.articles || []).map((a) => ({
      title: a.title,
      link: a.url,
      pubDate: a.publishedAt,
      description: a.description || '',
      source: 'newsapi',
    }));
  } catch (err) {
    console.error('[rss] NewsAPI fetch error:', err.message);
    return [];
  }
}

// ── Age filter ───────────────────────────────────────────────────────────────
function isRecent(pubDate) {
  if (!pubDate) return false;
  const age = Date.now() - new Date(pubDate).getTime(); // CRITICAL: correct age calculation
  return age < MAX_AGE && age > 0;
}

// ── Deduplication by first 60 chars of title ────────────────────────────────
function deduplicate(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = (item.title || '').slice(0, 60).toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Keyword scorer ───────────────────────────────────────────────────────────
function scoreItem(item, keywords = []) {
  const text = `${item.title} ${item.description}`.toLowerCase();
  let score = 0;

  // Keyword match score
  for (const kw of keywords) {
    if (text.includes(kw.toLowerCase())) score += 3;
  }

  // Recency score (newer = higher)
  const ageMs = Date.now() - new Date(item.pubDate).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  score += Math.max(0, 48 - ageHours); // up to 48 bonus points for freshness

  return score;
}

// ── Main exports ─────────────────────────────────────────────────────────────

/** Fetch from all configured sources in parallel, filter, deduplicate, sort by recency. */
export async function fetchAllSources() {
  const keywords = [
    siteConfig.seo.primaryKeyword,
    ...siteConfig.seo.secondaryKeywords,
  ];

  const queries = ['IPL cricket india match 2026', 'india cricket team match today', 'IPL player auction score wicket'];
  const subreddits = siteConfig.reddit || ['Cricket', 'IPL'];

  // Fetch all sources in parallel
  const results = await Promise.allSettled([
    ...queries.map((q) => fetchGoogleNewsRss(q)),
    ...subreddits.map((r) => fetchRedditJson(r)),
    fetchNewsApiRss('IPL cricket india 2026'),
  ]);

  const allItems = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value || []);

  // Filter by age
  const recent = allItems.filter((item) => isRecent(item.pubDate));

  // Deduplicate
  const unique = deduplicate(recent);

  // Score and sort
  const scored = unique
    .map((item) => ({ ...item, _score: scoreItem(item, keywords) }))
    .sort((a, b) => b._score - a._score || new Date(b.pubDate) - new Date(a.pubDate));

  console.log(`[rss] fetchAllSources: ${allItems.length} raw → ${recent.length} recent → ${unique.length} unique → ${scored.length} scored`);

  return scored;
}

/** Pick the single best story from a list of items. */
export function selectBestStory(items) {
  if (!items || items.length === 0) return null;
  return items[0]; // Already sorted by score desc
}

/** Shuffle for variety — pick a random top-N story. */
export function pickRandomFromTop(items, n = 5) {
  const pool = items.slice(0, n);
  return pool[Math.floor(Math.random() * pool.length)] || null;
}
