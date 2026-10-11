import { cleanText } from './catalog';

const OFFICIAL_PRODUCT_IMAGES = Object.freeze({
  iphone16: 'https://www.apple.com/v/iphone-16/h/images/meta/iphone-16_specs__bq5wb41xhdle_og.png?202610011920',
  iphone17: 'https://www.apple.com/v/iphone-17/i/images/meta/iphone-17_specs__bzlgip6v14mu_og.png?202609172011',
  iphone17e: 'https://www.apple.com/v/iphone-17e/e/images/meta/iphone17e_specs__b9s8kb5q7s5e_og.png?202609172011',
  iphoneAir: 'https://www.apple.com/v/iphone-air/i/images/meta/iphone-air_specs__tvk87wfx1oi2_og.png?202609172011',
  iphone18Pro: 'https://www.apple.com/v/iphone-18-pro/c/images/meta/iphone-18-pro_specs__cmwbqfe82cb6_og.png?202610011920',
  galaxyS26: 'https://image-us.samsung.com/us/smartphones/galaxy-s26/images/galaxy-s26-features-kv-mo.jpg?imbypass=true',
  galaxyS26Ultra: 'https://image-us.samsung.com/us/smartphones/galaxy-s26-ultra/images/galaxy-s26-ultra-features-kv-mo.jpg?imbypass=true',
  watchUltra3: 'https://www.apple.com/assets-www/en_WW/watch/01_og/watch_og_9cde5b638.png',
  watchSeries12: 'https://www.apple.com/v/apple-watch-series-12/b/images/meta/apple-watch-series-12__ep17epp8v16q_og.png?202609291712',
  airpodsPro: 'https://www.apple.com/v/airpods-pro/t/images/meta/og__c0ceegchesom_overview.png?202609132104',
});

function appleImageFor(sourceUrl) {
  if (sourceUrl.includes('iphone-18-pro')) return OFFICIAL_PRODUCT_IMAGES.iphone18Pro;
  if (sourceUrl.includes('iphone-17e')) return OFFICIAL_PRODUCT_IMAGES.iphone17e;
  if (sourceUrl.includes('iphone-17-pro')) return '';
  if (sourceUrl.includes('iphone-17')) return OFFICIAL_PRODUCT_IMAGES.iphone17;
  if (sourceUrl.includes('iphone-air')) return OFFICIAL_PRODUCT_IMAGES.iphoneAir;
  if (sourceUrl.includes('iphone-16-pro') || sourceUrl.includes('iphone-16e')) return '';
  if (sourceUrl.includes('iphone-16')) return OFFICIAL_PRODUCT_IMAGES.iphone16;
  return '';
}

const normalize = (value) => cleanText(value).normalize('NFKC').toLowerCase()
  .replace(/\+/g, ' plus ').replace(/\b5g\b/g, ' ').replace(/[^a-z0-9]+/g, ' ')
  .trim().replace(/\s+/g, ' ');

function profile({ family, maker, model, facts, highlights, box, sourceUrl, officialImageUrl = '', intro }) {
  return {
    family,
    maker,
    model,
    label: `Verified ${maker} specifications`,
    intro: intro || `Model-specific details for ${model}, based on the manufacturer’s published technical specifications.`,
    highlights,
    sections: facts.map(([title, body]) => ({ title, body })),
    inTheBox: box,
    sourceUrl,
    officialImageUrl,
    sourceLabel: `View official ${maker} specifications`,
  };
}

function phone({ family, maker, model, display, performance, camera, battery, support, box, sourceUrl, officialImageUrl }) {
  return profile({
    family, maker, model, sourceUrl, officialImageUrl, box,
    highlights: [display.replace(/\.$/, ''), performance.split(/[,.]/)[0], camera.split(/[;,.]/)[0], battery.split(';')[0]],
    facts: [
      ['Display & design', display],
      ['Performance & memory', performance],
      ['Camera system', camera],
      ['Battery & charging', battery],
      ['Connectivity & durability', support],
    ],
  });
}

const APPLE_BOX = ['iPhone', 'USB-C Charge Cable (1 m)', 'Documentation'];
const appleSource = (slug) => `https://www.apple.com/${slug}/specs/`;
const iphone = (model, display, chip, camera, battery, support, source) => {
  const content = phone({
    family: 'iphone', maker: 'Apple', model, display,
    performance: `${chip}. Storage capacity depends on the selected product option.`,
    camera, battery, support, sourceUrl: source, box: APPLE_BOX,
    officialImageUrl: appleImageFor(source),
  });
  return {
    ...content,
    sections: [
      ...content.sections,
      { title: 'Face ID & security', body: 'Face ID uses the TrueDepth camera system for secure unlocking, account authentication and supported payments. Apple combines device encryption, permission controls and privacy protections built into iOS; specific services and payment features depend on the country, carrier and configured Apple Account.' },
      { title: 'Software & accessibility', body: 'iOS includes built-in features for vision, mobility, hearing, speech and cognitive access. Tools can include VoiceOver, Zoom, Magnifier, Voice Control, Switch Control, AssistiveTouch, closed captions, Live Speech, Type to Siri and Spoken Content. Availability depends on the iOS release, language and region supported by this model.' },
      { title: 'Location, calls & media', body: 'iPhone combines satellite positioning, cellular, Wi-Fi, Bluetooth and compass data for supported location services. FaceTime audio and video, Wi-Fi calling, Voice over LTE, Spatial Audio and common high-efficiency photo, audio and video formats are supported where the network, app and regional service permit them.' },
      { title: 'Compatibility & regional notes', body: 'Radio bands, SIM format, included accessories and certain emergency, satellite, payment or intelligence features differ by sales region. For imported stock, confirm the exact model number, physical-SIM or eSIM configuration, local carrier bands and warranty coverage with DPK Mobile before purchasing.' },
    ],
  };
};

