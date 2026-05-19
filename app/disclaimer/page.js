import siteConfig from '@/config/site.config';

export const metadata = {
  title: `Disclaimer — ${siteConfig.siteName}`,
};

export default function DisclaimerPage() {
  return (
    <div className="container">
      <div className="static-page">
        <h1>Disclaimer</h1>
        <p className="updated">Last updated: May 2026</p>

        <p>
          The information provided by {siteConfig.siteName} ({siteConfig.domain}) is for
          general informational and entertainment purposes only.
        </p>

        <h2>No Affiliation</h2>
        <p>
          {siteConfig.siteName} is an independent website and is not affiliated with, endorsed
          by, or in any way officially connected with the BCCI, IPL, ICC, ESPNcricinfo, or any
          cricket board, team, or broadcaster.
        </p>

        <h2>Live Score Accuracy</h2>
        <p>
          Live cricket scores and statistics displayed on this site are sourced from third-party
          APIs and may be delayed or inaccurate. For official scores, please refer to the BCCI
          or ICC official websites.
        </p>

        <h2>Fantasy Tips</h2>
        <p>
          Fantasy cricket tips and team suggestions are the personal opinions of our analysts.
          They do not constitute professional advice. Fantasy cricket involves financial risk.
          {siteConfig.siteName} is not responsible for any losses incurred through fantasy
          cricket platforms.
        </p>

        <h2>External Links</h2>
        <p>
          This site may contain links to external websites. We have no control over the content
          of those sites and accept no responsibility for them.
        </p>

        <h2>AI-Generated Content</h2>
        <p>
          Some articles on this site are assisted by artificial intelligence tools. All
          AI-generated content is reviewed and guided by our editorial team. We strive for
          accuracy but recommend cross-referencing breaking news with official sources.
        </p>

        <h2>Contact</h2>
        <p>
          To report an error or inaccuracy:{' '}
          <a href={`mailto:${siteConfig.author.email}`} style={{ color: 'var(--blue)' }}>
            {siteConfig.author.email}
          </a>
        </p>
      </div>
    </div>
  );
}
