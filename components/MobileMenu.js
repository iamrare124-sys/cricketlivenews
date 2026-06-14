'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function MobileMenu({ navLinks = [] }) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const icons = {
    '/': '🏠',
    '/category/ipl-news': '⭐',
    '/category/match-analysis': '📊',
    '/category/player-news': '🏏',
    '/category/cricket-tips': '🎯',
    '/about': '👤',
    '/search': '🔍',
  };

  return (
    <>
      {/* Hamburger button */}
      <button
        className="hamburger-btn"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
      >
        <span />
        <span />
        <span />
      </button>

      {/* Overlay */}
      <div
        className={`mobile-overlay${open ? ' open' : ''}`}
        onClick={close}
        aria-hidden="true"
      />

      {/* Drawer */}
      <nav className={`mobile-menu${open ? ' open' : ''}`} aria-label="Mobile navigation">
        <div className="mm-header">
          <span className="mm-logo">🏏 CricketLiveNews</span>
          <button className="mm-close" onClick={close} aria-label="Close menu">
            ✕
          </button>
        </div>

        <div className="mm-nav">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="mm-nav-link"
              onClick={close}
            >
              <span className="mm-nav-link-icon">{icons[link.href] || '📰'}</span>
              {link.label}
            </Link>
          ))}
          <Link href="/search" className="mm-nav-link" onClick={close}>
            <span className="mm-nav-link-icon">🔍</span>
            Search
          </Link>
          <Link href="/about" className="mm-nav-link" onClick={close}>
            <span className="mm-nav-link-icon">👤</span>
            About
          </Link>
        </div>
      </nav>
    </>
  );
}
