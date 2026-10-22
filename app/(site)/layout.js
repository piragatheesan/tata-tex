import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic'; // the menu reads categories from the database
export const metadata = {
  title: { default: 'Tata Tex – Uniforms and Accessories', template: '%s | Tata Tex' },
  description:
    'Ready-made and custom uniforms and accessories for schools, hospitals, hotels, security, industries and institutions. Retail and wholesale.',
};

export default function SiteLayout({ children }) {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  );
}
