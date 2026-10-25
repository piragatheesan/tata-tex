import Link from 'next/link';
import styles from './About.module.css';
export const metadata = {
  alternates: { canonical: '/about' },
  title: 'About Tata Tex',
  description:
    'Ready-made and custom uniforms for schools, workplaces and teams across Sri Lanka. Explore how Tata Tex can help with your uniform requirements.',
};
const services = [
  {
    title: 'Ready-made Uniforms',
    text: 'Explore uniforms and accessories for schools, workplaces and everyday needs.',
    href: '/products',
    action: 'Explore Products',
  },
  {
    title: 'Custom Orders',
    text: 'Discuss uniforms to match your preferred styles, colours, sizes and requirements.',
    href: '/contact?type=quote',
    action: 'Discuss Your Order',
  },
  {
    title: 'Bulk Enquiries',
    text: 'Request a quotation for your school, organisation or team.',
    href: '/contact?type=quote',
    action: 'Get a Quote',
  },
];
export default function About() {
  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="about-title">
        <img
          className={styles.heroImage}
          src="/images/about-story-hero.webp"
          alt="Tailors sewing navy uniforms in a sunlit workshop"
          width="1774"
          height="887"
          fetchPriority="high"
        />
        <div className={styles.heroFade} />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>OUR STORY</p>
            <h1 id="about-title">
              Uniforms made
              <br />
              with purpose.
            </h1>
            <p className={styles.description}>
              Ready-made and custom uniforms for schools, workplaces and teams across Sri Lanka.
            </p>
            <Link className={styles.primaryButton} href="/products">
              Explore Products
            </Link>
          </div>
        </div>
      </section>
      <section className={styles.offers} aria-label="How we can help">
        <div className="row g-4">
          {services.map((service, index) => (
            <div className="col-12 col-md-4" key={service.title}>
              <article className={styles.service}>
                <div
                  className={styles.serviceImage}
                  style={{ backgroundPosition: `${index * 50}% center` }}
                  aria-hidden="true"
                />
                <div className={styles.serviceCopy}>
                  <h2>{service.title}</h2>
                  <p>{service.text}</p>
                  <Link className={styles.outlineButton} href={service.href}>
                    {service.action}
                  </Link>
                </div>
              </article>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
