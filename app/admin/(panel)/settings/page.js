import { requireUser } from '@/lib/auth';
import Link from 'next/link';
import styles from '@/components/admin/Admin.module.css';
export default async function Settings() {
  const user = await requireUser();
  const configured = Boolean(process.env.SMTP_HOST && process.env.MAIL_TO);
  return (
    <div className={styles.dashboard}>
      <header className={styles.heading}>
        <div>
          <h1>Settings</h1>
          <p>Account and enquiry notifications.</p>
        </div>
      </header>
      <section className={styles.panel}>
        <h2>My account</h2>
        <p>
          Signed in as {user.username} ({user.role}).
        </p>
        <Link className={styles.outline} href="/admin/users">
          Change password
        </Link>
      </section>
      <section className={styles.panel}>
        <h2>Email setup</h2>
        <p>
          Shop notifications:{' '}
          <strong>
            {configured ? 'Configured — delivery has not been verified.' : 'Not configured.'}
          </strong>
        </p>
        <p>
          New enquiries are saved before notifications are sent. Customer confirmation emails are
          not enabled.
        </p>
        {user.role === 'administrator' ? (
          <>
            <p>
              Add your email provider’s SMTP settings to the server environment or your local
              .env.local file:
            </p>
            <pre className={styles.code}>
              {'SMTP_HOST=\nSMTP_PORT=587\nSMTP_USER=\nSMTP_PASS=\nMAIL_FROM=\nMAIL_TO='}
            </pre>
            <p>
              Restart or redeploy after updating these settings. Submit a test enquiry and check
              your inbox to verify delivery. Keep credentials private and out of Git.
            </p>
          </>
        ) : (
          <p>Contact your administrator to configure email delivery.</p>
        )}
      </section>
    </div>
  );
}
