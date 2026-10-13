// Skeleton shown while the products page loads.
export default function Loading() {
  return (
    <div className="w catpage" aria-busy="true">
      <div className="shop2">
        <div className="shim side-skel" />
        <div className="main2">
          <div className="shim" style={{ height: 40, width: 260, marginBottom: 12 }} />
          <div className="shim" style={{ height: 42, marginBottom: 20 }} />
          <div className="pgrid">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="c pc">
                <div className="shim" style={{ aspectRatio: '1 / 1' }} />
                <div className="shim" style={{ height: 16, width: '75%' }} />
                <div className="shim" style={{ height: 12, width: '50%' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
