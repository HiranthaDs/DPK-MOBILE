# DPK Mobile React storefront

This is a Vite + React storefront backed by the `Products` tab in Google Sheets through Google Apps Script. A CORS-enabled CSV export pinned to the same tab is used if the Apps Script catalog route is temporarily unavailable.

## Run locally

```bash
npm install
npm run dev
```

Create a production build with `npm run build`. The output is written to `dist/`.

## Google Sheet setup

The Apps Script deployment configured by `VITE_GOOGLE_APPS_SCRIPT_URL` is the primary catalog source. `VITE_GOOGLE_SHEET_CSV_URL` must identify the same `Products` tab by its numeric `gid`; do not use a URL that defaults to the first tab.

The loader accepts the current schema:

- `Product_ID`
- `Data(json)` (product fields and `variants`)
- `Description`
- `Image_URL1` through `Image_URL8`
- `Timestampup`

It also accepts flat product columns such as `Product_Name`, `Brand`, `Product_Type`, `Price`, `Discount_Price`, `Status`, `Stock_Qty`, and `Warranty`.

Google Sheet `Description` content appears in the standard Product information section. The premium “A closer look” and “Everything worth knowing” presentation is intentionally independent from Google Sheet descriptions and detail fields: it appears only for recognized modern devices with a hardcoded, model-specific profile. Supported profiles include iPhone 15–18 families, Pixel 8–11 families, Galaxy S26 models, and selected recent watches and audio products.

## Large catalog behaviour

- CSV parsing moves to a web worker for larger files.
- Row normalization yields between batches so the UI stays responsive.
- Duplicate product IDs and malformed rows are removed safely.
- Search uses a prebuilt normalized search string and React deferred updates.
- Only the current 24-product page is mounted, so large catalogs do not create thousands of card elements at once.
- The last good catalog is cached in IndexedDB and shown while live stock refreshes. Changing the Apps Script deployment automatically selects a fresh cache namespace.
- Images use lazy loading, async decoding, and a safe fallback.

## Customer payment display

Payment figures are calculated from the current selling price (including the selected variant or active discount): bank transfer shows the original amount, card payment adds 3%, and Koko adds 12% before dividing the total into three monthly installments. These are display estimates; the team confirms the final amount before payment.

If Apps Script is unavailable or is still an older deployment, the website uses the configured CSV export for `gid=1048487281`, which is specifically the `Products` tab. It never reads `Sheet1`. Administrative writes still require the admin password.

## Connected product admin and Google Apps Script

The protected `/admin-key.html` product library creates, edits, and archives products in Google Sheets and saves product images in Google Drive. Copy [Code.gs](./Code.gs) into the Apps Script project connected to the catalog spreadsheet, then:

1. `SETUP_ADMIN_PASSWORD` is set to the requested initial password, `DPK@2026`. Change it before setup if you want a different password.
2. `SETUP_SPREADSHEET_ID` is pinned to `1xHhAE25eK0-6R0D0ggxfjhzYZ__pNwEY4A-yotVwPz4`, so reads and writes cannot drift to another spreadsheet.
3. Product administration and public catalog reads are locked to the tab named `Products`. `Sheet1` and `Audit Logs` are ignored.
4. `SETUP_IMAGE_FOLDER_ID` is already set to `1vOxlxz8vV1tZwqFTdAqXkI7xzklYB1DP`. The Google account that deploys the script must have edit access to that Drive folder.
5. Run `setupAdmin()` once and approve the requested Sheets and Drive access.
6. Deploy a new Web app version with **Execute as: Me** and **Who has access: Anyone**.
7. Add the deployment `/exec` URL as `VITE_GOOGLE_APPS_SCRIPT_URL` in `.env`, restart the Vite app, open `/admin-key.html`, and sign in with the same password.

`setupAdmin()` stores a SHA-256 password hash in Apps Script Properties, not the plain password. The browser keeps the authenticated password in `sessionStorage`, so signing out or ending the browser session clears it. Every management request is verified server-side. New product IDs are unique 16-letter random values and existing IDs remain permanent keys. Archive changes status inside `Data(json)` rather than deleting a row, making the operation recoverable. No admin audit sheet is created.

The simplified editor has four sections: Product, Options & price, Images, and Review. Only Product name, Product ID, Brand, Category, and Product type are required. Brand, category, product type, warranty, RAM, and storage are editable suggestion fields: admins can type a new value or choose a suggested value. Colour accepts any name and turns each Enter-separated value into a removable chip; colours are saved as one comma-separated value. AppleCare, AppleCare+, and Apple warranty suggestions are included. Price, stock, description, warranty, options, and images are optional and produce friendly, non-blocking review notices when omitted. Card price and Koko data are not collected or saved. Review shows desktop and mobile storefront previews before saving. The image step uploads up to eight JPG, PNG or WebP files (5 MB each) directly into the configured Drive folder.

Both the browser and Apps Script recursively sanitize writes. Every CRLF, CR, or LF in text is replaced with exactly five spaces before the row is written. Formula-like text is stored as text, writes are serialized with a script lock, and `Data(json)` is generated from the validated product record.

After editing `Code.gs`, use **Deploy → Manage deployments → Edit**, select **New version**, and deploy it. Update `.env` only if Google gives the deployment a new URL. The storefront reads the compact `Products` sheet through `?action=catalog`, so successful admin edits appear on subsequent storefront refreshes without waiting for the published CSV cache.

The admin portal is product-focused and does not include brand-library editing. Storefront brand logos and collection pages continue to work from the supplied assets in `public/assets/brands/`.
