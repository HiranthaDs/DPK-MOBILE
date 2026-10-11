/**
 * DPK Mobile product administration API for Google Sheets.
 *
 * SETUP
 * 1. Open the product spreadsheet, then Extensions > Apps Script.
 * 2. Replace Code.gs with this file.
 * 3. Change SETUP_ADMIN_PASSWORD if required.
 * 4. Confirm the spreadsheet, sheet and image-folder settings below.
 * 5. Run setupAdmin() once and approve Sheets and Drive permissions.
 * 6. Deploy > New deployment > Web app. Execute as: Me. Access: Anyone.
 * 7. Put the /exec URL in VITE_GOOGLE_APPS_SCRIPT_URL.
 *
 * The Products sheet uses this compact layout:
 * Product_ID | Data(json) | Description | Image_URL1 ... Image_URL8 | Timestampup
 *
 * Product name, brand, category, product type, options, price, stock and status
 * live inside Data(json). New IDs are 16 random uppercase letters. Price, images,
 * stock and all other details are optional.
 * Card-payment and audit-log data are never collected or written.
 */

var SETUP_ADMIN_PASSWORD = 'DPK@2026';
var SETUP_SPREADSHEET_ID = '1xHhAE25eK0-6R0D0ggxfjhzYZ__pNwEY4A-yotVwPz4';
var PRODUCT_SHEET_NAME = 'Products';
var SETUP_IMAGE_FOLDER_ID = '1vOxlxz8vV1tZwqFTdAqXkI7xzklYB1DP';
var FIVE_SPACES = '     ';

var PRODUCT_HEADERS = [
  'Product_ID', 'Data(json)', 'Description',
  'Image_URL1', 'Image_URL2', 'Image_URL3', 'Image_URL4',
  'Image_URL5', 'Image_URL6', 'Image_URL7', 'Image_URL8', 'Timestampup'
];

var LEGACY_DATA_FIELDS = [
  'Product_Name', 'Product_Type', 'Category', 'Brand', 'SKU', 'Model_Number',
  'Condition', 'Warranty', 'Status', 'Stock_Qty', 'Price', 'Discount_Price',
  'Featured', 'Highlights', 'Display_Details', 'Performance_Details',
  'Camera_Details', 'Battery_Details', 'Connectivity_Details', 'In_The_Box',
  'GSM_Arena_URL'
];

function setupAdmin() {
  if (!SETUP_ADMIN_PASSWORD || SETUP_ADMIN_PASSWORD.length < 8) {
    throw new Error('Set SETUP_ADMIN_PASSWORD to at least 8 characters.');
  }
  var properties = PropertiesService.getScriptProperties();
  properties.setProperty('ADMIN_PASSWORD_HASH', hash_(SETUP_ADMIN_PASSWORD));
  properties.setProperty('PRODUCT_SHEET_NAME', PRODUCT_SHEET_NAME);
  properties.setProperty('IMAGE_FOLDER_ID', SETUP_IMAGE_FOLDER_ID);
  if (SETUP_SPREADSHEET_ID) properties.setProperty('SPREADSHEET_ID', SETUP_SPREADSHEET_ID);
  var sheet = productSheet_();
  compactProductSheet_(sheet);
  Logger.log('DPK Mobile admin is ready. Product sheet: ' + sheet.getName());
}

function doGet(event) {
  var action = cleanText_(event && event.parameter ? event.parameter.action : '');
  if (action === 'catalog') return json_(publicCatalog_());
  return json_({ ok: true, service: 'DPK Mobile catalog admin', version: 5, sheet: PRODUCT_SHEET_NAME });
}

function doPost(event) {
  try {
    if (!event || !event.postData || !event.postData.contents) throw new Error('Request body is missing.');
    var request = JSON.parse(event.postData.contents);
    requireAccess_(request.accessKey);
    if (request.action === 'authenticate') return json_({ ok: true, authenticated: true });
    if (request.action === 'listProducts') return json_(listProducts_());
    if (request.action === 'uploadImage') return json_(uploadImage_(request.file));
    if (request.action === 'upsertProduct') return json_(upsertProduct_(request.product, request.createOnly === true));
    if (request.action === 'archiveProduct') return json_(archiveProduct_(request.productId));
    throw new Error('Unknown action.');
  } catch (error) {
    return json_({ ok: false, error: error && error.message ? error.message : String(error) });
  }
}

