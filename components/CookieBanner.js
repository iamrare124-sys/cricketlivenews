'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('cookie_consent');
      if (!consent) {
        const timer = setTimeout(() => setVisible(true), 1500);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage unavailable (SSR guard)
    }
  }, []);

  function accept() {
    try { localStorage.setItem('cookie_consent', 'accepted'); } catch {}
    setVisible(false);
  }

  function decline() {
    try { localStorage.setItem('cookie_consent', 'declined'); } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent">
      <div className="cookie-text">
        We use cookies to enhance your experience and serve personalised cricket content.{' '}
        <Link href="/cookie-policy">Learn more</Link>
      </div>
      <div className="cookie-actions">
        <button className="btn-cookie-decline" onClick={decline}>
          Decline
        </button>
        <button className="btn-cookie-accept" onClick={accept}>
          Accept All
        </button>
      </div>
    </div>
  );
}
