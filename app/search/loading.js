export default function SearchLoading() {
  return (
    <div className="container">
      <div style={{ padding: '32px 0 20px', borderBottom: '1px solid var(--gray-200)', marginBottom: '24px' }}>
        <div className="sk" style={{ height: '28px', width: '220px', marginBottom: '14px' }} />
        <div className="sk" style={{ height: '48px', maxWidth: '600px', borderRadius: '6px' }} />
      </div>
      <div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{ display: 'flex', gap: '14px', padding: '16px 0', borderBottom: '1px solid var(--gray-200)' }}
          >
            <div className="sk" style={{ width: '110px', height: '74px', borderRadius: '4px', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="sk" style={{ height: '16px', marginBottom: '8px' }} />
              <div className="sk" style={{ height: '16px', width: '80%', marginBottom: '8px' }} />
              <div className="sk" style={{ height: '12px', width: '40%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
