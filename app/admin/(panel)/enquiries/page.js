import Link from 'next/link';
import { getEnquiries } from '@/lib/queries';
import { getUser, requireUser } from '@/lib/auth';
import { STATUSES } from '@/lib/ui';
import { updateEnquiry, deleteEnquiry } from '@/lib/actions';
import Banner from '@/components/admin/Banner';

export default async function AdminEnquiries({ searchParams }) {
  await requireUser();
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status) ? sp.status : '';
  const rows = await getEnquiries({ status });
  const isAdmin = (await getUser())?.role === 'administrator';
  const back = '/admin/enquiries' + (status ? `?status=${encodeURIComponent(status)}` : '');
  return (
    <>
      <h1>Enquiries</h1>
      <Banner sp={sp} />
      <div className="toolbar">
        <div className="chips">
          <Link className={'chip' + (!status ? ' on' : '')} href="/admin/enquiries">
            All
          </Link>
          {STATUSES.map((s) => (
            <Link
              key={s}
              className={'chip' + (status === s ? ' on' : '')}
              href={`/admin/enquiries?status=${encodeURIComponent(s)}`}
            >
              {s}
            </Link>
          ))}
        </div>
        <a className="btn" href="/admin/enquiries/export">
          Download CSV
        </a>
      </div>
      {rows.length ? (
        rows.map((e) => (
          <article key={e.id} className="surface-card enq-card">
            <p className="muted">
              #{e.id} · {e.created_at} · {e.type}
            </p>
            <h3>{e.product}</h3>
            <p>
              <b>{e.name}</b> · {e.contact}
              {e.company ? ` · ${e.company}` : ''}
              {e.qty ? ` · Qty: ${e.qty}` : ''}
            </p>
            <p className="message-body">{e.message}</p>
            <form action={updateEnquiry} className="admin-form inline">
              <input type="hidden" name="id" value={e.id} />
              <input type="hidden" name="back" value={back} />
              <label>
                Status
                <select name="status" defaultValue={e.status}>
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Internal notes (never shown publicly)
                <input name="notes" defaultValue={e.notes} maxLength={2000} />
              </label>
              <button className="btn" type="submit">
                Save
              </button>
            </form>
            {isAdmin ? (
              <details className="danger">
                <summary>Delete</summary>
                <form action={deleteEnquiry}>
                  <input type="hidden" name="id" value={e.id} />
                  <button className="btn" type="submit">
                    Delete enquiry #{e.id}
                  </button>
                </form>
              </details>
            ) : null}
          </article>
        ))
      ) : (
        <p className="muted">No enquiries found.</p>
      )}
    </>
  );
}
