import siteConfig from '@/config/site.config';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cricketlivenews.in';

export const metadata = {
  title: `About — ${siteConfig.siteName}`,
  description: siteConfig.author.bio,
  alternates: { canonical: `${SITE_URL}/about` },
};

export default function AboutPage() {
  return (
    <div className="container">
      <div className="static-page">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
          <div style={{ fontSize: '64px', flexShrink: 0 }}>🏏</div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '4px' }}>
              {siteConfig.author.name}
            </h1>
            <div style={{ color: 'var(--blue)', fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>
              {siteConfig.author.title}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
              {siteConfig.siteName} · {siteConfig.domain}
            </div>
          </div>
        </div>

        <p>{siteConfig.author.bio}</p>

        <h2>About {siteConfig.siteName}</h2>
        <p>
          {siteConfig.siteName} is your go-to destination for live IPL scores, in-depth match
          analysis, player statistics, and breaking cricket news — all tailored for Indian
          cricket fans. We cover every IPL match, India team fixture, and major international
          cricket event with the passion and depth it deserves.
        </p>

        <h2>Our Coverage</h2>
        <ul>
          <li>Live IPL 2026 scores and ball-by-ball commentary</li>
          <li>In-depth match analysis after every game</li>
          <li>Player news, injuries, and auction updates</li>
          <li>Fantasy cricket tips for every match day</li>
          <li>Orange Cap and Purple Cap live trackers</li>
          <li>Pitch reports and venue analysis</li>
          <li>India cricket team news and fixtures</li>
        </ul>

        <h2>Contact</h2>
        <p>
          For press enquiries, corrections, or collaboration opportunities, reach out at{' '}
          <a href={`mailto:${siteConfig.author.email}`} style={{ color: 'var(--blue)' }}>
            {siteConfig.author.email}
          </a>
        </p>

        <h2>Disclaimer</h2>
        <p>
          {siteConfig.siteName} is an independent cricket news and analysis website. We are not
          affiliated with the BCCI, IPL, or any cricket board. All content is for informational
          purposes only. Live scores and statistics are sourced from publicly available APIs and
          may have slight delays.
        </p>
      </div>
    </div>
  );
}
