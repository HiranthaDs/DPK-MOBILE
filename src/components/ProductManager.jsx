import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive, ArrowLeft, ArrowRight, Box, Check, CircleAlert, Copy,
  DollarSign, Eye, Image as ImageIcon, Layers3, LoaderCircle, Package, PackagePlus,
  Pencil, Plus, Save, Search, Sparkles, Trash2, UploadCloud, X,
} from 'lucide-react';
import SmartImage from './SmartImage';
import { CONFIG, PLACEHOLDER_IMAGE } from '../config';
import { archiveProductInSheet, saveProductToSheet, uploadProductImage } from '../lib/adminApi';
import { formatPrice, getPricing, numberFrom } from '../lib/catalog';
import { suppliedBrandNames } from '../lib/brandAssets';

const DRAFT_KEY = 'dpk-product-editor-draft-v5';
const IMAGE_FOLDER_URL = 'https://drive.google.com/drive/folders/1vOxlxz8vV1tZwqFTdAqXkI7xzklYB1DP';
const categories = ['Mobile', 'Accessories', 'Tablets', 'Laptops', 'Wearables', 'Other'];
const productTypes = [
  'Smartphone', 'Feature phone', 'Tablet', 'Laptop', 'Smartwatch', 'Fitness tracker',
  'Earbuds', 'Headphones', 'Speaker', 'Charger', 'Cable', 'Power bank', 'Adapter',
  'Phone case', 'Screen protector', 'Memory card', 'Microphone', 'Camera accessory', 'Other',
];
const warranties = [
  'No warranty', '3 months', '6 months', '1 year', '18 months', '2 years',
  'Manufacturer warranty', 'AppleCare', 'AppleCare+', '1 year Apple warranty',
];
const ramOptions = ['Not applicable', '1GB', '2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '18GB', '24GB', '32GB', '64GB'];
const storageOptions = ['Not applicable', '8GB', '16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'];
const colourOptions = [
  'Black', 'White', 'Blue', 'Navy', 'Green', 'Mint', 'Red', 'Pink', 'Purple', 'Violet',
  'Yellow', 'Orange', 'Gold', 'Silver', 'Grey', 'Graphite', 'Titanium', 'Natural Titanium',
  'Desert Titanium', 'Rose Gold', 'Cream', 'Beige', 'Brown', 'Clear',
];
const brandOptions = [...new Set([
  'Apple', 'Samsung', 'Google', 'Huawei', 'OPPO', 'vivo', 'OnePlus', 'realme', 'Nothing',
  'Motorola', 'Tecno', 'ZTE', 'Sony', 'Oraimo', ...suppliedBrandNames,
])].sort((a, b) => a.localeCompare(b));
const steps = [
  { id: 'basics', label: 'Product', icon: Package },
  { id: 'pricing', label: 'Options & price', icon: DollarSign },
  { id: 'media', label: 'Images', icon: ImageIcon },
  { id: 'review', label: 'Review', icon: Eye },
];

const blankVariant = () => ({ ram: '', rom: '', color: '', sku: '', price: '', discountPrice: '', stockQty: '' });
const blankProduct = () => ({
  Product_ID: '', Product_Name: '', Product_Type: '', Category: '', Brand: '', SKU: '', Model_Number: '',
  Condition: 'Brand New', Warranty: '', Status: 'Active', Featured: '', Description: '',
  images: [], variants: [blankVariant()],
});
const clean = (value) => String(value ?? '').trim();
const splitColours = (value) => [...new Set(clean(value).split(',').map((item) => item.trim()).filter(Boolean))];
const safeNumber = (value) => value === '' || value === null || value === undefined ? 0 : numberFrom(value);
const mergeOptions = (presets, values = []) => [...new Set([...presets, ...values.map(clean).filter(Boolean)])].sort((a, b) => a.localeCompare(b));
const randomLetterId = () => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else bytes.forEach((_, index) => { bytes[index] = Math.floor(Math.random() * 256); });
  return [...bytes].map((byte) => alphabet[byte % alphabet.length]).join('');
};
const uniqueRandomId = (existingIds = []) => {
  const existing = new Set(existingIds.map((item) => clean(item).toUpperCase()));
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = randomLetterId();
    if (!existing.has(candidate)) return candidate;
  }
  return randomLetterId();
};

