import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Splash from '@/components/Splash';

export const dynamic = 'force-dynamic'; // the menu reads categories from the database
export const metadata = {
  title: { default: 'Tata Tex – Uniforms and Accessories since 1983', template: '%s | Tata Tex' },
  description: 'Ready-made and custom uniforms and accessories for schools, hospitals, hotels, security, industries and institutions. Retail and wholesale.',
};

export default function SiteLayout({ children }) {
  return (
    <>
      <Splash />
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
