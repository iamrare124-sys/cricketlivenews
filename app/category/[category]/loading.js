export default function CategoryLoading() {
  return (
    <>
      {/* Category header skeleton */}
      <div style={{ background: 'var(--blue)', padding: '28px 0', marginBottom: '24px' }}>
        <div className="container">
          <div className="sk" style={{ height: '32px', width: '200px', marginBottom: '8px', background: 'rgba(255,255,255,.2)', borderRadius: '4px' }} />
          <div className="sk" style={{ height: '14px', width: '300px', background: 'rgba(255,255,255,.15)', borderRadius: '4px' }} />
        </div>
      </div>

      <div className="container">
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '2px solid var(--gray-200)', paddingBottom: '2px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="sk" style={{ height: '36px', width: '100px', borderRadius: '4px' }} />
          ))}
        </div>

        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: '14px',
              padding: '16px 0',
              borderBottom: '1px solid var(--gray-200)',
            }}
          >
            <div className="sk" style={{ width: '110px', height: '74px', borderRadius: '4px', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="sk" style={{ height: '16px', marginBottom: '8px' }} />
              <div className="sk" style={{ height: '16px', width: '85%', marginBottom: '8px' }} />
              <div className="sk" style={{ height: '12px', width: '40%' }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