function listProducts_() {
  var sheet = productSheet_();
  var headers = ensureHeaders_(sheet);
  if (sheet.getLastRow() < 2) return { ok: true, products: [], count: 0, sheet: sheet.getName() };
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getDisplayValues();
  var products = rows.map(function (row) {
    var flat = rowObject_(headers, row);
    var structured = parseJson_(flat['Data(json)']);
    // Match the browser CSV loader: flat legacy fields remain usable, while
    // structured JSON takes precedence when both versions are present.
    var product = Object.assign({}, flat, structured);
    delete product['Data(json)'];
    product.Product_ID = cleanText_(flat.Product_ID || structured.Product_ID);
    product.Description = cleanText_(flat.Description || structured.Description);
    product.images = [];
    for (var index = 1; index <= 8; index += 1) {
      if (flat['Image_URL' + index]) product.images.push(flat['Image_URL' + index]);
    }
    product.Image_URL1 = product.images[0] || '';
    product.variants = Array.isArray(structured.variants) ? structured.variants : [];
    product.category = product.Category || product.Product_Type || 'Other';
    product.Timestampup = cleanText_(flat.Timestampup || flat.Timestamp || structured.Timestampup || structured.Timestamp);
    product.Timestamp = product.Timestampup;
    return product;
  }).filter(function (product) { return product.Product_ID && product.Product_Name; });
  return { ok: true, products: products, count: products.length, sheet: sheet.getName() };
}

function publicCatalog_() {
  var result = listProducts_();
  var products = result.products.filter(function (product) {
    var status = cleanText_(product.Status).toLowerCase();
    return !/(?:inactive|hidden|deleted|draft|disabled|archived)/.test(status);
  });
  return { ok: true, products: products, count: products.length, version: 5, sheet: result.sheet };
}

function upsertProduct_(input, createOnly) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Product data is missing.');
  var product = stripUnsupported_(cleanDeep_(input));
  var id = cleanText_(product.Product_ID);
  var name = cleanText_(product.Product_Name);
  var brand = cleanText_(product.Brand);
  var category = cleanText_(product.Category);
  var productType = cleanText_(product.Product_Type);
  if (!id) throw new Error('Product ID is required.');
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{1,119}$/.test(id)) throw new Error('Product ID must use 2-120 letters, numbers, dots, dashes or underscores.');
  if (!name) throw new Error('Product name is required.');
  if (!brand) throw new Error('Brand is required.');
  if (!category) throw new Error('Category is required.');
  if (!productType) throw new Error('Product type is required.');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = productSheet_();
    var headers = ensureHeaders_(sheet);
    var idColumn = headers.indexOf('Product_ID') + 1;
    var rowNumber = findProductRow_(sheet, idColumn, id);
    if (createOnly && rowNumber !== 0) throw new Error('This random Product ID already exists. Generate a new ID and try again.');
    var isNew = rowNumber === 0;
    if (isNew && !/^[A-Z]{16}$/.test(id)) throw new Error('A new Product ID must contain exactly 16 random uppercase letters.');
    if (isNew) rowNumber = Math.max(sheet.getLastRow() + 1, 2);
    var images = Array.isArray(product.images) ? product.images.slice(0, 8).map(safeUrl_).filter(Boolean) : [];
    var variants = normalizeVariants_(product.variants);
    var pricedVariants = variants.filter(function (variant) { return variant.price > 0; });
    var cheapest = pricedVariants.reduce(function (best, variant) {
      var current = variant.discountPrice || variant.price;
      var bestCurrent = best ? best.discountPrice || best.price : Number.POSITIVE_INFINITY;
      return current < bestCurrent ? variant : best;
    }, null);
    var stockKnown = variants.some(function (variant) { return variant.stockQty !== null; });
    var stockTotal = stockKnown ? variants.reduce(function (total, variant) { return total + (variant.stockQty || 0); }, 0) : null;
    var data = {
      Product_Name: name,
      Product_Type: productType,
      Category: category,
      Brand: brand,
      SKU: cleanText_(product.SKU),
      Model_Number: cleanText_(product.Model_Number),
      Condition: cleanText_(product.Condition) || 'Brand New',
      Warranty: cleanText_(product.Warranty),
      Status: cleanText_(product.Status) || 'Active',
      Stock_Qty: stockTotal,
      Price: cheapest ? cheapest.price : 0,
      Discount_Price: cheapest ? cheapest.discountPrice : 0,
      Featured: cleanText_(product.Featured),
      Highlights: cleanText_(product.Highlights),
      Display_Details: cleanText_(product.Display_Details),
      Performance_Details: cleanText_(product.Performance_Details),
      Camera_Details: cleanText_(product.Camera_Details),
      Battery_Details: cleanText_(product.Battery_Details),
      Connectivity_Details: cleanText_(product.Connectivity_Details),
      In_The_Box: cleanText_(product.In_The_Box),
      GSM_Arena_URL: cleanText_(product.GSM_Arena_URL),
      detailSections: Array.isArray(product.detailSections) ? product.detailSections : [],
      variants: variants
    };
    var record = {
      Product_ID: id,
      'Data(json)': JSON.stringify(stripUnsupported_(cleanDeep_(data))),
      Description: cleanText_(product.Description),
      Timestampup: new Date()
    };
    for (var imageIndex = 0; imageIndex < 8; imageIndex += 1) {
      record['Image_URL' + (imageIndex + 1)] = images[imageIndex] || '';
    }
    var row = headers.map(function (header) { return safeCell_(record[header]); });
    sheet.getRange(rowNumber, 1, 1, headers.length).setValues([row]);
    SpreadsheetApp.flush();
    return {
      ok: true,
      action: isNew ? 'created' : 'updated',
      productId: id,
      row: rowNumber,
      sheet: sheet.getName(),
      timestamp: record.Timestampup.toISOString()
    };
  } finally {
    lock.releaseLock();
  }
}

