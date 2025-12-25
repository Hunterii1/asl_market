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
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock data based on report type
      let reportData: ReportData;

      switch (options.type) {
        case 'sales':
          reportData = {
            title: 'گزارش فروش',
            generatedAt: new Date().toLocaleString('fa-IR'),
            dateRange: getDateRangeLabel(options.dateRange),
            summary: {
              total: 125000000,
              count: 1234,
              average: 101297,
              growth: 12.5,
            },
            data: generateMockSalesData(),
          };
          break;

        case 'users':
          reportData = {
            title: 'گزارش کاربران',
            generatedAt: new Date().toLocaleString('fa-IR'),
            dateRange: getDateRangeLabel(options.dateRange),
            summary: {
              total: 12847,
              count: 234,
              average: 54.9,
              growth: 8.2,
            },
            data: generateMockUsersData(),
          };
          break;

        case 'products':
          reportData = {
            title: 'گزارش محصولات',
            generatedAt: new Date().toLocaleString('fa-IR'),
            dateRange: getDateRangeLabel(options.dateRange),
            summary: {
              total: 156,
              count: 45,
              average: 3.5,
              growth: 5.0,
            },
            data: generateMockProductsData(),
          };
          break;

        case 'financial':
          reportData = {
            title: 'گزارش مالی',
            generatedAt: new Date().toLocaleString('fa-IR'),
            dateRange: getDateRangeLabel(options.dateRange),
            summary: {
              total: 450000000,
              count: 5678,
              average: 79280,
              growth: 15.3,
            },
            data: generateMockFinancialData(),
          };
          break;

        case 'orders':
          reportData = {
            title: 'گزارش سفارشات',
            generatedAt: new Date().toLocaleString('fa-IR'),
            dateRange: getDateRangeLabel(options.dateRange),
            summary: {
              total: 234,
              count: 234,
              average: 534188,
              growth: -2.4,
            },
            data: generateMockOrdersData(),
          };
          break;

        default:
          reportData = {
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

      resolve(reportData);
    }, 1000);
  });
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

// Mock data generators
function generateMockSalesData() {
  return Array.from({ length: 10 }, (_, i) => ({
    date: `۱۴۰۳/۰۹/${15 + i}`,
    amount: Math.floor(Math.random() * 10000000) + 1000000,
    count: Math.floor(Math.random() * 50) + 10,
  }));
}

function generateMockUsersData() {
  return Array.from({ length: 10 }, (_, i) => ({
    date: `۱۴۰۳/۰۹/${15 + i}`,
    newUsers: Math.floor(Math.random() * 50) + 10,
    activeUsers: Math.floor(Math.random() * 200) + 100,
    totalUsers: 12000 + i * 10,
  }));
}

function generateMockProductsData() {
  return Array.from({ length: 10 }, (_, i) => ({
    name: `محصول ${i + 1}`,
    sales: Math.floor(Math.random() * 100) + 10,
    revenue: Math.floor(Math.random() * 5000000) + 500000,
    stock: Math.floor(Math.random() * 100),
  }));
}

function generateMockFinancialData() {
  return Array.from({ length: 10 }, (_, i) => ({
    date: `۱۴۰۳/۰۹/${15 + i}`,
    income: Math.floor(Math.random() * 20000000) + 5000000,
    expense: Math.floor(Math.random() * 10000000) + 2000000,
    profit: Math.floor(Math.random() * 10000000) + 3000000,
  }));
}

function generateMockOrdersData() {
  return Array.from({ length: 10 }, (_, i) => ({
    orderId: `ORD-${1000 + i}`,
    date: `۱۴۰۳/۰۹/${15 + i}`,
    customer: `کاربر ${i + 1}`,
    amount: Math.floor(Math.random() * 1000000) + 100000,
    status: ['completed', 'pending', 'cancelled'][Math.floor(Math.random() * 3)],
  }));
}

