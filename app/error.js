'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({ error, reset }) {
  useEffect(() => {
    console.error('[error boundary]', error);
  }, [error]);

  return (
    <div className="container">
      <div className="not-found-page">
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h1 className="not-found-msg">Something went wrong</h1>
        <p className="not-found-sub">
          We had an unexpected error. Our team has been notified.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={reset}
            className="btn-primary"
            style={{ cursor: 'pointer', border: 'none' }}
          >
            Try Again
          </button>
          <Link href="/" className="btn-primary" style={{ background: 'var(--gray-700)' }}>
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
