import siteConfig from '@/config/site.config';

export const metadata = {
  title: `Privacy Policy — ${siteConfig.siteName}`,
  description: `Privacy Policy for ${siteConfig.siteName} (${siteConfig.domain})`,
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container">
      <div className="static-page">
        <h1>Privacy Policy</h1>
        <p className="updated">Last updated: May 2026</p>

        <p>
          At {siteConfig.siteName} ("{siteConfig.domain}"), your privacy is important to us.
          This Privacy Policy explains how we collect, use, and protect your information when
          you visit our website.
        </p>

        <h2>Information We Collect</h2>
        <p>
          We may collect non-personally identifiable information automatically through cookies
          and analytics tools, including pages visited, time spent, browser type, device type,
          and referring URLs. We do not collect personally identifiable information unless you
          voluntarily provide it (e.g., by contacting us via email).
        </p>

        <h2>Cookies</h2>
        <p>
          We use cookies to improve user experience, remember your preferences, and serve
          relevant content. You can control cookie settings through your browser or decline
          via our cookie consent banner. See our{' '}
          <a href="/cookie-policy" style={{ color: 'var(--blue)' }}>Cookie Policy</a> for details.
        </p>

        <h2>Analytics</h2>
        <p>
          We use Google Analytics 4 (GA4) to understand how visitors interact with our site.
          GA4 uses cookies to collect anonymised usage data. You can opt out of GA4 tracking
          by installing the{' '}
          <a href="https://tools.google.com/dlpage/gaoptout" style={{ color: 'var(--blue)' }} target="_blank" rel="noopener noreferrer">
            Google Analytics Opt-out Browser Add-on
          </a>.
        </p>

        <h2>Advertising</h2>
        <p>
          We may display advertisements via Google AdSense. Google may use cookies to serve ads
          based on your prior visits to our site or other websites. You can opt out of
          personalised advertising at{' '}
          <a href="https://www.google.com/settings/ads" style={{ color: 'var(--blue)' }} target="_blank" rel="noopener noreferrer">
            Google Ads Settings
          </a>.
        </p>

        <h2>Third-Party Links</h2>
        <p>
          Our website may contain links to third-party websites. We are not responsible for
          the privacy practices of those sites.
        </p>

        <h2>Data Security</h2>
        <p>
          We implement appropriate technical and organisational measures to protect your data.
          However, no internet transmission is completely secure.
        </p>

        <h2>Children's Privacy</h2>
        <p>
          Our site is not directed at children under 13. We do not knowingly collect personal
          information from children.
        </p>

        <h2>Changes to This Policy</h2>
        <p>
          We may update this policy from time to time. Continued use of the site after changes
          constitutes acceptance of the updated policy.
        </p>

        <h2>Contact Us</h2>
        <p>
          For privacy-related queries, contact:{' '}
          <a href={`mailto:${siteConfig.author.email}`} style={{ color: 'var(--blue)' }}>
            {siteConfig.author.email}
          </a>
        </p>
      </div>
    </div>
  );
}
