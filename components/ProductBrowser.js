'use client';
import { useEffect, useMemo, useState } from 'react';
import ProductCard from './ProductCard';

const AVAIL = [['available', 'Available'], ['enquire', 'Enquire for availability'], ['unavailable', 'Currently unavailable']];
const SORTS = [
  ['default', 'Featured'], ['name', 'Name: A–Z'], ['name_desc', 'Name: Z–A'], ['code', 'Product code'],
  ['price_asc', 'Price: low to high'], ['price_desc', 'Price: high to low'],
];

function Search({ id, value, onChange }) {
  return (
    <div className="sbox">
      <input id={id} type="search" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder="Name or code" aria-label="Search by name or code" autoComplete="off" />
      <svg className="sico" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

const hasPrice = (p) => p.price_display === 'public' && p.price != null;

export default function ProductBrowser({ categories, products, initial, bounds, extras = null }) {
  const showPrices = bounds.n > 0;
  const [cat, setCat] = useState(initial.category);
  const [q, setQ] = useState(initial.q);
  const [avail, setAvail] = useState(initial.avail);
  const [sort, setSort] = useState(initial.sort);
  const [min, setMin] = useState(initial.min);
  const [max, setMax] = useState(initial.max);
  const [unpriced, setUnpriced] = useState(initial.unpriced);
  const [panel, setPanel] = useState(false);

  // Keep the address bar in step with the filters so a filtered view can be shared.
  useEffect(() => {
    const p = new URLSearchParams();
    if (cat) p.set('category', cat);
    if (q.trim()) p.set('q', q.trim());
    avail.forEach((a) => p.append('avail', a));
    if (sort !== 'default') p.set('sort', sort);
    if (min !== '') p.set('min', min);
    if (max !== '') p.set('max', max);
    if (!unpriced) p.set('unpriced', '0');
    const s = p.toString();
    window.history.replaceState(null, '', '/products' + (s ? '?' + s : ''));
  }, [cat, q, avail, sort, min, max, unpriced]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const lo = min === '' ? null : Number(min);
    const hi = max === '' ? null : Number(max);
    let l = products.filter((p) => {
      if (cat && p.category_slug !== cat) return false;
      if (needle && !(p.name + ' ' + p.code).toLowerCase().includes(needle)) return false;
      if (avail.length && !avail.includes(p.availability)) return false;
      if (lo !== null || hi !== null) {
        if (!hasPrice(p)) return unpriced;
        if (lo !== null && p.price < lo) return false;
        if (hi !== null && p.price > hi) return false;
      }
      return true;
    });
    const byPrice = (dir) => (a, b) => (hasPrice(a) === hasPrice(b) ? (hasPrice(a) ? dir * (a.price - b.price) : 0) : hasPrice(a) ? -1 : 1);
    if (sort === 'name') l = [...l].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'name_desc') l = [...l].sort((a, b) => b.name.localeCompare(a.name));
    else if (sort === 'code') l = [...l].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    else if (sort === 'price_asc') l = [...l].sort(byPrice(1));
    else if (sort === 'price_desc') l = [...l].sort(byPrice(-1));
    return l;
  }, [products, cat, q, avail, sort, min, max, unpriced]);

  const active = categories.find((c) => c.slug === cat);
  const total = categories.reduce((n, c) => n + c.count, 0);
  const filtersOn = Boolean(cat || q.trim() || avail.length || min !== '' || max !== '' || !unpriced || sort !== 'default');
  const reset = () => { setCat(''); setQ(''); setAvail([]); setSort('default'); setMin(''); setMax(''); setUnpriced(true); };
  const toggleAvail = (v) => setAvail(avail.includes(v) ? avail.filter((a) => a !== v) : [...avail, v]);

  return (
    <div className="shop2">
      <aside className={'side' + (panel ? ' open' : '')}>
        <button type="button" className="fbtn" aria-expanded={panel} aria-controls="filters" onClick={() => setPanel(!panel)}>
          {panel ? 'Hide filters' : 'Show filters'}
        </button>
        <div id="filters" className="fbody">
          <section>
            <h2 className="fh">Search</h2>
            <Search id="side-search" value={q} onChange={setQ} />
          </section>
          <section>
            <h2 className="fh">Browse categories</h2>
            <ul className="catlist">
              <li>
                <button type="button" className={!cat ? 'on' : ''} aria-pressed={!cat} onClick={() => setCat('')}>
                  <i className="cv" aria-hidden="true" /><span className="cn">All products</span><span className="cc">{total}</span>
                </button>
              </li>
              {categories.map((c) => (
                <li key={c.slug}>
                  <button type="button" className={cat === c.slug ? 'on' : ''} aria-pressed={cat === c.slug} onClick={() => setCat(c.slug)}>
                    <i className="cv" aria-hidden="true" /><span className="cn">{c.name}</span><span className="cc">{c.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          {showPrices ? (
            <section>
              <h2 className="fh">Price range (Rs.)</h2>
              <div className="two">
                <input type="number" min="0" step="any" value={min} onChange={(e) => setMin(e.target.value)} placeholder={`From ${Math.floor(bounds.min)}`} aria-label="Lowest price" />
                <input type="number" min="0" step="any" value={max} onChange={(e) => setMax(e.target.value)} placeholder={`To ${Math.ceil(bounds.max)}`} aria-label="Highest price" />
              </div>
              <label className="chk"><input type="checkbox" checked={unpriced} onChange={(e) => setUnpriced(e.target.checked)} /> Include products without a listed price</label>
            </section>
          ) : null}
          <section>
            <h2 className="fh">Availability</h2>
            {AVAIL.map(([v, label]) => (
              <label key={v} className="chk"><input type="checkbox" checked={avail.includes(v)} onChange={() => toggleAvail(v)} /> {label}</label>
            ))}
          </section>
          <section>
            <h2 className="fh">Sort by</h2>
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products">
              {SORTS.filter(([v]) => showPrices || !v.startsWith('price')).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
            </select>
          </section>
          {filtersOn ? <button type="button" className="clear" onClick={reset}>Clear all filters</button> : null}
        </div>
      </aside>

      <div className="main2">
        <h1>{active ? active.name : 'All products'}</h1>
        <p className="sr-only count" aria-live="polite">{list.length} product{list.length === 1 ? '' : 's'}</p>
        <Search id="main-search" value={q} onChange={setQ} />
        {list.length ? (
          <div className="pgrid">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        ) : (
          <div className="empty">
            <p>No products match these filters.</p>
            <button type="button" className="btn-outline" onClick={reset}>Clear all filters</button>
          </div>
        )}
        {extras}
      </div>
    </div>
  );
}
