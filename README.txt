Tata Tex: products page like the mockup (compact header, framed sidebar, small 5-column cards, tips, footer)

1. Copy these files over your project, replacing files with the same name:
   - components/ProductCard.js, ProductBrowser.js, ShopExtras.js, Footer.js, NavMenu.js
   - app/(site)/products/(list)/page.js and loading.js
   - lib/ui.js : only if you have NOT applied the earlier "products redesign" update. Its new contents are in ui.js.txt (copy it to lib/ui.js).
2. Open app/globals.css. Find the first line that starts with
      /* ---- products page
   Delete that line and EVERYTHING below it to the end of the file.
3. Open REPLACE-END-OF-app-globals.css.txt, copy all of it, and paste it at the end of app/globals.css.
4. Save, then press Ctrl+F5 in the browser.

Categories and products come from the database. Rename categories or add products in the admin dashboard.