function normalizeVariants_(input) {
  if (!Array.isArray(input)) return [];
  return input.map(function (item, index) {
    item = item || {};
    var price = optionalNumber_(item.price, false, 'Option ' + (index + 1) + ' price');
    var discountPrice = optionalNumber_(item.discountPrice, false, 'Option ' + (index + 1) + ' offer price');
    if (!price && discountPrice) { price = discountPrice; discountPrice = 0; }
    if (price > 0 && discountPrice >= price) throw new Error('Option ' + (index + 1) + ' offer price must be lower than its regular price.');
    var stockQty = optionalNumber_(item.stockQty, true, 'Option ' + (index + 1) + ' stock');
    return {
      ram: cleanText_(item.ram),
      rom: cleanText_(item.rom),
      color: normalizeColours_(item.color),
      sku: cleanText_(item.sku),
      price: price,
      discountPrice: discountPrice,
      stockQty: stockQty
    };
  }).filter(function (variant) {
    return Boolean(variant.ram || variant.rom || variant.color || variant.sku || variant.price || variant.discountPrice || variant.stockQty !== null);
  });
}

function uploadImage_(input) {
  if (!input || !input.data) throw new Error('Image data is missing.');
  var allowed = ['image/jpeg', 'image/png', 'image/webp'];
  var mimeType = cleanText_(input.mimeType).toLowerCase();
  if (allowed.indexOf(mimeType) === -1) throw new Error('Only JPG, PNG and WebP images are allowed.');
  if (String(input.data).length > 7 * 1024 * 1024) throw new Error('The encoded image is too large. Use an image under 5 MB.');
  var folderId = PropertiesService.getScriptProperties().getProperty('IMAGE_FOLDER_ID') || SETUP_IMAGE_FOLDER_ID;
  if (!folderId) throw new Error('The Google Drive image folder is not configured.');
  var originalName = cleanText_(input.name) || 'product-image';
  var extension = mimeType === 'image/png' ? '.png' : mimeType === 'image/webp' ? '.webp' : '.jpg';
  var baseName = originalName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'image';
  var productId = cleanText_(input.productId).replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 50) || 'PRODUCT';
  var fileName = productId + '-' + new Date().getTime() + '-' + baseName + extension;
  var bytes = Utilities.base64Decode(String(input.data));
  if (bytes.length > 5 * 1024 * 1024) throw new Error('The image is larger than 5 MB.');
  var file = DriveApp.getFolderById(folderId).createFile(Utilities.newBlob(bytes, mimeType, fileName));
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (ignored) { /* Workspace policy may control sharing. */ }
  return {
    ok: true,
    fileId: file.getId(),
    name: fileName,
    url: 'https://drive.google.com/file/d/' + file.getId() + '/view?usp=sharing',
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1600'
  };
}

