const CRICAPI_KEY = process.env.CRICAPI_KEY;

let _cachedMatches = null;
let _cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/** Fetch today's matches from CricAPI */
async function fetchTodayMatches() {
  if (!CRICAPI_KEY) return [];

  // Return cached if fresh
  if (_cachedMatches && Date.now() - _cacheTime < CACHE_TTL) {
    return _cachedMatches;
  }

  try {
    const res = await fetch(
      `https://api.cricapi.com/v1/currentMatches?apikey=${CRICAPI_KEY}&offset=0`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const json = await res.json();

    const matches = (json.data || []).map((m) => ({
      id: m.id,
      name: m.name,
      status: m.status,
      venue: m.venue,
      date: m.date,
      dateTimeGMT: m.dateTimeGMT,
      teams: m.teams || [],
      teamInfo: m.teamInfo || [],
      score: m.score || [],
      matchType: m.matchType,
      matchStarted: m.matchStarted,
      matchEnded: m.matchEnded,
    }));

    _cachedMatches = matches;
    _cacheTime = Date.now();
    return matches;
  } catch (err) {
    console.error('[live-data] CricAPI error:', err.message);
    return [];
  }
}

/** Fetch IPL points table from CricAPI */
async function fetchIplPointsTable() {
  if (!CRICAPI_KEY) return null;
  try {
    // CricAPI series points table endpoint
    const res = await fetch(
      `https://api.cricapi.com/v1/series_points?apikey=${CRICAPI_KEY}&id=c75f8952-74d4-416f-b7b4-11c3f63cb73f`,
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error('[live-data] IPL points table error:', err.message);
    return null;
  }
}

/** Get live and upcoming matches for the ticker */
export async function getLiveMatches() {
  return fetchTodayMatches();
}

/** Get full live data (matches + points table) */
export async function getLiveData() {
  const [matches, pointsTable] = await Promise.allSettled([
    fetchTodayMatches(),
    fetchIplPointsTable(),
  ]);

  return {
    matches: matches.status === 'fulfilled' ? matches.value : [],
    pointsTable: pointsTable.status === 'fulfilled' ? pointsTable.value : null,
  };
}

/** Format match for ticker display */
export function formatMatchForTicker(match) {
  if (!match) return null;
  const teams = match.teams?.join(' vs ') || match.name;
  const score = match.score?.[0]
    ? `${match.score[0].r}/${match.score[0].w} (${match.score[0].o} ov)`
    : '';
  return {
    label: match.matchStarted && !match.matchEnded ? 'LIVE' : match.matchEnded ? 'RESULT' : 'UPCOMING',
    text: `${teams} ${score} · ${match.venue || ''}`,
  };
}

/** Static fallback ticker items when API is unavailable */
export const STATIC_TICKER = [
  { label: 'IPL 2026', text: 'CSK vs SRH — Today 7:30 PM · Chepauk Chennai' },
  { label: 'LIVE', text: 'BAN vs PAK 2nd Test — PAK need 437 runs, Day 3' },
  { label: 'PURPLE CAP', text: 'Bhuvneshwar Kumar 24 wickets — leads Purple Cap' },
  { label: 'ORANGE CAP', text: 'B Sai Sudharsan 554 runs · Shubman Gill 552' },
  { label: 'RESULT', text: 'Nepal beat Scotland by 6 wickets · WCL2 Kirtipur' },
];