const IPHONE_18_PRO_MAX = profile({
  family: 'iphone',
  maker: 'Apple',
  model: 'iPhone 18 Pro Max',
  sourceUrl: appleSource('iphone-18-pro'),
  officialImageUrl: OFFICIAL_PRODUCT_IMAGES.iphone18Pro,
  intro: 'A complete, model-specific guide to iPhone 18 Pro Max, presented as one continuous story with every important detail in view.',
  highlights: ['6.9-inch Super Retina XDR display', 'A20 Pro chip', '48MP Pro Fusion camera system', 'Up to 45 hours of video playback'],
  box: ['iPhone 18 Pro Max with iOS 27', 'USB-C Charge Cable (1 m)', 'Documentation'],
  facts: [
    ['Display & design', 'The 6.9-inch Super Retina XDR all-screen OLED display has a 2868-by-1320-pixel resolution at 460 ppi. It includes Dynamic Island, an Always-On display, ProMotion with adaptive refresh rates up to 120Hz, True Tone, P3 wide colour and HDR. Brightness reaches 1,000 nits typically, 1,600 nits for HDR and 3,000 nits outdoors, with a 1-nit minimum for comfortable low-light viewing.'],
    ['Performance & memory', 'The A20 Pro combines a 6-core CPU, a 7-core GPU with Neural Accelerators and dual 16-core Neural Engines. It supports hardware-accelerated ray tracing and powers demanding games, creative workflows and on-device intelligence. Storage choices are 256GB, 512GB, 1TB and 2TB; the exact capacity, colour and memory configuration available from DPK Mobile depends on the selected product option.'],
    ['Camera system', 'The 48MP Pro Fusion system includes a variable-aperture Main camera, a 48MP Ultra Wide and a 48MP 4x Telephoto with tetraprism design and 3D sensor-shift stabilisation. It also provides optical-quality 2x and 8x framing, a 16x optical-quality zoom range and digital zoom up to 40x. ProRAW, macro photography, Smart HDR 5, Night mode, Photographic Styles 3 and pro controls are included.'],
    ['Battery & charging', 'iPhone 18 Pro Max is rated for up to 30 hours of typical use, up to 45 hours of video playback and up to 40 hours of streamed video playback. Its built-in rechargeable lithium-ion battery can reach around 50 percent in 15 minutes with a compatible 60W-capable USB-C adapter. MagSafe and Qi2 wireless charging support up to 25W with suitable chargers and adapters sold separately.'],
    ['Connectivity & durability', 'The phone supports 5G, Gigabit LTE, Wi-Fi 7 with 2x2 MIMO, Bluetooth 6, Thread, NFC and second-generation Ultra Wideband. USB-C supports charging, DisplayPort and USB 3 data transfer up to 10Gb/s. The aluminium unibody uses Ceramic Shield 2 on the front and Ceramic Shield on the back, while IP68 testing covers water to six metres for up to 30 minutes under IEC 60529.'],
    ['Size, finish & capacity', 'The Pro Max body measures 163.4mm high, 78.0mm wide and 8.75mm deep, and weighs 249g. Apple lists Black, Silver, Glacier and Burgundy finishes. Every finish uses the same aluminium unibody construction, Ceramic Shield protection and 6.9-inch display. Capacity options run from 256GB through 2TB, so confirm the exact colour and storage combination shown in the variant selector before ordering.'],
    ['Video & front camera', 'Rear video recording reaches 4K Dolby Vision at up to 120 fps on the Fusion Main camera, with Cinematic mode up to 4K at 60 fps, ProRes, ProRes RAW, Apple Log 2, spatial video and Audio Mix tools. The 18MP Center Stage front camera offers autofocus, stabilised video, Dual Capture, 4K Dolby Vision up to 60 fps, ProRAW and automatic framing for supported video calls.'],
    ['Controls, sound & ports', 'Alongside the side and volume buttons, the Action button can open features such as Camera, Focus, Translate, Magnifier, Voice Memo or a custom Shortcut. Camera Control gives quick access to exposure, depth, zoom, cameras, styles and tone. The USB-C connector handles charging, displays and high-speed accessories, while built-in stereo speakers and multiple microphones support Spatial Audio recording, wind-noise reduction and clearer calls.'],
    ['Software, privacy & safety', 'iPhone 18 Pro Max ships with iOS 27 and supports Apple Intelligence and Siri AI where the required language, account and regional services are available. Face ID protects authentication and payments. Safety features include Crash Detection, Emergency SOS via satellite, Messages via satellite, Find My via satellite and roadside assistance in supported regions. Apple also provides app tracking controls and end-to-end encryption for iMessage and FaceTime.'],
    ['Sensors, location & compatibility', 'The sensor set includes Face ID hardware, LiDAR Scanner, barometer, high-dynamic-range gyro, high-g accelerometer, proximity sensing and dual ambient-light sensors. Precision dual-frequency GPS works with GLONASS, Galileo, QZSS, BeiDou and NavIC. This model uses dual eSIM rather than a physical SIM tray in the referenced specification, and band support or regional services can differ, so confirm the exact model number for Sri Lankan carrier compatibility.'],
    ['Main camera hardware', 'The 48MP Fusion Main camera uses a 24mm perspective, second-generation sensor-shift optical image stabilisation, full Focus Pixel coverage and selectable apertures of f/1.48, f/1.8, f/2.8 and f/4.0. It captures 24MP or 48MP high-resolution images and produces an optical-quality 12MP 2x view at 48mm. The default lens can be customised, while manual controls expose aperture, shutter speed, white balance and a live histogram.'],
    ['Ultra Wide, macro & panorama', 'The 48MP Fusion Ultra Wide uses a 13mm lens, f/2.2 aperture, 120-degree field of view and Hybrid Focus Pixels. It supports 24MP and 48MP output, 48MP macro photography and lens correction. Panorama capture reaches up to 63MP, while wide-colour capture, Live Photos, burst mode, automatic image stabilisation, geotagging and red-eye correction cover everyday shooting.'],
    ['Telephoto & zoom range', 'The 48MP Fusion Telephoto uses a 100mm 4x lens, f/2.8 aperture, tetraprism optics, Hybrid Focus Pixels and 3D sensor-shift stabilisation with autofocus. Sensor cropping also supplies an optical-quality 12MP 8x view at 200mm. Together with the 2x option and Ultra Wide, the system spans a 16x optical-quality range, with digital zoom available up to 40x.'],
    ['Computational photography', 'Photonic Engine, Deep Fusion and Smart HDR 5 combine multiple frames to improve texture, colour and dynamic range. The camera also provides Night mode, six Portrait Lighting effects, next-generation portraits with adjustable focus and depth, Photographic Styles 3, smart focus tracking, Spatial photos, an adaptive True Tone flash, Apple Reference Image and Apple ProRAW. Captured still formats include HEIF, JPEG and DNG.'],
    ['Professional rear video', 'The Main camera records 4K Dolby Vision at common cinematic and broadcast frame rates through 60 fps, plus 100 fps and 120 fps modes. Pro workflows include externally recorded ProRes up to 4K at 120 fps, ProRes RAW, Apple Log 2, Academy Color Encoding System support and genlock with compatible hardware. Cinematic mode reaches 4K Dolby Vision at 60 fps and offers editable cinematic effects.'],
    ['Action, slow motion & capture tools', 'Action mode reaches 2.8K Dolby Vision at 60 fps. Slow motion supports 1080p up to 240 fps and Main-camera 4K Dolby Vision up to 120 fps. Macro video, stabilised time-lapse up to 4K Dolby Vision, Night mode time-lapse, QuickTake up to 4K Dolby Vision at 60 fps, Spatial video and Dual Capture up to 4K Dolby Vision at 30 fps are also supported.'],
    ['Video stabilisation & sound', 'Video benefits from second-generation sensor-shift stabilisation on the Main camera and 3D sensor-shift stabilisation with autofocus on the Telephoto. Continuous autofocus, cinematic stabilisation, audio zoom and playback zoom are joined by four studio-quality microphones, stereo and Spatial Audio recording, wind-noise reduction and Audio Mix. Video can be stored as HEVC, H.264, ProRes or ProRes RAW.'],
    ['18MP Center Stage camera', 'The 18MP front camera has an f/1.9 aperture, Focus Pixel autofocus, Retina Flash and tap controls for zoom and rotation. Center Stage can automatically adjust framing for photos and video calls, while ultra-stabilised video and Dual Capture support more flexible recording. It also includes Night mode, Smart HDR 5, Deep Fusion, portraits, Photographic Styles 3, ProRAW, Animoji and Memoji.'],
    ['Front-camera video', 'Front video reaches 4K Dolby Vision at 24, 25, 30 or 60 fps, with 1080p Dolby Vision options at 25, 30 or 60 fps. Cinematic mode reaches 4K Dolby Vision at 30 fps, externally recorded ProRes reaches 4K at 60 fps, and ProRes RAW, Apple Log 2, time-lapse, 1080p slow motion at 120 fps, QuickTake, Spatial Audio and wind-noise reduction are supported.'],
    ['Cellular & wireless radios', 'Depending on model region, the phone supports sub-6GHz and millimetre-wave 5G with 4x4 MIMO, Gigabit LTE, legacy UMTS and GSM networks, Wi-Fi 7 with 2x2 MIMO, Bluetooth 6, Thread, NFC reader mode and Express Cards with power reserve. Apple wireless silicon includes the N1 networking chip, second-generation Ultra Wideband and, on listed models, the C2 cellular modem. Exact frequency bands vary by model number.'],
    ['Navigation & precise finding', 'Precision dual-frequency GPS works with GPS, GLONASS, Galileo, QZSS, BeiDou and NavIC constellations. The digital compass, Wi-Fi positioning, cellular positioning and iBeacon microlocation complement satellite navigation. Second-generation Ultra Wideband enables compatible precise-finding experiences, subject to device, country and regulatory availability.'],
    ['Action button & Camera Control', 'The Action button can be assigned to Silent Mode, Focus, Camera, Visual Intelligence, Flashlight, Voice Memo, music recognition, Translate, Magnifier, accessibility features, Controls or a Shortcut. Camera Control offers direct adjustment of exposure, depth, zoom, camera selection, photographic styles and tone, alongside the standard side and volume buttons.'],
    ['USB-C, displays & expansion', 'The USB-C connector supports charging, native DisplayPort output and USB 3 transfer speeds up to 10Gb/s with suitable cables and hardware. It can drive video mirroring or video output up to 4K HDR through supported USB-C display connections or an appropriate digital AV adapter. External storage can be used for supported high-data-rate recording workflows.'],
    ['MagSafe & wireless charging', 'MagSafe and Qi2 wireless charging reach up to 25W when paired with compatible power adapters and certified charging hardware. The rear system includes a magnet array, alignment magnet, accessory-identification NFC and magnetometer. Charging speed depends on the adapter, cable, charger, temperature and current battery level; accessories are sold separately unless the listing says otherwise.'],
    ['Face ID, Wallet & payments', 'TrueDepth technology in the Center Stage front camera powers Face ID. It can authorise device access, supported app sign-ins and contactless or online Apple Pay purchases. Express Cards can remain available with power reserve. Apple Cash, Apple Card and transit features are country-specific and should not be assumed available for every Sri Lankan account or imported regional model.'],
    ['Calling, playback & output', 'FaceTime supports video over cellular or Wi-Fi, 1080p FaceTime HD where available, Center Stage, SharePlay, screen sharing, portrait effects, Spatial Audio and voice-isolation modes. Audio playback covers formats such as AAC, MP3, Apple Lossless, FLAC and Dolby Atmos. Video playback supports HEVC, H.264, AV1, ProRes, Dolby Vision, HDR10-family formats and HLG, with supported 4K HDR AirPlay output.'],
    ['iOS, privacy & accessibility', 'The referenced model ships with iOS 27. Apple Intelligence and Siri AI integrate with supported apps while using on-device and privacy-focused processing where available. Accessibility options cover vision, mobility, hearing, speech and cognitive needs, including VoiceOver, Zoom, Magnifier, Voice Control, Switch Control, AssistiveTouch, Eye Tracking, captions, Personal Voice, Live Speech, Vocal Shortcuts and Spoken Content.'],
    ['Requirements & operating environment', 'Some functions require an Apple Account and internet access. Computer syncing requirements depend on macOS or Windows version and the available Finder, Apple Devices or iTunes workflow. Apple lists operation from 0 to 35 degrees Celsius, non-operating storage from -20 to 45 degrees Celsius, 5 to 95 percent non-condensing humidity and testing at altitudes up to 3,000 metres.'],
    ['Materials & environmental notes', 'Apple reports recycled content across the enclosure, battery and internal boards, including recycled aluminium, cobalt, lithium, gold, tin and rare-earth elements. Environmental percentages and carbon-impact statements come from Apple reporting for the referenced model and can use specific mass-balance or supply-chain accounting methods; consult the official product environmental report for definitions and the complete methodology.'],
  ],
});

