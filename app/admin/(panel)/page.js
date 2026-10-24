import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { getDashboardStats, getEnquiries, getProducts } from '@/lib/queries';
import { ProductImage } from '@/components/ProductCard';
import Banner from '@/components/admin/Banner';
import Icon from '@/components/admin/Icon';
import styles from '@/components/admin/Admin.module.css';

function received(value) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Colombo',
  }).format(new Date(value));
}
export default async function Dashboard({ searchParams }) {
  await requireUser();
  const [stats, enquiries, products, sp] = await Promise.all([
    getDashboardStats(),
    getEnquiries({ limit: 3 }),
    getProducts({ all: true }),
    searchParams,
  ]);
  const review = products.filter((product) => !product.published).slice(0, 3);
  const configured = Boolean(process.env.SMTP_HOST && process.env.MAIL_TO);
  const cards = [
    ['Products', stats.products, 'box', 'rose', '/admin/products'],
    ['Categories', stats.categories, 'tag', 'blue', '/admin/categories'],
    ['New enquiries', stats.enquiries, 'chat', 'green', '/admin/enquiries?status=New'],
    [
      'Awaiting reply',
      stats.awaitingReply,
      'clock',
      'amber',
      '/admin/enquiries?status=In%20Progress',
    ],
  ];
  return (
    <div className={styles.dashboard}>
      <header className={styles.heading}>
        <div>
          <h1>Dashboard</h1>
          <p>Manage your products and customer enquiries.</p>
        </div>
        <Link className={styles.primary} href="/admin/products/new">
          <Icon name="plus" />
          Add product
        </Link>
      </header>
      <Banner sp={sp} />
      <section className={styles.stats} aria-label="Store overview">
        {cards.map(([label, value, icon, tone, href]) => (
          <Link href={href} key={label} className={styles.stat}>
            <span className={`${styles.statIcon} ${styles[tone]}`}>
              <Icon name={icon} width="30" height="30" />
            </span>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          </Link>
        ))}
      </section>
      <div className={styles.dashboardGrid}>
        <section className={`${styles.panel} ${styles.recent}`}>
          <div className={styles.panelHeading}>
            <h2>Recent enquiries</h2>
            <Link className={styles.smallButton} href="/admin/enquiries">
              View all
            </Link>
          </div>
          {enquiries.length ? (
            <div className={styles.enquiries}>
              <div className={styles.tableHead}>
                <span>Customer</span>
                <span>Enquiry</span>
                <span>Status</span>
                <span>Received</span>
              </div>
              {enquiries.map((enquiry) => (
                <Link href="/admin/enquiries" key={enquiry.id} className={styles.enquiry}>
                  <strong>{enquiry.name}</strong>
                  <span className={styles.subject}>
                    {enquiry.product || enquiry.type || 'General enquiry'}
                  </span>
                  <span
                    className={`${styles.badge} ${enquiry.status === 'New' ? styles.rose : enquiry.status === 'Responded' || enquiry.status === 'Closed' ? styles.green : styles.blue}`}
                  >
                    {enquiry.status}
                  </span>
                  <time dateTime={enquiry.created_at}>{received(enquiry.created_at)}</time>
                </Link>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>No enquiries yet. Customer messages will appear here.</p>
          )}
        </section>
        <section className={`${styles.panel} ${styles.review}`}>
          <div className={styles.panelHeading}>
            <h2>Products to review</h2>
            <Link className={styles.smallButton} href="/admin/products">
              View all
            </Link>
          </div>
          {review.length ? (
            <div className={styles.productGrid}>
              {review.map((product) => (
                <article className={styles.product} key={product.id}>
                  <Link href={`/admin/products/${product.id}`} aria-label={`Edit ${product.name}`}>
                    <ProductImage p={product} height={195} />
                  </Link>
                  <h3>{product.name}</h3>
                  <Link className={styles.outline} href={`/admin/products/${product.id}`}>
                    <Icon name="edit" width="17" height="17" />
                    Edit
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>
              All products are published. Unpublished products will appear here for review.
            </p>
          )}
        </section>
        <section className={`${styles.panel} ${styles.quick}`}>
          <h2>Quick actions</h2>
          <div className={styles.actionList}>
            <Link className={styles.primary} href="/admin/products/new">
              <Icon name="plus" />
              Add product
            </Link>
            <Link className={styles.outline} href="/admin/categories">
              <Icon name="tag" />
              Manage categories
            </Link>
            <Link className={styles.outline} href="/admin/enquiries">
              <Icon name="chat" />
              View enquiries
            </Link>
          </div>
        </section>
        <section className={`${styles.panel} ${styles.email}`}>
          <div className={styles.emailTitle}>
            <Icon name="mail" />
            <div>
              <h2>Email setup</h2>
              <p>Send enquiry notifications to your team.</p>
            </div>
          </div>
          <div className={styles.emailRow}>
            <span>Shop notifications</span>
            <span className={`${styles.badge} ${configured ? styles.green : styles.rose}`}>
              {configured ? 'Configured' : 'Not configured'}
            </span>
          </div>
          <div className={styles.emailRow}>
            <span>Customer confirmations</span>
            <span className={`${styles.badge} ${styles.neutral}`}>Not enabled</span>
          </div>
          <Link className={styles.primary} href="/admin/settings">
            Set up email
          </Link>
        </section>
      </div>
    </div>
  );
}
