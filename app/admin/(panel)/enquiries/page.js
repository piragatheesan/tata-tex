import SubmitButton from '@/components/admin/SubmitButton';
import Link from 'next/link';
import { getEnquiries } from '@/lib/queries';
import { requireUser } from '@/lib/auth';
import { STATUSES } from '@/lib/ui';
import { updateEnquiry, deleteEnquiry } from '@/lib/actions';
import Banner from '@/components/admin/Banner';

export default async function AdminEnquiries({ searchParams }) {
  const user = await requireUser();
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status) ? sp.status : '';
  const page = Math.max(0, Math.min(100000, Math.trunc(Number(sp.page)) || 0));
  const results = await getEnquiries({ status, limit: 51, offset: page * 50 });
  const rows = results.slice(0, 50);
  const isAdmin = user.role === 'administrator';
  const pageUrl = (number) =>
    `/admin/enquiries?page=${number}${status ? `&status=${encodeURIComponent(status)}` : ''}`;
  const back = pageUrl(page);
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
        <a className="btn btn-primary" href="/admin/enquiries/export">
          Download CSV
        </a>
      </div>
      {rows.length ? (
        rows.map((e) => (
          <article key={e.id} className="surface-card enq-card">
            <p className="muted">
              #{e.id} ·{' '}
              {new Intl.DateTimeFormat('en-GB', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'Asia/Colombo',
              }).format(new Date(e.created_at))}{' '}
              · {e.type}
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
                <select className="form-select" name="status" defaultValue={e.status}>
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Internal notes (never shown publicly)
                <input
                  className="form-control"
                  name="notes"
                  defaultValue={e.notes}
                  maxLength={2000}
                />
              </label>
              <SubmitButton>Save</SubmitButton>
            </form>
            {isAdmin ? (
              <details className="danger">
                <summary>Delete</summary>
                <form action={deleteEnquiry}>
                  <input type="hidden" name="id" value={e.id} />
                  <SubmitButton
                    className="btn btn-outline-danger"
                    pendingLabel="Deleting…"
                    confirmMessage={`Permanently delete enquiry #${e.id}?`}
                  >
                    Delete enquiry #{e.id}
                  </SubmitButton>
                </form>
              </details>
            ) : null}
          </article>
        ))
      ) : (
        <p className="muted">No enquiries found.</p>
      )}
      <nav className="toolbar" aria-label="Enquiry pages">
        {page > 0 ? (
          <Link className="btn btn-outline-primary" href={pageUrl(page - 1)}>
            Previous page
          </Link>
        ) : (
          <span />
        )}
        <span>Page {page + 1}</span>
        {results.length > 50 ? (
          <Link className="btn btn-outline-primary" href={pageUrl(page + 1)}>
            Next page
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </>
  );
}