const IPHONES = {
  '15': iphone('iPhone 15', '6.1-inch Super Retina XDR OLED display with Dynamic Island.', 'A16 Bionic chip', '48MP Main and 12MP Ultra Wide cameras, with a 2x optical-quality option.', 'Up to 20 hours of video playback; fast-charge capable to 50% in around 30 minutes with a 20W or higher adapter.', '5G, Wi‑Fi 6, Bluetooth 5.3, USB-C with USB 2 speeds, MagSafe and IP68 resistance.', appleSource('iphone-15')),
  '15-plus': iphone('iPhone 15 Plus', '6.7-inch Super Retina XDR OLED display with Dynamic Island.', 'A16 Bionic chip', '48MP Main and 12MP Ultra Wide cameras, with a 2x optical-quality option.', 'Up to 26 hours of video playback; fast-charge capable to 50% in around 35 minutes with a 20W or higher adapter.', '5G, Wi‑Fi 6, Bluetooth 5.3, USB-C with USB 2 speeds, MagSafe and IP68 resistance.', appleSource('iphone-15')),
  '15-pro': iphone('iPhone 15 Pro', '6.1-inch Super Retina XDR OLED with Always-On display, Dynamic Island, ProMotion up to 120Hz and a titanium frame.', 'A17 Pro chip', '48MP Main, 12MP Ultra Wide and 12MP 3x Telephoto cameras; ProRAW and ProRes are supported.', 'Up to 23 hours of video playback; fast-charge capable to 50% in around 30 minutes with a 20W or higher adapter.', '5G, Wi‑Fi 6E, Bluetooth 5.3, USB-C with USB 3 up to 10Gb/s, MagSafe and IP68 resistance.', appleSource('iphone-15-pro')),
  '15-pro-max': iphone('iPhone 15 Pro Max', '6.7-inch Super Retina XDR OLED with Always-On display, Dynamic Island, ProMotion up to 120Hz and a titanium frame.', 'A17 Pro chip', '48MP Main, 12MP Ultra Wide and 12MP 5x Telephoto cameras; ProRAW and ProRes are supported.', 'Up to 29 hours of video playback; fast-charge capable to 50% in around 35 minutes with a 20W or higher adapter.', '5G, Wi‑Fi 6E, Bluetooth 5.3, USB-C with USB 3 up to 10Gb/s, MagSafe and IP68 resistance.', appleSource('iphone-15-pro')),
  '16': iphone('iPhone 16', '6.1-inch Super Retina XDR OLED with Dynamic Island and Camera Control.', 'A18 chip with 6-core CPU and 5-core GPU', '48MP Fusion Main and 12MP Ultra Wide cameras, with 2x optical-quality telephoto and macro photography.', 'Up to 22 hours of video playback; MagSafe wireless charging up to 25W with supported accessories.', '5G, Wi‑Fi 7, Bluetooth 5.3, USB-C with USB 2 speeds and IP68 resistance.', appleSource('iphone-16')),
  '16-plus': iphone('iPhone 16 Plus', '6.7-inch Super Retina XDR OLED with Dynamic Island and Camera Control.', 'A18 chip with 6-core CPU and 5-core GPU', '48MP Fusion Main and 12MP Ultra Wide cameras, with 2x optical-quality telephoto and macro photography.', 'Up to 27 hours of video playback; MagSafe wireless charging up to 25W with supported accessories.', '5G, Wi‑Fi 7, Bluetooth 5.3, USB-C with USB 2 speeds and IP68 resistance.', appleSource('iphone-16')),
  '16e': iphone('iPhone 16e', '6.1-inch Super Retina XDR OLED display with Ceramic Shield front.', 'A18 chip with 6-core CPU and 4-core GPU', '48MP Fusion camera system with a 12MP 2x telephoto option and 4K Dolby Vision recording.', 'Up to 26 hours of video playback; fast-charge capable to 50% in around 30 minutes with a 20W or higher adapter.', '5G, Wi‑Fi 6, Bluetooth 5.3, USB-C with USB 2 speeds, Qi charging and IP68 resistance.', appleSource('iphone-16e')),
  '16-pro': iphone('iPhone 16 Pro', '6.3-inch Super Retina XDR OLED with Always-On display, Dynamic Island, ProMotion up to 120Hz and a titanium frame.', 'A18 Pro chip', '48MP Fusion Main, 48MP Ultra Wide and 12MP 5x Telephoto cameras; 4K Dolby Vision up to 120 fps is supported.', 'Up to 27 hours of video playback; MagSafe wireless charging up to 25W with supported accessories.', '5G, Wi‑Fi 7, Bluetooth 5.3, USB-C with USB 3 up to 10Gb/s and IP68 resistance.', appleSource('iphone-16-pro')),
  '16-pro-max': iphone('iPhone 16 Pro Max', '6.9-inch Super Retina XDR OLED with Always-On display, Dynamic Island, ProMotion up to 120Hz and a titanium frame.', 'A18 Pro chip', '48MP Fusion Main, 48MP Ultra Wide and 12MP 5x Telephoto cameras; 4K Dolby Vision up to 120 fps is supported.', 'Up to 33 hours of video playback; MagSafe wireless charging up to 25W with supported accessories.', '5G, Wi‑Fi 7, Bluetooth 5.3, USB-C with USB 3 up to 10Gb/s and IP68 resistance.', appleSource('iphone-16-pro')),
  '17': iphone('iPhone 17', '6.3-inch Super Retina XDR OLED with Always-On display, Dynamic Island, ProMotion up to 120Hz and up to 3,000 nits outdoor peak brightness.', 'A19 chip', '48MP Dual Fusion Main and Ultra Wide cameras, with 2x optical-quality telephoto and 48MP macro photography.', 'Up to 30 hours of video playback; fast charging and MagSafe wireless charging with supported accessories.', '5G, Wi‑Fi 7, Bluetooth 6, USB-C, MagSafe and IP68 resistance.', appleSource('iphone-17')),
  '17e': iphone('iPhone 17e', '6.1-inch Super Retina XDR OLED display with Ceramic Shield 2 front.', 'A19 chip with 6-core CPU and 4-core GPU', '48MP Fusion camera system with a 12MP 2x telephoto option and 4K Dolby Vision recording.', 'Up to 26 hours of video playback; fast-charge capable to 50% in around 30 minutes with a 20W or higher adapter.', '5G, Wi‑Fi 6, Bluetooth 5.3, USB-C with USB 2 speeds, MagSafe up to 15W and IP68 resistance.', appleSource('iphone-17e')),
  '17-pro': iphone('iPhone 17 Pro', '6.3-inch Super Retina XDR OLED with Always-On display, Dynamic Island and ProMotion up to 120Hz.', 'A19 Pro chip', '48MP Pro Fusion Main, Ultra Wide and Telephoto cameras, plus ProRAW and ProRes workflows.', 'Up to 33 hours of video playback; fast charging and MagSafe wireless charging with supported accessories.', '5G, Wi‑Fi 7, Bluetooth 6, USB-C with USB 3 up to 10Gb/s, MagSafe and IP68 resistance.', appleSource('iphone-17-pro')),
  '17-pro-max': iphone('iPhone 17 Pro Max', '6.9-inch Super Retina XDR OLED with Always-On display, Dynamic Island and ProMotion up to 120Hz.', 'A19 Pro chip', '48MP Pro Fusion Main, Ultra Wide and Telephoto cameras, plus ProRAW and ProRes workflows.', 'Up to 39 hours of video playback; fast charging and MagSafe wireless charging with supported accessories.', '5G, Wi‑Fi 7, Bluetooth 6, USB-C with USB 3 up to 10Gb/s, MagSafe and IP68 resistance.', appleSource('iphone-17-pro')),
  air: iphone('iPhone Air', '6.5-inch Super Retina XDR OLED with Always-On display, Dynamic Island, ProMotion up to 120Hz and a 5.64mm titanium design.', 'A19 Pro chip with 6-core CPU and 5-core GPU', '48MP Fusion camera with a 12MP 2x telephoto option; 18MP Center Stage front camera.', 'Up to 27 hours of video playback; MagSafe and Qi2 charging up to 20W.', '5G, Wi‑Fi 7, Bluetooth 6, USB-C with USB 2 speeds and IP68 resistance.', appleSource('iphone-air')),
  '18-pro': iphone('iPhone 18 Pro', '6.3-inch Super Retina XDR OLED with Always-On display, Dynamic Island, ProMotion up to 120Hz and an aluminum unibody.', 'A20 Pro chip with 7-core GPU and Dual 16-core Neural Engine', '48MP Pro Fusion Main, Ultra Wide and variable-aperture 4x Telephoto cameras, with an 8x optical-quality option.', 'Up to 36 hours of video playback; up to 50% charge in around 15 minutes with supported 60W-class charging.', '5G, Wi‑Fi 7, Bluetooth 6, USB-C with USB 3 up to 10Gb/s, MagSafe up to 25W and IP68 resistance.', appleSource('iphone-18-pro')),
  '18-pro-max': IPHONE_18_PRO_MAX,
};

