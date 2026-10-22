import { saveProduct } from '@/lib/actions';

export default function ProductForm({ product, categories }) {
  const p = product || {
    price_display: 'contact',
    availability: 'enquire',
    price_unit: 'piece',
    published: 1,
  };
  return (
    <form action={saveProduct} className="admin-form">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <label>
        Name *<input name="name" defaultValue={p.name || ''} required maxLength={120} />
      </label>
      <label>
        Product code * (must be unique)
        <input name="code" defaultValue={p.code || ''} required maxLength={30} />
      </label>
      <label>
        Category
        <select name="category_id" defaultValue={p.category_id || ''}>
          <option value="">(none)</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Description
        <textarea name="description" rows="4" defaultValue={p.description || ''} maxLength={3000} />
      </label>
      <label>
        Specifications (for example material, width, colours)
        <input name="specifications" defaultValue={p.specifications || ''} maxLength={1000} />
      </label>
      <div className="three">
        <label>
          Price shown to visitors
          <select name="price_display" defaultValue={p.price_display}>
            <option value="contact">Contact for Price</option>
            <option value="quote">Request a Wholesale Quotation</option>
            <option value="public">Show the price</option>
          </select>
        </label>
        <label>
          Price (Rs.) – only used when the price is shown
          <input name="price" type="number" step="0.01" min="0" defaultValue={p.price ?? ''} />
        </label>
        <label>
          Sold per
          <input name="price_unit" defaultValue={p.price_unit || 'piece'} maxLength={20} />
        </label>
      </div>
      <label>
        Availability
        <select name="availability" defaultValue={p.availability}>
          <option value="available">Available</option>
          <option value="enquire">Enquire for availability</option>
          <option value="unavailable">Currently unavailable</option>
        </select>
      </label>
      <label>
        Product photo (JPG, PNG or WebP, up to 3 MB)
        <input name="image" type="file" accept="image/jpeg,image/png,image/webp" />
      </label>
      {p.image ? (
        <div className="current-image">
          <img src={`/uploads/${p.image}`} alt="Current product" />
          <label className="checkbox-label">
            <input type="checkbox" name="remove_image" /> Remove this photo
          </label>
        </div>
      ) : null}
      <label className="checkbox-label">
        <input type="checkbox" name="published" defaultChecked={!!p.published} /> Published (visible
        on the website)
      </label>
      <button className="btn" type="submit">
        {product ? 'Save changes' : 'Add product'}
      </button>
    </form>
  );
}
