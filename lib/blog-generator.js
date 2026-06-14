import Groq from 'groq-sdk'
import siteConfig from '@/config/site.config'

// ── Lazy Groq init — NEVER at module level ────────────────────────────────────
let _groq = null
function getGroq() {
  if (!_groq) {
    const key = process.env.GROQ_API_KEY
    if (!key) throw new Error('GROQ_API_KEY not set')
    _groq = new Groq({ apiKey: key })
  }
  return _groq
}

const MODEL = 'llama-3.3-70b-versatile'

// ── Banned phrases — first generation pass ────────────────────────────────────
const BANNED_PHRASES = [
  'furthermore',
  'moreover',
  'in this article',
  'it is important to note',
  'it is worth noting',
  'it should be noted',
  'one must consider',
  'in light of',
  'with regard to',
  'delve into',
  'in conclusion',
  'robust',
  'comprehensive',
  'having said that',
  'needless to say',
  'as we can see',
  'rest assured',
  'at the end of the day',
  'as previously mentioned',
  'it goes without saying',
  'in terms of',
]

// ── AI-detection patterns — triggers retry if found ───────────────────────────
const AI_DETECTION_PATTERNS = [
  'it is worth noting',
  'it should be noted',
  'one must consider',
  'in light of',
  'with regard to',
  'it is important to',
  'needless to say',
  'as previously mentioned',
  'it goes without saying',
  'in terms of',
]

// ── System prompt — includes AI personality + anti-detection rules ─────────────
const SYSTEM_PROMPT = `${siteConfig.aiPersonality}

BANNED PHRASES — NEVER USE ANY OF THESE:
${BANNED_PHRASES.map(p => `- "${p}"`).join('\n')}

ANTI-AI-DETECTION RULES — follow every one strictly:
1. VARY sentence length aggressively: short punch. Then a longer, detail-rich sentence that builds the point with a specific stat or name. Then medium. Never three sentences of the same length in a row.
2. USE contractions always: it's, don't, won't, here's, that's, they're, can't, isn't
3. START 2-3 sentences with "And" or "But" — real journalists do this constantly
4. ADD one personal aside per section: "And honestly?", "Here's the thing —", "Look,", "Real talk:", "Let me be clear:"
5. INCLUDE one rhetorical question per article
6. USE em-dashes for interruptions — like this — instead of always using commas
7. NUMBERS in the first paragraph always — specific stats, not vague claims
8. ONE strong opinion stated as fact per article: "This is the worst tactical call of the season." or "That DRS review changed everything."
9. ACTIVE voice only. Passive voice never.
10. NO corporate/academic language. Write like a passionate cricket journalist texting a mate who also loves the sport.

OUTPUT FORMAT — respond EXACTLY in this structure (no deviation):
TITLE: [engaging headline under 80 chars]
META_TITLE: [SEO title under 60 chars]
META_DESC: [meta description 130-155 chars, includes primary keyword]
TAGS: [tag1, tag2, tag3, tag4, tag5]
CATEGORY: [one of: ipl-news | match-analysis | player-news | cricket-tips]
CONTENT:
[Full article. Use ## for section headings. Minimum 700 words. No markdown bold (**text**). Be opinionated. Use cricket terms naturally: LBW, DRS, powerplay, death overs, Duckworth-Lewis, reverse swing, carrom ball. Mention player names, team names, venues, pitch conditions.]
FAQ:
Q: [question 1]
A: [answer 1]
Q: [question 2]
A: [answer 2]
Q: [question 3]
A: [answer 3]
Q: [question 4]
A: [answer 4]
END`

