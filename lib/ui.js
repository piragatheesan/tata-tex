export const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'item';

const PATTERNS = [
  'repeating-linear-gradient(45deg,#8D1838 0 8px,#a8405a 8px 16px)', // burgundy diagonal stripes
  'repeating-linear-gradient(90deg,#172A58 0 10px,#27407f 10px 20px)', // navy vertical stripes
  'repeating-linear-gradient(0deg,#C81E2A 0 6px,#dd4852 6px 12px)', // red horizontal stripes
  'repeating-linear-gradient(90deg,transparent 0 22px,rgba(255,255,255,.3) 22px 26px),repeating-linear-gradient(0deg,transparent 0 22px,rgba(255,255,255,.3) 22px 26px),#172A58', // navy check
];
export const swatch = (i) => PATTERNS[Math.abs(Number(i) || 0) % PATTERNS.length];

export function priceLabel(p) {
  if (p.price_display === 'public' && p.price != null)
    return `Rs. ${Number(p.price).toLocaleString('en-LK')} / ${p.price_unit || 'piece'}`;
  if (p.price_display === 'quote') return 'Request a Wholesale Quotation';
  return 'Contact for Price';
}
export const AVAILABILITY = {
  available: 'Available',
  unavailable: 'Currently unavailable',
  enquire: 'Enquire for availability',
};
export const STATUSES = ['New', 'In Progress', 'Awaiting Customer', 'Responded', 'Closed'];
