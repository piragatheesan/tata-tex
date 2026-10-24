'use client';
import Link from 'next/link';
export default function PageError({ reset }) {
  return (
    <section className="container section" role="alert">
      <h1>We couldn’t load this page.</h1>
      <p>Please try again. If the problem continues, contact Tata Tex.</p>
      <div className="button-row">
        <button className="btn btn-primary" onClick={reset}>
          Try again
        </button>
        <Link className="btn-outline" href="/contact">
          Contact us
        </Link>
      </div>
    </section>
  );
}
