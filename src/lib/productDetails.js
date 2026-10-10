import { cleanText } from './catalog';

const splitList = (value) => cleanText(value).split(/\s*(?:\||;|,| {5})\s*/).filter(Boolean);

function familyFor(product) {
  const name = `${product?.Brand || ''} ${product?.Product_Name || ''} ${product?.Model_Number || ''}`.toLowerCase();
  if (/iphone\s*(?:15|16|17|18)(?:\s|$|-)/.test(name)) return 'iphone';
  if (/(?:samsung\s*)?(?:galaxy\s*)?s(?:25|26)(?:\s|$|-)/.test(name)) return 'galaxy';
  if (/(?:google\s*)?pixel\s*(?:9|10|11)(?:\s|$|-)/.test(name)) return 'pixel';
  if (/apple\s*watch/.test(name) && (/(?:series\s*)?(?:9|10|11|12)(?:\s|$|-)/.test(name) || /ultra\s*(?:2|3|4)/.test(name) || /\bse\s*(?:2|3)/.test(name))) return 'watch';
  return '';
}

const defaults = {
  iphone: {
    label: 'Inside the latest iPhone experience',
    intro: 'Built for an effortless Apple experience, with thoughtful hardware, capable cameras and seamless continuity across the devices you use every day.',
    highlights: ['Premium Apple design', 'Advanced camera experience', 'Fast, fluid performance', 'Apple ecosystem ready'],
    sections: [
      ['Display & design', 'A refined display and carefully considered enclosure make this iPhone comfortable for everyday viewing, creating and communication.'],
      ['Performance that feels immediate', 'Designed for responsive apps, smooth multitasking, demanding games and the intelligent features supported by this model and software version.'],
      ['A versatile camera system', 'Capture everyday moments, portraits and video with the camera tools available on this exact model. Ask our team to compare camera differences between the standard, Pro and Pro Max versions.'],
      ['Battery for your routine', 'Efficient hardware and iOS work together to balance performance and battery life. Actual endurance varies with signal, settings, battery health and use.'],
      ['Apple ecosystem', 'Move naturally between compatible Apple devices with services such as iCloud, AirDrop, continuity features and connected accessories.'],
      ['Built for the long term', 'Software support, privacy controls, accessibility features and a broad accessory ecosystem help make iPhone an enduring everyday choice.'],
    ],
  },
  galaxy: {
    label: 'Explore the new Galaxy S experience',
    intro: 'A flagship Galaxy experience shaped around a vivid display, flexible cameras, productive software and the premium performance expected from the S series.',
    highlights: ['Flagship Galaxy experience', 'Flexible camera tools', 'Productive multitasking', 'Connected Galaxy ecosystem'],
    sections: [
      ['Immersive display', 'A spacious Galaxy display makes photos, entertainment, navigation and daily tasks clear and engaging. Exact size and panel specifications depend on the selected S-series model.'],
      ['Flagship performance', 'Built for quick app launches, confident multitasking and demanding mobile experiences, with performance varying by model, memory and regional configuration.'],
      ['Camera creativity', 'Explore wide scenes, portraits, zoom and video with the camera system fitted to this model. Ultra models may offer different camera capabilities from other S-series versions.'],
      ['Battery & charging', 'Power management is designed around a full day of mixed use. Capacity, charging speed and supported accessories should be confirmed for the exact model.'],
      ['Galaxy productivity', 'Samsung software brings customisation, connected-device features and tools intended to help you work, create and communicate efficiently.'],
      ['Premium, connected design', 'Designed to sit at the centre of a Galaxy setup, connecting with compatible wearables, audio products, tablets and smart accessories.'],
    ],
  },
  pixel: {
    label: 'Meet the newest Pixel experience',
    intro: 'Google hardware and software come together in a clean Android experience, with computational photography and helpful intelligence at the centre.',
    highlights: ['Made by Google', 'Computational photography', 'Helpful software features', 'Clean Android experience'],
    sections: [
      ['Distinctive display & design', 'Pixel pairs a recognisable design with a display tuned for daily viewing. Dimensions and display capabilities vary across the standard, Pro and Pro XL models.'],
      ['Google-powered performance', 'Hardware and Android are designed together for responsive everyday work, intelligent features and smooth interaction across supported apps.'],
      ['Computational photography', 'Pixel camera tools combine capable hardware with Google image processing. Lens options and advanced controls depend on the exact model.'],
      ['Battery intelligence', 'Adaptive software helps manage power around how you use the phone. Real battery life depends on network, brightness, applications and settings.'],
      ['The latest Android experience', 'Enjoy Google services, privacy controls and feature updates in a cohesive interface, subject to the support policy for this exact device.'],
      ['Pixel ecosystem', 'Pair with compatible Pixel audio, watch and smart-home products for a more connected Google experience.'],
    ],
  },
  watch: {
    label: 'A closer look at Apple Watch',
    intro: 'A capable everyday companion for activity, communication and useful information at a glance, designed to work closely with a compatible iPhone.',
    highlights: ['Activity & workout tools', 'Useful notifications', 'Customisable watch faces', 'Apple ecosystem ready'],
    sections: [
      ['Designed for your wrist', 'A compact, customisable design keeps important information and controls within easy reach. Case materials, sizes and bands vary by model.'],
      ['Health & wellbeing', 'Apple Watch includes health and wellbeing features appropriate to the exact model and region. It is not a substitute for professional medical advice or equipment.'],
      ['Fitness & activity', 'Track supported workouts, activity trends and goals while using compatible apps and services to build a routine that fits you.'],
      ['Stay connected', 'See notifications, handle supported communications and access useful apps from your wrist. Cellular functions require a compatible model, carrier and plan.'],
      ['Battery & charging', 'Battery performance varies by model, battery health, settings and use. Confirm the included charging accessories and exact rated endurance before purchase.'],
      ['Made for the Apple ecosystem', 'Works with a compatible iPhone and supported Apple services, with features depending on hardware, watchOS version and region.'],
    ],
  },
};

export function getExtendedProductContent(product) {
  const family = familyFor(product);
  if (!family) return null;
  const preset = defaults[family];
  const customBodies = [
    product.Display_Details,
    product.Performance_Details,
    family === 'watch' ? product.Camera_Details?.replace(/^/, 'Health & fitness: ') : product.Camera_Details,
    product.Battery_Details,
    product.Connectivity_Details,
  ];
  const sections = preset.sections.map(([title, fallback], index) => ({
    title,
    body: cleanText(customBodies[index]) || fallback,
    image: product.images?.[index + 1] || '',
  }));
  const custom = Array.isArray(product.detailSections) ? product.detailSections : [];
  const gsmUrl = cleanText(product.GSM_Arena_URL) || (family === 'watch' ? '' : `https://www.gsmarena.com/results.php3?sQuickSearch=yes&sName=${encodeURIComponent(product.Product_Name)}`);
  return {
    family,
    label: preset.label,
    intro: product.Description || preset.intro,
    highlights: splitList(product.Highlights).length ? splitList(product.Highlights) : preset.highlights,
    sections: [...sections, ...custom],
    inTheBox: splitList(product.In_The_Box),
    gsmUrl,
  };
}
