import EnquiryForm from '@/components/EnquiryForm';
import { site } from '@/lib/site';

export const metadata = { title: 'Contact Us' };

export default async function Contact({ searchParams }) {
  const sp = await searchParams;
  const defaultType = sp.type === 'quote' ? 'Wholesale quotation' : 'General enquiry';
  return (
    <div className="w sec">
      <h1>Contact us</h1>
      <div className="pd">
        <div>
          <p><b>Address</b><br />{site.address}</p>
          <p><b>Telephone</b><br />{site.phone}</p>
          <p><b>Email</b><br />{site.email}</p>
          <p><b>Opening hours</b><br />{site.hours}</p>
        </div>
        <div><EnquiryForm defaultType={defaultType} /></div>
      </div>
    </div>
  );
}
