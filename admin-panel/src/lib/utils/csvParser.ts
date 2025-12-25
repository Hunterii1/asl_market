import { addUserSchema, type AddUserFormData } from '@/lib/validations/user';

export interface ParsedUserRow {
  rowNumber: number;
  data: Partial<AddUserFormData>;
  errors: string[];
  isValid: boolean;
}

/**
 * Parse CSV file content
 */
export function parseCSV(content: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentCell += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of cell
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\n' || (char === '\r' && nextChar !== '\n')) && !inQuotes) {
      // End of row
      currentRow.push(currentCell.trim());
      currentCell = '';
      if (currentRow.some(cell => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      // Skip \r\n combination
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
    } else if (char !== '\r') {
      // Regular character (skip \r when part of \r\n)
      currentCell += char;
    }
  }

  // Add last cell and row if exists
  if (currentCell.trim() || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(cell => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Parse CSV file and validate rows
 */
export function parseAndValidateCSV(
  content: string,
  hasHeader: boolean = true
): { rows: ParsedUserRow[]; headers: string[] } {
  const allRows = parseCSV(content);
  
  if (allRows.length === 0) {
    throw new Error('فایل خالی است');
  }

  const headers = hasHeader ? allRows[0] : [];
  const dataRows = hasHeader ? allRows.slice(1) : allRows;

  // Expected headers (Persian)
  const expectedHeaders = ['نام', 'ایمیل', 'تلفن', 'تلگرام', 'موجودی', 'وضعیت'];
  const expectedHeadersEn = ['name', 'email', 'phone', 'telegramId', 'balance', 'status'];

  // Map headers
  const headerMap: Record<string, string> = {};
  if (hasHeader && headers.length > 0) {
    headers.forEach((header, index) => {
      const cleanHeader = header.trim().toLowerCase();
      // Check Persian headers
      const persianIndex = expectedHeaders.findIndex(h => h === header.trim());
      if (persianIndex !== -1) {
        headerMap[expectedHeadersEn[persianIndex]] = index.toString();
      } else {
        // Check English headers
        const enIndex = expectedHeadersEn.findIndex(h => h.toLowerCase() === cleanHeader);
        if (enIndex !== -1) {
          headerMap[expectedHeadersEn[enIndex]] = index.toString();
        }
      }
    });
  } else {
    // Default mapping if no headers
    expectedHeadersEn.forEach((header, index) => {
      headerMap[header] = index.toString();
    });
  }

  const parsedRows: ParsedUserRow[] = [];

  dataRows.forEach((row, index) => {
    const rowNumber = index + (hasHeader ? 2 : 1); // +1 for header, +1 for 1-based index
    const errors: string[] = [];

    // Skip empty rows
    if (row.every(cell => !cell.trim())) {
      return;
    }

    // Extract data based on header mapping
    const getCell = (key: string): string => {
      const colIndex = parseInt(headerMap[key] || '-1');
      return colIndex >= 0 && colIndex < row.length ? row[colIndex].trim() : '';
    };

    const rawData: Partial<AddUserFormData> = {
      name: getCell('name') || '',
      email: getCell('email') || '',
      phone: getCell('phone') || '',
      telegramId: getCell('telegramId') || '',
      balance: (() => {
        const balanceStr = getCell('balance');
        if (!balanceStr) return 0;
        const num = parseFloat(balanceStr.replace(/,/g, ''));
        return isNaN(num) ? 0 : num;
      })(),
      status: (() => {
        const statusStr = getCell('status').toLowerCase();
        if (['active', 'فعال', '1', 'true'].includes(statusStr)) return 'active';
        if (['inactive', 'غیرفعال', '0', 'false'].includes(statusStr)) return 'inactive';
        if (['banned', 'مسدود'].includes(statusStr)) return 'banned';
        return 'active' as const;
      })(),
    };

    // Validate using zod schema
    const validationResult = addUserSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      validationResult.error.errors.forEach(error => {
        errors.push(`${error.path.join('.')}: ${error.message}`);
      });
    }

    parsedRows.push({
      rowNumber,
      data: rawData,
      errors,
      isValid: errors.length === 0,
    });
  });

  return { rows: parsedRows, headers: hasHeader ? headers : expectedHeaders };
}

/**
 * Generate CSV template
 */
export function generateCSVTemplate(): string {
  const headers = ['نام', 'ایمیل', 'تلفن', 'تلگرام', 'موجودی', 'وضعیت'];
  const exampleRow = ['علی محمدی', 'ali@example.com', '09123456789', '@ali_mohammadi', '100000', 'فعال'];
  
  return [headers, exampleRow].map(row => row.join(',')).join('\n');
}

/**
 * Download CSV template
 */
export function downloadCSVTemplate(): void {
  const content = generateCSVTemplate();
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'template-users.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

