import siteConfig from '@/config/site.config';

export const metadata = {
  title: `Cookie Policy — ${siteConfig.siteName}`,
};

export default function CookiePolicyPage() {
  return (
    <div className="container">
      <div className="static-page">
        <h1>Cookie Policy</h1>
        <p className="updated">Last updated: May 2026</p>

        <p>
          This Cookie Policy explains how {siteConfig.siteName} uses cookies and similar
          tracking technologies on {siteConfig.domain}.
        </p>

        <h2>What Are Cookies?</h2>
        <p>
          Cookies are small text files placed on your device by websites you visit. They are
          widely used to make websites work, improve efficiency, and provide information to
          site owners.
        </p>

        <h2>Types of Cookies We Use</h2>

        <h2>Essential Cookies</h2>
        <p>
          These are necessary for the website to function properly. They include session
          management and security cookies. You cannot opt out of essential cookies.
        </p>

        <h2>Analytics Cookies</h2>
        <p>
          We use Google Analytics 4 to collect anonymised data about how visitors use our site
          (pages visited, time on site, traffic sources). This helps us improve our content and
          user experience.
        </p>
        <ul>
          <li>Cookie name: _ga, _ga_*, _gid</li>
          <li>Duration: Up to 2 years</li>
          <li>Provider: Google LLC</li>
        </ul>

        <h2>Advertising Cookies</h2>
        <p>
          If Google AdSense is enabled, Google may use cookies to serve personalised
          advertisements based on your browsing history. These cookies are set by Google, not
          by us.
        </p>
        <ul>
          <li>Cookie name: IDE, DSID, FLC</li>
          <li>Duration: Up to 13 months</li>
          <li>Provider: Google LLC</li>
        </ul>

        <h2>Preference Cookies</h2>
        <p>
          We store your cookie consent preference in localStorage (key: cookie_consent) so we
          don't show the banner on every visit.
        </p>

        <h2>Managing Cookies</h2>
        <p>
          You can control and/or delete cookies as you wish. You can delete all cookies
          already on your computer and you can set most browsers to prevent them from being
          placed. If you do this, however, some features may not work as expected.
        </p>
        <p>
          To manage cookies in your browser, visit your browser's help documentation:
        </p>
        <ul>
          <li>
            <a href="https://support.google.com/chrome/answer/95647" style={{ color: 'var(--blue)' }} target="_blank" rel="noopener noreferrer">
              Google Chrome
            </a>
          </li>
          <li>
            <a href="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences" style={{ color: 'var(--blue)' }} target="_blank" rel="noopener noreferrer">
              Mozilla Firefox
            </a>
          </li>
          <li>
            <a href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac" style={{ color: 'var(--blue)' }} target="_blank" rel="noopener noreferrer">
              Apple Safari
            </a>
          </li>
        </ul>

        <h2>Contact</h2>
        <p>
          Questions about our cookie use?{' '}
          <a href={`mailto:${siteConfig.author.email}`} style={{ color: 'var(--blue)' }}>
            {siteConfig.author.email}
          </a>
        </p>
      </div>
    </div>
  );
}