function productToDraft(product) {
  if (!product) return blankProduct();
  const variants = product.variants?.length
    ? product.variants.map((item, index) => ({
      ...blankVariant(), ...item,
      price: item.price || '', discountPrice: item.discountPrice || '',
      stockQty: item.stockQty ?? (index === 0 ? product.Stock_Qty ?? '' : ''),
    }))
    : [{
      ...blankVariant(), sku: product.SKU || '', price: product.Price || '',
      discountPrice: product.Discount_Price || '', stockQty: product.Stock_Qty ?? '',
    }];
  return {
    ...blankProduct(), ...product,
    images: product.images?.length ? [...product.images] : [],
    variants,
  };
}

function loadRecoveredDraft() {
  try {
    const parsed = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    return parsed?.Product_Name || parsed?.Product_ID ? productToDraft(parsed) : null;
  } catch { return null; }
}

function normalizeVariant(item) {
  let price = safeNumber(item.price);
  let discountPrice = safeNumber(item.discountPrice);
  if (!price && discountPrice) { price = discountPrice; discountPrice = 0; }
  const hasStock = item.stockQty !== '' && item.stockQty !== null && item.stockQty !== undefined;
  return {
    ram: clean(item.ram),
    rom: clean(item.rom),
    color: splitColours(item.color).join(', '),
    sku: clean(item.sku),
    price,
    discountPrice: price > 0 && discountPrice > 0 && discountPrice < price ? discountPrice : 0,
    stockQty: hasStock ? Math.max(0, Math.floor(safeNumber(item.stockQty))) : null,
  };
}

function productPayload(draft) {
  const variants = draft.variants
    .filter((item) => [item.ram, item.rom, item.color, item.sku, item.price, item.discountPrice, item.stockQty].some((value) => clean(value)))
    .map(normalizeVariant);
  const priced = variants.filter((item) => item.price > 0);
  const cheapest = priced.reduce((best, item) => {
    const current = item.discountPrice || item.price;
    const bestCurrent = best ? best.discountPrice || best.price : Number.POSITIVE_INFINITY;
    return current < bestCurrent ? item : best;
  }, null);
  const stockIsKnown = variants.some((item) => item.stockQty !== null);
  return {
    Product_ID: clean(draft.Product_ID),
    Product_Name: clean(draft.Product_Name),
    Product_Type: clean(draft.Product_Type),
    Category: clean(draft.Category),
    Brand: clean(draft.Brand),
    SKU: clean(draft.SKU),
    Model_Number: clean(draft.Model_Number),
    Condition: clean(draft.Condition) || 'Brand New',
    Warranty: clean(draft.Warranty),
    Status: clean(draft.Status) || 'Active',
    Featured: clean(draft.Featured),
    Description: clean(draft.Description),
    Stock_Qty: stockIsKnown ? variants.reduce((total, item) => total + (item.stockQty || 0), 0) : null,
    Price: cheapest?.price || 0,
    Discount_Price: cheapest?.discountPrice || 0,
    images: draft.images.map(clean).filter(Boolean).slice(0, 8),
    variants,
  };
}

