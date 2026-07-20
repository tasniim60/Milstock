const { body } = require('express-validator');
const Product = require('../models/productModel');
const ProductWarehouse = require('../models/productWarehouseModel');
const Warehouse = require('../models/warehouseModel');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { adjustStock } = require('../services/inventoryService');
const { createAuditLog } = require('../services/auditLogService');
const { generateExpirationNotifications } = require('../services/expirationNotificationService');
const { buildWarehouseScopeFilter, assertWarehouseAccess } = require('../utils/warehouseScope');
const { assertDateRange, assertValidDate } = require('../utils/dateValidation');
const { getEffectiveProductUnitPrice } = require('../utils/productPricing');

const textTranslations = {
  Chicken: 'دجاج',
  chicken: 'دجاج',
  Meat: 'لحمة',
  meat: 'لحمة',
  Beef: 'لحمة',
  beef: 'لحمة',
  Eggs: 'بيض',
  eggs: 'بيض',
  Butter: 'زبدة',
  butter: 'زبدة',
  Potatoes: 'بطاطس',
  potatoes: 'بطاطس',
  Tomatoes: 'طماطم',
  tomatoes: 'طماطم',
  Onions: 'بصل',
  onions: 'بصل',
  Apples: 'تفاح',
  apples: 'تفاح',
  Bananas: 'موز',
  bananas: 'موز',
  'Orange Juice': 'عصير برتقال',
  'orange juice': 'عصير برتقال',
  Tea: 'شاي',
  tea: 'شاي',
  Salt: 'ملح',
  salt: 'ملح',
  Oats: 'شوفان',
  oats: 'شوفان',
  Corn: 'ذرة',
  corn: 'ذرة',
  Chickpeas: 'حمص',
  chickpeas: 'حمص',
  Honey: 'عسل',
  honey: 'عسل',
  Jam: 'مربى',
  jam: 'مربى',
  Coffee: 'قهوة',
  coffee: 'قهوة',
  'Fish Fillets': 'فيليه سمك',
  'fish fillets': 'فيليه سمك',
  Shrimp: 'جمبري',
  shrimp: 'جمبري',
  Cream: 'كريمة',
  cream: 'كريمة',
  Lettuce: 'خس',
  lettuce: 'خس',
  Cucumbers: 'خيار',
  cucumbers: 'خيار',
  Carrots: 'جزر',
  carrots: 'جزر',
  Oranges: 'برتقال',
  oranges: 'برتقال',
  Mangoes: 'مانجو',
  mangoes: 'مانجو',
  Dates: 'تمر',
  dates: 'تمر',
  'Chocolate Spread': 'كريمة شوكولاتة',
  'chocolate spread': 'كريمة شوكولاتة',
  Cereal: 'حبوب إفطار',
  cereal: 'حبوب إفطار',
  Croissants: 'كرواسون',
  croissants: 'كرواسون',
  'Grape Juice': 'عصير عنب',
  'grape juice': 'عصير عنب',
  'Sparkling Water': 'مياه غازية',
  'sparkling water': 'مياه غازية',
  Flour: 'دقيق',
  flour: 'دقيق',
  Yogurt: 'زبادي',
  yogurt: 'زبادي',
  'Tomato Sauce': 'صلصة طماطم',
  'Apple Juice': 'عصير تفاح',
  'Fresh Vegetables': 'خضروات طازجة',
  Bread: 'خبز',
  Rice: 'أرز',
  Pasta: 'مكرونة',
  'Cooking Oil': 'زيت طهي',
  Milk: 'حليب',
  Cheese: 'جبن',
  'Fresh Fruits': 'فواكه طازجة',
  Sugar: 'سكر',
  Beans: 'فول',
  'Canned Tuna': 'تونة معلبة',
  'Frozen Vegetables': 'خضروات مجمدة',
  'Water Bottles': 'زجاجات مياه',
  Food: 'أغذية',
  Dairy: 'ألبان',
  Bakery: 'مخبوزات',
  Pantry: 'مواد جافة',
  'Canned Food': 'أغذية معلبة',
  'Frozen Food': 'أغذية مجمدة',
  'Fresh Produce': 'منتجات طازجة',
  Beverages: 'مشروبات',
  'Dry Goods': 'مواد جافة',
  Legumes: 'بقوليات',
  'Fish and Seafood': 'أسماك ومأكولات بحرية',
};

