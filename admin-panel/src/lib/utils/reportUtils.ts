import { adminApi } from '@/lib/api/adminApi';

export type ReportType = 'sales' | 'users' | 'products' | 'financial' | 'orders' | 'custom';
export type ReportFormat = 'pdf' | 'excel' | 'csv';
export type DateRange = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

export interface ReportOptions {
  type: ReportType;
  format: ReportFormat;
  dateRange: DateRange;
  startDate?: string;
  endDate?: string;
  includeCharts: boolean;
  includeDetails: boolean;
  filters?: {
    status?: string[];
    category?: string[];
    minAmount?: number;
    maxAmount?: number;
  };
}

export interface ReportData {
  title: string;
  generatedAt: string;
  dateRange: string;
  summary: {
    total: number;
    count: number;
    average?: number;
    growth?: number;
  };
  data: any[];
  charts?: any[];
}

/**
 * Generate report data based on options
 */
export async function generateReport(options: ReportOptions): Promise<ReportData> {
  const { type } = options;

  switch (type) {
    case 'sales':
      return generateSalesReport(options);
    case 'users':
      return generateUsersReport(options);
    case 'products':
      return generateProductsReport(options);
    case 'financial':
      return generateFinancialReport(options);
    case 'orders':
      return generateOrdersReport(options);
    default:
      return generateCustomReport(options);
  }
}

// ==================== Helpers ====================

function parseBackendDate(value: any): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function getRangeBounds(range: DateRange, start?: string, end?: string): { from: Date; to: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const clone = (d: Date) => new Date(d.getTime());

  let from = clone(today);
  let to = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1); // exclusive

  switch (range) {
    case 'today':
      break;
    case 'yesterday':
      from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
      to = clone(today);
      break;
    case 'last7days':
      from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
      to = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      break;
    case 'last30days':
      from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
      to = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      break;
    case 'thisMonth':
      from = new Date(today.getFullYear(), today.getMonth(), 1);
      to = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      break;
    case 'lastMonth':
      from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      to = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'thisYear':
      from = new Date(today.getFullYear(), 0, 1);
      to = new Date(today.getFullYear() + 1, 0, 1);
      break;
    case 'custom':
      if (start) {
        const s = new Date(start);
        if (!isNaN(s.getTime())) {
          from = new Date(s.getFullYear(), s.getMonth(), s.getDate());
        }
      }
      if (end) {
        const e = new Date(end);
        if (!isNaN(e.getTime())) {
          to = new Date(e.getFullYear(), e.getMonth(), e.getDate() + 1);
        }
      }
      break;
  }

  return { from, to };
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildEmptyDailySeries(from: Date, to: Date): Record<string, number> {
  const map: Record<string, number> = {};
  for (let d = new Date(from); d < to; d.setDate(d.getDate() + 1)) {
    map[formatDateKey(d)] = 0;
  }
  return map;
}

// ==================== Sales (Licenses) ====================

async function generateSalesReport(options: ReportOptions): Promise<ReportData> {
  const { from, to } = getRangeBounds(options.dateRange, options.startDate, options.endDate);

  let page = 1;
  const perPage = 100;
  const licenses: any[] = [];

  while (true) {
    const res = await adminApi.getLicenses({ page, per_page: perPage, status: 'used' });
    const data = (res.data || res) as any;
    const pageItems: any[] = data.licenses || res.licenses || [];
    const total: number = data.total ?? res.total ?? pageItems.length;

    licenses.push(...pageItems);

    if (pageItems.length < perPage || page * perPage >= total) {
      break;
    }
    page += 1;
  }

  const daily = buildEmptyDailySeries(from, to);

  for (const lic of licenses) {
    const usedAt = parseBackendDate(lic.used_at || lic.UsedAt);
    if (!usedAt) continue;
    if (usedAt < from || usedAt >= to) continue;
    const key = formatDateKey(usedAt);
    if (daily[key] === undefined) daily[key] = 0;
    daily[key] += 1;
  }

  const entries = Object.entries(daily).sort(([a], [b]) => (a < b ? -1 : 1));
  const data = entries.map(([date, count]) => ({
    date,
    count,
  }));

  const totalSales = data.reduce((sum, r) => sum + r.count, 0);
  const daysWithData = data.length || 1;

  return {
    title: 'گزارش فروش (بر اساس لایسنس‌های فعال‌شده)',
    generatedAt: new Date().toLocaleString('fa-IR'),
    dateRange: getDateRangeLabel(options.dateRange),
    summary: {
      total: totalSales,
      count: daysWithData,
      average: Number((totalSales / daysWithData).toFixed(2)),
    },
    data,
  };
}

// ==================== Users ====================