function validateDraft(draft) {
  const errors = {};
  if (!clean(draft.Product_Name)) errors.Product_Name = 'Product name is required.';
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{1,119}$/.test(clean(draft.Product_ID))) errors.Product_ID = 'Use 2-120 letters, numbers, dots, dashes or underscores.';
  if (!clean(draft.Brand)) errors.Brand = 'Brand is required.';
  if (!clean(draft.Category)) errors.Category = 'Category is required.';
  if (!clean(draft.Product_Type)) errors.Product_Type = 'Product type is required.';
  if (draft.images.some((item) => clean(item) && !/^https:\/\//i.test(clean(item)))) errors.images = 'Every image URL must start with https://.';
  draft.variants.forEach((item, index) => {
    const price = safeNumber(item.price);
    const offer = safeNumber(item.discountPrice);
    if (item.price !== '' && price < 0) errors[`variant-${index}`] = 'Prices cannot be negative.';
    if (offer > 0 && price > 0 && offer >= price) errors[`variant-${index}`] = 'Offer price must be lower than the regular price.';
    if (item.stockQty !== '' && (!Number.isInteger(Number(item.stockQty)) || Number(item.stockQty) < 0)) errors[`variant-${index}`] = 'Stock must be a whole number of 0 or more.';
  });
  return errors;
}

function optionalNotices(draft) {
  const notices = [];
  if (!clean(draft.Description)) notices.push('No description - the product page will show a short fallback message.');
  if (!draft.images.some((item) => clean(item))) notices.push('No image - the storefront placeholder will be used.');
  if (!draft.variants.some((item) => safeNumber(item.price) > 0 || safeNumber(item.discountPrice) > 0)) notices.push('No price - customers will see "Ask for price".');
  if (!draft.variants.some((item) => item.stockQty !== '')) notices.push('No stock quantity - availability will be shown as "Check availability".');
  if (!clean(draft.Warranty)) notices.push('No warranty information has been selected.');
  if (!draft.variants.some((item) => clean(item.ram) || clean(item.rom) || clean(item.color))) notices.push('No RAM, storage or colour options have been added.');
  return notices;
}

function Field({ label, error, help, wide, required, group = false, children }) {
  const Tag = group ? 'div' : 'label';
  return <Tag className={`product-field${wide ? ' product-field--wide' : ''}${error ? ' has-error' : ''}`}>
    <span>{label}{required && <b className="required-mark" aria-label="required"> *</b>}</span>
    {children}
    {error ? <small className="product-field__error"><CircleAlert size={13} />{error}</small> : help ? <small>{help}</small> : null}
  </Tag>;
}

function SuggestionInput({ value, onChange, options, placeholder = 'Type to search...', listId }) {
  return <>
    <input list={listId} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete="off" />
    <datalist id={listId}>{mergeOptions(options, [value]).map((item) => <option key={item} value={item} />)}</datalist>
  </>;
}

function ColourInput({ value, onChange, listId }) {
  const [entry, setEntry] = useState('');
  const selected = splitColours(value);
  const options = mergeOptions(colourOptions, selected);
  const add = (rawValue = entry) => {
    const additions = splitColours(rawValue);
    if (!additions.length) return;
    onChange([...new Set([...selected, ...additions])].join(', '));
    setEntry('');
  };
  const remove = (colour) => onChange(selected.filter((item) => item !== colour).join(', '));
  return <div className="colour-entry">
    <div className="colour-entry__control">
      <input aria-label="Colour" list={listId} value={entry} onChange={(event) => setEntry(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); add(); } }} placeholder="Type a colour and press Enter" autoComplete="off" />
      <datalist id={listId}>{options.map((colour) => <option key={colour} value={colour} />)}</datalist>
      <button type="button" onClick={() => add()} disabled={!clean(entry)}>Add</button>
    </div>
    {selected.length > 0 && <div className="colour-entry__chips">{selected.map((colour) => <span key={colour}>{colour}<button type="button" onClick={() => remove(colour)} aria-label={`Remove ${colour}`}><X size={11} /></button></span>)}</div>}
  </div>;
}

function ProductPreview({ draft, mobile = false }) {
  const payload = productPayload(draft);
  const variant = payload.variants.find((item) => item.stockQty === null || item.stockQty > 0) || payload.variants[0] || {};
  const pricing = getPricing(payload, payload.variants.length ? variant : null);
  const image = payload.images[0] || PLACEHOLDER_IMAGE;
  const soldOut = payload.Stock_Qty === 0 || variant.stockQty === 0 || /out of stock|sold out/i.test(payload.Status);
  const canBuy = !soldOut && pricing.current > 0;
  const stockText = soldOut ? 'Out of stock' : payload.Stock_Qty === null ? 'Check availability' : `${payload.Stock_Qty} in stock`;
  return <article className={`storefront-review-preview${mobile ? ' is-mobile' : ' is-desktop'}`}>
    <header><span>{mobile ? 'Mobile website' : 'Desktop website'}</span><small>{mobile ? '390 px preview' : 'Storefront product page'}</small></header>
    <div className="storefront-review-preview__browser"><div className="storefront-review-preview__bar"><i /><i /><i /><b>DPK MOBILE</b></div><div className="storefront-review-preview__page">
      <div className="storefront-review-preview__image"><SmartImage src={image} alternatives={payload.images} alt="Product storefront preview" /></div>
      <div className="storefront-review-preview__copy"><small>{payload.Category || 'Category'} / {payload.Brand || 'Brand'}</small><h3>{payload.Product_Name || 'Your product name'}</h3><p className="preview-product-id">{payload.Product_ID || 'PRODUCT-ID'} · {payload.Condition}</p><strong>{pricing.current ? formatPrice(pricing.current) : 'Ask for price'}</strong>{pricing.discounted && <del>{formatPrice(pricing.regular)}</del>}
        <p className="preview-stock"><span />{stockText}</p>
        {(variant.ram || variant.rom || variant.color) && <div className="preview-options">{variant.ram && <span>{variant.ram}</span>}{variant.rom && <span>{variant.rom}</span>}{splitColours(variant.color).map((colour) => <span key={colour}>{colour}</span>)}</div>}
        {payload.Warranty && <p className="preview-warranty">✓ {payload.Warranty}</p>}
        <p className="preview-description">{payload.Description || 'Contact our team for complete product details and availability.'}</p>
        <div className="preview-actions"><button type="button" disabled={!canBuy}>Add to cart</button><button type="button" disabled={!canBuy}>Buy now</button></div>
      </div>
    </div></div>
  </article>;
}