const reverseTextTranslations = Object.entries(textTranslations).reduce((acc, [english, arabic]) => {
  acc[arabic] = english;
  return acc;
}, {});

const containsArabic = (value) => /[\u0600-\u06FF]/.test(String(value || ''));

const getKnownTranslation = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';
  if (textTranslations[text]) return textTranslations[text];
  const lowerText = text.toLowerCase();
  const match = Object.keys(textTranslations).find((key) => key.toLowerCase() === lowerText);
  return match ? textTranslations[match] : '';
};

const getKnownEnglish = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';
  if (reverseTextTranslations[text]) return reverseTextTranslations[text];
  const lowerText = text.toLowerCase();
  const match = Object.keys(reverseTextTranslations).find((key) => key.toLowerCase() === lowerText);
  return match ? reverseTextTranslations[match] : '';
};

const getBilingualText = (primary, fallback = {}) => {
  const text = String(primary || '').trim();
  const fallbackEn = String(fallback.en || '').trim();
  const fallbackAr = String(fallback.ar || '').trim();

  if (!text) {
    return {
      en: fallbackEn || (fallbackAr ? getKnownEnglish(fallbackAr) || fallbackAr : ''),
      ar: containsArabic(fallbackAr) ? fallbackAr : getKnownTranslation(fallbackEn) || fallbackAr || fallbackEn || '',
    };
  }

  if (containsArabic(text)) {
    return {
      en: getKnownEnglish(text) || (fallbackEn && !containsArabic(fallbackEn) && fallbackEn.length >= text.length ? fallbackEn : text),
      ar: text,
    };
  }

  return {
    en: text,
    ar: getKnownTranslation(text) || (containsArabic(fallbackAr) ? fallbackAr : '') || text,
  };
};

const productRules = [
  body('name').optional({ nullable: true, checkFalsy: true }).trim().isLength({ min: 2 }).withMessage('Product name is required'),
  body('nameAr').optional({ nullable: true, checkFalsy: true }).trim(),
  body('quantity').optional().isFloat({ min: 0 }).withMessage('Quantity must be 0 or greater'),
  body('unit').optional().isIn(['kg', 'g', 'liter', 'Tons', 'piece', 'box']).withMessage('Invalid unit'),
  body('category').optional({ nullable: true, checkFalsy: true }).trim().notEmpty().withMessage('Category is required'),
  body('categoryAr').optional({ nullable: true, checkFalsy: true }).trim(),
  body('min_quantity').optional().isFloat({ min: 0 }).withMessage('Minimum quantity must be 0 or greater'),
  body('unit_price').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('Unit price must be 0 or greater'),
  body('warehouse_id').optional().isMongoId().withMessage('Valid warehouse_id is required'),
  body('expiry_date').optional({ nullable: true, checkFalsy: true }).custom((value) => assertValidDate(value, 'Expiry date must be a valid date')),
  body('expiration_date').optional({ nullable: true, checkFalsy: true }).custom((value) => assertValidDate(value, 'Expiration date must be a valid date')),
  body('manufacturing_date').optional({ nullable: true, checkFalsy: true }).custom((value) => assertValidDate(value, 'Manufacturing date must be a valid date')),
  body('manufacturing_date').custom((value, { req }) => {
    const expirationDate = req.body.expiration_date || req.body.expiry_date;
    return assertDateRange(value, expirationDate, 'Manufacturing date cannot be after expiration date');
  }),
  body('warehouse_name').optional().trim(),
  body('storage_section').optional().trim(),
  body('batch_number').optional().trim(),
  body('serial_number').optional().trim(),
  body('description').optional().trim(),
  body('descriptionAr').optional({ nullable: true, checkFalsy: true }).trim(),
  body('notes').optional().trim(),
];

const buildAlertSettingsResponse = (product) => ({
  product_id: product._id,
  product_name: product.name,
  unit: product.unit,
  low_stock_threshold: Number(product.alert_settings?.low_stock_threshold ?? product.min_quantity ?? 0),
  critical_stock_threshold: Number(product.alert_settings?.critical_stock_threshold ?? 0),
  expiration_warning_days: Number(product.alert_settings?.expiration_warning_days ?? 30),
  critical_expiration_days: Number(product.alert_settings?.critical_expiration_days ?? 7),
});