const googlePhone = (model, display, chip, memory, camera, battery, support, sourceUrl) => phone({
  family: 'pixel', maker: 'Google', model, display,
  performance: `${chip}, ${memory} and Google’s Titan security coprocessor.`,
  camera, battery, support, sourceUrl,
  box: [model, '1 m USB-C to USB-C cable', 'SIM tool'],
});
const GOOGLE_SPECS = 'https://support.google.com/pixelphone/answer/7158570?hl=en';
const PIXELS = {
  '8': googlePhone('Pixel 8', '6.2-inch Actua OLED, 60–120Hz and up to 2,000 nits.', 'Tensor G3', '8GB RAM', '50MP wide and 12MP autofocus ultrawide cameras, with Super Res Zoom up to 8x.', 'Typical 4,575mAh battery with a 24+ hour claim, Qi charging and Battery Share.', 'IP68 resistance and seven years of OS, security and Pixel Drop updates.', GOOGLE_SPECS),
  '8a': googlePhone('Pixel 8a', '6.1-inch Actua OLED, up to 120Hz and up to 2,000 nits.', 'Tensor G3', '8GB RAM', '64MP wide and 13MP ultrawide cameras.', 'Typical 4,492mAh battery with a 24+ hour claim and Qi charging.', 'IP67 resistance and seven years of OS, security and Pixel Drop updates.', GOOGLE_SPECS),
  '8-pro': googlePhone('Pixel 8 Pro', '6.7-inch Super Actua LTPO OLED, 1–120Hz and up to 2,400 nits.', 'Tensor G3', '12GB RAM', '50MP wide, 48MP ultrawide and 48MP 5x telephoto cameras, with Super Res Zoom up to 30x.', 'Typical 5,050mAh battery with a 24+ hour claim, Qi charging and Battery Share.', 'IP68 resistance and seven years of OS, security and Pixel Drop updates.', GOOGLE_SPECS),
  '9': googlePhone('Pixel 9', '6.3-inch Actua OLED, 60–120Hz and up to 2,700 nits.', 'Tensor G4', '12GB RAM', '50MP wide and 48MP autofocus ultrawide cameras, with Super Res Zoom up to 8x.', 'Typical 4,700mAh battery; up to 55% in about 30 minutes with a supported charger.', 'IP68 resistance and seven years of OS, security and Pixel Drop updates.', GOOGLE_SPECS),
  '9-pro': googlePhone('Pixel 9 Pro', '6.3-inch Super Actua LTPO OLED, 1–120Hz and up to 3,000 nits.', 'Tensor G4', '16GB RAM', '50MP wide, 48MP ultrawide and 48MP 5x telephoto cameras; 42MP autofocus selfie camera.', 'Typical 4,700mAh battery with fast wired and wireless charging.', 'IP68 resistance and seven years of OS, security and Pixel Drop updates.', GOOGLE_SPECS),
  '9-pro-xl': googlePhone('Pixel 9 Pro XL', '6.8-inch Super Actua LTPO OLED, 1–120Hz and up to 3,000 nits.', 'Tensor G4', '16GB RAM', '50MP wide, 48MP ultrawide and 48MP 5x telephoto cameras; 42MP autofocus selfie camera.', 'Typical 5,060mAh battery with fast wired and wireless charging.', 'IP68 resistance and seven years of OS, security and Pixel Drop updates.', GOOGLE_SPECS),
  '10': googlePhone('Pixel 10', '6.3-inch Actua OLED, 60–120Hz and up to 3,000 nits.', 'Tensor G5', '12GB RAM', '48MP wide, 13MP ultrawide and 10.8MP 5x telephoto cameras, with Super Res Zoom up to 20x.', 'Typical 4,970mAh battery with a 24+ hour claim and Pixelsnap Qi2 up to 15W.', 'IP68 resistance and seven years of updates.', 'https://store.google.com/product/pixel_10_specs?hl=en-US'),
  '10-pro': googlePhone('Pixel 10 Pro', '6.3-inch Super Actua LTPO OLED, 1–120Hz and up to 3,300 nits.', 'Tensor G5', '16GB RAM', '50MP wide, 48MP ultrawide and 48MP 5x telephoto cameras, with Pro Zoom up to 100x.', 'Typical 4,870mAh battery with a 24+ hour claim and Pixelsnap Qi2 up to 15W.', '8K through Video Boost, IP68 resistance and seven years of updates.', 'https://store.google.com/product/pixel_10_pro_specs?hl=en-US'),
  '10-pro-xl': googlePhone('Pixel 10 Pro XL', '6.8-inch Super Actua LTPO OLED, 1–120Hz and up to 3,300 nits.', 'Tensor G5', '16GB RAM', '50MP wide, 48MP ultrawide and 48MP 5x telephoto cameras, with Pro Zoom up to 100x.', 'Typical 5,200mAh battery with a 24+ hour claim and Pixelsnap Qi2 up to 25W.', '8K through Video Boost, IP68 resistance and seven years of updates.', 'https://store.google.com/product/pixel_10_pro_specs?hl=en-US'),
  '11': googlePhone('Pixel 11', '6.3-inch Actua OLED, 60–120Hz and up to 3,000 nits.', 'Tensor G6', '12GB RAM', '48MP wide, 13MP ultrawide and 10.8MP 5x telephoto cameras, with Super Res Zoom up to 30x.', 'Typical 4,985mAh battery with a 30+ hour claim and Pixelsnap Qi2 up to 25W.', 'Titan M3 security, IP68 resistance and seven years of updates.', 'https://store.google.com/product/pixel_11_specs?hl=en-US'),
  '11-pro': googlePhone('Pixel 11 Pro', '6.3-inch Super Actua LTPO OLED, 1–120Hz and up to 3,600 nits.', 'Tensor G6', '12GB or 16GB RAM depending on storage', '50MP wide, 48MP ultrawide and 48MP 5x telephoto cameras, with Pro Zoom up to 120x.', 'Typical 4,850mAh battery with a 30+ hour claim and Pixelsnap Qi2.2 up to 25W.', 'Titan M3 security, IP68 resistance and seven years of updates.', 'https://store.google.com/product/pixel_11_pro_specs?hl=en-US'),
  '11-pro-xl': googlePhone('Pixel 11 Pro XL', '6.8-inch Super Actua LTPO OLED, 1–120Hz and up to 3,600 nits.', 'Tensor G6', '12GB or 16GB RAM depending on storage', '50MP wide, 48MP ultrawide and 48MP 5x telephoto cameras, with Pro Zoom up to 120x.', 'Typical 5,115mAh battery with a 30+ hour claim and Pixelsnap Qi2.2 up to 25W.', 'Titan M3 security, IP68 resistance and seven years of updates.', 'https://store.google.com/product/pixel_11_pro_specs?hl=en-US'),
};

