/**
 * Config loader — reads NICHE env var and returns the matching niche config.
 * Falls back to cricket if NICHE is not set.
 */
function getSiteConfig() {
  const niche = process.env.NICHE || 'cricket';
  try {
    // eslint-disable-next-line import/no-dynamic-require
    const config = require(`./niches/${niche}.config.js`);
    return config;
  } catch {
    console.warn(`[config] Niche "${niche}" not found, falling back to cricket`);
    return require('./niches/cricket.config.js');
  }
}

const siteConfig = getSiteConfig();
module.exports = siteConfig;
