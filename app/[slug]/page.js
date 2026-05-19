import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostBySlug, getPosts } from '@/lib/supabase';
import siteConfig from '@/config/site.config';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cricketlivenews.in';

export async function generateStaticParams() {
  try {
    const posts = await getPosts({ limit: 50 });
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: 'Not Found' };

  const url = `${SITE_URL}/${post.slug}`;
  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    keywords: post.tags || [],
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      images: post.image_url ? [{ url: post.image_url, alt: post.image_alt || post.title }] : [],
      publishedTime: post.published_at,
      modifiedTime: post.created_at,
      authors: [post.author || siteConfig.author.name],
      section: post.category,
      tags: post.tags || [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      images: post.image_url ? [post.image_url] : [],
    },
  };
}

function ArticleSchema({ post }) {
  const url = `${SITE_URL}/${post.slug}`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.meta_description || post.excerpt,
    image: post.image_url ? [post.image_url] : [],
    datePublished: post.published_at,
    dateModified: post.created_at || post.published_at,
    author: [{ '@type': 'Person', name: post.author || siteConfig.author.name }],
    publisher: {
      '@type': 'Organization',
      name: siteConfig.siteName,
      url: SITE_URL,
    },
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    keywords: (post.tags || []).join(', '),
    articleSection: post.category,
    inLanguage: 'en-IN',
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function BreadcrumbSchema({ post }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: siteConfig.categories.find((c) => c.slug === post.category)?.label || 'News',
        item: `${SITE_URL}/category/${post.category}`,
      },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${SITE_URL}/${post.slug}` },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function FaqSchema({ faq }) {
  if (!faq || faq.length === 0) return null;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function ArticleBody({ content }) {
  // content can be: object with sections, or a string (rawContent fallback)

  // 1. Object with sections
  if (content && typeof content === 'object' && Array.isArray(content.sections) && content.sections.length > 0) {
    return (
      <div className="art-body">
        {content.hook && <p>{content.hook}</p>}
        {content.sections.map((section, i) => (
          <div key={i}>
            {section.heading && <h2>{section.heading}</h2>}
            {section.body
              .split('\n')
              .filter(Boolean)
              .map((para, j) => (
                <p key={j}>{para}</p>
              ))}
          </div>
        ))}
      </div>
    );
  }

  // 2. rawContent string fallback
  if (content && typeof content === 'object' && content.rawContent) {
    return (
      <div className="art-body">
        {content.rawContent
          .split('\n\n')
          .filter(Boolean)
          .map((para, i) => {
            const headingMatch = para.match(/^#{1,3}\s+(.+)/);
            if (headingMatch) return <h2 key={i}>{headingMatch[1]}</h2>;
            return <p key={i}>{para.replace(/^#{1,3}\s+/, '')}</p>;
          })}
      </div>
    );
  }

  // 3. Plain string fallback
  if (typeof content === 'string' && content.length > 0) {
    return (
      <div className="art-body">
        {content
          .split('\n\n')
          .filter(Boolean)
          .map((para, i) => (
            <p key={i}>{para}</p>
          ))}
      </div>
    );
  }

  // 4. Nothing
  return (
    <div className="art-body">
      <p>Content is being prepared. Please check back shortly.</p>
    </div>
  );
}

export default async function ArticlePage({ params }) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  // Parse content at page level
  let content = post.content;
  if (typeof content === 'string') {
    try {
      content = JSON.parse(content);
    } catch {
      // Keep as string — ArticleBody handles it
    }
  }

  const faq = content?.faq || [];
  const categoryLabel =
    siteConfig.categories.find((c) => c.slug === post.category)?.label || 'Cricket News';

  const publishedDate = new Date(post.published_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      <ArticleSchema post={post} />
      <BreadcrumbSchema post={post} />
      {faq.length > 0 && <FaqSchema faq={faq} />}

      {/* Reading progress bar */}
      <div className="progress-bar" id="readingProgress" style={{ width: '0%' }} />

      <div className="container">
        <article className="article-wrap">
          {/* Breadcrumb */}
          <nav className="art-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>›</span>
            <Link href={`/category/${post.category}`}>{categoryLabel}</Link>
            <span>›</span>
            <span style={{ color: 'var(--text)' }}>{post.title.slice(0, 40)}...</span>
          </nav>

          {/* Category */}
          <div className="art-category">{categoryLabel}</div>

          {/* Headline */}
          <h1 className="art-headline">{post.title}</h1>

          {/* Deck */}
          {post.meta_description && (
            <p className="art-deck">{post.meta_description}</p>
          )}

          {/* Byline */}
          <div className="art-byline">{post.author || siteConfig.author.name}</div>
          <div className="art-pub">Published: {publishedDate}</div>

          {/* Actions */}
          <div className="art-actions">
            <button className="art-action-btn" title="Share" aria-label="Share article">
              ↗
            </button>
            <button
              className="art-action-btn"
              title="Copy link"
              aria-label="Copy link"
              id="copyBtn"
            />
            <button className="likes-btn" aria-label="Like article">
              ❤ 14
            </button>
          </div>

          {/* Hero image */}
          {post.image_url && (
            <>
              <img
                className="art-hero-img"
                src={post.image_url}
                alt={post.image_alt || post.title}
                loading="eager"
              />
              <div className="art-img-caption">
                {post.image_alt || 'Cricket action'} · CricketLiveNews.in
              </div>
            </>
          )}

          {/* Body */}
          <ArticleBody content={content} />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div style={{ marginTop: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    border: '1px solid var(--gray-300)',
                    borderRadius: '20px',
                    fontSize: '12px',
                    padding: '4px 12px',
                    color: 'var(--gray-700)',
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* FAQ */}
          {faq.length > 0 && (
            <div className="faq-section">
              <h2 className="faq-title">Frequently Asked Questions</h2>
              {faq.map((item, i) => (
                <div className="faq-item" key={i}>
                  <div className="faq-q">
                    <span>{item.question}</span>
                    <span>▾</span>
                  </div>
                  <div className="faq-a">{item.answer}</div>
                </div>
              ))}
            </div>
          )}

          {/* Author box */}
          <div
            style={{
              marginTop: '32px',
              padding: '20px',
              background: 'var(--gray-100)',
              borderRadius: '6px',
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start',
              borderTop: '3px solid var(--blue)',
            }}
          >
            <div style={{ fontSize: '40px', flexShrink: 0 }}>🏏</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>
                {siteConfig.author.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--blue)', marginBottom: '8px' }}>
                {siteConfig.author.title}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--gray-700)', lineHeight: 1.5 }}>
                {siteConfig.author.bio}
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* Reading progress + copy link script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var bar = document.getElementById('readingProgress');
              if (bar) {
                window.addEventListener('scroll', function() {
                  var total = document.body.scrollHeight - window.innerHeight;
                  var pct = total > 0 ? (window.scrollY / total * 100) : 0;
                  bar.style.width = Math.min(pct, 100) + '%';
                }, { passive: true });
              }
              var copyBtn = document.getElementById('copyBtn');
              if (copyBtn) {
                copyBtn.textContent = '🔗';
                copyBtn.addEventListener('click', function() {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href).then(function() {
                      copyBtn.textContent = '✓';
                      setTimeout(function() { copyBtn.textContent = '🔗'; }, 1500);
                    });
                  }
                });
              }
            })();
          `,
        }}
      />
    </>
  );
}