const alertSettingsRules = [
  body('low_stock_threshold').isFloat({ min: 0 }).withMessage('Low stock threshold must be 0 or greater'),
  body('critical_stock_threshold').isFloat({ min: 0 }).withMessage('Critical stock threshold must be 0 or greater'),
  body('expiration_warning_days').isFloat({ min: 0 }).withMessage('Expiration warning days must be 0 or greater'),
  body('critical_expiration_days').isFloat({ min: 0 }).withMessage('Critical expiration days must be 0 or greater'),
  body('critical_stock_threshold').custom((value, { req }) => {
    if (Number(value) > Number(req.body.low_stock_threshold)) {
      throw new Error('Critical stock threshold must be less than or equal to low stock threshold');
    }
    return true;
  }),
  body('critical_expiration_days').custom((value, { req }) => {
    if (Number(value) > Number(req.body.expiration_warning_days)) {
      throw new Error('Critical expiration days must be less than or equal to expiration warning days');
    }
    return true;
  }),
];

const requireTrimmed = (payload, field, message) => {
  if (!String(payload[field] || '').trim()) {
    throw new AppError(message, 400);
  }
  payload[field] = String(payload[field]).trim();
};

const normalizeBilingualProductPayload = (payload, { partial = false } = {}) => {
  if (!payload.name) {
    payload.name = payload.displayName || payload.product_name || payload.item_name || payload.itemName || payload.productName || payload.title || '';
  }
  if (!payload.nameAr) {
    payload.nameAr = payload.product_name_ar || payload.item_name_ar || payload.itemNameAr || payload.productNameAr || payload.titleAr || '';
  }
  if (!payload.category) {
    payload.category = payload.category_name || payload.categoryName || '';
  }
  if (!payload.categoryAr) {
    payload.categoryAr = payload.category_name_ar || payload.categoryNameAr || '';
  }

  const hasName = Object.prototype.hasOwnProperty.call(payload, 'name');
  const hasNameAr = Object.prototype.hasOwnProperty.call(payload, 'nameAr');
  const hasCategory = Object.prototype.hasOwnProperty.call(payload, 'category');
  const hasCategoryAr = Object.prototype.hasOwnProperty.call(payload, 'categoryAr');
  const hasDescription = Object.prototype.hasOwnProperty.call(payload, 'description');
  const hasDescriptionAr = Object.prototype.hasOwnProperty.call(payload, 'descriptionAr');

  if (!partial || hasName || hasNameAr) {
    const nameInput = payload.name || payload.nameAr;
    const bilingualName = getBilingualText(nameInput, { en: payload.name, ar: payload.nameAr });
    payload.name = bilingualName.en;
    payload.nameAr = bilingualName.ar;
    requireTrimmed(payload, 'name', 'Product name is required');
  }

  if (!partial || hasCategory || hasCategoryAr) {
    const categoryInput = payload.category || payload.categoryAr;
    const bilingualCategory = getBilingualText(categoryInput, { en: payload.category, ar: payload.categoryAr });
    payload.category = bilingualCategory.en;
    payload.categoryAr = bilingualCategory.ar;
    requireTrimmed(payload, 'category', 'Category is required');
  }

  if (hasDescription || hasDescriptionAr) {
    const descriptionInput = payload.description || payload.descriptionAr;
    const bilingualDescription = getBilingualText(descriptionInput, { en: payload.description, ar: payload.descriptionAr });
    payload.description = bilingualDescription.en;
    payload.descriptionAr = bilingualDescription.ar;
  }

  for (const field of ['description', 'descriptionAr', 'warehouse_name', 'storage_section', 'batch_number', 'serial_number', 'notes']) {
    if (Object.prototype.hasOwnProperty.call(payload, field) && payload[field] !== undefined && payload[field] !== null) {
      payload[field] = String(payload[field]).trim();
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'unit_price')) {
    payload.unit_price = Number(payload.unit_price || 0);
  }
};

const normalizeProductRequest = (req, _res, next) => {
  normalizeBilingualProductPayload(req.body, { partial: req.method !== 'POST' });
  next();
};