function BasicsStep({ draft, update, errors, isNew, choices, regenerateId }) {
  return <section className="product-step"><div className="product-step__intro"><Package size={20} /><div><h3>Product essentials</h3><p>Only the five fields marked with an asterisk are required. Everything else can be added later.</p></div></div><div className="product-form-grid">
    <Field label="Product name" error={errors.Product_Name} required wide><input autoFocus value={draft.Product_Name} onChange={(event) => update('Product_Name', event.target.value)} placeholder="e.g. Apple iPhone 16 Pro" /></Field>
    <Field label="Product ID" error={errors.Product_ID} required help={isNew ? 'A unique 16-letter ID is generated automatically.' : 'Permanent catalog key.'}><div className="product-id-input"><input value={draft.Product_ID} readOnly aria-readonly="true" /><button type="button" disabled={!isNew} onClick={regenerateId}><Sparkles size={14} /> New random ID</button></div></Field>
    <Field label="Brand" error={errors.Brand} required><SuggestionInput listId="product-brand-suggestions" value={draft.Brand} onChange={(value) => update('Brand', value)} options={choices.brands} placeholder="Type a brand" /></Field>
    <Field label="Category" error={errors.Category} required><SuggestionInput listId="product-category-suggestions" value={draft.Category} onChange={(value) => update('Category', value)} options={choices.categories} placeholder="Type a category" /></Field>
    <Field label="Product type" error={errors.Product_Type} required><SuggestionInput listId="product-type-suggestions" value={draft.Product_Type} onChange={(value) => update('Product_Type', value)} options={choices.productTypes} placeholder="Type a product type" /></Field>
    <Field label="Warranty"><SuggestionInput listId="product-warranty-suggestions" value={draft.Warranty} onChange={(value) => update('Warranty', value)} options={choices.warranties} placeholder="Type a warranty" /></Field>
    <Field label="Model number"><input value={draft.Model_Number} onChange={(event) => update('Model_Number', event.target.value)} placeholder="Optional" /></Field>
    <Field label="SKU"><input value={draft.SKU} onChange={(event) => update('SKU', event.target.value)} placeholder="Optional internal code" /></Field>
    <Field label="Condition"><select value={draft.Condition} onChange={(event) => update('Condition', event.target.value)}><option>Brand New</option><option>Used</option><option>Refurbished</option><option>Open Box</option></select></Field>
    <Field label="Publishing status"><select value={draft.Status} onChange={(event) => update('Status', event.target.value)}><option>Active</option><option>Draft</option><option>Out of stock</option><option>Archived</option></select></Field>
    <Field label="Storefront promotion"><select value={draft.Featured} onChange={(event) => update('Featured', event.target.value)}><option value="">Standard product</option><option value="Yes">Featured product</option><option value="New">New arrival</option><option value="Deal">Best deal</option></select></Field>
    <Field label="Description" help="Optional. This appears on the product page." wide><textarea rows="5" value={draft.Description} onChange={(event) => update('Description', event.target.value)} placeholder="Describe the product in clear, customer-friendly language." /></Field>
  </div></section>;
}

