/**
 * دسته‌بندی محصولات تأمین‌کنندگان (هماهنگ با فرانت اصلی و بک‌اند)
 * برای استفاده در فرم‌های ثبت/ویرایش تأمین‌کننده و محصولات
 */
export const PRODUCT_CATEGORIES = [
  { id: 'oil_petro', name: 'محصولات نفت و پتروشیمی' },
  { id: 'mineral', name: 'محصولات معدنی' },
  { id: 'agriculture_food', name: 'محصولات کشاورزی و غذایی' },
  { id: 'carpet_handicraft', name: 'فرش و صنایع دستی' },
  { id: 'processed_food_industrial_agri', name: 'مواد غذایی فرآوری شده و محصولات کشاورزی صنعتی' },
  { id: 'chemical_pharma', name: 'مواد شیمیایی و دارویی' },
  { id: 'textile', name: 'محصولات نساجی' },
  { id: 'machinery_industrial', name: 'ماشین‌آلات و تجهیزات صنعتی' },
  { id: 'glass_ceramic', name: 'محصولات شیشه‌ای و سرامیکی' },
  { id: 'building_materials', name: 'مصالح ساختمانی' },
  { id: 'household_appliances', name: 'لوازم خانگی' },
  { id: 'other', name: 'سایر موارد' },
] as const;

export type ProductCategoryId = (typeof PRODUCT_CATEGORIES)[number]['id'];
