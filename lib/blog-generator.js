import Groq from 'groq-sdk';
import siteConfig from '@/config/site.config';

// ── Lazy Groq init ───────────────────────────────────────────────────────────
let _groq = null;
function getGroq() {
  if (!_groq) {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error('GROQ_API_KEY not set');
    _groq = new Groq({ apiKey: key });
  }
  return _groq;
}

// ── Constants ────────────────────────────────────────────────────────────────
const MODEL = 'llama-3.3-70b-versatile';
const BANNED_PHRASES = [
  'furthermore',
  'moreover',
  'in this article',
  'it is important to note',
  'delve into',
  'in conclusion',
  'robust',
  'comprehensive',
  'it\'s worth noting',
  'having said that',
  'needless to say',
  'as we can see',
  'rest assured',
  'at the end of the day',
];

const SYSTEM_PROMPT = `${siteConfig.aiPersonality}

BANNED PHRASES — NEVER USE THESE:
${BANNED_PHRASES.map((p) => `- "${p}"`).join('\n')}

OUTPUT FORMAT — respond EXACTLY in this structure:
TITLE: [engaging headline, max 80 chars]
META_TITLE: [SEO title, max 60 chars]
META_DESC: [SEO meta description, max 155 chars]
TAGS: [tag1, tag2, tag3, tag4, tag5]
CATEGORY: [one of: ipl-news | match-analysis | player-news | cricket-tips]
CONTENT:
[Full article body. Use ## for section headings. Min 600 words. No markdown bold (**). Write in first person as Vikram Sharma. Be opinionated. Use cricket terms: LBW, DRS, powerplay, death overs, Duckworth-Lewis. Mention venues, crowd, pitch conditions.]
FAQ:
Q: [question 1]
A: [answer 1]
Q: [question 2]
A: [answer 2]
Q: [question 3]
A: [answer 3]
Q: [question 4]
A: [answer 4]
END`;

// ── Section parser ───────────────────────────────────────────────────────────
function parseSections(contentText) {
  if (!contentText || contentText.trim().length === 0) return [];

  const lines = contentText.split('\n');
  const sections = [];
  let currentHeading = null;
  let currentBody = [];

  const flush = () => {
    const body = currentBody.join('\n').trim();
    if (body) {
      sections.push({ heading: currentHeading, body });
    }
    currentBody = [];
    currentHeading = null;
  };

  for (const line of lines) {
    // Detect ## or # headings
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    // Detect **Bold** as heading
    const boldMatch = line.match(/^\*\*(.+)\*\*\s*$/);

    if (headingMatch || boldMatch) {
      flush();
      currentHeading = (headingMatch ? headingMatch[1] : boldMatch[1]).trim();
    } else {
      currentBody.push(line);
    }
  }
  flush();

  // Fallback: if no headings found, split by double newlines into paragraphs
  if (sections.length <= 1 && contentText.includes('\n\n')) {
    return contentText
      .split('\n\n')
      .map((para) => para.trim())
      .filter(Boolean)
      .map((para) => ({ heading: null, body: para }));
  }

  return sections;
}

// ── FAQ parser ───────────────────────────────────────────────────────────────
function parseFaq(faqText) {
  if (!faqText) return [];
  const faqs = [];
  const qRegex = /Q:\s*(.+?)(?=\nA:)/gs;
  const aRegex = /A:\s*(.+?)(?=\nQ:|$)/gs;

  const questions = [...faqText.matchAll(qRegex)].map((m) => m[1].trim());
  const answers = [...faqText.matchAll(aRegex)].map((m) => m[1].trim());

  for (let i = 0; i < Math.min(questions.length, answers.length); i++) {
    faqs.push({ question: questions[i], answer: answers[i] });
  }
  return faqs;
}