const galaxy = (model, display, camera, battery, design, sourceUrl) => phone({
  family: 'galaxy', maker: 'Samsung', model, display,
  performance: '12GB RAM with flagship Galaxy performance. The processor varies by regional SKU, so imported stock should be confirmed by model number.',
  camera, battery, support: `${design} IP68 resistance; feature availability can vary by market and software version.`,
  box: [model, 'USB-C cable', 'SIM ejection pin'], sourceUrl,
  officialImageUrl: sourceUrl.includes('ultra') ? OFFICIAL_PRODUCT_IMAGES.galaxyS26Ultra : OFFICIAL_PRODUCT_IMAGES.galaxyS26,
});
const S26_SOURCE = 'https://www.samsung.com/us/smartphones/galaxy-s26/';
const GALAXY_S26 = {
  s26: galaxy('Galaxy S26', '6.3-inch Dynamic AMOLED 2X, 120Hz and up to 2,600 nits.', '50MP wide, 12MP ultrawide and 10MP 3x telephoto rear cameras; 12MP selfie camera.', 'Typical 4,300mAh battery with up to 30 hours of video playback.', '7.2mm body and 167g weight.', S26_SOURCE),
  's26-plus': galaxy('Galaxy S26+', '6.7-inch Dynamic AMOLED 2X, 120Hz and up to 2,600 nits.', '50MP wide, 12MP ultrawide and 10MP 3x telephoto rear cameras; 12MP selfie camera.', 'Typical 4,900mAh battery with up to 31 hours of video playback.', '7.3mm body and 190g weight.', S26_SOURCE),
  's26-ultra': galaxy('Galaxy S26 Ultra', '6.9-inch display with built-in Privacy Display and a 120Hz refresh rate.', '200MP wide, 50MP ultrawide, 50MP 5x telephoto and 10MP 3x telephoto rear cameras; 12MP selfie camera.', 'Typical 5,000mAh battery with up to 31 hours of video playback; up to 75% in about 30 minutes with supported charging.', '7.9mm body, 214g weight and an upgraded vapor chamber.', 'https://www.samsung.com/us/smartphones/galaxy-s26-ultra/'),
};

