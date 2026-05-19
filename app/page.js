import Link from 'next/link';
import { getPosts } from '@/lib/supabase';
import siteConfig from '@/config/site.config';

export const revalidate = 3600; // ISR: revalidate every hour

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cricketlivenews.in';

// Static score cards — replace with live API data when CRICAPI_KEY is set
const SCORE_CARDS = [
  {
    status: 'LIVE',
    match: '2nd Test, Sylhet · BAN vs PAK',
    teams: [
      { flag: '🇧🇩', name: 'BAN', score: '278 & 390', batting: false },
      { flag: '🇵🇰', name: 'PAK', score: '232 & 0/0', batting: true },
    ],
    result: 'Day 3 — PAK need 437 runs',
    isLive: true,
  },
  {
    status: 'UPCOMING',
    match: 'IPL 2026 · 63rd Match · Chennai',
    teams: [
      { flag: '🦁', name: 'CSK', score: '', batting: false },
      { flag: '🌅', name: 'SRH', score: '', batting: false },
    ],
    result: 'Today · 7:30 PM IST',
    isLive: false,
  },
  {
    status: 'RESULT',
    match: 'WCL2 · 106th Match · Kirtipur',
    teams: [
      { flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', name: 'SCOT', score: '194', batting: false },
      { flag: '🇳🇵', name: 'NEP', score: '199/4', batting: false },
    ],
    result: 'Nepal won by 6 wickets',
    isLive: false,
  },
];

const IPL_TABLE = [
  { rank: 1, team: 'GT', p: 12, w: 8, nrr: '+0.68', pts: 16, q: true },
  { rank: 2, team: 'RCB', p: 12, w: 8, nrr: '+0.31', pts: 16, q: true },
  { rank: 3, team: 'DC', p: 12, w: 7, nrr: '+0.52', pts: 14, q: true },
  { rank: 4, team: 'MI', p: 12, w: 7, nrr: '+0.19', pts: 14, q: false },
  { rank: 5, team: 'SRH', p: 12, w: 6, nrr: '+0.45', pts: 12, q: false },
  { rank: 6, team: 'PBKS', p: 12, w: 6, nrr: '-0.12', pts: 12, q: false },
  { rank: 7, team: 'RR', p: 12, w: 5, nrr: '-0.08', pts: 10, q: false },
  { rank: 8, team: 'KKR', p: 12, w: 5, nrr: '-0.23', pts: 10, q: false },
  { rank: 9, team: 'LSG', p: 12, w: 4, nrr: '-0.41', pts: 8, q: false },
  { rank: 10, team: 'CSK', p: 12, w: 3, nrr: '-1.31', pts: 6, q: false },
];

export default async function HomePage() {
  let posts = [];
  try {
    posts = await getPosts({ limit: 20 });
  } catch {
    posts = [];
  }

  const featured = posts[0] || null;
  const topStories = posts.slice(1, 7);
  const hasNoPosts = posts.length === 0;

  return (
    <>
      {/* ── Score Cards Bar ─────────────────────────────────────── */}
      <div className="scores-bar">
        <div className="scores-inner">
          {SCORE_CARDS.map((card, i) => (
            <div className="score-card" key={i}>
              <div className="sc-status">
                {card.isLive && <span className="live-dot" />}
                {card.status}
              </div>
              <div className="sc-match">{card.match}</div>
              {card.teams.map((t, j) => (
                <div className="sc-team" key={j}>
                  <span className="sc-team-name">
                    {t.flag} {t.name}
                  </span>
                  {t.score && (
                    <span className={`sc-score${t.batting ? ' batting' : ''}`}>
                      {t.score}
                    </span>
                  )}
                </div>
              ))}
              <div className={`sc-result${card.isLive ? ' live' : ''}`}>{card.result}</div>
              <div className="sc-links">
                <a href="#">Schedule</a>
                <a href="#">Table</a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container">
        {/* ── Empty State ───────────────────────────────────────── */}
        {hasNoPosts && (
          <div className="empty-state">
            <div className="empty-state-icon">🏏</div>
            <h2>No posts yet — trigger the cron to generate content</h2>
            <p>
              Set your environment variables, then trigger the cron endpoint to
              generate your first AI-powered cricket articles.
            </p>
            <span className="empty-cron-url">
              {SITE_URL}/api/cron?secret=YOUR_CRON_SECRET
            </span>
          </div>
        )}

        {!hasNoPosts && (
          <div className="page-grid">
            {/* ── MAIN COLUMN ─────────────────────────────────────── */}
            <div>
              {/* Featured */}
              {featured && (
                <div className="featured-block">
                  <p className="section-eyebrow">Featured</p>
                  <p className="section-eyebrow" style={{ color: 'var(--blue)', marginBottom: '6px' }}>
                    {siteConfig.categories.find((c) => c.slug === featured.category)?.label || 'IPL News'}
                  </p>
                  <Link href={`/${featured.slug}`}>
                    <h2 className="featured-title">{featured.title}</h2>
                  </Link>
                  {featured.image_url && (
                    <Link href={`/${featured.slug}`}>
                      <img
                        className="featured-img"
                        src={featured.image_url}
                        alt={featured.image_alt || featured.title}
                        loading="eager"
                      />
                    </Link>
                  )}
                  {!featured.image_url && (
                    <div
                      className="featured-img sk"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}
                    >
                      🏏
                    </div>
                  )}
                  {featured.excerpt && (
                    <p className="featured-caption">{featured.excerpt}</p>
                  )}
                </div>
              )}

              {/* Top Stories */}
              {topStories.length > 0 && (
                <div>
                  <div className="sec-header">
                    <h2 className="sec-title">Top Stories</h2>
                    <Link href="/category/ipl-news" className="see-all">
                      See all
                    </Link>
                  </div>
                  <div className="news-list">
                    {topStories.map((post) => (
                      <Link
                        key={post.slug}
                        href={`/${post.slug}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <article className="news-item">
                          {post.image_url ? (
                            <img
                              className="news-thumb"
                              src={post.image_url}
                              alt={post.image_alt || post.title}
                              loading="lazy"
                            />
                          ) : (
                            <div className="news-thumb sk" />
                          )}
                          <div className="news-item-content">
                            <h3 className="news-item-title">{post.title}</h3>
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
              )}

              {/* Quick Links */}
              <div style={{ padding: '20px 0 10px' }}>
                <div className="section-eyebrow gray" style={{ marginBottom: '10px' }}>
                  Quick Links
                </div>
                <div className="quick-links-row">
                  {['IPL 2026 schedule', 'India fixtures', 'Orange Cap', 'Purple Cap', 'Points Table', 'Pitch reports', 'Fantasy Tips'].map((label) => (
                    <Link
                      key={label}
                      href={label.includes('Fantasy') ? '/category/cricket-tips' : '/category/ipl-news'}
                      className="ql-chip"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Quote Block */}
              <div className="quote-block">
                <div className="quote-label">Quote Unquote</div>
                <div className="quote-marks">&ldquo;&rdquo;</div>
                <div className="quote-text">
                  Just got to thank a good Kookaburra bat
                </div>
                <div className="quote-attr">
                  Glamorgan nightwatcher <strong>Ryan Hadley</strong> was
                  surprised he hit a six during his equally unexpected
                  match-winning 50 against Somerset
                </div>
                <div className="quote-actions">
                  <a href="#">Share</a>
                  <span style={{ color: 'var(--gray-300)' }}>•</span>
                  <a href="#">See all</a>
                </div>
              </div>

              {/* More Stories */}
              {posts.length > 7 && (
                <div>
                  <div className="sec-header">
                    <h2 className="sec-title">More Cricket News</h2>
                    <Link href="/category/match-analysis" className="see-all">
                      See all
                    </Link>
                  </div>
                  <div className="news-list">
                    {posts.slice(7, 14).map((post) => (
                      <Link
                        key={post.slug}
                        href={`/${post.slug}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <article className="news-item">
                          {post.image_url ? (
                            <img
                              className="news-thumb"
                              src={post.image_url}
                              alt={post.image_alt || post.title}
                              loading="lazy"
                            />
                          ) : (
                            <div className="news-thumb sk" />
                          )}
                          <div className="news-item-content">
                            <h3 className="news-item-title">{post.title}</h3>
                            <div className="news-item-meta">
                              <span>
                                {new Date(post.published_at).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
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
              )}
            </div>

            {/* ── SIDEBAR ──────────────────────────────────────────── */}
            <aside className="sidebar">
              {/* IPL Points Table */}
              <div className="sidebar-box">
                <div className="sidebar-box-title">IPL 2026 — Points Table</div>
                <table className="points-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Team</th>
                      <th>P</th>
                      <th>W</th>
                      <th>NRR</th>
                      <th>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {IPL_TABLE.map((row) => (
                      <tr key={row.rank}>
                        <td className={row.q ? 'team-qualified' : ''}>{row.rank}</td>
                        <td style={{ fontWeight: 700 }}>{row.team}</td>
                        <td>{row.p}</td>
                        <td>{row.w}</td>
                        <td>{row.nrr}</td>
                        <td>
                          <strong>{row.pts}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--gray-500)' }}>
                  🟢 Top 3 qualify for playoffs
                </div>
              </div>

              {/* Latest in sidebar */}
              {topStories.length > 0 && (
                <div className="sidebar-box">
                  <div className="sidebar-box-title">Latest News</div>
                  {topStories.slice(0, 4).map((post) => (
                    <Link
                      key={post.slug}
                      href={`/${post.slug}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div className="sidebar-news-item">
                        {post.image_url ? (
                          <img
                            className="sn-thumb"
                            src={post.image_url}
                            alt={post.image_alt || post.title}
                            loading="lazy"
                          />
                        ) : (
                          <div className="sn-thumb sk" />
                        )}
                        <div>
                          <div className="sn-title">{post.title}</div>
                          <div className="sn-meta">
                            {new Date(post.published_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Orange Cap */}
              <div className="sidebar-box">
                <div className="sidebar-box-title">Orange Cap — IPL 2026</div>
                <table className="points-table">
                  <thead>
                    <tr><th>#</th><th>Player</th><th>Team</th><th>Runs</th></tr>
                  </thead>
                  <tbody>
                    {[
                      ['1', 'B Sudharsan', 'GT', '554'],
                      ['2', 'Sh. Gill', 'GT', '552'],
                      ['3', 'V. Kohli', 'RCB', '542'],
                      ['4', 'KL Rahul', 'LSG', '533'],
                      ['5', 'H. Klaasen', 'SRH', '521'],
                    ].map(([rank, player, team, runs]) => (
                      <tr key={rank}>
                        <td>{rank}</td>
                        <td style={{ fontWeight: 700 }}>{player}</td>
                        <td>{team}</td>
                        <td><strong>{runs}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Purple Cap */}
              <div className="sidebar-box">
                <div className="sidebar-box-title">Purple Cap — IPL 2026</div>
                <table className="points-table">
                  <thead>
                    <tr><th>#</th><th>Player</th><th>Team</th><th>Wkts</th></tr>
                  </thead>
                  <tbody>
                    {[
                      ['1', 'Bhuvi Kumar', 'RCB', '24'],
                      ['2', 'K. Rabada', 'GT', '21'],
                      ['3', 'A. Kamboj', 'CSK', '19'],
                      ['4', 'J. Archer', 'RR', '18'],
                      ['5', 'Y. Chahal', 'PBKS', '17'],
                    ].map(([rank, player, team, wkts]) => (
                      <tr key={rank}>
                        <td>{rank}</td>
                        <td style={{ fontWeight: 700 }}>{player}</td>
                        <td>{team}</td>
                        <td><strong>{wkts}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
