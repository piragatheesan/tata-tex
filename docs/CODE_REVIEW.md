# Supabase migration and code review

## Implemented

- Replaced local SQLite queries with asynchronous Supabase PostgreSQL reads/writes across every public/admin page and enquiry/export route.
- Replaced custom password hashing and login cookies with Supabase Auth email/password sessions and Next.js proxy refresh.
- Added database-backed pending/staff/administrator profiles; signup metadata cannot grant staff access.
- Kept explicit authentication before every protected page read and action. Admin-only operations also verify role.
- Added a server-only privileged Supabase client. Public catalogue reads exclude unpublished products/hidden categories and strip nonpublic prices before serialization.
- Added Supabase Storage uploads. New-image cleanup on a failed database save preserves the existing picture; old images are removed only after successful database changes.
- Added RLS, revoked direct browser table writes/reads of private records, and restricted import functions to the server role.
- Added database-backed login/enquiry rate limits with HMAC-hashed visitor addresses and server-only RPC permissions.
- Removed the optional API endpoint that returned customer enquiries using a shared API key.
- Added production CSP nonces and baseline security headers; production requests require trusted proxy configuration for rate limiting.
- Added database enforcement of unique codes/slugs, valid pricing, category foreign keys and last-administrator protection.
- Added an atomic initial seed/SQLite import with identity-sequence reset, plus a read-only SQLite export and first-administrator setup.
- Retained all 88 bundled images, responsive layout, readable formatting and the corrected category class expression.

## Validation

The production build and formatting checks pass. Automated tests exercise populated/selected category rendering, catalogue filters, bundled image references, rate-limit expiry/capacity, Supabase read authorization and public-price sanitization, failed-save cleanup, SQL signup role defaults, table/function grants, own-profile RLS, last-administrator protection, transactional import/rollback/identity counters and schema constraints.

SQL tests execute the schema in an isolated PostgreSQL-compatible PGlite engine with stand-in Auth and Storage schemas. Supabase application tests mock HTTP/client results. These checks establish source behaviour and PostgreSQL rules, not a successful connection to a real Supabase project.

## Setup still required

Create/configure your Supabase project, apply schema SQL, seed or import your catalogue, and create the first administrator. Verify actual email/password login, session refresh, Storage uploads, new enquiries, SMTP delivery and deployment after those steps. No live database credentials were supplied, so no remote project or customer data was altered.

Rate limiting depends on the production host replacing `X-Forwarded-For`; set `TRUST_PROXY=true` only after verifying that behavior. The CSP allows inline styles because this app uses React style attributes; it blocks inline scripts and permits the configured Supabase project origin plus Google Fonts. Existing Supabase access tokens can remain valid until expiry after password changes/sign-out of other sessions; revoked refresh tokens cannot renew them. User removal or role suspension is checked through live Auth/profile reads. SMTP is separate from Supabase and has no durable retry queue.

The original `since 1983` content remains unverified, and `lib/site.js` needs approved contact details. Bundled pictures are style examples; availability and pricing require confirmation.