function PricingStep({ draft, update, errors }) {
  const setVariant = (index, field, value) => update('variants', draft.variants.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  const removeVariant = (index) => update('variants', draft.variants.length === 1 ? [blankVariant()] : draft.variants.filter((_, itemIndex) => itemIndex !== index));
  return <section className="product-step"><div className="product-step__intro"><DollarSign size={20} /><div><h3>Options, price and stock</h3><p>This entire step is optional. Add one row per combination; a row can contain several colours.</p></div></div><div className="variant-builder"><div className="variant-builder__heading"><div><Layers3 size={18} /><span><strong>Product options</strong><small>Prices are optional. Multiple colours are saved as a comma-separated value.</small></span></div><button type="button" onClick={() => update('variants', [...draft.variants, blankVariant()])}><Plus size={15} /> Add option</button></div>
    {draft.variants.map((variant, index) => <article className="variant-row" key={index}><header><strong>Option {index + 1}</strong><span>{variant.stockQty === '' ? 'Stock not set' : safeNumber(variant.stockQty) > 0 ? `${Math.floor(safeNumber(variant.stockQty))} in stock` : 'Out of stock'}</span><button type="button" onClick={() => removeVariant(index)} aria-label={`Remove option ${index + 1}`}><Trash2 size={15} /></button></header><div>
      <Field label="RAM"><SuggestionInput listId={`product-ram-suggestions-${index}`} value={variant.ram} onChange={(value) => setVariant(index, 'ram', value)} options={ramOptions} placeholder="Type RAM" /></Field>
      <Field label="Storage"><SuggestionInput listId={`product-storage-suggestions-${index}`} value={variant.rom} onChange={(value) => setVariant(index, 'rom', value)} options={storageOptions} placeholder="Type storage" /></Field>
      <Field label="Colour" group help="Type any colour name and press Enter. Add as many colours as needed."><ColourInput listId={`product-colour-suggestions-${index}`} value={variant.color} onChange={(value) => setVariant(index, 'color', value)} /></Field>
      <Field label="Variant SKU"><input value={variant.sku} onChange={(event) => setVariant(index, 'sku', event.target.value)} placeholder="Optional" /></Field>
      <Field label="Regular price (LKR)" error={errors[`variant-${index}`]} help="Optional"><input type="number" min="0" value={variant.price} onChange={(event) => setVariant(index, 'price', event.target.value)} placeholder="Optional" /></Field>
      <Field label="Offer price (LKR)" help="Optional"><input type="number" min="0" value={variant.discountPrice} onChange={(event) => setVariant(index, 'discountPrice', event.target.value)} placeholder="Optional" /></Field>
      <Field label="Stock quantity" error={errors[`variant-${index}`]} help="Leave empty when stock is unknown."><input type="number" min="0" step="1" value={variant.stockQty} onChange={(event) => setVariant(index, 'stockQty', event.target.value)} placeholder="Optional" /></Field>
    </div></article>)}
  </div></section>;
}

function MediaStep({ draft, update, errors, accessKey }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const removeImage = (index) => update('images', draft.images.filter((_, itemIndex) => itemIndex !== index));
  const makePrimary = (index) => update('images', [draft.images[index], ...draft.images.filter((_, itemIndex) => itemIndex !== index)]);
  async function upload(event) {
    const files = [...event.target.files];
    event.target.value = '';
    if (!files.length) return;
    const available = 8 - draft.images.length;
    if (available <= 0) { setUploadError('The gallery already has its maximum of eight images.'); return; }
    setUploading(true); setUploadError('');
    const uploaded = [];
    try {
      for (const file of files.slice(0, available)) {
        const result = await uploadProductImage(file, accessKey, draft.Product_ID || 'PRODUCT');
        uploaded.push(result.thumbnailUrl || result.url);
      }
      update('images', [...draft.images, ...uploaded].slice(0, 8));
      if (files.length > available) setUploadError(`Uploaded ${available} image${available === 1 ? '' : 's'}; the gallery limit is eight.`);
    } catch (error) {
      if (uploaded.length) update('images', [...draft.images, ...uploaded].slice(0, 8));
      setUploadError(`${error.message}${uploaded.length ? ` ${uploaded.length} earlier image${uploaded.length === 1 ? '' : 's'} finished uploading.` : ''}`);
    } finally { setUploading(false); }
  }
  return <section className="product-step"><div className="product-step__intro"><ImageIcon size={20} /><div><h3>Product images</h3><p>Images are optional and save directly to Google Drive. The first image is the storefront cover.</p><a className="drive-folder-link" href={IMAGE_FOLDER_URL} target="_blank" rel="noreferrer">Open Drive image folder <ArrowRight size={13} /></a></div></div>{errors.images && <p className="product-step-error"><CircleAlert size={15} />{errors.images}</p>}{uploadError && <p className="product-step-error" role="alert"><CircleAlert size={15} />{uploadError}</p>}<label className={`drive-upload-zone${uploading ? ' is-uploading' : ''}`}><input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading || draft.images.length >= 8} onChange={upload} /><span>{uploading ? <LoaderCircle className="spin" size={25} /> : <UploadCloud size={25} />}</span><strong>{uploading ? 'Uploading to Google Drive...' : 'Choose product images'}</strong><small>JPG, PNG or WebP · up to 5 MB each · {draft.images.length}/8 saved</small></label><div className="image-builder">{draft.images.map((image, index) => <article key={`${image}-${index}`}><div className="image-builder__preview"><SmartImage src={image || PLACEHOLDER_IMAGE} alternatives={draft.images} alt="" /></div><div><span>{index === 0 ? 'Primary image' : `Gallery image ${index + 1}`}</span><small>{index === 0 ? 'Shown on product cards and search results.' : 'Shown in the product gallery.'}</small>{index > 0 && <button type="button" className="image-make-primary" onClick={() => makePrimary(index)}>Make primary</button>}</div><button type="button" onClick={() => removeImage(index)} aria-label={`Remove image ${index + 1}`}><Trash2 size={15} /></button></article>)}</div>{!draft.images.length && <div className="builder-empty"><ImageIcon size={27} /><p>No product images yet</p><span>You can save now and add images later.</span></div>}</section>;
}