function archiveProduct_(productId) {
  var id = cleanText_(productId);
  if (!id) throw new Error('Product ID is required.');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = productSheet_();
    var headers = ensureHeaders_(sheet);
    var rowNumber = findProductRow_(sheet, headers.indexOf('Product_ID') + 1, id);
    if (!rowNumber) throw new Error('Product was not found.');
    var jsonColumn = headers.indexOf('Data(json)') + 1;
    var data = parseJson_(sheet.getRange(rowNumber, jsonColumn).getDisplayValue());
    data.Status = 'Archived';
    sheet.getRange(rowNumber, jsonColumn).setValue(JSON.stringify(stripUnsupported_(cleanDeep_(data))));
    sheet.getRange(rowNumber, headers.indexOf('Timestampup') + 1).setValue(new Date());
    SpreadsheetApp.flush();
    return { ok: true, action: 'archived', productId: id, row: rowNumber };
  } finally {
    lock.releaseLock();
  }
}

function productSheet_() {
  var properties = PropertiesService.getScriptProperties();
  // The configured spreadsheet wins over stale properties from old scripts.
  var spreadsheetId = cleanText_(SETUP_SPREADSHEET_ID) || properties.getProperty('SPREADSHEET_ID');
  var spreadsheet = spreadsheetId ? SpreadsheetApp.openById(spreadsheetId) : SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('No spreadsheet is connected. Set SETUP_SPREADSHEET_ID and run setupAdmin again.');
  // Always use the Products tab. This deliberately ignores stale properties
  // left by older deployments that may have pointed at Sheet1.
  return spreadsheet.getSheetByName(PRODUCT_SHEET_NAME) || spreadsheet.insertSheet(PRODUCT_SHEET_NAME);
}

function ensureHeaders_(sheet) {
  var lastColumn = sheet.getLastColumn();
  var headers = lastColumn ? sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0].map(cleanText_) : [];
  var changed = false;
  if (!headers.some(Boolean)) {
    headers = PRODUCT_HEADERS.slice();
    changed = true;
  } else {
    PRODUCT_HEADERS.forEach(function (header) {
      if (headers.indexOf(header) === -1) {
        headers.push(header);
        changed = true;
      }
    });
  }
  if (changed) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (sheet.getFrozenRows() < 1) sheet.setFrozenRows(1);
  return headers;
}

function compactProductSheet_(sheet) {
  var lastColumn = sheet.getLastColumn();
  var existingHeaders = lastColumn ? sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0].map(cleanText_) : [];
  if (!existingHeaders.some(Boolean)) {
    sheet.getRange(1, 1, 1, PRODUCT_HEADERS.length).setValues([PRODUCT_HEADERS]);
    sheet.setFrozenRows(1);
    return;
  }
  if (existingHeaders.join('|') === PRODUCT_HEADERS.join('|')) {
    sheet.setFrozenRows(1);
    return;
  }
  var rowCount = Math.max(0, sheet.getLastRow() - 1);
  var sourceRows = rowCount ? sheet.getRange(2, 1, rowCount, existingHeaders.length).getValues() : [];
  var compactRows = sourceRows.map(function (row) {
    return compactLegacyRow_(rowObject_(existingHeaders, row));
  }).filter(function (row) { return row.some(function (value) { return value !== '' && value !== null; }); });
  sheet.getDataRange().clearContent();
  sheet.getRange(1, 1, 1, PRODUCT_HEADERS.length).setValues([PRODUCT_HEADERS]);
  if (compactRows.length) sheet.getRange(2, 1, compactRows.length, PRODUCT_HEADERS.length).setValues(compactRows);
  sheet.setFrozenRows(1);
}