// ── Section parser ─────────────────────────────────────────────────────────────
function parseSections(contentText) {
  if (!contentText || !contentText.trim()) return []

  const lines = contentText.split('\n')
  const sections = []
  let currentHeading = null
  let currentBody = []

  const flush = () => {
    const body = currentBody.join('\n').trim()
    if (body) sections.push({ heading: currentHeading, body })
    currentBody = []
    currentHeading = null
  }

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)/)
    const boldMatch    = line.match(/^\*\*(.+)\*\*\s*$/)
    if (headingMatch || boldMatch) {
      flush()
      currentHeading = (headingMatch ? headingMatch[1] : boldMatch[1]).trim()
    } else {
      currentBody.push(line)
    }
  }
  flush()

  // Fallback: no headings found → split by double newline
  if (sections.length <= 1 && contentText.includes('\n\n')) {
    return contentText
      .split('\n\n')
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => ({ heading: null, body: p }))
  }

  return sections
}

// ── FAQ parser ─────────────────────────────────────────────────────────────────
function parseFaq(faqText) {
  if (!faqText) return []
  const faqs = []
  const qRegex = /Q:\s*(.+?)(?=\nA:)/gs
  const aRegex = /A:\s*(.+?)(?=\nQ:|$)/gs
  const questions = [...faqText.matchAll(qRegex)].map(m => m[1].trim())
  const answers   = [...faqText.matchAll(aRegex)].map(m => m[1].trim())
  for (let i = 0; i < Math.min(questions.length, answers.length); i++) {
    faqs.push({ question: questions[i], answer: answers[i] })
  }
  return faqs
}

// ── Raw output parser ──────────────────────────────────────────────────────────
function parseGenerated(rawText) {
  const get = (key, nextKey) => {
    const start = rawText.indexOf(`${key}:`)
    if (start === -1) return ''
    const valueStart = start + key.length + 1
    const end = nextKey
      ? rawText.indexOf(`\n${nextKey}:`, valueStart)
      : rawText.indexOf('\nEND', valueStart)
    const slice = end === -1 ? rawText.slice(valueStart) : rawText.slice(valueStart, end)
    return slice.trim()
  }

  const title          = get('TITLE', 'META_TITLE')
  const metaTitle      = get('META_TITLE', 'META_DESC')
  const metaDescription= get('META_DESC', 'TAGS')
  const tagsRaw        = get('TAGS', 'CATEGORY')
  const category       = get('CATEGORY', 'CONTENT')
  const contentRaw     = get('CONTENT', 'FAQ')
  const faqRaw         = get('FAQ', null)

  const tags = tagsRaw
    .split(',')
    .map(t => t.trim().toLowerCase().replace(/\s+/g, '-'))
    .filter(Boolean)
    .slice(0, 5)

  const sections = parseSections(contentRaw)
  const faq      = parseFaq(faqRaw)
  const hook     = sections[0]?.body?.split('\n')[0] || ''

  return {
    title: title || 'Cricket Update',
    metaTitle: metaTitle || title,
    metaDescription,
    tags,
    category: category || 'ipl-news',
    content: { hook, sections, faq, rawContent: contentRaw },
    rawContent: contentRaw,
    rawText,
  }
}

// ── Quality scorer ─────────────────────────────────────────────────────────────
function qualityScore(parsed) {
  let score = 10
  const text = (parsed.rawContent || '').toLowerCase()

  // Deduct for banned phrases
  for (const phrase of BANNED_PHRASES) {
    if (text.includes(phrase)) score -= 1
  }

  // Deduct for AI detection patterns (harder check)
  for (const pattern of AI_DETECTION_PATTERNS) {
    if (text.includes(pattern)) {
      console.warn(`[generator] AI pattern detected: "${pattern}"`)
      score -= 2
    }
  }

  // Deduct for missing required elements
  if (!parsed.title || parsed.title.length < 10)           score -= 2
  if (!parsed.metaDescription || parsed.metaDescription.length < 50) score -= 1
  if (!parsed.content?.sections?.length)                    score -= 2
  if ((parsed.rawContent || '').split(' ').length < 400)    score -= 2

  return Math.max(0, score)
}

