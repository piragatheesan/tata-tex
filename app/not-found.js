import { connection } from 'next/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NotFoundContent from '@/components/NotFoundContent';

export default async function NotFound() {
  // Render per request so the production CSP nonce matches the page scripts.
  await connection();
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      <main id="main-content">
        <NotFoundContent />
      </main>
      <Footer />
    </>
  );
}
