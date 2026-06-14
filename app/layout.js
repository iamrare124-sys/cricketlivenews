import './globals.css';
import Link from 'next/link';
import MobileMenu from '@/components/MobileMenu';
import CookieBanner from '@/components/CookieBanner';
import siteConfig from '@/config/site.config';
import { getLiveMatches, STATIC_TICKER, formatMatchForTicker } from '@/lib/live-data';

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cricketlivenews.in';

const showGA4 = GA4_ID && GA4_ID !== '' && !GA4_ID.includes('placeholder');
const showAdsense = ADSENSE_ID && ADSENSE_ID !== '' && !ADSENSE_ID.includes('placeholder');

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${siteConfig.siteName} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.siteName}`,
  },
  description: siteConfig.description,
  keywords: [siteConfig.seo.primaryKeyword, ...siteConfig.seo.secondaryKeywords],
  authors: [{ name: siteConfig.author.name, url: SITE_URL }],
  creator: siteConfig.author.name,
  publisher: siteConfig.siteName,
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: siteConfig.siteName,
    title: `${siteConfig.siteName} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.siteName} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    creator: '@cricketlivenews',
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: { 'msvalidate.01': process.env.BING_SITE_VERIFICATION },
  },
  alternates: { canonical: SITE_URL },
};

export default async function RootLayout({ children }) {
  // Try live ticker — fallback to static if CricAPI key not set
  let tickerItems = STATIC_TICKER;
  try {
    const liveMatches = await getLiveMatches();
    if (liveMatches.length > 0) {
      tickerItems = liveMatches.slice(0, 5).map(m => {
        const formatted = formatMatchForTicker(m);
        return formatted || { label: 'LIVE', text: m.name };
      });
    }
  } catch {}
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#006db7" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        {showGA4 && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA4_ID}');`,
              }}
            />
          </>
        )}
        {showAdsense && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body>
        {/* ── Ticker ────────────────────────────────────────────────── */}
        <div className="ticker-wrap" aria-label="Live cricket updates">
          <div className="ticker-label">🏏 LIVE</div>
          <div className="ticker-viewport">
            <div className="ticker-track">
              {[...tickerItems, ...tickerItems].map((item, i) => (
                <div className="ticker-item" key={i}>
                  <span className="ticker-item-label">{item.label}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Header ───────────────────────────────────────────────── */}
        <header className="site-header">
          <div className="header-inner">
            <div className="site-logo">
              <MobileMenu navLinks={siteConfig.navLinks} />
              <Link href="/" aria-label={siteConfig.siteName} style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                <span className="logo-icon">🏏</span>
                <div className="logo-text">
                  <span className="logo-name">{siteConfig.siteName}</span>
                  <span className="logo-tagline">{siteConfig.tagline}</span>
                </div>
              </Link>
            </div>

            <form className="header-search" action="/search" method="get" role="search">
              <span className="header-search-icon">🔍</span>
              <input
                type="search"
                name="q"
                placeholder="Search cricket..."
                aria-label="Search"
                autoComplete="off"
              />
            </form>

            <div className="header-actions">
              <a className="btn-get-app" href="#">Get the App</a>
              <Link href="/search" className="icon-btn" aria-label="Search">
                🔍
              </Link>
              <span className="icon-btn" aria-label="Settings">⚙️</span>
            </div>
          </div>
        </header>

        {/* ── Category Nav ─────────────────────────────────────────── */}
        <nav className="main-nav" aria-label="Main navigation">
          <div className="main-nav-inner">
            {siteConfig.navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="nav-link">
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* ── Page Content ─────────────────────────────────────────── */}
        <main id="main-content">{children}</main>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <footer className="site-footer">
          <div className="container">
            <div className="footer-top">
              <div className="footer-logo">🏏 {siteConfig.siteName}</div>
              <div className="footer-tagline">
                {siteConfig.tagline} · {siteConfig.domain}
              </div>
            </div>
            <div className="footer-grid">
              <div className="footer-col">
                <h4>Cricket</h4>
                <Link href="/">Live Scores</Link>
                <Link href="/category/ipl-news">IPL 2026</Link>
                <Link href="/category/match-analysis">Match Analysis</Link>
                <Link href="/category/player-news">Player News</Link>
              </div>
              <div className="footer-col">
                <h4>Content</h4>
                <Link href="/category/cricket-tips">Fantasy Tips</Link>
                <Link href="/search">Search</Link>
                <Link href="/about">About</Link>
                <a href="/api/cron" target="_blank" rel="noopener">
                  RSS Feed
                </a>
              </div>
              <div className="footer-col">
                <h4>Legal</h4>
                <Link href="/privacy-policy">Privacy Policy</Link>
                <Link href="/terms">Terms of Use</Link>
                <Link href="/disclaimer">Disclaimer</Link>
                <Link href="/cookie-policy">Cookie Policy</Link>
              </div>
              <div className="footer-col">
                <h4>Contact</h4>
                <a href={`mailto:${siteConfig.author.email}`}>
                  {siteConfig.author.email}
                </a>
                <a href="#">Twitter / X</a>
                <a href="#">Instagram</a>
                <a href="#">YouTube</a>
              </div>
            </div>
            <div className="footer-bottom">
              <span>
                © {new Date().getFullYear()} {siteConfig.siteName} · By{' '}
                {siteConfig.author.name}
              </span>
              <span>{siteConfig.description}</span>
            </div>
          </div>
        </footer>

        {/* ── Cookie Banner ─────────────────────────────────────────── */}
        <CookieBanner />

        {/* ── Back to Top ───────────────────────────────────────────── */}
        <button
          className="back-to-top"
          id="backToTop"
          aria-label="Back to top"
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var btn = document.getElementById('backToTop');
                if (!btn) return;
                window.addEventListener('scroll', function() {
                  btn.classList.toggle('visible', window.scrollY > 400);
                }, { passive: true });
                btn.addEventListener('click', function() {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                });
                btn.textContent = '↑';
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
