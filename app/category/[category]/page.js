import Link from 'next/link';
import { getPosts } from '@/lib/supabase';
import siteConfig from '@/config/site.config';
import { notFound } from 'next/navigation';

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cricketlivenews.in';

export function generateStaticParams() {
  return siteConfig.categories.map((cat) => ({ category: cat.slug }));
}

export async function generateMetadata({ params }) {
  const cat = siteConfig.categories.find((c) => c.slug === params.category);
  if (!cat) return { title: 'Not Found' };
  return {
    title: `${cat.label} — ${siteConfig.siteName}`,
    description: `Latest ${cat.label} news, analysis and updates from ${siteConfig.siteName}. ${siteConfig.description}`,
    alternates: { canonical: `${SITE_URL}/category/${cat.slug}` },
  };
}

export default async function CategoryPage({ params }) {
  const cat = siteConfig.categories.find((c) => c.slug === params.category);
  if (!cat) notFound();

  let posts = [];
  try {
    posts = await getPosts({ limit: 30, category: params.category });
  } catch {
    posts = [];
  }

  return (
    <>
      {/* Category Header */}
      <div className="category-header">
        <div className="container">
          <h1>{cat.label}</h1>
          <p>
            Latest {cat.label} news, analysis and updates ·{' '}
            {siteConfig.siteName}
          </p>
        </div>
      </div>

      <div className="container">
        {/* Tab bar (categories) */}
        <div className="tab-bar">
          {siteConfig.categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className={`tab-btn${c.slug === params.category ? ' active' : ''}`}
            >
              {c.label}
            </Link>
          ))}
        </div>

        {/* Breadcrumb */}
        <nav style={{ display: 'flex', gap: '6px', fontSize: '13px', color: 'var(--gray-500)', marginBottom: '20px' }}>
          <Link href="/" style={{ color: 'var(--blue)' }}>Home</Link>
          <span>›</span>
          <span>{cat.label}</span>
        </nav>

        {posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📰</div>
            <h2>No posts in {cat.label} yet</h2>
            <p>
              Trigger the cron to generate articles in this category.
            </p>
          </div>
        ) : (
          <div className="news-list">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/${post.slug}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <article className="news-item">
                  {post.cover_image ? (
                    <img
                      className="news-thumb"
                      src={post.cover_image}
                      alt={post.cover_image_alt || post.title}
                      loading="lazy"
                    />
                  ) : (
                    <div className="news-thumb sk" />
                  )}
                  <div className="news-item-content">
                    <h2 className="news-item-title">{post.title}</h2>
                    {post.excerpt && (
                      <p className="news-item-excerpt">{post.excerpt}</p>
                    )}
                    <div className="news-item-meta">
                      <span>
                        {new Date(post.published_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="meta-dot">•</span>
                      {post.published_at && (
                        <span>
                          {Math.round(
                            (Date.now() - new Date(post.published_at).getTime()) / 3600000
                          )}{' '}
                          hrs ago
                        </span>
                      )}
                      <span className="meta-dot">•</span>
                      <span>{post.author_name || siteConfig.author.name}</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