const createProduct = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  normalizeBilingualProductPayload(payload);
  if (payload.expiration_date && !payload.expiry_date) {
    payload.expiry_date = payload.expiration_date;
  }
  if (payload.expiry_date && !payload.expiration_date) {
    payload.expiration_date = payload.expiry_date;
  }
  if (payload.warehouse_id && !payload.warehouse_name) {
    const warehouse = await Warehouse.findById(payload.warehouse_id);
    payload.warehouse_name = warehouse?.name || '';
  }
  if (!Number(payload.unit_price || 0)) {
    payload.unit_price = getEffectiveProductUnitPrice(payload);
  }

  const product = await Product.create(payload);

  await ProductWarehouse.create({
    product_id: product._id,
    warehouse_id: product.warehouse_id,
    quantity: 0,
  });

  if (product.quantity > 0 && req.user) {
    await adjustStock({
      product_id: product._id,
      warehouse_id: product.warehouse_id,
      quantity: product.quantity,
      change_type: 'in',
      user_id: req.user._id,
      reference_type: 'product_create',
    });
  }

  await createAuditLog({
    req,
    action: 'create_item',
    module: 'inventory',
    entityId: product._id,
    entityType: 'Product',
    description: `Created inventory item ${product.name}`,
    newData: product,
  });
  await generateExpirationNotifications(req);

  res.status(201).json({ success: true, data: product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const previous = await Product.findById(req.params.id);
  const payload = { ...req.body };
  normalizeBilingualProductPayload(payload, { partial: true });
  if (payload.expiration_date && !payload.expiry_date) {
    payload.expiry_date = payload.expiration_date;
  }
  if (payload.expiry_date && !payload.expiration_date) {
    payload.expiration_date = payload.expiry_date;
  }
  if (payload.warehouse_id && !payload.warehouse_name) {
    const warehouse = await Warehouse.findById(payload.warehouse_id);
    payload.warehouse_name = warehouse?.name || '';
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'unit_price') && !Number(payload.unit_price || 0)) {
    payload.unit_price = getEffectiveProductUnitPrice({ ...previous?.toObject?.(), ...payload });
  }

  const product = await Product.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  });

  if (previous && product && req.body.quantity !== undefined) {
    const diff = Number(req.body.quantity) - previous.quantity;
    if (diff !== 0 && req.user) {
      await adjustStock({
        product_id: product._id,
        warehouse_id: product.warehouse_id,
        quantity: Math.abs(diff),
        change_type: diff > 0 ? 'in' : 'out',
        user_id: req.user._id,
        reference_type: 'product_update',
      });
    }
  }

  await createAuditLog({
    req,
    action: req.body.quantity !== undefined && previous?.quantity !== product?.quantity ? 'change_stock' : 'update_item',
    module: 'inventory',
    entityId: product?._id,
    entityType: 'Product',
    description: `Updated inventory item ${product?.name || req.params.id}`,
    previousData: previous,
    newData: product,
  });
  await generateExpirationNotifications(req);

  res.json({ success: true, data: product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  await createAuditLog({
    req,
    action: 'delete_item',
    module: 'inventory',
    entityId: product._id,
    entityType: 'Product',
    description: `Deleted inventory item ${product.name}`,
    previousData: product,
  });

  res.status(204).send();
});

const getProductAlertSettings = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  res.json({ success: true, data: buildAlertSettingsResponse(product) });
});

const updateProductAlertSettings = asyncHandler(async (req, res) => {
  const previous = await Product.findById(req.params.id);
  if (!previous) {
    throw new AppError('Product not found', 404);
  }

  const alertSettings = {
    low_stock_threshold: Number(req.body.low_stock_threshold),
    critical_stock_threshold: Number(req.body.critical_stock_threshold),
    expiration_warning_days: Number(req.body.expiration_warning_days),
    critical_expiration_days: Number(req.body.critical_expiration_days),
  };

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { alert_settings: alertSettings },
    { new: true, runValidators: true }
  );

  await createAuditLog({
    req,
    action: 'update_product_alert_thresholds',
    module: 'settings',
    entityId: product._id,
    entityType: 'product',
    description: `Updated alert thresholds for ${product.name}`,
    previousData: { alert_settings: previous.alert_settings },
    newData: { alert_settings: product.alert_settings },
  });

  res.json({ success: true, data: buildAlertSettingsResponse(product) });
});

const normalizeStockIdentity = (value) => String(value || '').trim().toLowerCase();

