'use client';
import SubmitButton from '@/components/admin/SubmitButton';
import { useEffect, useState } from 'react';
import { ProductImage } from '@/components/ProductCard';
import { priceLabel, AVAILABILITY } from '@/lib/ui';
import DeleteProductButton from './DeleteProductButton';
import styles from './ProductEditor.module.css';
import { saveProduct } from '@/lib/actions';

export default function ProductForm({ product, categories }) {
  const p = product || {
    price_display: 'contact',
    availability: 'enquire',
    price_unit: 'piece',
    published: 1,
  };
  const [draft, setDraft] = useState(p);
  const [file, setFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [imageError, setImageError] = useState('');
  useEffect(() => {
    if (!file) {
      setPhotoUrl('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  function updatePreview(event) {
    const data = new FormData(event.currentTarget);
    setDraft({
      ...p,
      ...Object.fromEntries(data),
      published: data.has('published'),
      image: data.has('remove_image') ? null : p.image,
    });
    const selected = data.get('image');
    const error =
      selected?.size > 3 * 1024 * 1024
        ? 'Choose an image smaller than 3 MB.'
        : selected?.size && !['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)
          ? 'Choose a JPG, PNG or WebP image.'
          : '';
    setImageError(error);
    setFile(!error && selected?.size ? selected : null);
  }
  const category = categories.find((item) => String(item.id) === String(draft.category_id));
  const preview = {
    ...draft,
    name: draft.name || 'Product name',
    code: draft.code || 'Product code',
    price: draft.price === '' || draft.price == null ? null : Number(draft.price),
  };
  return (
    <div className={`row g-4 ${styles.editor}`} data-product-editor>
      <div className={`col-12 col-lg-6 ${styles.formColumn}`}>
        <form
          action={saveProduct}
          onChange={updatePreview}
          onSubmit={(event) => {
            if (imageError) {
              event.preventDefault();
              event.currentTarget.elements.namedItem('image')?.focus();
            }
          }}
          className={`admin-form ${styles.form}`}
        >
          {product ? <input type="hidden" name="id" value={product.id} /> : null}
          <label>
            Name *
            <input
              className="form-control"
              name="name"
              defaultValue={p.name || ''}
              required
              maxLength={120}
            />
          </label>
          <label>
            Product code * (must be unique)
            <input
              className="form-control"
              name="code"
              defaultValue={p.code || ''}
              required
              maxLength={30}
            />
          </label>
          <label>
            Category
            <select className="form-select" name="category_id" defaultValue={p.category_id || ''}>
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
            <textarea
              className="form-control"
              name="description"
              rows="4"
              defaultValue={p.description || ''}
              maxLength={3000}
            />
          </label>
          <label>
            Specifications (for example material, width, colours)
            <input
              className="form-control"
              name="specifications"
              defaultValue={p.specifications || ''}
              maxLength={1000}
            />
          </label>
          <div className="three">
            <label>
              Price shown to visitors
              <select className="form-select" name="price_display" defaultValue={p.price_display}>
                <option value="contact">Contact for Price</option>
                <option value="quote">Request a Wholesale Quotation</option>
                <option value="public">Show the price</option>
              </select>
            </label>
            <label>
              Price (Rs.) – only used when the price is shown
              <input
                className="form-control"
                name="price"
                type="number"
                step="0.01"
                min="0"
                required={draft.price_display === 'public'}
                defaultValue={p.price ?? ''}
              />
            </label>
            <label>
              Sold per
              <input
                className="form-control"
                name="price_unit"
                defaultValue={p.price_unit || 'piece'}
                maxLength={20}
              />
            </label>
          </div>
          <label>
            Availability
            <select className="form-select" name="availability" defaultValue={p.availability}>
              <option value="available">Available</option>
              <option value="enquire">Enquire for availability</option>
              <option value="unavailable">Currently unavailable</option>
            </select>
          </label>
          <label>
            Product photo (JPG, PNG or WebP, up to 3 MB)
            <input
              className="form-control"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-invalid={Boolean(imageError)}
              aria-describedby={imageError ? 'product-image-error' : undefined}
            />
            {imageError ? (
              <span id="product-image-error" className="field-error" role="alert">
                {imageError}
              </span>
            ) : null}
          </label>
          {p.image ? (
            <div className="current-image">
              <img src={`/uploads/${p.image}`} alt="Current product" />
              <label className="checkbox-label">
                <input className="form-check-input" type="checkbox" name="remove_image" /> Remove
                this photo
              </label>
            </div>
          ) : null}
          <label className="checkbox-label">
            <input
              className="form-check-input"
              type="checkbox"
              name="published"
              defaultChecked={!!p.published}
            />{' '}
            Published (visible on the website)
          </label>
          <SubmitButton>{product ? 'Save changes' : 'Add product'}</SubmitButton>
        </form>
        {product ? (
          <div className={styles.deleteArea}>
            <DeleteProductButton product={product} />
          </div>
        ) : null}
      </div>
      <aside
        className={`col-12 col-lg-6 ${styles.previewColumn}`}
        aria-label="Live product preview"
      >
        <div className={styles.preview}>
          <h2>Live preview</h2>
          <p className={styles.hint}>
            This is how your product will look in the catalogue. Changes appear here before saving.
          </p>
          <article className={`surface-card product-card ${styles.card}`}>
            <div className="pc-main">
              <span className="product-card-image-wrap">
                {photoUrl ? (
                  <img
                    className="product-visual product-photo"
                    src={photoUrl}
                    alt={preview.name}
                    width="480"
                    height="600"
                    style={{ height: 300 }}
                  />
                ) : (
                  <ProductImage p={preview} height={300} />
                )}
              </span>
              <h3>{preview.name}</h3>
              <p className="muted">
                {preview.code}
                {category ? ` � ${category.name}` : ''}
              </p>
              <p className="product-price">{priceLabel(preview)}</p>
              <span className={`av ${preview.availability}`}>
                {AVAILABILITY[preview.availability]}
              </span>
            </div>
            <span className="pc-enq">View Uniform Details</span>
          </article>
          <p className={styles.visibility}>
            {draft.published ? 'Published after saving' : 'Draft � hidden from the website'}
          </p>
          {draft.description ? (
            <section className={styles.details}>
              <h3>Description</h3>
              <p>{draft.description}</p>
            </section>
          ) : null}
          {draft.specifications ? (
            <section className={styles.details}>
              <h3>Product details</h3>
              <p>{draft.specifications}</p>
            </section>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
