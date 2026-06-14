import siteConfig from '@/config/site.config';

const PEXELS_KEY = process.env.PEXELS_API_KEY;
const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;

const FALLBACK_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1540747913346-19212a4b95e2?w=1200&q=80',
    alt: 'Cricket stadium IPL India',
  },
  {
    url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200&q=80',
    alt: 'Cricket bat and ball on pitch',
  },
  {
    url: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=1200&q=80',
    alt: 'Indian cricket team celebration',
  },
];

/** Pick a random fallback image */
function randomFallback() {
  return FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
}

/** Build a query from keywords + title */
function buildQuery(title) {
  // Try to extract key phrases
  const keywords = siteConfig.imageKeywords || ['cricket stadium india IPL'];
  const keyword = keywords[Math.floor(Math.random() * keywords.length)];
  // Mix title words + keyword for best match
  const titleWords = (title || '')
    .split(' ')
    .slice(0, 3)
    .join(' ');
  return `${keyword} ${titleWords}`.trim();
}

/** Fetch image from Pexels */
async function fetchPexels(query) {
  if (!PEXELS_KEY || PEXELS_KEY === 'your_pexels_key') return null;
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`;
    const res = await fetch(url, {
      headers: { Authorization: PEXELS_KEY },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    const photos = json.photos || [];
    if (!photos.length) return null;
    const photo = photos[Math.floor(Math.random() * Math.min(3, photos.length))];
    return {
      url: photo.src?.large2x || photo.src?.large || photo.src?.original,
      alt: photo.alt || query,
      credit: `Photo by ${photo.photographer} on Pexels`,
    };
  } catch (err) {
    console.error('[image] Pexels error:', err.message);
    return null;
  }
}

/** Fetch image from Unsplash */
async function fetchUnsplash(query) {
  if (!UNSPLASH_KEY || UNSPLASH_KEY === 'your_unsplash_key') return null;
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    const results = json.results || [];
    if (!results.length) return null;
    const photo = results[Math.floor(Math.random() * Math.min(3, results.length))];
    return {
      url: photo.urls?.regular || photo.urls?.full,
      alt: photo.alt_description || query,
      credit: `Photo by ${photo.user?.name} on Unsplash`,
    };
  } catch (err) {
    console.error('[image] Unsplash error:', err.message);
    return null;
  }
}

/**
 * Fetch a relevant image for a post.
 * Tries Pexels first, then Unsplash, then falls back to static images.
 */
export async function fetchImage(title) {
  const query = buildQuery(title);

  const pexels = await fetchPexels(query);
  if (pexels?.url) return pexels;

  const unsplash = await fetchUnsplash(query);
  if (unsplash?.url) return unsplash;

  // Fallback to static
  return randomFallback();
}
