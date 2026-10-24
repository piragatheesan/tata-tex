'use client';
import { useFormStatus } from 'react-dom';
import { deleteProduct } from '@/lib/actions';
import styles from './ProductEditor.module.css';
function DeleteSubmit() {
  const { pending } = useFormStatus();
  return (
    <button className={styles.deleteButton} type="submit" disabled={pending}>
      {pending ? 'Deleting…' : 'Delete product'}
    </button>
  );
}
export default function DeleteProductButton({ product }) {
  return (
    <form
      action={deleteProduct}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Delete “${product.name}”? This permanently removes the product and its uploaded photo.`,
          )
        )
          event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={product.id} />
      <DeleteSubmit />
    </form>
  );
}
