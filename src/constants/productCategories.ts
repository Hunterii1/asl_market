/**
 * دسته‌بندی محصولات تأمین‌کنندگان (هماهنگ با بک‌اند و فیلتر صفحه تأمین‌کنندگان)
 * مقدار value در دیتابیس (supplier_products.product_type) ذخیره می‌شود.
 */
export const PRODUCT_CATEGORIES = [
  { id: 'oil_petro', name: 'محصولات نفت و پتروشیمی', description: 'محصولات نفت، مواد پتروشیمی و کدهای شیمیایی' },
  { id: 'mineral', name: 'محصولات معدنی', description: 'سنگ آهن، فولاد، مس، روی، سرب، سیمان و...' },
  { id: 'agriculture_food', name: 'محصولات کشاورزی و غذایی', description: 'پسته، زعفران، خرما، کشمش، میوه‌ها و سبزیجات' },
  { id: 'carpet_handicraft', name: 'فرش و صنایع دستی', description: 'فرش و صنایع دستی' },
  { id: 'processed_food_industrial_agri', name: 'مواد غذایی فرآوری شده و محصولات کشاورزی صنعتی', description: 'مواد غذایی فرآوری شده و محصولات کشاورزی صنعتی' },
  { id: 'chemical_pharma', name: 'مواد شیمیایی و دارویی', description: 'مواد شیمیایی و دارویی' },
  { id: 'textile', name: 'محصولات نساجی', description: 'محصولات نساجی' },
  { id: 'machinery_industrial', name: 'ماشین‌آلات و تجهیزات صنعتی', description: 'ماشین‌آلات و تجهیزات صنعتی' },
  { id: 'glass_ceramic', name: 'محصولات شیشه‌ای و سرامیکی', description: 'محصولات شیشه‌ای و سرامیکی' },
  { id: 'building_materials', name: 'مصالح ساختمانی', description: 'مصالح ساختمانی' },
  { id: 'household_appliances', name: 'لوازم خانگی', description: 'لوازم خانگی' },
  { id: 'other', name: 'سایر موارد', description: 'در صورتی که در هیچ‌یک از دسته‌های بالا قرار نگیرد' },
] as const;

export type ProductCategoryId = typeof PRODUCT_CATEGORIES[number]['id'];

/** متن هشدار برای حوزه خدمات (صادرات خدمات در اصل مارکت انجام نمی‌شود) */
export const SUPPLIER_SERVICES_DISCLAIMER =
  'اگر در حوزه خدمات هستید (مثل خدمات روانشناسی، تعمیرگاهی و...) در بخش تأمین‌کنندگان ثبت‌نام نکنید. صادرات خدمات در اصل مارکت صورت نمی‌گیرد و این بخش فقط برای تأمین‌کنندگان کالا است.';