// ── Humanize pass — second Groq call to remove AI patterns ────────────────────
async function humanizeContent(rawContent) {
  try {
    const completion = await getGroq().chat.completions.create({
      model: MODEL,
      max_tokens: 2500,
      temperature: 0.9,
      frequency_penalty: 0.5,
      messages: [{
        role: 'user',
        content: `Rewrite this cricket article to sound like a real human journalist wrote it.

RULES:
1. Break long sentences into 2-3 shorter ones
2. Add 1-2 conversational asides like "And honestly?" or "Here's the thing —" or "Look,"
3. Use contractions: "it's", "don't", "here's", "that's", "won't", "can't"
4. Start 2-3 sentences with "And" or "But" (humans do this, AI avoids it)
5. Add one slightly informal phrase per section
6. Remove ALL formal/academic phrasing
7. Keep all facts, numbers, player names, and quotes EXACTLY the same — do not invent anything
8. Keep the same ## headings and article structure
9. Output ONLY the rewritten article — no preamble, no "Here is the rewritten..." prefix

ARTICLE:
${rawContent.slice(0, 4000)}`
      }]
    })
    return completion.choices[0]?.message?.content?.trim() || rawContent
  } catch (err) {
    console.warn('[generator] humanize pass failed (using original):', err.message)
    return rawContent  // fallback — never throw
  }
}

// ── Slug generator ─────────────────────────────────────────────────────────────
export function generateSlug(title) {
  return (title || 'post')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

// ── Main generator ─────────────────────────────────────────────────────────────
/**
 * Generate a full blog post from a news story.
 * @param {object} story - { title, description, link, pubDate, publishedAt }
 * @returns {object} parsed post with content, metadata, FAQ
 */
export async function generatePost(story) {
  const groq = getGroq()
  const maxRetries = 3
  let lastParsed = null

  const prompt = `Write a detailed cricket news article based on this story:

Headline: ${story.title}
Summary: ${story.description || story.title}
Source URL: ${story.link || ''}
Published: ${story.publishedAt || story.pubDate || new Date().toISOString()}

Primary keyword to include naturally: ${siteConfig.seo?.primaryKeyword || 'IPL cricket news india'}
Secondary keywords to weave in: ${(siteConfig.seo?.secondaryKeywords || []).join(', ')}

Write as ${siteConfig.author?.name || 'Vikram Sharma'} — opinionated, expert voice with deep cricket knowledge. Minimum 750 words.`

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await groq.chat.completions.create({
        model: MODEL,
        temperature: 0.85,
        frequency_penalty: 0.4,
        presence_penalty: 0.3,
        max_tokens: 2800,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: prompt },
        ],
      })

      const rawText = res.choices[0]?.message?.content || ''
      const parsed  = parseGenerated(rawText)
      const score   = qualityScore(parsed)

      console.log(`[generator] Attempt ${attempt} — quality: ${score}/10`)

      // Check for AI detection patterns — retry if found
      const hasAiPattern = AI_DETECTION_PATTERNS.some(p =>
        (parsed.rawContent || '').toLowerCase().includes(p)
      )
      if (hasAiPattern && attempt < maxRetries) {
        console.warn(`[generator] Attempt ${attempt}: AI pattern found — retrying`)
        lastParsed = parsed
        continue
      }

      if (score >= 7) {
        // Humanize pass — rewrite full content body to remove AI patterns
        if (parsed.rawContent) {
          const humanized = await humanizeContent(parsed.rawContent)
          // Rebuild sections from humanized content
          parsed.content.sections = parseSections(humanized)
          parsed.content.rawContent = humanized
          parsed.rawContent = humanized
        }
        return parsed
      }

      lastParsed = parsed
    } catch (err) {
      console.error(`[generator] Attempt ${attempt} error:`, err.message)
      if (attempt === maxRetries) throw err
    }
  }

  // Best-effort fallback after all retries
  console.warn('[generator] Returning best-effort after max retries')
  return lastParsed
}

/** Stub for multilingual support (future feature) */
export async function rewritePostInLanguage(post, language) {
  console.log(`[generator] rewritePostInLanguage stub: language=${language}`)
  return post
}