const wearable = (model, display, performance, health, battery, durability, sourceUrl) => profile({
  family: 'watch', maker: 'Apple', model, sourceUrl,
  officialImageUrl: sourceUrl.includes('ultra-3')
    ? OFFICIAL_PRODUCT_IMAGES.watchUltra3
    : sourceUrl.includes('series-12') ? OFFICIAL_PRODUCT_IMAGES.watchSeries12 : '',
  intro: `Model-specific details for ${model}. Health feature availability varies by region and is not a substitute for professional medical care.`,
  highlights: [display.split(',')[0], performance.split(',')[0], battery.split(';')[0], durability.split(';')[0]],
  facts: [['Display & design', display], ['Chip & controls', performance], ['Health & fitness tools', health], ['Battery & charging', battery], ['Durability & compatibility', durability]],
  box: [model, 'Band', 'Apple Watch Magnetic Fast Charger to USB-C Cable'],
});
const WATCHES = {
  'series-9': wearable('Apple Watch Series 9', '41mm or 45mm Always-On Retina LTPO OLED, up to 2,000 nits.', 'S9 SiP, 4-core Neural Engine, 64GB and Double Tap.', 'Electrical and third-generation optical heart sensors, temperature sensing, ECG, sleep stages and workout tracking; availability varies.', 'Up to 18 hours normal use or 36 hours in Low Power Mode; fast charging is supported.', 'WR50 swimproof and IP6X dust resistance; requires a compatible iPhone.', 'https://support.apple.com/en-us/111833'),
  'ultra-3': wearable('Apple Watch Ultra 3', '49mm Always-On Retina LTPO3 OLED, sapphire crystal and up to 3,000 nits.', 'S10 chip, 4-core Neural Engine, 64GB, Action button and dual-frequency GPS.', 'Electrical and optical heart sensors, temperature sensing, ECG, sleep and advanced workout tools; availability varies.', 'Up to 42 hours normal use or 72 hours in Low Power Mode; up to 80% in about 45 minutes.', '100m water resistance, diving to 40m, IP6X and a Grade 5 titanium case.', 'https://www.apple.com/apple-watch-ultra-3/specs/'),
  'series-12': wearable('Apple Watch Series 12', '42mm or 46mm Always-On Retina LTPO3 OLED, up to 2,000 nits.', 'S11 chip, 4-core Neural Engine, 64GB and wrist gestures.', 'Health Sensing System, ECG, temperature sensing, sleep score, heart-rate and fitness tools; availability varies.', 'Up to 24 hours normal use or 38 hours in Low Power Mode; up to 80% in about 30 minutes.', 'WR50 water and IP6X dust resistance; requires a compatible iPhone and software.', 'https://www.apple.com/apple-watch-series-12/specs/'),
};

