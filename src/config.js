export const CONFIG = {
  csvUrl:
    import.meta.env.VITE_GOOGLE_SHEET_CSV_URL ||
    'https://docs.google.com/spreadsheets/d/1xHhAE25eK0-6R0D0ggxfjhzYZ__pNwEY4A-yotVwPz4/export?format=csv&gid=1048487281',
  whatsapp: '94773852437',
  phone: '0773852437',
  email: 'info@dpkmobiles.com',
  locations: [
    'EL 15/1, Ground Floor, Realty Plaza, Ja-Ela 11350',
    'No. 53, Colombo Road, Kandana',
  ],
  pageSize: 24,
  cacheMaxAge: 24 * 60 * 60 * 1000,
  adminApiUrl:
    import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL ||
    'https://script.google.com/macros/s/AKfycbwB24_AcbnX0Lc8Mla1lYbWUMC-K7MNfWZsCTiWrPplB5V7Lsj_4gwDdLfI2hPFdZIe/exec',
};

export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
    <rect width="800" height="800" fill="#f5f6fc"/>
    <rect x="275" y="120" width="250" height="470" rx="55" fill="#000092"/>
    <rect x="292" y="140" width="216" height="430" rx="42" fill="#fff"/>
    <circle cx="400" cy="350" r="82" fill="#000092" fill-opacity=".06"/>
    <path d="M355 350h90M400 305v90" stroke="#cc0033" stroke-width="13" stroke-linecap="round"/>
    <text x="400" y="680" text-anchor="middle" font-family="Arial" font-size="25" font-weight="700" fill="#687089" letter-spacing="7">DPK MOBILE</text>
  </svg>`);
