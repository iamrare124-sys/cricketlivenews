import siteConfig from '@/config/site.config';

export const metadata = {
  title: `Terms of Use — ${siteConfig.siteName}`,
};

export default function TermsPage() {
  return (
    <div className="container">
      <div className="static-page">
        <h1>Terms of Use</h1>
        <p className="updated">Last updated: May 2026</p>

        <p>
          By accessing {siteConfig.siteName} ({siteConfig.domain}), you agree to these Terms of
          Use. Please read them carefully.
        </p>

        <h2>Use of Content</h2>
        <p>
          All content on {siteConfig.siteName} — including articles, analysis, statistics, and
          images — is for informational purposes only. You may not reproduce, distribute, or
          republish our content without explicit written permission.
        </p>

        <h2>Accuracy of Information</h2>
        <p>
          We strive to provide accurate and up-to-date cricket news and statistics. However,
          live scores and data may experience delays or inaccuracies. We are not liable for
          any decisions made based on information published on this site.
        </p>

        <h2>Fantasy Cricket Advice</h2>
        <p>
          Fantasy tips published on {siteConfig.siteName} are the opinions of our analysts and
          are not guaranteed. Fantasy cricket involves risk. Always do your own research before
          making team selections.
        </p>

        <h2>Intellectual Property</h2>
        <p>
          The {siteConfig.siteName} name, logo, and all original content are the intellectual
          property of {siteConfig.author.name} / {siteConfig.siteName}. Unauthorised use is
          prohibited.
        </p>

        <h2>Limitation of Liability</h2>
        <p>
          {siteConfig.siteName} is not liable for any direct, indirect, incidental, or
          consequential damages arising from your use of the site or reliance on its content.
        </p>

        <h2>Governing Law</h2>
        <p>
          These terms are governed by the laws of India. Disputes shall be subject to the
          jurisdiction of Indian courts.
        </p>

        <h2>Changes</h2>
        <p>
          We may modify these terms at any time. Continued use of the site constitutes
          acceptance of updated terms.
        </p>

        <h2>Contact</h2>
        <p>
          <a href={`mailto:${siteConfig.author.email}`} style={{ color: 'var(--blue)' }}>
            {siteConfig.author.email}
          </a>
        </p>
      </div>
    </div>
  );
}
