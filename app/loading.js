export default function Loading() {
  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '48px' }}>
      <div className="page-grid">
        <div>
          {/* Featured skeleton */}
          <div style={{ paddingTop: '18px', paddingBottom: '16px' }}>
            <div className="sk" style={{ height: '12px', width: '80px', marginBottom: '10px' }} />
            <div className="sk sk-title" style={{ height: '28px', marginBottom: '8px' }} />
            <div className="sk sk-title" style={{ height: '28px', width: '70%', marginBottom: '14px' }} />
            <div className="sk sk-img" style={{ height: '230px', marginBottom: '10px', borderRadius: '6px' }} />
            <div className="sk sk-text" style={{ marginBottom: '8px' }} />
          </div>

          {/* News list skeleton */}
          <div style={{ marginTop: '20px' }}>
            <div className="sk" style={{ height: '24px', width: '140px', marginBottom: '16px' }} />
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: '14px',
                  padding: '16px 0',
                  borderBottom: '1px solid var(--gray-200)',
                }}
              >
                <div
                  className="sk"
                  style={{ width: '110px', height: '74px', borderRadius: '4px', flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div className="sk" style={{ height: '16px', marginBottom: '8px' }} />
                  <div className="sk" style={{ height: '16px', width: '90%', marginBottom: '8px' }} />
                  <div className="sk" style={{ height: '12px', width: '50%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar skeleton */}
        <aside className="sidebar">
          <div className="sidebar-box">
            <div
              className="sk"
              style={{ height: '36px', margin: '0', borderRadius: '0' }}
            />
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-200)' }}
              >
                <div className="sk" style={{ height: '13px', marginBottom: '4px' }} />
              </div>
            ))}
          </div>
          <div className="sidebar-box">
            <div
              className="sk"
              style={{ height: '36px', margin: '0', borderRadius: '0' }}
            />
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{ display: 'flex', gap: '10px', padding: '11px 14px', borderBottom: '1px solid var(--gray-200)' }}
              >
                <div className="sk" style={{ width: '68px', height: '48px', flexShrink: 0, borderRadius: '3px' }} />
                <div style={{ flex: 1 }}>
                  <div className="sk" style={{ height: '12px', marginBottom: '6px' }} />
                  <div className="sk" style={{ height: '12px', width: '70%' }} />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
