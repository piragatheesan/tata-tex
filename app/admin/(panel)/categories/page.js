import SubmitButton from '@/components/admin/SubmitButton';
import { requireUser } from '@/lib/auth';
import { getCategories } from '@/lib/queries';
import { addCategory, saveCategory, deleteCategory } from '@/lib/actions';
import Banner from '@/components/admin/Banner';

export default async function AdminCategories({ searchParams }) {
  await requireUser();
  const sp = await searchParams;
  const cats = await getCategories({ all: true });
  return (
    <>
      <h1>Categories</h1>
      <Banner sp={sp} />
      <form action={addCategory} className="admin-form inline">
        <label>
          New category
          <input className="form-control" name="name" required maxLength={80} />
        </label>
        <label>
          Description (optional)
          <input className="form-control" name="description" maxLength={300} />
        </label>
        <SubmitButton>Add category</SubmitButton>
      </form>
      <h2>Existing categories</h2>
      {cats.map((c) => (
        <div key={c.id} className="surface-card" style={{ marginBottom: 12 }}>
          <form action={saveCategory} className="admin-form inline">
            <input type="hidden" name="id" value={c.id} />
            <label>
              Name
              <input
                className="form-control"
                name="name"
                defaultValue={c.name}
                required
                maxLength={80}
              />
            </label>
            <label>
              Description
              <input
                className="form-control"
                name="description"
                defaultValue={c.description}
                maxLength={300}
              />
            </label>
            <label>
              Order
              <input
                className="form-control"
                name="display_order"
                type="number"
                defaultValue={c.display_order}
              />
            </label>
            <label className="checkbox-label">
              <input
                className="form-check-input"
                type="checkbox"
                name="published"
                defaultChecked={!!c.published}
              />{' '}
              Visible
            </label>
            <SubmitButton>Save</SubmitButton>
          </form>
          <details className="danger">
            <summary>{c.count} product(s) · delete</summary>
            <form action={deleteCategory}>
              <input type="hidden" name="id" value={c.id} />
              <SubmitButton
                className="btn btn-outline-danger"
                pendingLabel="Deleting…"
                confirmMessage={`Permanently delete the category “${c.name}”? Products must be moved or deleted first.`}
              >
                Delete {c.name}
              </SubmitButton>
            </form>
          </details>
        </div>
      ))}
    </>
  );
}