const audio = (maker, model, sound, noise, battery, durability, compatibility, box, sourceUrl) => profile({
  family: 'audio', maker, model, sourceUrl,
  officialImageUrl: sourceUrl.includes('apple.com/airpods-pro') ? OFFICIAL_PRODUCT_IMAGES.airpodsPro : '',
  highlights: [sound.split(/[;,.]/)[0], noise.split(/[;,.]/)[0], battery.split(';')[0], durability.split(';')[0]],
  facts: [['Sound & driver system', sound], ['Noise control & calls', noise], ['Battery & charging', battery], ['Durability', durability], ['Compatibility', compatibility]],
  box,
});
const AUDIO = {
  'airpods-pro-2': audio('Apple', 'AirPods Pro 2', 'H2 chip, custom driver, Adaptive EQ and Personalized Spatial Audio.', 'Active Noise Cancellation, Transparency, Adaptive Audio and Conversation Awareness.', 'Up to 6 hours listening and up to 30 hours with the MagSafe USB-C case.', 'IP54 dust, sweat and water resistance for earbuds and case.', 'Full features require supported Apple hardware, software and accounts.', ['AirPods Pro 2', 'MagSafe Charging Case (USB-C)', 'Ear tips', 'USB-C cable'], 'https://support.apple.com/en-us/111834'),
  'airpods-4': audio('Apple', 'AirPods 4', 'H2 chip, custom driver, Adaptive EQ and Personalized Spatial Audio.', 'Voice Isolation supports clearer calls; ANC is available only on the AirPods 4 with ANC version.', 'Up to 5 hours listening and up to 30 hours with the USB-C case.', 'IP54 dust, sweat and water resistance for earbuds and case.', 'Full features require supported Apple hardware and software.', ['AirPods 4', 'USB-C Charging Case', 'Documentation'], 'https://support.apple.com/en-us/121203'),
  'airpods-pro-3': audio('Apple', 'AirPods Pro 3', 'Apple high-excursion driver, Adaptive EQ and Personalized Spatial Audio.', 'Active Noise Cancellation, Transparency and adaptive listening features.', 'Rechargeable earbuds with a MagSafe USB-C case supporting MagSafe, Qi and Apple Watch chargers.', 'IP57 dust, sweat and water resistance for earbuds and case.', 'Full features require supported Apple devices, software and accounts.', ['AirPods Pro 3', 'MagSafe Charging Case (USB-C)', 'Ear tips', 'USB-C cable'], 'https://www.apple.com/airpods-pro/specs/'),
  'galaxy-buds2-pro': audio('Samsung', 'Galaxy Buds2 Pro', 'Coaxial 2-way speaker and 24-bit Hi-Fi on compatible Galaxy devices.', 'ANC with three high-SNR microphones, Voice Detect and 360 Audio.', 'Up to 5 hours with ANC and up to 18 hours with the case.', 'IPX7 water resistance for the earbuds; the case is not water resistant.', 'Bluetooth 5.3; Samsung codec features require compatible Galaxy devices.', ['Galaxy Buds2 Pro', 'Charging case', 'Ear tips', 'USB cable'], 'https://www.samsung.com/in/audio-sound/galaxy-buds/galaxy-buds2-pro/'),
  'galaxy-buds4': audio('Samsung', 'Galaxy Buds4', 'Open fit with 11mm driver and 24-bit/96kHz SSC-UHQ on compatible Galaxy devices.', 'Adaptive ANC, six microphones, Super Clear Call and 360 Audio.', 'Up to 5 hours with ANC or 24 hours including the case.', 'IP54 dust and water resistance for the earbuds.', 'Bluetooth 6.1; high-resolution and AI features require compatible Galaxy devices.', ['Galaxy Buds4', 'Charging case', 'USB cable'], 'https://www.samsung.com/us/audio-sound/galaxy-buds4/'),
  'galaxy-buds4-pro': audio('Samsung', 'Galaxy Buds4 Pro', 'Enhanced 2-way speaker, dual amplifiers and 24-bit/96kHz SSC-UHQ on compatible Galaxy devices.', 'Adaptive ANC, six microphones, Super Clear Call and 360 Audio.', 'Up to 6 hours with ANC or 26 hours including the case.', 'IP57 dust and water resistance for the earbuds.', 'Bluetooth 6.1; high-resolution and AI features require compatible Galaxy devices.', ['Galaxy Buds4 Pro', 'Charging case', 'Ear tips', 'USB cable'], 'https://www.samsung.com/us/audio-sound/galaxy-buds4-pro/'),
  'pixel-buds-pro-2': audio('Google', 'Pixel Buds Pro 2', 'Tensor A1, custom 11mm driver and spatial audio on supported devices.', 'Silent Seal 2.0 ANC, Transparency and Conversation Detection.', 'Up to 8 hours with ANC or 30 hours with the case.', 'IP54 earbuds and IPX4 charging case.', 'Bluetooth 5.4; some features require a compatible Android device and Google Account.', ['Pixel Buds Pro 2', 'Wireless charging case', 'Ear tips'], 'https://store.google.com/us/product/pixel_buds_pro_2_specs?hl=en-US'),
};

