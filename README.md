# 🏏 CricketLiveNews — Next.js Blog Site

> Live IPL Scores & Cricket News India · Powered by Groq AI + Supabase + Vercel

---

## 🚀 Quick Start (5 Steps)

### 1. Clone & Install
```bash
npm install
```

### 2. Set Up Supabase
1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste contents of `supabase-schema.sql` → Run
3. Copy your Project URL, Anon Key, and Service Role Key

### 3. Configure Environment Variables
```bash
cp .env.example .env.local
```
Fill in your `.env.local`:
```env
NICHE=cricket
GROQ_API_KEY=gsk_...
PEXELS_API_KEY=...
UNSPLASH_ACCESS_KEY=...
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CRON_SECRET=make-a-long-random-string-here
NEXT_PUBLIC_SITE_URL=https://cricketlivenews.in
```

### 4. Run Locally
```bash
npm run dev
```
Visit: http://localhost:3000

### 5. Generate First Posts
```bash
curl "http://localhost:3000/api/cron?secret=YOUR_CRON_SECRET"
```

---

## 📦 Vercel Deployment

### Deploy
```bash
npx vercel --prod
```
Or connect your GitHub repo at [vercel.com](https://vercel.com).

### Add Environment Variables
In Vercel Dashboard → Settings → Environment Variables — add all vars from `.env.example`.

### Cron Job
`vercel.json` configures the cron to run daily at 9 AM UTC (2:30 PM IST):
```json
{ "crons": [{ "path": "/api/cron", "schedule": "0 9 * * *" }] }
```
Vercel automatically sets the `Authorization: Bearer CRON_SECRET` header.

---

## 🏗️ Project Structure

```
/app
  layout.js              Header, ticker, nav, footer, cookie banner
  page.js                Homepage with score cards + posts grid
  globals.css            All styles — ESPNcricinfo-style UI
  not-found.js           404 page
  error.js               Error boundary
  robots.js              SEO robots.txt
  sitemap.js             Auto-generated XML sitemap
  /[slug]/page.js        Article page with schemas + FAQ
  /category/[cat]/page.js  Category listing
  /search/page.js        Client-side search
  /about /privacy-policy /terms /disclaimer /cookie-policy
  /api/cron/route.js     Main content generator (maxDuration=300)
  /api/search/route.js   Search API
  /api/indexnow/route.js IndexNow submission
  /api/fix-excerpts/     Fix missing post excerpts
/components
  MobileMenu.js          'use client' mobile drawer
  CookieBanner.js        'use client' cookie consent
/config
  niches/cricket.config.js   All niche-specific settings
  site.config.js         Config loader
/lib
  supabase.js            DB helpers (lazy init, maybeSingle)
  rss-fetcher.js         Multi-source fetcher + deduplication
  blog-generator.js      Groq AI generator + quality checks
  live-data.js           CricAPI live match data
  image-fetcher.js       Pexels + Unsplash image fetcher
  security.js            verifyCronSecret + rate limiting
```

---

## 🔑 API Keys Needed

| Key | Where to Get | Required? |
|-----|-------------|-----------|
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project Settings | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Project Settings | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Project Settings | ✅ Yes |
| `CRON_SECRET` | Generate yourself (random string) | ✅ Yes |
| `PEXELS_API_KEY` | [pexels.com/api](https://www.pexels.com/api/) | Optional |
| `UNSPLASH_ACCESS_KEY` | [unsplash.com/developers](https://unsplash.com/developers) | Optional |
| `CRICAPI_KEY` | [cricapi.com](https://cricapi.com) | Optional |
| `NEWS_API_KEY` | [newsapi.org](https://newsapi.org) | Optional |
| `INDEX_NOW_KEY` | Generate at [indexnow.org](https://indexnow.org) | Optional |
| `NEXT_PUBLIC_GA4_ID` | Google Analytics | Optional |
| `NEXT_PUBLIC_ADSENSE_ID` | Google AdSense | Optional |

---

## 📰 How Content Generation Works

1. **Cron triggers** at 9 AM UTC (or manually via `/api/cron?secret=...`)
2. **RSS Fetcher** pulls from Google News RSS (3 queries) + Reddit (r/Cricket, r/IPL) + NewsAPI in parallel
3. Stories are **filtered** (max 48 hours old), **deduplicated** (first 60 chars), and **scored** by keyword relevance + recency
4. **Groq AI** (llama-3.3-70b-versatile) generates a full article: title, meta, tags, category, 700+ word body, 4 FAQs
5. **Quality check** — if score < 7/10, retries up to 3 times
6. **Humanize pass** — second Groq call removes AI patterns
7. **Image fetcher** gets a relevant photo from Pexels/Unsplash
8. **Saved to Supabase** with enforced 30-post limit (oldest deleted)
9. **IndexNow** pinged for fast Google/Bing indexing

---

## 🛠️ Admin Endpoints

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /api/cron?secret=X` | CRON_SECRET | Generate new posts |
| `GET /api/indexnow?password=X` | SITE_API_PASSWORD | Submit all URLs to IndexNow |
| `GET /api/fix-excerpts?password=X` | SITE_API_PASSWORD | Fix missing post excerpts |
| `GET /api/search?q=kohli` | Public | Search posts |

---

## 🎨 Customisation

### Change Niche
Edit `config/niches/cricket.config.js` or create a new niche file and set `NICHE=yourniche` in `.env`.

### Change AI Personality
Update `aiPersonality` in the config file.

### Change Cron Schedule
Edit `vercel.json` → `schedule` field (cron syntax).

### Change Max Posts
Set `MAX_POSTS_PER_SITE=50` in `.env`.

---

## ✅ Pre-Deploy Checklist

- [ ] `supabase-schema.sql` run in Supabase SQL Editor
- [ ] All required env vars set in Vercel
- [ ] `CRON_SECRET` is a long random string
- [ ] `NEXT_PUBLIC_SITE_URL` matches your actual domain
- [ ] Test cron endpoint manually after deploy
- [ ] Submit sitemap to Google Search Console: `https://yourdomain.com/sitemap.xml`
- [ ] Add `INDEX_NOW_KEY.txt` to `/public/` folder if using IndexNow

---

## 📊 Build Notes

- `npm run build` will pass even without Supabase (getPosts gracefully returns `[]`)
- ISR (Incremental Static Regeneration) set to 3600s on homepage and category pages
- Article pages use `generateStaticParams` for SSG at build time

---

Built with ❤️ for Indian cricket fans · By Vikram Sharma