function ReviewStep({ draft, errors }) {
  const notices = optionalNotices(draft);
  const blocking = [...new Set(Object.values(errors))];
  return <section className="product-step review-step"><div className="product-step__intro"><Eye size={20} /><div><h3>Review the real storefront view</h3><p>Check both desktop and mobile previews. Optional gaps are clearly listed and will not stop saving.</p></div></div>
    {blocking.length > 0 ? <div className="review-errors"><CircleAlert size={20} /><div><strong>Complete the required information</strong><p>{blocking.join(' ')}</p></div></div> : <div className="review-ready"><Check size={18} /><div><strong>Required information is complete</strong><p>This product is ready to save to Google Sheets.</p></div></div>}
    {notices.length > 0 && <div className="smart-save-notice"><Sparkles size={19} /><div><strong>{notices.length} optional {notices.length === 1 ? 'detail is' : 'details are'} missing</strong><p>You can still save. The storefront will use sensible fallbacks.</p><ul>{notices.map((notice) => <li key={notice}>{notice}</li>)}</ul></div></div>}
    <div className="storefront-review-grid"><ProductPreview draft={draft} /><ProductPreview draft={draft} mobile /></div>
  </section>;
}

function ProductEditor({ product, isNew, accessKey, choices, existingIds, onClose, onSaved }) {
  const dialog = useRef(null);
  const recovered = isNew && !product ? loadRecoveredDraft() : null;
  const [draft, setDraft] = useState(() => {
    const initialDraft = recovered || productToDraft(product);
    if (isNew && !/^[A-Z]{16}$/.test(clean(initialDraft.Product_ID))) initialDraft.Product_ID = uniqueRandomId(existingIds);
    return initialDraft;
  });
  const initial = useRef(JSON.stringify(draft));
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const errors = validateDraft(draft);
  const dirty = JSON.stringify(draft) !== initial.current;
  useEffect(() => { dialog.current?.showModal(); return () => dialog.current?.close(); }, []);
  useEffect(() => { if (!isNew || !dirty) return undefined; const timeout = setTimeout(() => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* Draft recovery is optional. */ } }, 450); return () => clearTimeout(timeout); }, [draft, dirty, isNew]);
  useEffect(() => { const warn = (event) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty]);
  const update = (field, value) => setDraft((current) => ({ ...current, [field]: value }));
  const regenerateId = () => update('Product_ID', uniqueRandomId(existingIds));
  const requestClose = () => { if (!dirty || window.confirm(isNew ? 'Close the editor? Your draft will remain available for recovery.' : 'Close and discard these unsaved changes?')) onClose(); };
  async function publish() {
    if (Object.keys(errors).length) {
      setError('Please complete the required fields or correct the highlighted values before saving.');
      const identityError = errors.Product_Name || errors.Product_ID || errors.Brand || errors.Category || errors.Product_Type;
      setStepIndex(identityError ? 0 : errors.images ? 2 : 1);
      return;
    }
    setSaving(true); setError('');
    try {
      const payload = productPayload(draft);
      await saveProductToSheet(payload, accessKey, isNew);
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* Draft recovery is optional. */ }
      onSaved(payload, `${draft.Product_Name} was saved to Google Sheets.`);
    } catch (saveError) { setError(saveError.message); }
    finally { setSaving(false); }
  }
  const stepProps = { draft, update, errors, accessKey };
  return <dialog ref={dialog} className="advanced-product-editor" aria-labelledby="advanced-product-editor-title" onCancel={(event) => { event.preventDefault(); requestClose(); }}><div className="advanced-product-editor__shell"><header className="advanced-product-editor__header"><div><span className="admin-kicker">Simple product editor</span><h2 id="advanced-product-editor-title">{isNew ? product ? 'Duplicate product' : 'Add a new product' : `Edit ${product.Product_Name}`}</h2><p>{dirty ? isNew ? 'Draft saved in this browser' : 'You have unsaved changes' : 'Ready to edit'}</p></div><button type="button" onClick={requestClose} aria-label="Close product editor"><X size={21} /></button></header><nav className="product-editor-steps" aria-label="Product editor sections">{steps.map((step, index) => { const Icon = step.icon; return <button type="button" key={step.id} className={index === stepIndex ? 'is-active' : index < stepIndex ? 'is-done' : ''} onClick={() => setStepIndex(index)}><span>{index < stepIndex ? <Check size={15} /> : <Icon size={15} />}</span><small>Step {index + 1}</small><strong>{step.label}</strong></button>; })}</nav>{recovered && <div className="draft-recovered"><Sparkles size={16} /><span>Your unfinished product draft was recovered.</span><button type="button" onClick={() => { const fresh = blankProduct(); fresh.Product_ID = uniqueRandomId(existingIds); setDraft(fresh); initial.current = JSON.stringify(fresh); localStorage.removeItem(DRAFT_KEY); }}>Start fresh</button></div>}<div className="advanced-product-editor__body"><div className="product-editor-workspace">{stepIndex === 0 && <BasicsStep {...stepProps} isNew={isNew} choices={choices} regenerateId={regenerateId} />}{stepIndex === 1 && <PricingStep {...stepProps} />}{stepIndex === 2 && <MediaStep {...stepProps} />}{stepIndex === 3 && <ReviewStep {...stepProps} />}{error && <p className="admin-error" role="alert">{error}</p>}</div></div><footer className="advanced-product-editor__footer"><div><button type="button" className="admin-button admin-button--secondary" onClick={requestClose}>{isNew ? 'Save draft & close' : 'Discard & close'}</button></div><div>{stepIndex > 0 && <button type="button" className="admin-button admin-button--secondary" onClick={() => setStepIndex((value) => value - 1)}><ArrowLeft size={15} /> Back</button>}{stepIndex < steps.length - 1 ? <button type="button" className="admin-button" onClick={() => setStepIndex((value) => value + 1)}>Continue <ArrowRight size={15} /></button> : <button type="button" className="admin-button admin-button--publish" onClick={publish} disabled={saving}><Save size={16} />{saving ? 'Saving...' : 'Save to Google Sheets'}</button>}</div></footer></div></dialog>;
}