async function generateUsersReport(options: ReportOptions): Promise<ReportData> {
  const { from, to } = getRangeBounds(options.dateRange, options.startDate, options.endDate);

  let page = 1;
  const perPage = 100;
  const users: any[] = [];

  while (true) {
    const res = await adminApi.getUsers({ page, per_page: perPage });
    const data = (res.data || res) as any;
    const pageItems: any[] = data.users || res.users || [];
    const total: number = data.total ?? res.total ?? pageItems.length;

    users.push(...pageItems);

    if (pageItems.length < perPage || page * perPage >= total) {
      break;
    }
    page += 1;
  }

  const dailyNew = buildEmptyDailySeries(from, to);

  for (const u of users) {
    const createdAt = parseBackendDate(u.created_at || u.CreatedAt);
    if (!createdAt) continue;
    if (createdAt < from || createdAt >= to) continue;
    const key = formatDateKey(createdAt);
    if (dailyNew[key] === undefined) dailyNew[key] = 0;
    dailyNew[key] += 1;
  }

  // Build cumulative active users approximation
  const entries = Object.entries(dailyNew).sort(([a], [b]) => (a < b ? -1 : 1));
  let cumulative = 0;
  const data = entries.map(([date, newUsers]) => {
    cumulative += newUsers;
    return {
      date,
      newUsers,
      activeUsers: cumulative,
    };
  });

  const totalNew = data.reduce((sum, r) => sum + r.newUsers, 0);
  const daysWithData = data.length || 1;

  return {
    title: 'گزارش کاربران',
    generatedAt: new Date().toLocaleString('fa-IR'),
    dateRange: getDateRangeLabel(options.dateRange),
    summary: {
      total: totalNew,
      count: daysWithData,
      average: Number((totalNew / daysWithData).toFixed(2)),
    },
    data,
  };
}

// ==================== Products (Available Products) ====================

async function generateProductsReport(options: ReportOptions): Promise<ReportData> {
  const { from, to } = getRangeBounds(options.dateRange, options.startDate, options.endDate);

  let page = 1;
  const perPage = 100;
  const products: any[] = [];

  while (true) {
    const res = await adminApi.getAvailableProducts({ page, per_page: perPage });
    const data = (res.data || res) as any;
    const pageItems: any[] = data.products || res.products || [];
    const total: number = data.total ?? res.total ?? pageItems.length;

    products.push(...pageItems);

    if (pageItems.length < perPage || page * perPage >= total) {
      break;
    }
    page += 1;
  }

  const dailyNew = buildEmptyDailySeries(from, to);

  for (const p of products) {
    const createdAt = parseBackendDate(p.created_at || p.CreatedAt);
    if (!createdAt) continue;
    if (createdAt < from || createdAt >= to) continue;
    const key = formatDateKey(createdAt);
    if (dailyNew[key] === undefined) dailyNew[key] = 0;
    dailyNew[key] += 1;
  }

  const entries = Object.entries(dailyNew).sort(([a], [b]) => (a < b ? -1 : 1));
  const data = entries.map(([date, count]) => ({
    date,
    count,
  }));

  const totalProducts = data.reduce((sum, r) => sum + r.count, 0);
  const daysWithData = data.length || 1;

  return {
    title: 'گزارش محصولات در دسترس',
    generatedAt: new Date().toLocaleString('fa-IR'),
    dateRange: getDateRangeLabel(options.dateRange),
    summary: {
      total: totalProducts,
      count: daysWithData,
      average: Number((totalProducts / daysWithData).toFixed(2)),
    },
    data,
  };
}

// ==================== Financial (Withdrawals) ====================

async function generateFinancialReport(options: ReportOptions): Promise<ReportData> {
  const { from, to } = getRangeBounds(options.dateRange, options.startDate, options.endDate);

  let page = 1;
  const perPage = 100;
  const withdrawals: any[] = [];

  while (true) {
    const res = await adminApi.getWithdrawals({ page, per_page: perPage });
    const data = (res.data || res) as any;
    const pageItems: any[] = data.requests || data.items || res.requests || [];
    const total: number = data.total ?? res.total ?? pageItems.length;

    withdrawals.push(...pageItems);

    if (pageItems.length < perPage || page * perPage >= total) {
      break;
    }
    page += 1;
  }

  const daily = buildEmptyDailySeries(from, to);

  for (const w of withdrawals) {
    const requestedAt = parseBackendDate(w.requested_at || w.RequestedAt || w.created_at || w.CreatedAt);
    if (!requestedAt) continue;
    if (requestedAt < from || requestedAt >= to) continue;
    const key = formatDateKey(requestedAt);
    if (daily[key] === undefined) daily[key] = 0;
    daily[key] += Number(w.amount || w.Amount || 0);
  }

  const entries = Object.entries(daily).sort(([a], [b]) => (a < b ? -1 : 1));
  const data = entries.map(([date, amount]) => ({
    date,
    amount,
  }));

  const totalAmount = data.reduce((sum, r) => sum + r.amount, 0);
  const daysWithData = data.length || 1;

  return {
    title: 'گزارش مالی (مبالغ برداشت‌ها)',
    generatedAt: new Date().toLocaleString('fa-IR'),
    dateRange: getDateRangeLabel(options.dateRange),
    summary: {
      total: totalAmount,
      count: daysWithData,
      average: Number((totalAmount / daysWithData).toFixed(2)),
    },
    data,
  };
}