const attachWarehouseStock = async (products, options = {}) => {
  const { includeMatchingProducts = false } = options;
  const productList = Array.isArray(products) ? products : [products];
  const baseProductIds = productList.map((product) => product._id);
  let productIds = baseProductIds;
  let matchingProductsByBaseId = {};

  if (includeMatchingProducts) {
    const orFilters = productList.map((product) => ({
      name: product.name,
      category: product.category,
      unit: product.unit,
    }));
    const matchingProducts = await Product.find({ $or: orFilters }).populate('warehouse_id');

    matchingProductsByBaseId = productList.reduce((acc, product) => {
      acc[String(product._id)] = matchingProducts.filter((candidate) =>
        normalizeStockIdentity(candidate.name) === normalizeStockIdentity(product.name)
        && normalizeStockIdentity(candidate.category) === normalizeStockIdentity(product.category)
        && normalizeStockIdentity(candidate.unit) === normalizeStockIdentity(product.unit)
      );
      return acc;
    }, {});

    productIds = [...new Set(matchingProducts.map((product) => String(product._id)))];
  }

  const stockRows = await ProductWarehouse.find({ product_id: { $in: productIds } })
    .populate('product_id', '_id name nameAr category categoryAr unit warehouse_id warehouse_name')
    .populate('warehouse_id', '_id name nameAr code location locationAr status')
    .sort('-quantity');

  const rowsByProduct = stockRows.reduce((acc, row) => {
    const productId = String(row.product_id?._id || row.product_id);
    if (!acc[productId]) acc[productId] = [];
    acc[productId].push(row);
    return acc;
  }, {});

  return productList.map((product) => {
    const plain = product.toObject ? product.toObject() : { ...product };
    const matchingProducts = matchingProductsByBaseId[String(product._id)] || [product];
    const matchingProductIds = new Set(matchingProducts.map((entry) => String(entry._id)));
    const rows = includeMatchingProducts
      ? stockRows.filter((row) => matchingProductIds.has(String(row.product_id?._id || row.product_id)))
      : rowsByProduct[String(product._id)] || [];
    const warehousesById = new Map();
    const warehouses = rows
      .filter((row) => row.warehouse_id)
      .map((row) => {
        const key = String(row.warehouse_id._id);
        const existing = warehousesById.get(key);
        const nextQuantity = Number(row.quantity || 0);
        if (existing) {
          existing.quantity += nextQuantity;
          return null;
        }
        const warehouse = {
          id: key,
          _id: row.warehouse_id._id,
          name: row.warehouse_id.name,
          nameAr: row.warehouse_id.nameAr,
          code: row.warehouse_id.code,
          location: row.warehouse_id.location,
          locationAr: row.warehouse_id.locationAr,
          status: row.warehouse_id.status,
          quantity: nextQuantity,
          unit: row.product_id?.unit || plain.unit,
        };
        warehousesById.set(key, warehouse);
        return warehouse;
      })
      .filter(Boolean);

    if (!warehouses.length && plain.warehouse_id) {
      warehouses.push({
        id: String(plain.warehouse_id._id || plain.warehouse_id),
        _id: plain.warehouse_id._id || plain.warehouse_id,
        name: plain.warehouse_id.name || plain.warehouse_name || 'Unassigned',
        nameAr: plain.warehouse_id.nameAr || '',
        code: plain.warehouse_id.code || '',
        location: plain.warehouse_id.location || '',
        locationAr: plain.warehouse_id.locationAr || '',
        quantity: Number(plain.quantity || 0),
        unit: plain.unit,
      });
    }

    const totalStock = warehouses.reduce((sum, warehouse) => sum + Number(warehouse.quantity || 0), 0);
    const unitPrice = getEffectiveProductUnitPrice(plain);
    return {
      ...plain,
      unit_price: unitPrice,
      price: unitPrice,
      warehouses,
      totalStock,
      quantity: warehouses.length ? totalStock : Number(plain.quantity || 0),
    };
  });
};

const getProducts = asyncHandler(async (req, res) => {
  const scopeFilter = await buildWarehouseScopeFilter(req, Product);
  const queryFilter = { ...req.query };
  delete queryFilter.sort;
  delete queryFilter.limit;
  delete queryFilter.page;
  delete queryFilter.fields;

  const docs = await Product.find({ ...queryFilter, ...scopeFilter })
    .populate('warehouse_id')
    .sort('-createdAt');
  const data = await attachWarehouseStock(docs);

  res.json({ success: true, count: data.length, data });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('warehouse_id');
  if (!product) throw new AppError('Product not found', 404);
  await assertWarehouseAccess(req, Product, product);
  const [data] = await attachWarehouseStock(product, { includeMatchingProducts: true });

  res.json({ success: true, data });
});

module.exports = {
  productRules,
  alertSettingsRules,
  normalizeProductRequest,
  getProducts,
  getProduct,
  getProductAlertSettings,
  updateProductAlertSettings,
  createProduct,
  updateProduct,
  deleteProduct,
};
