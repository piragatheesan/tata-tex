import { requireUser } from '@/lib/auth';
import Link from 'next/link';
import styles from '@/components/admin/Admin.module.css';
export default async function Settings() {
  const user = await requireUser();
  const configured = Boolean(process.env.SMTP_HOST && process.env.MAIL_TO);
  const fields = [
    ['SMTP server', process.env.SMTP_HOST || 'Not configured'],
    ['Port', process.env.SMTP_PORT || '587'],
    ['Sender', process.env.MAIL_FROM || process.env.SMTP_USER || 'Not configured'],
    ['Notifications sent to', process.env.MAIL_TO || 'Not configured'],
    ['SMTP password', process.env.SMTP_PASS ? 'Saved securely (hidden)' : 'Not configured'],
  ];
  return (
    <div className={styles.dashboard}>
      <header className={styles.heading}>
        <div>
          <h1>Settings</h1>
          <p>Account and enquiry notifications.</p>
        </div>
      </header>
      <div className="row g-4">
        <div className="col-12 col-lg-4">
          <section className="card">
            <div className="card-body">
              <h2 className="card-title">My account</h2>
              <p>
                Signed in as <strong>{user.username}</strong> ({user.role}).
              </p>
              <Link
                className={`btn btn-primary ${styles.settingsButton}`}
                href="/admin/users#change-password"
              >
                Change password
              </Link>
            </div>
          </section>
        </div>
        <div className="col-12 col-lg-8">
          <section className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="card-title">Email setup</h2>
                <span className={`${styles.badge} ${configured ? styles.green : styles.rose}`}>
                  {configured ? 'Configured' : 'Not configured'}
                </span>
              </div>
              <p>New enquiries are saved before notifications are sent to your team.</p>
              {user.role === 'administrator' ? (
                <>
                  <div className="table-responsive">
                    <table className="table">
                      <tbody>
                        {fields.map(([label, value]) => (
                          <tr key={label}>
                            <th scope="row">{label}</th>
                            <td>{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="alert alert-info" role="note">
                    Configuration is present when marked configured; delivery still needs a test
                    enquiry. Customer confirmation emails are not enabled.
                  </div>
                  <p>
                    To change these settings, update your private server environment or .env.local
                    file, then restart or redeploy. Passwords are never displayed here.
                  </p>
                </>
              ) : (
                <p>Contact your administrator to configure email delivery.</p>
              )}
              <Link className={`btn btn-outline-primary ${styles.settingsButton}`} href="/contact">
                Open contact form
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