function compactLegacyRow_(flat) {
  var data = parseJson_(flat['Data(json)']);
  LEGACY_DATA_FIELDS.forEach(function (field) {
    if (flat[field] !== '' && flat[field] !== null && flat[field] !== undefined) data[field] = flat[field];
  });
  var id = cleanText_(flat.Product_ID || data.Product_ID);
  var description = cleanText_(flat.Description || data.Description);
  delete data.Product_ID;
  delete data.Description;
  delete data.images;
  data = stripUnsupported_(cleanDeep_(data));
  var record = {
    Product_ID: id,
    'Data(json)': Object.keys(data).length ? JSON.stringify(data) : '',
    Description: description,
    Timestampup: flat.Timestampup || flat.Timestamp || new Date()
  };
  for (var index = 1; index <= 8; index += 1) record['Image_URL' + index] = cleanText_(flat['Image_URL' + index]);
  return PRODUCT_HEADERS.map(function (header) { return safeCell_(record[header]); });
}

function findProductRow_(sheet, idColumn, id) {
  if (idColumn < 1 || sheet.getLastRow() < 2) return 0;
  var finder = sheet.getRange(2, idColumn, sheet.getLastRow() - 1, 1).createTextFinder(id).matchEntireCell(true).matchCase(true).findNext();
  return finder ? finder.getRow() : 0;
}

function requireAccess_(provided) {
  var expected = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD_HASH');
  if (!expected) throw new Error('Admin access is not configured. Run setupAdmin first.');
  var actual = hash_(String(provided || ''));
  var mismatch = expected.length === actual.length ? 0 : 1;
  var length = Math.max(expected.length, actual.length);
  for (var index = 0; index < length; index += 1) mismatch |= (expected.charCodeAt(index % expected.length) || 0) ^ (actual.charCodeAt(index % Math.max(actual.length, 1)) || 0);
  if (mismatch !== 0) throw new Error('The admin access key is incorrect.');
}

function hash_(value) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8);
  return bytes.map(function (byte) { var normalized = byte < 0 ? byte + 256 : byte; return ('0' + normalized.toString(16)).slice(-2); }).join('');
}

function rowObject_(headers, row) {
  var output = {};
  headers.forEach(function (header, index) { if (header) output[header] = row[index]; });
  return output;
}

function parseJson_(value) {
  try {
    var parsed = value ? JSON.parse(String(value)) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (ignored) { return {}; }
}

function normalizeColours_(value) {
  var seen = {};
  return cleanText_(value).split(',').map(function (item) { return cleanText_(item); }).filter(function (item) {
    var key = item.toLowerCase();
    if (!item || seen[key]) return false;
    seen[key] = true;
    return true;
  }).join(', ');
}

function optionalNumber_(value, integerOnly, label) {
  if (value === '' || value === null || value === undefined) return null;
  var parsed = Number(String(value).replace(/[^0-9.-]/g, ''));
  if (!isFinite(parsed) || parsed < 0) throw new Error(label + ' must be a valid non-negative number.');
  if (integerOnly && parsed !== Math.floor(parsed)) throw new Error(label + ' must be a whole number.');
  return integerOnly ? Math.floor(parsed) : parsed;
}

function stripUnsupported_(value) {
  if (Array.isArray(value)) return value.map(stripUnsupported_);
  if (value && typeof value === 'object' && Object.prototype.toString.call(value) === '[object Object]') {
    var output = {};
    Object.keys(value).forEach(function (key) {
      if (/^(?:cardAmount|Card_Amount|Koko_Amount)$/i.test(key)) return;
      output[key] = stripUnsupported_(value[key]);
    });
    return output;
  }
  return value;
}

function cleanDeep_(value) {
  if (typeof value === 'string') return cleanText_(value);
  if (Array.isArray(value)) return value.map(cleanDeep_);
  if (value && typeof value === 'object' && Object.prototype.toString.call(value) === '[object Object]') {
    var output = {};
    Object.keys(value).forEach(function (key) { output[cleanText_(key)] = cleanDeep_(value[key]); });
    return output;
  }
  return value;
}

function cleanText_(value) {
  return String(value == null ? '' : value).replace(/\r\n|\r|\n/g, FIVE_SPACES).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
}

function safeUrl_(value) {
  var url = cleanText_(value);
  if (!url) return '';
  if (!/^https:\/\//i.test(url)) throw new Error('Image URLs must start with https://');
  return url;
}

function safeCell_(value) {
  if (value instanceof Date || typeof value === 'number') return value;
  if (value === null || value === undefined) return '';
  var text = cleanText_(value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
