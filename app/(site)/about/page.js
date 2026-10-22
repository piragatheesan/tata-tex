import Link from 'next/link';
import styles from './About.module.css';
export const metadata = { title: 'About Tata Tex' };
const services = [
  ['Ready-made Uniforms', 'Explore uniforms and accessories for schools, workplaces and teams.'],
  ['Custom Orders', 'Discuss your preferred styles, colours and sizes.'],
  ['Bulk Enquiries', 'Request a quotation for your organisation or team.'],
];
export default function About() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <img
          src="/about-workshop.png"
          alt="Tailors working with uniform fabric in a workshop"
          width="1536"
          height="1024"
        />
        <div>
          <p className="eyebrow">Made with care</p>
          <h1>Uniforms for work, school and every day.</h1>
          <p>Explore ready-made uniforms or talk with us about what your team needs.</p>
          <div className="button-row">
            <Link className="btn" href="/products">
              Explore Products
            </Link>
            <Link className="btn-outline" href="/contact?type=quote">
              Get a Quote
            </Link>
          </div>
        </div>
      </section>
      <section className={styles.offers}>
        <div className="section-heading">
          <h2>How we can help</h2>
          <p>Choose what works for you.</p>
        </div>
        <div className={styles.services}>
          {services.map(([title, text]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