export default function ProductManager({ products, accessKey, onChanged, onMessage }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [category, setCategory] = useState('All');
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [archiving, setArchiving] = useState('');
  const configured = Boolean(CONFIG.adminApiUrl);
  const choices = useMemo(() => ({
    brands: mergeOptions(brandOptions, products.map((item) => item.Brand)),
    categories: mergeOptions(categories, products.map((item) => item.Category || item.category)),
    productTypes: mergeOptions(productTypes, products.map((item) => item.Product_Type)),
    warranties: mergeOptions(warranties, products.map((item) => item.Warranty)),
  }), [products]);
  const categoryOptions = useMemo(() => ['All', ...new Set(products.map((item) => item.category || item.Category).filter(Boolean))], [products]);
  const filtered = useMemo(() => products.filter((item) => {
    const matchesQuery = `${item.Product_ID} ${item.Product_Name} ${item.Brand} ${item.SKU}`.toLowerCase().includes(query.trim().toLowerCase());
    const matchesStatus = status === 'All' || (status === 'Active' ? /active/i.test(item.Status) : status === 'Out of stock' ? item.Stock_Qty === 0 || /out of stock/i.test(item.Status) : new RegExp(status, 'i').test(item.Status));
    return matchesQuery && matchesStatus && (category === 'All' || (item.category || item.Category) === category);
  }).sort((a, b) => a.Product_Name.localeCompare(b.Product_Name)).slice(0, 250), [products, query, status, category]);
  const stats = {
    active: products.filter((item) => /active/i.test(item.Status)).length,
    low: products.filter((item) => item.Stock_Qty !== null && item.Stock_Qty <= 3).length,
    featured: products.filter((item) => item.Featured).length,
  };
  async function archive(product) {
    if (!window.confirm(`Archive "${product.Product_Name}"? It stays in Google Sheets and can be restored by editing its status.`)) return;
    setArchiving(product.Product_ID); setError('');
    try { await archiveProductInSheet(product.Product_ID, accessKey); onMessage(`${product.Product_Name} was archived.`); onChanged({ ...product, Status: 'Archived' }); }
    catch (archiveError) { setError(archiveError.message); }
    finally { setArchiving(''); }
  }
  return <section className="smart-product-library" id="product-library" aria-labelledby="product-library-title"><header className="smart-product-library__header"><div><span className="admin-kicker">Your live inventory</span><h2 id="product-library-title">Products <span>{products.length}</span></h2><p>Add or update a product in four simple steps.</p></div><button className="admin-button admin-button--new" onClick={() => setEditing({ product: null, isNew: true })}><PackagePlus size={17} /> Add new product</button></header><div className="product-library-stats"><article><Package size={18} /><span><strong>{products.length}</strong>Total products</span></article><article><Check size={18} /><span><strong>{stats.active}</strong>Active</span></article><article><CircleAlert size={18} /><span><strong>{stats.low}</strong>Low / no stock</span></article><article><Sparkles size={18} /><span><strong>{stats.featured}</strong>Featured</span></article></div>{!configured && <div className="product-setup-notice"><CircleAlert size={19} /><div><strong>Google Sheets is not connected.</strong><p>Add <code>VITE_GOOGLE_APPS_SCRIPT_URL</code> to <code>.env</code>.</p></div></div>}{error && <p className="admin-error" role="alert">{error}</p>}<div className="product-library-toolbar"><div className="admin-search"><Search size={18} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, ID, brand or SKU..." aria-label="Search products" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear product search"><X size={15} /></button>}</div><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter product category">{categoryOptions.map((item) => <option key={item}>{item === 'All' ? 'All categories' : item}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter product status"><option>All</option><option>Active</option><option>Draft</option><option>Out of stock</option><option>Archived</option></select></div>{filtered.length ? <div className="smart-product-table-wrap"><table className="smart-product-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filtered.map((product) => { const pricing = getPricing(product); return <tr key={product.Product_ID}><td><div className="smart-product-identity"><span><SmartImage src={product.Image_URL1 || product.images?.[0] || PLACEHOLDER_IMAGE} alternatives={product.images} alt="" /></span><div><strong>{product.Product_Name}</strong><small>{product.Product_ID} · {product.Brand || 'No brand'}</small></div></div></td><td>{product.category || product.Category}</td><td><strong>{pricing.current ? formatPrice(pricing.current) : 'Ask for price'}</strong>{pricing.discounted && <small><del>{formatPrice(pricing.regular)}</del></small>}</td><td><span className={product.Stock_Qty !== null && product.Stock_Qty <= 3 ? 'is-low-stock' : ''}>{product.Stock_Qty ?? 'Unknown'}</span></td><td><span className={`admin-status ${/active/i.test(product.Status) ? 'admin-status--visible' : 'admin-status--hidden'}`}>{product.Status || 'Active'}</span></td><td><div className="smart-product-actions"><button type="button" onClick={() => setEditing({ product, isNew: false })} title="Edit product"><Pencil size={15} /><span>Edit</span></button><button type="button" onClick={() => setEditing({ product: { ...product, Product_ID: '', Product_Name: `${product.Product_Name} Copy` }, isNew: true })} title="Duplicate product"><Copy size={15} /></button><button type="button" className="is-danger" onClick={() => archive(product)} disabled={!configured || archiving === product.Product_ID || /archived/i.test(product.Status)} title="Archive product"><Archive size={15} /></button></div></td></tr>; })}</tbody></table></div> : <div className="smart-product-empty"><Search size={31} /><h3>No matching products</h3><p>Clear the filters or create a new catalog item.</p><button type="button" onClick={() => { setQuery(''); setStatus('All'); setCategory('All'); }}>Clear filters</button></div>}<footer className="smart-product-library__footer"><span>Showing {filtered.length} of {products.length} products</span><span><Box size={14} /> Google Sheets remains the catalog source of truth</span></footer>{editing && <ProductEditor key={`${editing.product?.Product_ID || 'new'}-${editing.isNew}`} product={editing.product} isNew={editing.isNew} accessKey={accessKey} choices={choices} existingIds={products.map((item) => item.Product_ID)} onClose={() => setEditing(null)} onSaved={(payload, message) => { setEditing(null); onMessage(message); onChanged(payload); }} />}</section>;
}
