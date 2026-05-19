const cricketConfig = {
  niche: 'cricket',
  siteName: 'CricketLiveNews',
  domain: 'cricketlivenews.in',
  tagline: 'Live Cricket Scores & IPL News India',
  description:
    'Live IPL scores, match analysis, player stats and cricket news for Indian cricket fans.',
  siteUrl: 'https://cricketlivenews.in',

  author: {
    name: 'Vikram Sharma',
    title: 'Cricket Analyst | 10 Years Experience',
    bio: 'Vikram Sharma has covered Indian cricket for 10 years. Former ESPNcricinfo contributor, he brings deep match analysis and player insights to fans at CricketLiveNews.in',
    email: 'vikram@cricketlivenews.in',
  },

  seo: {
    primaryKeyword: 'IPL cricket news india',
    secondaryKeywords: [
      'IPL 2026 live score',
      'India cricket match today',
      'cricket player stats',
      'IPL team analysis',
    ],
  },

  rssSources: [
    'https://news.google.com/rss/search?q=IPL+cricket+india+match+2026&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=india+cricket+team+match+today&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=IPL+player+auction+score+wicket&hl=en-IN&gl=IN&ceid=IN:en',
  ],

  reddit: ['Cricket', 'IPL', 'india'],

  liveData: {
    provider: 'cricapi',
    symbols: ['Today Match Score', 'IPL Points Table'],
  },

  imageKeywords: [
    'cricket stadium india IPL',
    'cricket bat ball pitch',
    'indian cricket team celebration',
  ],

  categories: [
    { slug: 'ipl-news', label: 'IPL News' },
    { slug: 'match-analysis', label: 'Match Analysis' },
    { slug: 'player-news', label: 'Player News' },
    { slug: 'cricket-tips', label: 'Fantasy Tips' },
  ],

  cron: '0 9 * * *',

  ticker: [
    { label: 'IPL 2026', text: 'CSK vs SRH — Today 7:30 PM · Chepauk Chennai' },
    { label: 'LIVE', text: 'BAN vs PAK 2nd Test — PAK need 437 runs, Day 3' },
    { label: 'IPL', text: 'Bhuvneshwar Kumar leads Purple Cap with 24 wickets' },
    { label: 'ORANGE CAP', text: 'B Sai Sudharsan 554 runs · Shubman Gill 552' },
    { label: 'RESULT', text: 'Nepal beat Scotland by 6 wickets · WCL2' },
  ],

  aiPersonality: `You are Vikram Sharma, cricket analyst at CricketLiveNews.in. Write like an excited cricket commentator mixed with deep analyst. Use cricket terms naturally: LBW, DRS, powerplay, death overs. Always mention player names, team names, venues. Strong takes: "This was the worst DRS decision of the season." India-specific: home crowd advantage, pitch reports, IPL auction prices. Never say "Furthermore" or "In this article".`,

  colors: {
    primary: '#006db7',
    accent: '#f5821f',
    headerBg: '#006db7',
  },

  navLinks: [
    { label: 'Home', href: '/' },
    { label: 'IPL 2026', href: '/category/ipl-news' },
    { label: 'Match Analysis', href: '/category/match-analysis' },
    { label: 'Player News', href: '/category/player-news' },
    { label: 'Fantasy Tips', href: '/category/cricket-tips' },
    { label: 'About', href: '/about' },
  ],
};

module.exports = cricketConfig;
