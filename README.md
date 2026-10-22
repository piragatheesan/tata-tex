# Tata Tex — Supabase edition

A Next.js/React catalogue and enquiry website with Supabase PostgreSQL, Supabase Auth staff login, and Supabase Storage for new product pictures. The responsive design, 88 bundled photos and existing public/admin features are retained.

**Start with `docs/SUPABASE_SETUP.md`.** It walks through project keys, SQL setup, initial catalogue or SQLite import, first administrator, and deployment.

## Quick sequence

1. Create a Supabase project.
2. Configure `.env.local` using `.env.example`.
3. Run `supabase/schema.sql` in the Supabase SQL Editor.
4. Run `npm ci`, then either `npm run seed:supabase` or the SQLite import instructions.
5. Run `npm run setup:admin`.
6. Run `npm run dev` and visit `http://localhost:3000`.

Admin login: `http://localhost:3000/admin`, using the new Supabase **email/password** account.

## Useful commands

```powershell
npm ci
npm run seed:supabase
npm run setup:admin
npm run dev
npm test
npm run format:check
npm run build
```

Do not seed an existing populated catalogue. The import and seed functions require empty catalogue/enquiry tables and refuse to overwrite your existing records.

## Code map

| Edit                                                       | Location                                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| Home/About/Contact text and layouts                        | `app/(site)`                                                             |
| Design tokens, component styles and breakpoints            | `app/globals.css`                                                        |
| Approved business details                                  | `lib/site.js`                                                            |
| Search/filter behaviour                                    | `components/ProductBrowser.js`, `lib/catalogue.mjs`                      |
| Bundled photos and galleries                               | `lib/product-images.js`, `public/images`, `components/ProductGallery.js` |
| Server-only Supabase clients                               | `lib/supabase/admin.js`, `lib/supabase/server.js`                        |
| Database reads and public-price sanitization               | `lib/queries.js`                                                         |
| Staff changes, Supabase Auth login and user administration | `lib/actions.js`, `lib/auth.js`                                          |
| Remote picture uploads and cleanup                         | `lib/storage.js`                                                         |
| Auth-cookie refresh                                        | `proxy.js`                                                               |
| PostgreSQL schema and permissions                          | `supabase/schema.sql`                                                    |
| First administrator, seed and migration                    | `scripts`                                                                |

## Data and pictures

The website no longer uses `data/tatatex.db`. Products, categories, enquiries and staff profiles are in Supabase. Passwords/sessions are handled by Supabase Auth.

The 88 supplied photos remain in `public/images`, with mapping in `lib/product-images.js`. Admin-added photos go to the `product-images` Storage bucket. Uploaded photos override the bundled primary picture. The dashboard supports one uploaded photo per product; bundled galleries retain multiple pictures.

Public visitors browse products and send enquiries. There is no cart or payment processing. Enquiries are saved remotely; SMTP notifications are optional. The private server key is never included in a client component.

## Checks and limits

Tests cover product rendering, filtering, image mapping, rate limiting, Supabase query visibility/access checks, failed-save image cleanup and real PostgreSQL schema/permission/import behaviour in an isolated PGlite engine. Live Supabase Auth/Storage and browser checks require configuring your project first.

The application was built with Node.js 24.19.0. Tests use VM modules and may print a Node experimental warning. PGlite is a development-only test dependency; it is not the website database.

`lib/site.js` still needs approved contact details. Existing business-history claims were retained from the supplied source. Keep your old SQLite database and uploads until the migration has been verified.

See `docs/SUPABASE_SETUP.md` and `docs/CODE_REVIEW.md` for setup and validation details. No live project was connected, data migrated remotely, deployment made, or repository pushed during preparation.
