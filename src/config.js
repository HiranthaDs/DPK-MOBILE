export const CONFIG = {
  siteUrl: 'https://dpkmobile.com',
  siteName: 'DPK Mobile',
  csvUrl:
    import.meta.env.VITE_GOOGLE_SHEET_CSV_URL ||
    'https://docs.google.com/spreadsheets/d/1xHhAE25eK0-6R0D0ggxfjhzYZ__pNwEY4A-yotVwPz4/export?format=csv&gid=1048487281',
  whatsapp: '94773852437',
  phone: '0773852437',
  phoneInternational: '+94773852437',
  email: 'info@dpkmobiles.com',
  stores: [
    {
      slug: 'ja-ela',
      town: 'Ja-Ela',
      name: 'DPK Mobile Ja-Ela',
      branch: 'Realty Plaza',
      streetAddress: 'EL 15/1, Ground Floor, Realty Plaza',
      postalCode: '11350',
      address: 'EL 15/1, Ground Floor, Realty Plaza, Ja-Ela 11350',
      latitude: 7.0753069,
      longitude: 79.8919249,
      mapQuery: 'DPK Mobile Realty Plaza Ja-Ela',
      embed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3959.436312595959!2d79.89192489999999!3d7.075306899999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae2f18bedc8831d%3A0xf7dbde8ef3d4785a!2sDPK%20MOBILE!5e0!3m2!1sen!2slk!4v1791637215391!5m2!1sen!2slk',
    },
    {
      slug: 'kandana',
      town: 'Kandana',
      name: 'DPK Mobile Kandana',
      branch: 'Colombo Road',
      streetAddress: 'No. 53, Colombo Road',
      address: 'No. 53, Colombo Road, Kandana',
      latitude: 7.0469893,
      longitude: 79.897321,
      mapQuery: 'DPK Mobile 53 Colombo Road Kandana',
      embed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3959.6787165506894!2d79.89732099999999!3d7.046989300000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae2fb0617221809%3A0x3828b4d1c239b2bb!2sDPK%20Mobile!5e0!3m2!1sen!2slk!4v1791637245507!5m2!1sen!2slk',
    },
  ],
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
