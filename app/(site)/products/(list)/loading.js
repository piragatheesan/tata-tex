// Skeleton shown while the products page loads.
export default function Loading() {
  return (
    <div className="container catalogue-page" aria-busy="true">
      <div className="catalogue-layout">
        <div className="skeleton filter-skeleton" />
        <div className="catalogue-results">
          <div className="skeleton" style={{ height: 40, width: 260, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 42, marginBottom: 20 }} />
          <div className="product-grid">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="surface-card product-card">
                <div className="skeleton" style={{ aspectRatio: '1 / 1' }} />
                <div className="skeleton" style={{ height: 16, width: '75%' }} />
                <div className="skeleton" style={{ height: 12, width: '50%' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
