import EnquiryForm from '@/components/EnquiryForm';
import { site } from '@/lib/site';
export const metadata = { title: 'Contact us' };
export default async function Contact({ searchParams }) {
  const parameters = await searchParams;
  const defaultType = parameters.type === 'quote' ? 'Wholesale quotation' : 'General enquiry';
  const details = [
    ['Visit us', site.address],
    ['Call us', site.phone],
    ['Email us', site.email],
    ['Opening hours', site.hours],
  ].filter(([, value]) => value && !value.startsWith('['));
  return (
    <div className="container section">
      <div className="page-intro">
        <h1>Get in Touch</h1>
        <p>Tell us what you need. We’ll help you find the right uniforms.</p>
      </div>
      <div className="row g-4">
        <aside className="col-12 col-lg-5 contact-details">
          <h2>Ordering for a team?</h2>
          <p>
            Include your preferred products, sizes and quantities so we can understand your order.
          </p>
          {details.map(([label, value]) => (
            <div key={label}>
              <h3>{label}</h3>
              <p>{value}</p>
            </div>
          ))}
        </aside>
        <section className="col-12 col-lg-7 enquiry-panel">
          <h2>Send an enquiry</h2>
          <p className="muted">Fields marked * are required.</p>
          <EnquiryForm key={defaultType} defaultType={defaultType} />
        </section>
      </div>
    </div>
  );
}
