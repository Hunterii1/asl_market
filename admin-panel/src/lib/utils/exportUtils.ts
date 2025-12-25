import { type AddUserFormData } from '@/lib/validations/user';

export interface UserExportData {
  id: string;
  name: string;
  email: string;
  phone: string;
  telegramId: string;
  balance: number;
  status: 'active' | 'inactive' | 'banned';
  createdAt: string;
}

export interface ExportOptions {
  format: 'csv' | 'xlsx';
  columns: string[];
  includeHeaders: boolean;
  selectedUsers?: string[];
  filters?: {
    status?: ('active' | 'inactive' | 'banned')[];
    minBalance?: number;
    maxBalance?: number;
  };
}

/**
 * Convert data to CSV format
 */
export function convertToCSV(
  data: UserExportData[],
  columns: string[],
  includeHeaders: boolean = true
): string {
  const columnMap: Record<string, (user: UserExportData) => string> = {
    id: (user) => user.id,
    name: (user) => user.name,
    email: (user) => user.email,
    phone: (user) => user.phone,
    telegramId: (user) => user.telegramId,
    balance: (user) => user.balance.toString(),
    status: (user) => {
      const statusMap = {
        active: 'فعال',
        inactive: 'غیرفعال',
        banned: 'مسدود',
      };
      return statusMap[user.status];
    },
    createdAt: (user) => user.createdAt,
  };

  const headerMap: Record<string, string> = {
    id: 'شناسه',
    name: 'نام',
    email: 'ایمیل',
    phone: 'تلفن',
    telegramId: 'آیدی تلگرام',
    balance: 'موجودی',
    status: 'وضعیت',
    createdAt: 'تاریخ ثبت',
  };

  const rows: string[] = [];

  // Add headers
  if (includeHeaders) {
    const headers = columns.map(col => {
      const header = headerMap[col] || col;
      // Escape commas and quotes in headers
      return `"${header.replace(/"/g, '""')}"`;
    });
    rows.push(headers.join(','));
  }

  // Add data rows
  data.forEach(user => {
    const row = columns.map(col => {
      const value = columnMap[col]?.(user) || '';
      // Escape commas, quotes, and newlines in values
      return `"${String(value).replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '')}"`;
    });
    rows.push(row.join(','));
  });

  return rows.join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string = 'users-export.csv'): void {
  // Add BOM for Excel UTF-8 support
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
 * Convert data to Excel format (CSV with proper encoding for Excel)
 */
export function convertToExcel(
  data: UserExportData[],
  columns: string[],
  includeHeaders: boolean = true
): string {
  // Excel can read CSV files, so we use CSV format with UTF-8 BOM
  return convertToCSV(data, columns, includeHeaders);
}

/**
 * Download Excel file (CSV format compatible with Excel)
 */
export function downloadExcel(content: string, filename: string = 'users-export.xlsx'): void {
  // Change extension to .csv for Excel compatibility
  const csvFilename = filename.replace(/\.xlsx?$/, '.csv');
  downloadCSV(content, csvFilename);
}

/**
 * Filter users based on export options
 */
export function filterUsersForExport(
  users: UserExportData[],
  options: ExportOptions
): UserExportData[] {
  let filtered = [...users];

  // Filter by selected users
  if (options.selectedUsers && options.selectedUsers.length > 0) {
    filtered = filtered.filter(user => options.selectedUsers!.includes(user.id));
  }

  // Filter by status
  if (options.filters?.status && options.filters.status.length > 0) {
    filtered = filtered.filter(user => options.filters!.status!.includes(user.status));
  }

  // Filter by balance range
  if (options.filters?.minBalance !== undefined) {
    filtered = filtered.filter(user => user.balance >= options.filters!.minBalance!);
  }

  if (options.filters?.maxBalance !== undefined) {
    filtered = filtered.filter(user => user.balance <= options.filters!.maxBalance!);
  }

  return filtered;
}

/**
 * Export users with progress callback
 */
export async function exportUsers(
  users: UserExportData[],
  options: ExportOptions,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve) => {
    // Simulate processing time for large datasets
    setTimeout(() => {
      onProgress?.(25);

      // Filter users
      const filteredUsers = filterUsersForExport(users, options);
      onProgress?.(50);

      // Convert to format
      let content: string;
      if (options.format === 'csv' || options.format === 'xlsx') {
        content = convertToCSV(filteredUsers, options.columns, options.includeHeaders);
      } else {
        content = convertToCSV(filteredUsers, options.columns, options.includeHeaders);
      }
      onProgress?.(75);

      // Download
      if (options.format === 'xlsx') {
        downloadExcel(content, `users-export-${new Date().toISOString().split('T')[0]}.xlsx`);
      } else {
        downloadCSV(content, `users-export-${new Date().toISOString().split('T')[0]}.csv`);
      }
      onProgress?.(100);

      resolve();
    }, 500);
  });
}

/**
 * Get available columns
 */
export function getAvailableColumns(): Array<{ id: string; label: string; default: boolean }> {
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
}