// ==================== Orders (treat each used license as an order) ====================

async function generateOrdersReport(options: ReportOptions): Promise<ReportData> {
  // برای سادگی، هر لایسنس استفاده‌شده را یک «سفارش» در نظر می‌گیریم
  const salesReport = await generateSalesReport(options);
  return {
    ...salesReport,
    title: 'گزارش سفارشات (بر اساس لایسنس‌های فعال‌شده)',
  };
}

// ==================== Custom ====================

async function generateCustomReport(options: ReportOptions): Promise<ReportData> {
  return {
    title: 'گزارش سفارشی',
    generatedAt: new Date().toLocaleString('fa-IR'),
    dateRange: getDateRangeLabel(options.dateRange),
    summary: {
      total: 0,
      count: 0,
    },
    data: [],
  };
}

/**
 * Export report to file
 */
export async function exportReport(
  reportData: ReportData,
  format: ReportFormat,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      onProgress?.(progress);
      if (progress >= 100) {
        clearInterval(interval);
        
        // Generate file content based on format
        let content = '';
        let filename = '';
        let mimeType = '';

        switch (format) {
          case 'csv':
            content = convertToCSV(reportData);
            filename = `report-${Date.now()}.csv`;
            mimeType = 'text/csv;charset=utf-8;';
            downloadFile(content, filename, mimeType);
            break;

          case 'excel':
            content = convertToCSV(reportData);
            filename = `report-${Date.now()}.csv`;
            mimeType = 'text/csv;charset=utf-8;';
            downloadFile(content, filename, mimeType);
            break;

          case 'pdf':
            // For PDF, we'll create a simple text representation
            // In a real app, you'd use a PDF library
            content = convertToText(reportData);
            filename = `report-${Date.now()}.txt`;
            mimeType = 'text/plain;charset=utf-8;';
            downloadFile(content, filename, mimeType);
            break;
        }

        resolve();
      }
    }, 100);
  });
}

function convertToCSV(data: ReportData): string {
  const rows: string[] = [];
  
  // Header
  rows.push(`گزارش: ${data.title}`);
  rows.push(`تاریخ تولید: ${data.generatedAt}`);
  rows.push(`بازه زمانی: ${data.dateRange}`);
  rows.push('');
  
  // Summary
  rows.push('خلاصه:');
  rows.push(`کل: ${data.summary.total.toLocaleString('fa-IR')}`);
  rows.push(`تعداد: ${data.summary.count.toLocaleString('fa-IR')}`);
  if (data.summary.average) {
    rows.push(`میانگین: ${data.summary.average.toLocaleString('fa-IR')}`);
  }
  rows.push('');
  
  // Data
  if (data.data.length > 0) {
    const headers = Object.keys(data.data[0]);
    rows.push(headers.join(','));
    data.data.forEach(item => {
      const values = headers.map(header => {
        const value = item[header];
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      rows.push(values.join(','));
    });
  }
  
  return rows.join('\n');
}

function convertToText(data: ReportData): string {
  let text = '';
  text += `گزارش: ${data.title}\n`;
  text += `تاریخ تولید: ${data.generatedAt}\n`;
  text += `بازه زمانی: ${data.dateRange}\n\n`;
  text += 'خلاصه:\n';
  text += `کل: ${data.summary.total.toLocaleString('fa-IR')}\n`;
  text += `تعداد: ${data.summary.count.toLocaleString('fa-IR')}\n`;
  if (data.summary.average) {
    text += `میانگین: ${data.summary.average.toLocaleString('fa-IR')}\n`;
  }
  text += '\n';
  text += 'جزئیات:\n';
  data.data.forEach((item, index) => {
    text += `${index + 1}. ${JSON.stringify(item, null, 2)}\n`;
  });
  return text;
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getDateRangeLabel(range: DateRange): string {
  const labels: Record<DateRange, string> = {
    today: 'امروز',
    yesterday: 'دیروز',
    last7days: '۷ روز گذشته',
    last30days: '۳۰ روز گذشته',
    thisMonth: 'این ماه',
    lastMonth: 'ماه گذشته',
    thisYear: 'امسال',
    custom: 'سفارشی',
  };
  return labels[range];
}
