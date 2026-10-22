/** Pure catalogue rules shared by the UI and regression tests. */
export function hasPublicPrice(product) {
  return product.price_display === 'public' && Number.isFinite(product.price);
}

export function filterProducts(products, filters) {
  const search = filters.query.trim().toLowerCase();
  const minimum = filters.minimum === '' ? null : Number(filters.minimum);
  const maximum = filters.maximum === '' ? null : Number(filters.maximum);
  const filtered = products.filter((product) => {
    if (filters.category && product.category_slug !== filters.category) return false;
    if (
      search &&
      !`${product.name} ${product.code} ${product.category_name || ''}`
        .toLowerCase()
        .includes(search)
    )
      return false;
    if (filters.availability.length && !filters.availability.includes(product.availability))
      return false;
    if (!hasPublicPrice(product)) return filters.includeUnpriced;
    if (minimum !== null && product.price < minimum) return false;
    if (maximum !== null && product.price > maximum) return false;
    return true;
  });
  const comparePrice = (direction) => (first, second) => {
    if (hasPublicPrice(first) !== hasPublicPrice(second)) return hasPublicPrice(first) ? -1 : 1;
    return hasPublicPrice(first) ? direction * (first.price - second.price) : 0;
  };
  const comparators = {
    name: (first, second) => first.name.localeCompare(second.name),
    name_desc: (first, second) => second.name.localeCompare(first.name),
    code: (first, second) => first.code.localeCompare(second.code, undefined, { numeric: true }),
    price_asc: comparePrice(1),
    price_desc: comparePrice(-1),
  };
  return comparators[filters.sort] ? filtered.sort(comparators[filters.sort]) : filtered;
}
