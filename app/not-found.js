import Link from 'next/link';
import siteConfig from '@/config/site.config';

export const metadata = {
  title: `404 — Page Not Found | ${siteConfig.siteName}`,
};

export default function NotFound() {
  return (
    <div className="container">
      <div className="not-found-page">
        <div className="not-found-code">404</div>
        <h1 className="not-found-msg">Page Not Found</h1>
        <p className="not-found-sub">
          That page has been clean bowled — it doesn't exist or was removed.
        </p>
        <Link href="/" className="btn-primary">
          Back to Home
        </Link>

        <div style={{ marginTop: '40px' }}>
          <p style={{ fontSize: '14px', color: 'var(--gray-500)', marginBottom: '16px' }}>
            Browse popular sections:
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {siteConfig.categories.map((cat) => (
              <Link key={cat.slug} href={`/category/${cat.slug}`} className="ql-chip">
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
