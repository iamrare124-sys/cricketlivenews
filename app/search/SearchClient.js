'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import siteConfig from '@/config/site.config';

function SearchResults({ query }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => {
        setResults(data.results || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Search failed. Please try again.');
        setLoading(false);
      });
  }, [query]);

  if (!query) return null;

  if (loading) {
    return (
      <div>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ display: 'flex', gap: '14px', padding: '16px 0', borderBottom: '1px solid var(--gray-200)' }}>
            <div className="sk" style={{ width: '110px', height: '74px', borderRadius: '4px', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="sk" style={{ height: '16px', marginBottom: '8px' }} />
              <div className="sk" style={{ height: '16px', width: '80%', marginBottom: '8px' }} />
              <div className="sk" style={{ height: '12px', width: '40%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p style={{ color: 'var(--red)', padding: '20px 0' }}>{error}</p>;
  }

  if (results.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '40px 0' }}>
        <div className="empty-state-icon">🔍</div>
        <h2>No results for "{query}"</h2>
        <p>Try different keywords — team names, player names, or match types.</p>
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: '14px', color: 'var(--gray-500)', marginBottom: '16px' }}>
        {results.length} result{results.length !== 1 ? 's' : ''} for &quot;{query}&quot;
      </p>
      <div className="news-list">
        {results.map((post) => (
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
                  <span>{post.author || siteConfig.author.name}</span>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function SearchClient() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [inputVal, setInputVal] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(e) {
    e.preventDefault();
    const q = inputVal.trim();
    setQuery(q);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('q', q);
      window.history.pushState({}, '', url.toString());
    }
  }

  return (
    <div className="container">
      <div className="search-hero">
        <h1>Search Cricket News</h1>
        <form className="search-input-wrap" onSubmit={handleSubmit}>
          <input
            type="search"
            placeholder="Search IPL news, players, matches..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            autoFocus
            aria-label="Search cricket news"
          />
          <button type="submit" className="search-submit">
            Search
          </button>
        </form>
      </div>
      <SearchResults query={query} />
    </div>
  );
}
