import siteConfig from '@/config/site.config'

// ── Constants ────────────────────────────────────────────────────────────────
const MAX_AGE = 48 * 60 * 60 * 1000  // 48 hours in ms

// ── XML / RSS parser (zero dependencies) ─────────────────────────────────────
function parseXml(xml) {
  const items = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    const get = (tag) => {
      const r = new RegExp(
        `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
        'i'
      )
      const m = r.exec(block)
      return m ? (m[1] || m[2] || '').trim() : ''
    }
    const title = get('title')
    const pubDate = get('pubDate')
    if (!title) continue   // skip empty items
    items.push({
      title,
      link: get('link'),
      pubDate,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      description: get('description').replace(/<[^>]*>/g, '').slice(0, 400),
      source: 'rss',
    })
  }
  return items
}

// ── Fetch with timeout ────────────────────────────────────────────────────────
async function fetchWithTimeout(url, ms = 9000, extraHeaders = {}) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'User-Agent': 'SyndicateHub/2.0 news aggregator (cricket)',
        ...extraHeaders,
      },
    })
    clearTimeout(id)
    return res
  } catch (err) {
    clearTimeout(id)
    throw err
  }
}

// ── Age check ─────────────────────────────────────────────────────────────────
// CRITICAL: age = Date.now() - pubDate timestamp (milliseconds elapsed)
// NOT: comparing timestamp to a cutoff value — that was the old bug
function isRecent(pubDate) {
  if (!pubDate) return false
  const age = Date.now() - new Date(pubDate).getTime()  // ms elapsed since publication
  return age < MAX_AGE && age > 0                        // must be < 48h AND not future
}

// ── Source 1: Google News RSS ─────────────────────────────────────────────────
async function fetchGoogleNews(queries) {
  const items = []
  for (const q of queries) {
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-IN&gl=IN&ceid=IN:en`
      const res = await fetchWithTimeout(url)
      if (!res.ok) continue
      const xml = await res.text()
      const parsed = parseXml(xml).map(item => ({ ...item, source: 'google-news' }))
      items.push(...parsed)
      console.log(`[rss] Google News "${q}": ${parsed.length} items`)
    } catch (err) {
      console.error(`[rss] Google News "${q}" error:`, err.message)
    }
  }
  return items
}

// ── Source 2: Bing News RSS ───────────────────────────────────────────────────
async function fetchBing(queries) {
  const items = []
  for (const q of queries.slice(0, 2)) {  // limit to 2 queries to avoid rate limit
    try {
      const url = `https://www.bing.com/news/search?q=${encodeURIComponent(q)}&format=RSS`
      const res = await fetchWithTimeout(url)
      if (!res.ok) continue
      const xml = await res.text()
      const parsed = parseXml(xml).map(item => ({ ...item, source: 'bing-news' }))
      items.push(...parsed)
      console.log(`[rss] Bing "${q}": ${parsed.length} items`)
    } catch (err) {
      console.error(`[rss] Bing "${q}" error:`, err.message)
    }
  }
  return items
}

// ── Source 3: Reddit JSON API ─────────────────────────────────────────────────
// Uses .json endpoint (NOT RSS — RSS is broken for reddit)
async function fetchReddit(subreddits) {
  const items = []
  for (const sub of (subreddits || []).slice(0, 3)) {
    try {
      const url = `https://www.reddit.com/r/${sub}/hot.json?limit=15`
      const res = await fetchWithTimeout(url, 9000, {
        'User-Agent': 'SyndicateHub/2.0 cricket news aggregator',
      })
      if (!res.ok) {
        console.warn(`[rss] Reddit r/${sub} returned ${res.status}`)
        continue
      }
      const json = await res.json()
      const posts = json?.data?.children || []

      const fresh = posts.filter(p => {
        if (p.data.stickied) return false  // skip mod stickies
        const age = Date.now() - p.data.created_utc * 1000  // created_utc is seconds
        return age < 24 * 60 * 60 * 1000  // only last 24h from reddit (more conservative)
      })

      const mapped = fresh.slice(0, 4).map(p => ({
        title: p.data.title,
        link: `https://reddit.com${p.data.permalink}`,
        pubDate: new Date(p.data.created_utc * 1000).toUTCString(),
        publishedAt: new Date(p.data.created_utc * 1000).toISOString(),
        description: (p.data.selftext || p.data.title).slice(0, 400),
        source: `r/${sub}`,
      }))

      items.push(...mapped)
      console.log(`[rss] Reddit r/${sub}: ${mapped.length} fresh items`)
    } catch (err) {
      console.error(`[rss] Reddit r/${sub} error:`, err.message)
    }
  }
  return items
}

