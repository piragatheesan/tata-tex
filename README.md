# Tata Tex website (Next.js + admin dashboard)

Catalogue and enquiry website built with Next.js (Node.js) and React, with a staff admin dashboard and a SQLite database. No cart or payments.

## What it includes
**Public site:** home (building-photo hero), products (8 categories, search, product pages), About Us, Contact, enquiry forms (product enquiry, wholesale quotation, general), white-glass animated logo loading screen (click to skip), skeleton loading on product lists.

**Admin dashboard (`/admin`):**
- Login with username and password (sessions in a signed, HTTP-only cookie, 8 hours; 5 failed logins per address blocks login for 15 minutes).
- Dashboard: counts and latest enquiries.
- Products: add, edit, delete, search; code, category, description, specifications, price display (Contact for Price / Request a Wholesale Quotation / show the price), availability, photo upload (JPG, PNG or WebP up to 3 MB), published on/off.
- Categories: add, rename, reorder, hide, delete (only when empty).
- Enquiries: filter by status (New, In Progress, Awaiting Customer, Responded, Closed), internal notes, download as CSV, delete (administrators).
- Users: administrators add and delete staff or administrator accounts; everyone can change their own password.
- Roles: **administrator** (everything, including users) and **staff** (products, categories, enquiries).

Enquiries from the website are saved in the database and emailed to the business (Nodemailer, SMTP).

## Database choice: SQLite
The data is small (about 50 products, low write volume) and runs on one server, so SQLite (via `better-sqlite3`, WAL mode) fits: nothing extra to install or pay for, and a backup is a file copy. Move to PostgreSQL later if you need several servers writing at once, serverless hosting, or a managed database. Migrating is mostly mechanical because the tables are plain SQL (`lib/db.js`).

## Requirements
Node.js 20.9 or newer (22 LTS recommended; 24 also works). The database library (`better-sqlite3` 12) ships ready-made Windows, macOS and Linux binaries for Node 20, 22 and 24, so no compiler is needed.

## About npm warnings
- **"allow-scripts ... better-sqlite3"**: newer npm versions list packages that run install scripts. `package.json` already approves `better-sqlite3` (it needs its install script to fetch its database binary), so this is only information. To check the database library works, run `node -e "new (require('better-sqlite3'))(':memory:'); console.log('database library OK')"`.
- **`npm audit`**: this version uses Next.js 16, React 19 and a current Nodemailer, and reports 0 known vulnerabilities at the time it was built. Run `npm audit` again before going live and keep packages updated (`npm update`).

## If `npm install` fails
- **"No prebuilt binaries found" / "Could not find any Visual Studio installation"**: you are on a Node version without a ready-made binary (very new or very old). Install Node 22 LTS from nodejs.org, then delete the `node_modules` folder, and run `npm install` again.
- **"EPERM: operation not permitted, rmdir ..." warnings**: Windows or antivirus is locking files. Close VS Code and other terminals, delete the `node_modules` folder, pause real-time antivirus for the project folder (or add it as an exclusion), keep the project outside OneDrive, and run `npm install` again.

## Run it
```
npm install
cp .env.example .env.local     # then edit .env.local (Windows: copy the file and rename it)
npm run dev                     # http://localhost:3000   (admin: http://localhost:3000/admin)
```
In `.env.local` set `ADMIN_USERNAME` and `ADMIN_PASSWORD` (creates the first administrator the first time the site starts) and `SESSION_SECRET` (a long random string, for example from `openssl rand -hex 32`). After the first start you can remove `ADMIN_PASSWORD` from the file.

Production:
```
npm run build
npm start                       # port 3000 (set PORT to change)
```
Login cookies are HTTPS-only in production. Put the site behind HTTPS (Nginx, Caddy or your host). If you run production mode over plain http on a private network, set `COOKIE_SECURE=false`.

## Email setup (Gmail example)
Turn on 2-step verification, create an App Password, then set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER` and `MAIL_FROM` (that account), `SMTP_PASS` (the app password) and `MAIL_TO` (where enquiries should arrive). With `SMTP_HOST` empty, emails are only printed in the server log. Enquiries are saved even if the email fails.

## Where to edit
- Admin dashboard: products, categories, photos, prices, enquiries, users.
- `lib/site.js`: phone, email, address, opening hours (still `[PHONE]`, `[EMAIL]`, `[ADDRESS]`, `[HOURS]`).
- `app/(site)/about/page.js`: About Us text. `app/(site)/page.js`: home page. `app/globals.css`: styling.
- `public/logo.png`, `public/hero.jpg`: logo and hero photo.
- `lib/seed.js`: the starting catalogue, loaded only the first time (when the database is empty).

## Data and backups
Everything is in the `data/` folder: `tatatex.db` (database) and `uploads/` (product photos). Back it up regularly. For a safe copy while the site is running: `sqlite3 data/tatatex.db ".backup 'backup.db'"`, then copy `backup.db` and `data/uploads/`.

## Deploy
Use a server with Node.js and a writable disk (a VPS, or a Node host with persistent storage). Serverless hosts such as Vercel do not keep the database file or uploads. Run it with `pm2` (or a systemd service) behind Nginx or Caddy with HTTPS. Keep `.env.local` private.

## Security notes
Passwords are hashed with scrypt; admin pages and every admin action check the login on the server; uploads are checked for type, size and file signature; CSV export neutralises spreadsheet formulas; enquiry forms have a spam trap and a per-address limit (kept in memory, per server process).

## Not included yet
Multiple photos per product, drag-and-drop ordering, password reset by email, audit log, Sinhala/Tamil versions, sitemap and analytics. Product codes (TT-001...) were auto-numbered at the start; change them in the dashboard.