// ── Raw text parser ──────────────────────────────────────────────────────────
function parseGenerated(rawText) {
  const get = (key, nextKey) => {
    const start = rawText.indexOf(`${key}:`);
    if (start === -1) return '';
    const valueStart = start + key.length + 1;
    const end = nextKey ? rawText.indexOf(`\n${nextKey}:`, valueStart) : rawText.indexOf('\nEND', valueStart);
    const slice = end === -1 ? rawText.slice(valueStart) : rawText.slice(valueStart, end);
    return slice.trim();
  };

  const title = get('TITLE', 'META_TITLE');
  const metaTitle = get('META_TITLE', 'META_DESC');
  const metaDescription = get('META_DESC', 'TAGS');
  const tagsRaw = get('TAGS', 'CATEGORY');
  const category = get('CATEGORY', 'CONTENT');
  const contentRaw = get('CONTENT', 'FAQ');
  const faqRaw = get('FAQ', null);

  const tags = tagsRaw
    .split(',')
    .map((t) => t.trim().toLowerCase().replace(/\s+/g, '-'))
    .filter(Boolean)
    .slice(0, 5);

  const sections = parseSections(contentRaw);
  const faq = parseFaq(faqRaw);

  const hook = sections[0]?.body?.split('\n')[0] || '';

  return {
    title: title || 'Cricket Update',
    metaTitle: metaTitle || title,
    metaDescription,
    tags,
    category: category || 'ipl-news',
    content: {
      hook,
      sections,
      faq,
      rawContent: contentRaw,
    },
    rawContent: contentRaw,
    rawText,
  };
}

// ── Quality checker ──────────────────────────────────────────────────────────
function qualityScore(parsed) {
  let score = 10;
  const text = (parsed.rawContent || '').toLowerCase();

  for (const phrase of BANNED_PHRASES) {
    if (text.includes(phrase)) score -= 1;
  }

  if (!parsed.title || parsed.title.length < 10) score -= 2;
  if (!parsed.metaDescription || parsed.metaDescription.length < 50) score -= 1;
  if (!parsed.content?.sections?.length) score -= 2;
  if ((parsed.rawContent || '').split(' ').length < 300) score -= 2;

  return Math.max(0, score);
}

// ── Slug generator ───────────────────────────────────────────────────────────
export function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

// ── Humanize pass ────────────────────────────────────────────────────────────
async function humanizeContent(text) {
  try {
    const groq = getGroq();
    const res = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.7,
      max_tokens: 1500,
      messages: [
        {
          role: 'system',
          content:
            'You are an editor. Remove AI-sounding patterns from cricket articles. Break long sentences. Use contractions. Make it sound like a passionate Indian cricket journalist wrote it. Return only the improved text — no preamble.',
        },
        {
          role: 'user',
          content: `Humanize this cricket article text:\n\n${text.slice(0, 3000)}`,
        },
      ],
    });
    return res.choices[0]?.message?.content || text;
  } catch {
    return text; // Humanize is best-effort
  }
}

// ── Main generator ───────────────────────────────────────────────────────────

/**
 * Generate a full blog post from a news story.
 * @param {object} story - { title, description, link, pubDate }
 * @returns {object} parsed post object
 */
export async function generatePost(story) {
  const groq = getGroq();
  const maxRetries = 3;
  let lastParsed = null;

  const prompt = `Write a detailed cricket news article based on this story:

Headline: ${story.title}
Summary: ${story.description || story.title}
Source URL: ${story.link || ''}
Published: ${story.pubDate || new Date().toISOString()}

Primary keyword to include naturally: ${siteConfig.seo.primaryKeyword}
Secondary keywords to weave in: ${siteConfig.seo.secondaryKeywords.join(', ')}

Write as Vikram Sharma — opinionated, cricket-expert voice. Minimum 700 words.`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await groq.chat.completions.create({
        model: MODEL,
        temperature: 0.85,
        frequency_penalty: 0.4,
        presence_penalty: 0.3,
        max_tokens: 2500,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
      });

      const rawText = res.choices[0]?.message?.content || '';
      const parsed = parseGenerated(rawText);
      const score = qualityScore(parsed);

      console.log(`[generator] Attempt ${attempt} — quality score: ${score}/10`);

      if (score >= 7) {
        // Humanize the content body
        if (parsed.content?.sections?.length) {
          const firstSection = parsed.content.sections[0];
          firstSection.body = await humanizeContent(firstSection.body);
        }
        return parsed;
      }

      lastParsed = parsed;
    } catch (err) {
      console.error(`[generator] Attempt ${attempt} error:`, err.message);
      if (attempt === maxRetries) throw err;
    }
  }

  // Return best effort after retries
  console.warn('[generator] Using best-effort result after max retries');
  return lastParsed;
}

/** Stub for future multilingual support */
export async function rewritePostInLanguage(post, language) {
  // TODO: implement when language_mode !== 'english'
  console.log(`[generator] rewritePostInLanguage stub: language=${language}`);
  return post;
}
