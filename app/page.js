import Link from 'next/link';
import { getPosts } from '@/lib/supabase';
import siteConfig from '@/config/site.config';
import { getLiveData, formatMatchForTicker } from '@/lib/live-data';

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


export default async function HomePage() {
  let posts = [];
  let liveData = { matches: [], pointsTable: null };
  try {
    [posts] = await Promise.all([
      getPosts({ limit: 20 }),
    ]);
    try { liveData = await getLiveData(); } catch {}
  } catch {
    posts = [];
  }

  const featured = posts[0] || null;
  const topStories = posts.slice(1, 7);
  const hasNoPosts = posts.length === 0;
  const liveMatches = liveData.matches || [];
  const iplTable = liveData.pointsTable || [];

  return (
    <>
      {/* ── Score Cards Bar — Live CricAPI data ──────────────── */}
      {liveMatches.length > 0 && (
        <div className="scores-bar">
          <div className="scores-inner">
            {liveMatches.slice(0, 3).map((match, i) => {
              const isLive = match.matchStarted && !match.matchEnded
              const status = isLive ? 'LIVE' : match.matchEnded ? 'RESULT' : 'UPCOMING'
              const score = match.score?.[0] ? `${match.score[0].r}/${match.score[0].w} (${match.score[0].o} ov)` : ''
              return (
                <div className="score-card" key={match.id || i}>
                  <div className="sc-status">
                    {isLive && <span className="live-dot" />}
                    {status}
                  </div>
                  <div className="sc-match">{match.name}</div>
                  {(match.teams || []).map((team, j) => (
                    <div className="sc-team" key={j}>
                      <span className="sc-team-name">{team}</span>
                      {j === 0 && score && <span className="sc-score batting">{score}</span>}
                    </div>
                  ))}
                  <div className={`sc-result${isLive ? ' live' : ''}`}>{match.status}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
                  {featured.cover_image && (
                    <Link href={`/${featured.slug}`}>
                      <img
                        className="featured-img"
                        src={featured.cover_image}
                        alt={featured.cover_image_alt || featured.title}
                        loading="eager"
                      />
                    </Link>
                  )}
                  {!featured.cover_image && (
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
                              <span>{post.author_name || siteConfig.author.name}</span>
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
                            <h3 className="news-item-title">{post.title}</h3>
                            <div className="news-item-meta">
                              <span>
                                {new Date(post.published_at).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </span>
                              <span className="meta-dot">•</span>
                              <span>{post.author_name || siteConfig.author.name}</span>
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
              {/* IPL Points Table — live from CricAPI */}
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
                    {(Array.isArray(iplTable) && iplTable.length > 0 ? iplTable : []).map((row, idx) => (
                      <tr key={row.rank || idx}>
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
                        {post.cover_image ? (
                          <img
                            className="sn-thumb"
                            src={post.cover_image}
                            alt={post.cover_image_alt || post.title}
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
