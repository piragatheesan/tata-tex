'use client';
import { useEffect, useMemo, useState } from 'react';
import ProductCard from './ProductCard';
import { filterProducts } from '@/lib/catalogue.mjs';

const AVAIL = [
  ['available', 'Available'],
  ['enquire', 'Enquire for availability'],
  ['unavailable', 'Currently unavailable'],
];
const SORTS = [
  ['default', 'Featured'],
  ['name', 'Name: A–Z'],
  ['name_desc', 'Name: Z–A'],
  ['code', 'Product code'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
];

function Search({ id, value, onChange }) {
  return (
    <div className="search-box">
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search products, codes or categories"
        aria-label="Search products, codes or categories"
        autoComplete="off"
      />
      <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function ProductBrowser({ categories, products, initial, bounds, extras = null }) {
  const showPrices = bounds.n > 0;
  const [selectedCategory, setSelectedCategory] = useState(initial.category);
  const [searchQuery, setSearchQuery] = useState(initial.q);
  const [selectedAvailability, setSelectedAvailability] = useState(initial.avail);
  const [sort, setSort] = useState(initial.sort);
  const [minimumPrice, setMinimumPrice] = useState(initial.min);
  const [maximumPrice, setMaximumPrice] = useState(initial.max);
  const [includeUnpriced, setIncludeUnpriced] = useState(initial.unpriced);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Keep the address bar in step with the filters so a filtered view can be shared.
  useEffect(() => {
    const p = new URLSearchParams();
    if (selectedCategory) p.set('category', selectedCategory);
    if (searchQuery.trim()) p.set('q', searchQuery.trim());
    selectedAvailability.forEach((a) => p.append('avail', a));
    if (sort !== 'default') p.set('sort', sort);
    if (minimumPrice !== '') p.set('min', minimumPrice);
    if (maximumPrice !== '') p.set('max', maximumPrice);
    if (!includeUnpriced) p.set('unpriced', '0');
    const s = p.toString();
    window.history.replaceState(null, '', '/products' + (s ? '?' + s : ''));
  }, [
    selectedCategory,
    searchQuery,
    selectedAvailability,
    sort,
    minimumPrice,
    maximumPrice,
    includeUnpriced,
  ]);

  const visibleProducts = useMemo(
    () =>
      filterProducts(products, {
        category: selectedCategory,
        query: searchQuery,
        availability: selectedAvailability,
        sort,
        minimum: minimumPrice,
        maximum: maximumPrice,
        includeUnpriced: includeUnpriced,
      }),
    [
      products,
      selectedCategory,
      searchQuery,
      selectedAvailability,
      sort,
      minimumPrice,
      maximumPrice,
      includeUnpriced,
    ],
  );

  const activeCategory = categories.find((c) => c.slug === selectedCategory);
  const total = products.length;
  const hasActiveFilters = Boolean(
    selectedCategory ||
    searchQuery.trim() ||
    selectedAvailability.length ||
    minimumPrice !== '' ||
    maximumPrice !== '' ||
    !includeUnpriced ||
    sort !== 'default',
  );
  const reset = () => {
    setSelectedCategory('');
    setSearchQuery('');
    setSelectedAvailability([]);
    setSort('default');
    setMinimumPrice('');
    setMaximumPrice('');
    setIncludeUnpriced(true);
  };
  const toggleAvail = (v) =>
    setSelectedAvailability(
      selectedAvailability.includes(v)
        ? selectedAvailability.filter((a) => a !== v)
        : [...selectedAvailability, v],
    );

  return (
    <div className="catalogue-layout">
      <aside className={'catalogue-sidebar' + (isFilterPanelOpen ? ' open' : '')}>
        <button
          type="button"
          className="filter-toggle"
          aria-expanded={isFilterPanelOpen}
          aria-controls="filters"
          onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
        >
          {isFilterPanelOpen ? 'Hide filters' : 'Show filters'}
        </button>
        <div id="filters" className="filter-body">
          <section>
            <h2 className="filter-heading">Browse categories</h2>
            <ul className="category-list">
              <li>
                <button
                  type="button"
                  className={!selectedCategory ? 'on' : ''}
                  aria-pressed={!selectedCategory}
                  onClick={() => setSelectedCategory('')}
                >
                  <i className="category-dot" aria-hidden="true" />
                  <span className="category-name">All products</span>
                  <span className="category-count">{total}</span>
                </button>
              </li>
              {categories.map((category) => (
                <li key={category.slug}>
                  <button
                    type="button"
                    className={selectedCategory === category.slug ? 'on' : ''}
                    aria-pressed={selectedCategory === category.slug}
                    onClick={() => setSelectedCategory(category.slug)}
                  >
                    <i className="category-dot" aria-hidden="true" />
                    <span className="category-name">{category.name}</span>
                    <span className="category-count">{category.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          {showPrices ? (
            <section>
              <h2 className="filter-heading">Price range (Rs.)</h2>
              <div className="two-columns">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={minimumPrice}
                  onChange={(e) => setMinimumPrice(e.target.value)}
                  placeholder={`From ${Math.floor(bounds.min)}`}
                  aria-label="Lowest price"
                />
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={maximumPrice}
                  onChange={(e) => setMaximumPrice(e.target.value)}
                  placeholder={`To ${Math.ceil(bounds.max)}`}
                  aria-label="Highest price"
                />
              </div>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={includeUnpriced}
                  onChange={(e) => setIncludeUnpriced(e.target.checked)}
                />{' '}
                Include products without a listed price
              </label>
            </section>
          ) : null}
          <section>
            <h2 className="filter-heading">Availability</h2>
            {AVAIL.map(([v, label]) => (
              <label key={v} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedAvailability.includes(v)}
                  onChange={() => toggleAvail(v)}
                />{' '}
                {label}
              </label>
            ))}
          </section>
          {hasActiveFilters ? (
            <button type="button" className="clear" onClick={reset}>
              Clear all filters
            </button>
          ) : null}
        </div>
      </aside>

      <div className="catalogue-results">
        <h1>{activeCategory ? activeCategory.name : 'Our Products'}</h1>
        <p className="count" aria-live="polite">
          {visibleProducts.length} product{visibleProducts.length === 1 ? '' : 's'}
        </p>
        <div className="catalogue-toolbar">
          <Search id="main-search" value={searchQuery} onChange={setSearchQuery} />{' '}
          <section className="sort-control">
            <label htmlFor="product-sort">Sort</label>
            <select
              id="product-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort products"
            >
              {SORTS.filter(([v]) => showPrices || !v.startsWith('price')).map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
          </section>
        </div>
        {visibleProducts.length ? (
          <div className="product-grid">
            {visibleProducts.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <p>No products match these filters.</p>
            <button type="button" className="btn-outline" onClick={reset}>
              Clear all filters
            </button>
          </div>
        )}
        {extras}
      </div>
    </div>
  );
}