// ── Source 4: NewsAPI ─────────────────────────────────────────────────────────
async function fetchNewsApi(query) {
  const key = process.env.NEWS_API_KEY
  if (!key) return []
  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${key}`
    const res = await fetchWithTimeout(url)
    if (!res.ok) return []
    const json = await res.json()
    const mapped = (json.articles || [])
      .filter(a => a.title && a.title !== '[Removed]')
      .map(a => ({
        title: a.title,
        link: a.url,
        pubDate: a.publishedAt,
        publishedAt: a.publishedAt,
        description: (a.description || a.title).slice(0, 400),
        source: 'newsapi',
      }))
    console.log(`[rss] NewsAPI "${query}": ${mapped.length} items`)
    return mapped
  } catch (err) {
    console.error('[rss] NewsAPI error:', err.message)
    return []
  }
}

// ── Deduplication by first 60 chars of title ──────────────────────────────────
function deduplicate(items) {
  const seen = new Set()
  return items.filter(item => {
    const key = (item.title || '').slice(0, 60).toLowerCase().trim()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ── Keyword relevance scorer ──────────────────────────────────────────────────
function scoreItem(item, keywords = []) {
  const text = `${item.title} ${item.description || ''}`.toLowerCase()
  let score = 0

  for (const kw of keywords) {
    if (text.includes(kw.toLowerCase())) score += 3
  }

  // Recency bonus: newer stories score higher
  const pubDate = item.publishedAt || item.pubDate
  if (pubDate) {
    const ageMs = Date.now() - new Date(pubDate).getTime()
    const ageHours = ageMs / (1000 * 60 * 60)
    score += Math.max(0, 48 - ageHours)  // up to +48 for brand new
  }

  return score
}

// ── Main export: fetch all 4 sources in parallel ──────────────────────────────
export async function fetchAllSources() {
  const keywords = [
    siteConfig.seo?.primaryKeyword || '',
    ...(siteConfig.seo?.secondaryKeywords || []),
  ]

  const queries = siteConfig.rssSources
    ? siteConfig.rssSources.map(url => {
        // Extract query string from Google News RSS URLs
        const match = url.match(/q=([^&]+)/)
        return match ? decodeURIComponent(match[1]) : 'IPL cricket india'
      })
    : ['IPL cricket india match 2026', 'india cricket team match today', 'IPL player wicket']

  const subreddits = siteConfig.reddit || ['Cricket', 'IPL', 'india']

  // All 4 sources in parallel — Promise.allSettled means one failure won't kill others
  const results = await Promise.allSettled([
    fetchGoogleNews(queries),
    fetchBing(queries.slice(0, 2)),
    fetchReddit(subreddits),
    fetchNewsApi('IPL cricket india 2026'),
  ])

  const allItems = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value || [])

  // CRITICAL age filter — uses correct calculation: elapsed ms since pubDate
  const recent = allItems.filter(item => {
    const date = item.publishedAt || item.pubDate
    return isRecent(date)
  })

  // Deduplicate by title prefix
  const unique = deduplicate(recent)

  // Score by keyword relevance + recency, sort desc
  const scored = unique
    .map(item => ({ ...item, _score: scoreItem(item, keywords) }))
    .sort((a, b) => b._score - a._score || new Date(b.publishedAt || b.pubDate) - new Date(a.publishedAt || a.pubDate))

  console.log(
    `[rss] fetchAllSources: ${allItems.length} raw → ${recent.length} recent → ${unique.length} unique → ${scored.length} scored`
  )

  return scored
}

/** Pick the best story (already sorted by score) */
export function selectBestStory(items) {
  if (!items || items.length === 0) return null
  return items[0]
}

/** Pick a random story from the top-N pool for variety */
export function pickRandomFromTop(items, n = 5) {
  const pool = items.slice(0, Math.min(n, items.length))
  if (pool.length === 0) return null
  return pool[Math.floor(Math.random() * pool.length)]
}