function modelProfile(product) {
  const name = normalize(`${product?.Product_Name || ''} ${product?.Model_Number || ''}`);
  const category = normalize(`${product?.category || ''} ${product?.Product_Type || ''} ${product?.Category || ''}`);
  const isPhone = /\bmobile\b|\bphone\b|\bsmartphone\b/.test(category);
  if (isPhone) {
    if (/\biphone air\b/.test(name)) return IPHONES.air;
    const iphoneMatch = name.match(/\biphone\s*(15|16|17|18)\s*(pro max|pro|plus|e)?\b/);
    if (iphoneMatch) return IPHONES[[iphoneMatch[1], iphoneMatch[2]?.replace(/\s+/g, '-')].filter(Boolean).join('-')] || null;
    const pixelMatch = name.match(/\bpixel\s*(8|9|10|11)\s*(pro xl|pro|a)?\b/);
    if (pixelMatch) return PIXELS[[pixelMatch[1], pixelMatch[2]?.replace(/\s+/g, '-')].filter(Boolean).join('-')] || null;
    const s26Match = name.match(/\b(?:galaxy\s*)?s26\s*(ultra|plus)?\b/);
    if (s26Match) return GALAXY_S26[s26Match[1] ? `s26-${s26Match[1]}` : 's26'] || null;
  }
  if (/\bapple watch series 12\b/.test(name)) return WATCHES['series-12'];
  if (/\bapple watch ultra 3\b/.test(name)) return WATCHES['ultra-3'];
  if (/\bapple watch series 9\b/.test(name)) return WATCHES['series-9'];
  if (/\bairpods pro 3\b/.test(name)) return AUDIO['airpods-pro-3'];
  if (/\bairpods pro 2\b/.test(name)) return AUDIO['airpods-pro-2'];
  if (/\bairpods 4\b/.test(name)) return AUDIO['airpods-4'];
  if (/\bgalaxy buds 4 pro\b/.test(name)) return AUDIO['galaxy-buds4-pro'];
  if (/\bgalaxy buds 4\b/.test(name)) return AUDIO['galaxy-buds4'];
  if (/\bgalaxy buds 2 pro\b/.test(name)) return AUDIO['galaxy-buds2-pro'];
  if (/\bpixel buds pro 2\b/.test(name)) return AUDIO['pixel-buds-pro-2'];
  return null;
}

export function getExtendedProductContent(product) {
  return modelProfile(product);
}
