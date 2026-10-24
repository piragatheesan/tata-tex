'use client';
import Link from 'next/link';
export default function AdminError({ reset }) {
  return (
    <section className="alert alert-danger" role="alert">
      <h1>Unable to load this page</h1>
      <p>Your changes may not have been saved. Retry, or return to the dashboard.</p>
      <div className="button-row">
        <button className="btn btn-primary" onClick={reset}>
          Try again
        </button>
        <Link className="btn btn-outline-primary" href="/admin">
          Dashboard
        </Link>
      </div>
    </section>
  );
}
