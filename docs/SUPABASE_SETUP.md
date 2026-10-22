# Connect Tata Tex to Supabase

The source is migrated. A live Supabase project has not been created or connected yet; no existing database or customer records have been changed.

## 1. Create your project and configure keys

Create a Supabase project. From its Connect dialog or API settings, copy its project URL and publishable key. Obtain a server secret key (or the legacy `service_role` key) for the server's database/admin operations.

In PowerShell, from the extracted project directory:

```powershell
npm ci
Copy-Item .env.example .env.local
```

If `.env.local` already exists, edit it instead of overwriting it. Fill in:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR-PUBLISHABLE-KEY
SUPABASE_SECRET_KEY=YOUR-SERVER-SECRET-KEY
ADMIN_EMAIL=your-email@example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-new-password
```

Use a password of at least 10 characters. Keep the server secret in `.env.local` and your hosting environment only. Never prefix it with `NEXT_PUBLIC_`, commit it to Git, or paste it into a public message. `SUPABASE_SERVICE_ROLE_KEY` is also accepted as a legacy alternative to `SUPABASE_SECRET_KEY`.

Use Node.js 24 (tested) or a compatible Node.js 22 version. The application no longer needs a SQLite native binary or local writable database folder.

## 2. Create the database and storage bucket

Open the Supabase **SQL Editor**, paste the complete contents of `supabase/schema.sql`, and run it.

This creates:

- `categories`, `products`, `enquiries`, and `profiles` tables.
- A `product-images` Storage bucket, limited to JPG/PNG/WebP and 3 MB per upload.
- Role protection and row-level security.
- A private rate-limit table and server-only functions for shared login/enquiry limits.
- Transactional import/seed functions accessible only with the server key.

Use a new project/database for this migration. Do not run this schema over unrelated existing tables with the same names.

The raw product/enquiry tables are deliberately inaccessible to browser/public keys. Public pages read only published products through server code, and strip internal prices. Admin operations verify a Supabase Auth user and database role before using the server client. Signed-in users can read only their own profile directly; they cannot change its role.

For an existing Tata Tex database, run `supabase/security-hardening.sql` in the SQL Editor before deploying the security update. It adds only the private rate-limit table and its restricted server RPCs; it does not modify catalogue or enquiry rows.

The public storage bucket exposes product pictures, but browser upload/delete policies are not granted. Uploads go through authenticated server actions. All 88 original pictures remain bundled in `public/images`, so no extra image upload is required to use the initial catalogue.

## 3. Choose ONE catalogue setup route

### Fresh website using the supplied catalogue

```powershell
npm run seed:supabase
```

This inserts the supplied categories/products and keeps their slugs aligned with the bundled galleries. The operation is transactional and refuses to overwrite nonempty catalogue/enquiry tables.

### Preserve an existing SQLite website

Do not run the seed command. Keep a backup of your original `data` directory. Stop the old website before exporting so product/enquiry changes do not race with the export.

With Python installed:

```powershell
python scripts/export_sqlite.py "D:\Pyraxis\tatatex\tatatex-next\data\tatatex.db" "sqlite-export.json"
npm run migrate:sqlite -- "sqlite-export.json" "D:\Pyraxis\tatatex\tatatex-next\data\uploads"
```

If you moved the old website into another folder, adjust those paths. The export is read-only. It contains products, categories and customer enquiries; keep it private.

The import uploads existing administrator-added pictures to Supabase Storage and inserts the database records in one transaction. Existing IDs, codes, slugs, prices, category visibility and enquiry statuses are preserved. The tables must be empty. Original photos must be available before importing. If the upload step fails, fix the issue and retry against the still-empty database; uploads use the same names. A failed database transaction leaves no partially imported records, although uploaded files may remain in Storage.

SQLite staff passwords cannot be imported into Supabase Auth through this script. Recreate staff accounts with email addresses and new passwords. The source SQLite database is never deleted.

## 4. Create the first administrator

```powershell
npm run setup:admin
```

This uses the `ADMIN_EMAIL`, `ADMIN_USERNAME` and `ADMIN_PASSWORD` values from `.env.local`. It creates a confirmed email/password account and assigns the administrator role. It does not send an invitation email.

If an administrator already exists, the script refuses to create another. Use Admin → Users for additional staff. Supabase users created outside the script/dashboard start with `pending` access and cannot log into the dashboard until an administrator explicitly grants a role.

Remove `ADMIN_PASSWORD` from `.env.local` after setup. Disable public sign-ups in Supabase Auth settings because this site uses staff accounts only.

## 5. Run the website

```powershell
npm run dev
```

Open `http://localhost:3000`. Log in at `http://localhost:3000/admin` using your **email address**, rather than the old SQLite username.

Check: product browsing, category filters, admin login, a new product/photo upload, an enquiry appearing in the dashboard, and CSV export. Keep SMTP settings empty while testing if you do not want enquiry notification emails sent.

## 6. Deploy

Configure the Supabase URL, publishable key and server secret in your hosting project's environment variables, along with any SMTP settings. Build/start:

```powershell
npm run build
npm start
```

The app can use a Node-compatible host such as Vercel because products, enquiries and new uploads are remote. The bundled photos deploy with the source's public assets. Use HTTPS and set the Supabase Auth Site URL to `https://tatatex.com` (plus any `www` hostname you actually configure).

Supabase Auth cookies are refreshed by Next.js `proxy.js`; user and role checks also happen in the server pages/actions. Do not cache `/admin` responses publicly. Enquiry notification email still requires your separate SMTP configuration.

Login attempt counters and public enquiry limits use the shared Supabase database, so they work across application instances. The database stores only HMAC hashes of visitor addresses. For `tatatex.com`, set `TRUST_PROXY=true` only after confirming that your hosting proxy overwrites `X-Forwarded-For`; the app intentionally refuses rate-limited operations if that production setting is missing. Keep the Supabase secret key server-only. The former optional API endpoint that returned customer enquiries has been removed; staff should access enquiries through the authenticated admin panel.

Use HTTPS in production. The app sets anti-framing, MIME-sniffing, referrer, permissions and HSTS response headers. A strict Content Security Policy needs to be tested against the deployed Next.js scripts and configured font/image hosts before enforcement; do not paste in a generic policy that may break the site.

## Verification performed

The production build and automated source/schema tests can run without project keys. PostgreSQL schema tests use an isolated PGlite engine with mock Supabase Auth/Storage base tables. Application tests mock Supabase responses to exercise price visibility, access guards and failed-upload cleanup.

A live Supabase connection, real Auth session refresh, actual Storage upload/download, production hosting and real SMTP delivery still need verification after configuring your project. These were not claimed as tested without credentials. Production rate limiting also depends on correctly configuring the trusted proxy setting for the selected host.

## Official reference

- [Supabase server-side Auth clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Auth administrator account creation](https://supabase.com/docs/reference/javascript/auth-admin-createuser)
