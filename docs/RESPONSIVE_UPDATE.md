# Responsive storefront update

This package updates the Supabase version of Tata Tex. It is based on the source available in this conversation, not a live copy of your Windows folder.

## Install on Windows

1. Stop the current development server with Ctrl+C and back up the project folder.
2. Extract this ZIP into a new folder. Open the inner `tatatex-next` folder, which contains `package.json`.
3. Copy your existing `.env.local` into that folder. Keep its keys private. If you have edited business details or added bundled assets locally, carry those changes across before switching projects.
4. In PowerShell in the new folder, run `npm ci`, then `npm run dev`.
5. Open http://localhost:3000 and check the public pages and admin login.

Your existing Supabase database and uploaded pictures stay in the same project. No SQL, seed, import or administrator setup is required for this design update. Dependencies have not changed. No secrets, local databases or exports are included.

## Changes

- Existing logo alone in header/footer; plain Lato navigation, active underline and one quote button.
- White background, navy text, burgundy pill actions, shorter homepage/About/Contact copy.
- Three-column desktop catalogue, two-column mobile cards and collapsible mobile filters. Search and sorting remain available outside collapsed filters.
- Product gallery with two desktop images where available, thumbnails, previous/next controls, touch swipe and native dialog zoom. Single and missing images have fallbacks.
- Product enquiry in a native dialog (bottom sheet on mobile) with product preselected. Native modal focus handling and Escape dismissal. Existing API payload and validation retained.
- Mobile fixed enquiry action, with reserved page space; expandable product information and related products.
- Existing product pricing and availability are retained. No invented variant options or generated mockup photos added. All original bundled photos remain.
- Desktop navigation is centered between the logo and quote button, with subtle hover states for navigation, cards, and interactive controls.
- The Tata Tex logo is used for the browser tab icon. A short branded loading screen appears on the first page view of each browser session.

## Verification

- Production build passed.
- 26 automated tests passed, including five added rendering tests for galleries, homepage and enquiry dialog.
- Prettier formatting check passed.
- Live Supabase calls, email delivery, actual dialog interaction, swipe interaction and browser visual layouts were not verified in this environment.

## Check locally

At desktop, tablet and phone widths, check navigation, category links, search, sorting and filters. Open a product with multiple photos and one with a single photo. Test zoom, keyboard Escape, enquiry dialog focus and successful submission. Verify the mobile sticky button does not cover the footer. Confirm the new enquiry appears in admin and that product editing/uploading still works. Lato is loaded through Google Fonts; Arial is the fallback if it cannot load.
