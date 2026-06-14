export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import SearchClient from './SearchClient';

export const metadata = {
  title: 'Search Cricket News | CricketLiveNews',
  description: 'Search IPL 2026 news, player stats, match analysis and cricket updates.',
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ padding: '40px 16px' }}>
          <div className="sk" style={{ height: '32px', width: '50%', marginBottom: '16px' }} />
          <div className="sk" style={{ height: '48px', maxWidth: '600px', borderRadius: '6px' }} />
        </div>
      }
    >
      <SearchClient />
    </Suspense>
  );
}
