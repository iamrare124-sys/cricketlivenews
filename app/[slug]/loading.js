export default function ArticleLoading() {
  return (
    <div className="container">
      <div className="article-wrap">
        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
          <div className="sk" style={{ height: '12px', width: '40px' }} />
          <div className="sk" style={{ height: '12px', width: '10px' }} />
          <div className="sk" style={{ height: '12px', width: '80px' }} />
        </div>

        {/* Category badge */}
        <div className="sk" style={{ height: '12px', width: '80px', marginBottom: '12px' }} />

        {/* Headline */}
        <div className="sk" style={{ height: '34px', marginBottom: '10px' }} />
        <div className="sk" style={{ height: '34px', width: '80%', marginBottom: '16px' }} />

        {/* Deck */}
        <div className="sk" style={{ height: '18px', marginBottom: '8px' }} />
        <div className="sk" style={{ height: '18px', width: '90%', marginBottom: '16px' }} />

        {/* Byline */}
        <div className="sk" style={{ height: '14px', width: '160px', marginBottom: '6px' }} />
        <div className="sk" style={{ height: '12px', width: '220px', marginBottom: '18px' }} />

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '22px' }}>
          {[1, 2].map((i) => (
            <div key={i} className="sk" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
          ))}
          <div className="sk" style={{ width: '80px', height: '40px', borderRadius: '20px' }} />
        </div>

        {/* Hero image */}
        <div className="sk" style={{ width: '100%', height: '300px', borderRadius: '6px', marginBottom: '10px' }} />
        <div className="sk" style={{ height: '12px', width: '220px', marginBottom: '24px' }} />

        {/* Body paragraphs */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="sk" style={{ height: '16px', width: i % 3 === 0 ? '75%' : '100%', marginBottom: '10px' }} />
        ))}

        <div className="sk" style={{ height: '22px', width: '200px', margin: '28px 0 14px' }} />

        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="sk" style={{ height: '16px', width: i % 4 === 0 ? '65%' : '100%', marginBottom: '10px' }} />
        ))}
      </div>
    </div>
  );
}
