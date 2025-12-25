/**
 * Utility functions for exporting different data types to Excel/CSV
 */

export type ExportFormat = 'csv' | 'xlsx';
export type ExportDataType = 
  | 'users' 
  | 'products' 
  | 'admins' 
  | 'withdrawals' 
  | 'licenses' 
  | 'tickets' 
  | 'education' 
  | 'suppliers' 
  | 'visitors' 
  | 'inventory' 
  | 'popups' 
  | 'notifications';

export interface ExportColumn {
  id: string;
  label: string;
  default: boolean;
}

export interface ExportOptions {
  format: ExportFormat;
  columns: string[];
  includeHeaders: boolean;
  filters?: Record<string, any>;
}

/**
 * Convert data to CSV format
 */
export function convertToCSV(
  data: any[],
  columns: string[],
  columnMap: Record<string, (item: any) => string>,
  headerMap: Record<string, string>,
  includeHeaders: boolean = true
): string {
  const rows: string[] = [];

  // Add headers
  if (includeHeaders) {
    const headers = columns.map(col => {
      const header = headerMap[col] || col;
      return `"${header.replace(/"/g, '""')}"`;
    });
    rows.push(headers.join(','));
  }

  // Add data rows
  data.forEach(item => {
    const row = columns.map(col => {
      const value = columnMap[col]?.(item) || '';
      return `"${String(value).replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '')}"`;
    });
    rows.push(row.join(','));
  });

  return rows.join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string = 'export.csv'): void {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download Excel file (CSV format compatible with Excel)
 */
export function downloadExcel(content: string, filename: string = 'export.xlsx'): void {
  const csvFilename = filename.replace(/\.xlsx?$/, '.csv');
  downloadCSV(content, csvFilename);
}

/**
 * Get available columns for each data type
 */
export function getAvailableColumns(dataType: ExportDataType): ExportColumn[] {
  switch (dataType) {
    case 'users':
      return [
        { id: 'id', label: 'شناسه', default: false },
        { id: 'name', label: 'نام', default: true },
        { id: 'email', label: 'ایمیل', default: true },
        { id: 'phone', label: 'تلفن', default: true },
        { id: 'telegramId', label: 'آیدی تلگرام', default: true },
        { id: 'balance', label: 'موجودی', default: true },
        { id: 'status', label: 'وضعیت', default: true },
        { id: 'createdAt', label: 'تاریخ ثبت', default: true },
      ];
    
    case 'products':
      return [
        { id: 'id', label: 'شناسه', default: false },
        { id: 'name', label: 'نام محصول', default: true },
        { id: 'description', label: 'توضیحات', default: false },
        { id: 'price', label: 'قیمت', default: true },
        { id: 'category', label: 'دسته‌بندی', default: true },
        { id: 'stock', label: 'موجودی', default: true },
        { id: 'status', label: 'وضعیت', default: true },
        { id: 'sku', label: 'SKU', default: false },
        { id: 'sales', label: 'فروش', default: false },
        { id: 'createdAt', label: 'تاریخ ایجاد', default: true },
      ];
    
    case 'admins':
      return [
        { id: 'id', label: 'شناسه', default: false },
        { id: 'name', label: 'نام', default: true },
        { id: 'email', label: 'ایمیل', default: true },
        { id: 'role', label: 'نقش', default: true },
        { id: 'status', label: 'وضعیت', default: true },
        { id: 'createdAt', label: 'تاریخ ایجاد', default: true },
      ];
    
    case 'withdrawals':
      return [
        { id: 'id', label: 'شناسه', default: false },
        { id: 'userId', label: 'شناسه کاربر', default: true },
        { id: 'amount', label: 'مبلغ', default: true },
        { id: 'method', label: 'روش پرداخت', default: true },
        { id: 'status', label: 'وضعیت', default: true },
        { id: 'createdAt', label: 'تاریخ ایجاد', default: true },
      ];
    
    case 'licenses':
      return [
        { id: 'id', label: 'شناسه', default: false },
        { id: 'code', label: 'کد لایسنس', default: true },
        { id: 'userId', label: 'شناسه کاربر', default: true },
        { id: 'productId', label: 'شناسه محصول', default: true },
        { id: 'type', label: 'نوع', default: true },
        { id: 'status', label: 'وضعیت', default: true },
        { id: 'expiresAt', label: 'تاریخ انقضا', default: true },
        { id: 'createdAt', label: 'تاریخ ایجاد', default: true },
      ];
    
    case 'tickets':
      return [
        { id: 'id', label: 'شناسه', default: false },
        { id: 'subject', label: 'موضوع', default: true },
        { id: 'category', label: 'دسته‌بندی', default: true },
        { id: 'priority', label: 'اولویت', default: true },
        { id: 'status', label: 'وضعیت', default: true },
        { id: 'userId', label: 'شناسه کاربر', default: true },
        { id: 'createdAt', label: 'تاریخ ایجاد', default: true },
      ];
    
    case 'education':
      return [
        { id: 'id', label: 'شناسه', default: false },
        { id: 'title', label: 'عنوان', default: true },
        { id: 'category', label: 'دسته‌بندی', default: true },
        { id: 'level', label: 'سطح', default: true },
        { id: 'status', label: 'وضعیت', default: true },
        { id: 'price', label: 'قیمت', default: true },
        { id: 'views', label: 'بازدید', default: false },
        { id: 'createdAt', label: 'تاریخ ایجاد', default: true },
      ];
    
    case 'suppliers':
      return [
        { id: 'id', label: 'شناسه', default: false },
        { id: 'name', label: 'نام', default: true },
        { id: 'companyName', label: 'نام شرکت', default: true },
        { id: 'email', label: 'ایمیل', default: true },
        { id: 'phone', label: 'تلفن', default: true },
        { id: 'category', label: 'دسته‌بندی', default: true },
        { id: 'status', label: 'وضعیت', default: true },
        { id: 'rating', label: 'امتیاز', default: false },
        { id: 'createdAt', label: 'تاریخ ایجاد', default: true },
      ];
    
    case 'visitors':
      return [
        { id: 'id', label: 'شناسه', default: false },
        { id: 'ip', label: 'IP', default: true },
        { id: 'browser', label: 'مرورگر', default: true },
        { id: 'os', label: 'سیستم عامل', default: true },
        { id: 'deviceType', label: 'نوع دستگاه', default: true },
        { id: 'country', label: 'کشور', default: false },
        { id: 'city', label: 'شهر', default: false },
        { id: 'visitedPage', label: 'صفحه بازدید شده', default: true },
        { id: 'createdAt', label: 'تاریخ', default: true },
      ];
    
    case 'inventory':
      return [
        { id: 'id', label: 'شناسه', default: false },
        { id: 'productName', label: 'نام محصول', default: true },
        { id: 'sku', label: 'SKU', default: true },
        { id: 'quantity', label: 'تعداد کل', default: true },
        { id: 'availableQuantity', label: 'موجود', default: true },
        { id: 'status', label: 'وضعیت', default: true },
        { id: 'warehouse', label: 'انبار', default: false },
        { id: 'location', label: 'مکان', default: false },
        { id: 'createdAt', label: 'تاریخ ایجاد', default: true },
      ];
    
    case 'popups':
      return [
        { id: 'id', label: 'شناسه', default: false },
        { id: 'title', label: 'عنوان', default: true },
        { id: 'type', label: 'نوع', default: true },
        { id: 'status', label: 'وضعیت', default: true },
        { id: 'displayCount', label: 'تعداد نمایش', default: true },
        { id: 'clickCount', label: 'تعداد کلیک', default: false },
        { id: 'createdAt', label: 'تاریخ ایجاد', default: true },
      ];
    
    case 'notifications':
      return [
        { id: 'id', label: 'شناسه', default: false },
        { id: 'title', label: 'عنوان', default: true },
        { id: 'type', label: 'نوع', default: true },
        { id: 'status', label: 'وضعیت', default: true },
        { id: 'priority', label: 'اولویت', default: true },
        { id: 'readCount', label: 'خوانده شده', default: true },
        { id: 'clickCount', label: 'کلیک', default: false },
        { id: 'createdAt', label: 'تاریخ ایجاد', default: true },
      ];
    
    default:
      return [];
  }
}

/**
 * Get column map for each data type
 */
export function getColumnMap(dataType: ExportDataType): Record<string, (item: any) => string> {
  switch (dataType) {
    case 'users':
      return {
        id: (item) => item.id,
        name: (item) => item.name,
        email: (item) => item.email,
        phone: (item) => item.phone,
        telegramId: (item) => item.telegramId || '',
        balance: (item) => item.balance?.toString() || '0',
        status: (item) => {
          const map: Record<string, string> = { active: 'فعال', inactive: 'غیرفعال', banned: 'مسدود' };
          return map[item.status] || item.status;
        },
        createdAt: (item) => item.createdAt || '',
      };
    
    case 'products':
      return {
        id: (item) => item.id,
        name: (item) => item.name,
        description: (item) => item.description || '',
        price: (item) => item.price?.toString() || '0',
        category: (item) => item.category || '',
        stock: (item) => item.stock?.toString() || '0',
        status: (item) => {
          const map: Record<string, string> = { active: 'فعال', inactive: 'غیرفعال', out_of_stock: 'ناموجود' };
          return map[item.status] || item.status;
        },
        sku: (item) => item.sku || '',
        sales: (item) => item.sales?.toString() || '0',
        createdAt: (item) => item.createdAt || '',
      };
    
    case 'admins':
      return {
        id: (item) => item.id,
        name: (item) => item.name,
        email: (item) => item.email,
        role: (item) => item.role || '',
        status: (item) => {
          const map: Record<string, string> = { active: 'فعال', inactive: 'غیرفعال', suspended: 'تعلیق شده' };
          return map[item.status] || item.status;
        },
        createdAt: (item) => item.createdAt || '',
      };
    
    case 'withdrawals':
      return {
        id: (item) => item.id,
        userId: (item) => item.userId || '',
        amount: (item) => item.amount?.toString() || '0',
        method: (item) => item.method || '',
        status: (item) => {
          const map: Record<string, string> = { pending: 'در انتظار', approved: 'تایید شده', rejected: 'رد شده', completed: 'تکمیل شده' };
          return map[item.status] || item.status;
        },
        createdAt: (item) => item.createdAt || '',
      };
    
    case 'licenses':
      return {
        id: (item) => item.id,
        code: (item) => item.code || '',
        userId: (item) => item.userId || '',
        productId: (item) => item.productId || '',
        type: (item) => item.type || '',
        status: (item) => {
          const map: Record<string, string> = { active: 'فعال', expired: 'منقضی شده', used: 'استفاده شده' };
          return map[item.status] || item.status;
        },
        expiresAt: (item) => item.expiresAt || '',
        createdAt: (item) => item.createdAt || '',
      };
    
    case 'tickets':
      return {
        id: (item) => item.id,
        subject: (item) => item.subject || '',
        category: (item) => item.category || '',
        priority: (item) => {
          const map: Record<string, string> = { low: 'پایین', medium: 'متوسط', high: 'بالا', urgent: 'فوری' };
          return map[item.priority] || item.priority;
        },
        status: (item) => {
          const map: Record<string, string> = { open: 'باز', in_progress: 'در حال بررسی', resolved: 'حل شده', closed: 'بسته' };
          return map[item.status] || item.status;
        },
        userId: (item) => item.userId || '',
        createdAt: (item) => item.createdAt || '',
      };
    
    case 'education':
      return {
        id: (item) => item.id,
        title: (item) => item.title || '',
        category: (item) => item.category || '',
        level: (item) => {
          const map: Record<string, string> = { beginner: 'مبتدی', intermediate: 'متوسط', advanced: 'پیشرفته' };
          return map[item.level] || item.level;
        },
        status: (item) => {
          const map: Record<string, string> = { draft: 'پیش‌نویس', published: 'منتشر شده', archived: 'آرشیو شده' };
          return map[item.status] || item.status;
        },
        price: (item) => item.price?.toString() || '0',
        views: (item) => item.views?.toString() || '0',
        createdAt: (item) => item.createdAt || '',
      };
    
    case 'suppliers':
      return {
        id: (item) => item.id,
        name: (item) => item.name || '',
        companyName: (item) => item.companyName || '',
        email: (item) => item.email || '',
        phone: (item) => item.phone || '',
        category: (item) => item.category || '',
        status: (item) => {
          const map: Record<string, string> = { active: 'فعال', inactive: 'غیرفعال', suspended: 'تعلیق شده' };
          return map[item.status] || item.status;
        },
        rating: (item) => item.rating?.toString() || '0',
        createdAt: (item) => item.createdAt || '',
      };
    
    case 'visitors':
      return {
        id: (item) => item.id,
        ip: (item) => item.ip || '',
        browser: (item) => item.browser || '',
        os: (item) => item.os || '',
        deviceType: (item) => item.deviceType || '',
        country: (item) => item.country || '',
        city: (item) => item.city || '',
        visitedPage: (item) => item.visitedPage || '',
        createdAt: (item) => item.createdAt || '',
      };
    
    case 'inventory':
      return {
        id: (item) => item.id,
        productName: (item) => item.productName || '',
        sku: (item) => item.sku || '',
        quantity: (item) => item.quantity?.toString() || '0',
        availableQuantity: (item) => item.availableQuantity?.toString() || '0',
        status: (item) => {
          const map: Record<string, string> = { in_stock: 'موجود', low_stock: 'موجودی کم', out_of_stock: 'ناموجود', reserved: 'رزرو شده' };
          return map[item.status] || item.status;
        },
        warehouse: (item) => item.warehouse || '',
        location: (item) => item.location || '',
        createdAt: (item) => item.createdAt || '',
      };
    
    case 'popups':
      return {
        id: (item) => item.id,
        title: (item) => item.title || '',
        type: (item) => {
          const map: Record<string, string> = { modal: 'Modal', banner: 'Banner', toast: 'Toast', slide_in: 'Slide-in' };
          return map[item.type] || item.type;
        },
        status: (item) => {
          const map: Record<string, string> = { active: 'فعال', inactive: 'غیرفعال', scheduled: 'زمان‌بندی شده' };
          return map[item.status] || item.status;
        },
        displayCount: (item) => item.displayCount?.toString() || '0',
        clickCount: (item) => item.clickCount?.toString() || '0',
        createdAt: (item) => item.createdAt || '',
      };
    
    case 'notifications':
      return {
        id: (item) => item.id,
        title: (item) => item.title || '',
        type: (item) => {
          const map: Record<string, string> = { system: 'سیستمی', email: 'ایمیل', sms: 'پیامک', telegram: 'تلگرام', push: 'Push' };
          return map[item.type] || item.type;
        },
        status: (item) => {
          const map: Record<string, string> = { sent: 'ارسال شده', pending: 'در انتظار', failed: 'ناموفق', draft: 'پیش‌نویس' };
          return map[item.status] || item.status;
        },
        priority: (item) => {
          const map: Record<string, string> = { low: 'پایین', medium: 'متوسط', high: 'بالا', urgent: 'فوری' };
          return map[item.priority] || item.priority;
        },
        readCount: (item) => item.readCount?.toString() || '0',
        clickCount: (item) => item.clickCount?.toString() || '0',
        createdAt: (item) => item.createdAt || '',
      };
    
    default:
      return {};
  }
}

/**
 * Get header map for each data type
 */
export function getHeaderMap(dataType: ExportDataType): Record<string, string> {
  const columns = getAvailableColumns(dataType);
  const headerMap: Record<string, string> = {};
  columns.forEach(col => {
    headerMap[col.id] = col.label;
  });
  return headerMap;
}

/**
 * Export data with progress callback
 */
export async function exportData(
  data: any[],
  dataType: ExportDataType,
  options: ExportOptions,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      onProgress?.(25);

      // Filter data if needed
      let filteredData = [...data];
      if (options.filters) {
        // Apply filters based on data type
        filteredData = applyFilters(filteredData, dataType, options.filters);
      }
      onProgress?.(50);

      // Get column map and header map
      const columnMap = getColumnMap(dataType);
      const headerMap = getHeaderMap(dataType);

      // Convert to CSV
      const content = convertToCSV(
        filteredData,
        options.columns,
        columnMap,
        headerMap,
        options.includeHeaders
      );
      onProgress?.(75);

      // Download
      const filename = `${dataType}-export-${new Date().toISOString().split('T')[0]}.${options.format === 'xlsx' ? 'csv' : 'csv'}`;
      if (options.format === 'xlsx') {
        downloadExcel(content, filename);
      } else {
        downloadCSV(content, filename);
      }
      onProgress?.(100);

      resolve();
    }, 500);
  });
}

/**
 * Apply filters to data
 */
function applyFilters(data: any[], dataType: ExportDataType, filters: Record<string, any>): any[] {
  let filtered = [...data];

  // Apply common filters
  if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
    filtered = filtered.filter(item => filters.status.includes(item.status));
  }

  // Apply data-type specific filters
  switch (dataType) {
    case 'users':
      if (filters.minBalance !== undefined) {
        filtered = filtered.filter(item => (item.balance || 0) >= filters.minBalance);
      }
      if (filters.maxBalance !== undefined) {
        filtered = filtered.filter(item => (item.balance || 0) <= filters.maxBalance);
      }
      break;
    
    case 'products':
      if (filters.minPrice !== undefined) {
        filtered = filtered.filter(item => (item.price || 0) >= filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        filtered = filtered.filter(item => (item.price || 0) <= filters.maxPrice);
      }
      if (filters.category && Array.isArray(filters.category) && filters.category.length > 0) {
        filtered = filtered.filter(item => filters.category.includes(item.category));
      }
      break;
    
    // Add more filters for other data types as needed
  }

  return filtered;
}

