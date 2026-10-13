import { getCategories } from '@/lib/queries';
import { addCategory, saveCategory, deleteCategory } from '@/lib/actions';
import Banner from '@/components/admin/Banner';

export default async function AdminCategories({ searchParams }) {
  const sp = await searchParams;
  const cats = getCategories({ all: true });
  return (
    <>
      <h1>Categories</h1>
      <Banner sp={sp} />
      <form action={addCategory} className="afm inline">
        <label>New category<input name="name" required maxLength={80} /></label>
        <label>Description (optional)<input name="description" maxLength={300} /></label>
        <button className="btn" type="submit">Add category</button>
      </form>
      <h2>Existing categories</h2>
      {cats.map((c) => (
        <div key={c.id} className="c" style={{ marginBottom: 12 }}>
          <form action={saveCategory} className="afm inline">
            <input type="hidden" name="id" value={c.id} />
            <label>Name<input name="name" defaultValue={c.name} required maxLength={80} /></label>
            <label>Description<input name="description" defaultValue={c.description} maxLength={300} /></label>
            <label>Order<input name="display_order" type="number" defaultValue={c.display_order} /></label>
            <label className="chk"><input type="checkbox" name="published" defaultChecked={!!c.published} /> Visible</label>
            <button className="btn" type="submit">Save</button>
          </form>
          <details className="danger">
            <summary>{c.count} product(s) · delete</summary>
            <form action={deleteCategory}>
              <input type="hidden" name="id" value={c.id} />
              <button className="btn" type="submit">Delete {c.name}</button>
            </form>
          </details>
        </div>
      ))}
    </>
  );
}
