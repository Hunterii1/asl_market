import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { adminApi } from '@/lib/api/adminApi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  CheckCircle2,
  Settings,
  Database,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  exportData,
  getAvailableColumns,
  getColumnMap,
  getHeaderMap,
  type ExportDataType,
  type ExportFormat,
  type ExportOptions,
} from '@/lib/utils/exportDataUtils';

const dataTypes: Array<{ value: ExportDataType; label: string; icon: any }> = [
  { value: 'users', label: 'کاربران', icon: Database },
  { value: 'products', label: 'محصولات', icon: Database },
  { value: 'admins', label: 'مدیران', icon: Database },
  { value: 'withdrawals', label: 'برداشت‌ها', icon: Database },
  { value: 'licenses', label: 'لایسنس‌ها', icon: Database },
  { value: 'tickets', label: 'تیکت‌ها', icon: Database },
  { value: 'education', label: 'آموزش', icon: Database },
  { value: 'suppliers', label: 'تامین‌کنندگان', icon: Database },
  { value: 'visitors', label: 'بازدیدکنندگان', icon: Database },
  { value: 'inventory', label: 'موجودی انبار', icon: Database },
  { value: 'popups', label: 'پاپ‌آپ‌ها', icon: Database },
  { value: 'notifications', label: 'اعلان‌ها', icon: Database },
];

export default function Export() {
  const [selectedDataType, setSelectedDataType] = useState<ExportDataType>('users');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('xlsx');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [dataCount, setDataCount] = useState(0);

  // Load data when data type changes
  useEffect(() => {
    loadData(selectedDataType);
  }, [selectedDataType]);

  // Reset columns when data type changes
  useEffect(() => {
    const columns = getAvailableColumns(selectedDataType);
    setSelectedColumns(columns.filter(col => col.default).map(col => col.id));
  }, [selectedDataType]);

  const loadData = async (dataType: ExportDataType) => {
    try {
      let response: any;
      
      switch (dataType) {
        case 'users':
          response = await adminApi.getUsers({ page: 1, per_page: 1000 });
          if (response?.data?.users) {
            setData(response.data.users);
            setDataCount(response.data.total || response.data.users.length);
          }
          break;
        case 'suppliers':
          response = await adminApi.getSuppliers({ page: 1, per_page: 1000 });
          if (response?.data?.suppliers || response?.suppliers) {
            setData(response.data?.suppliers || response.suppliers);
            setDataCount(response.data?.total || response.total || (response.data?.suppliers || response.suppliers).length);
          }
          break;
        case 'visitors':
          response = await adminApi.getVisitors({ page: 1, per_page: 1000 });
          if (response?.data?.visitors || response?.visitors) {
            setData(response.data?.visitors || response.visitors);
            setDataCount(response.data?.total || response.total || (response.data?.visitors || response.visitors).length);
          }
          break;
        case 'licenses':
          response = await adminApi.getLicenses({ page: 1, per_page: 1000 });
          if (response?.data?.licenses || response?.licenses) {
            setData(response.data?.licenses || response.licenses);
            setDataCount(response.data?.total || response.total || (response.data?.licenses || response.licenses).length);
          }
          break;
        case 'products':
          response = await adminApi.getProducts({ page: 1, per_page: 1000 });
          if (response?.data?.products || response?.products) {
            setData(response.data?.products || response.products);
            setDataCount(response.data?.total || response.total || (response.data?.products || response.products).length);
          }
          break;
        case 'tickets':
          response = await adminApi.getTickets({ page: 1, per_page: 1000 });
          if (response?.data?.tickets || response?.tickets) {
            setData(response.data?.tickets || response.tickets);
            setDataCount(response.data?.total || response.total || (response.data?.tickets || response.tickets).length);
          }
          break;
        case 'notifications':
          response = await adminApi.getNotifications({ page: 1, per_page: 1000 });
          if (response?.data?.notifications || response?.notifications) {
            setData(response.data?.notifications || response.notifications);
            setDataCount(response.data?.total || response.total || (response.data?.notifications || response.notifications).length);
          }
          break;
        case 'popups':
          response = await adminApi.getPopups({ page: 1, per_page: 1000 });
          if (response?.data?.popups || response?.popups) {
            setData(response.data?.popups || response.popups);
            setDataCount(response.data?.total || response.total || (response.data?.popups || response.popups).length);
          }
          break;
        default:
          // For other types, use localStorage as fallback
          const storageKey = `asll-${dataType}`;
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              setData(parsed);
              setDataCount(parsed.length);
            } catch {
              setData([]);
              setDataCount(0);
            }
          } else {
            setData([]);
            setDataCount(0);
          }
      }
    } catch (error: any) {
      console.error('Error loading data for export:', error);
      toast({
        title: 'خطا',
        description: error.message || 'خطا در بارگذاری داده‌ها',
        variant: 'destructive',
      });
      setData([]);
      setDataCount(0);
    }
  };

  const availableColumns = getAvailableColumns(selectedDataType);

  const handleToggleColumn = (columnId: string) => {
    setSelectedColumns(prev => {
      if (prev.includes(columnId)) {
        return prev.filter(id => id !== columnId);
      } else {
        return [...prev, columnId];
      }
    });
  };

  const handleSelectAllColumns = () => {
    if (selectedColumns.length === availableColumns.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(availableColumns.map(col => col.id));
    }
  };

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      toast({
        title: 'خطا',
        description: 'لطفا حداقل یک ستون را انتخاب کنید.',
        variant: 'destructive',
      });
      return;
    }

    if (data.length === 0) {
      toast({
        title: 'خطا',
        description: 'داده‌ای برای export وجود ندارد.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    setIsComplete(false);

    const options: ExportOptions = {
      format: selectedFormat,
      columns: selectedColumns,
      includeHeaders,
    };

    try {
      await exportData(data, selectedDataType, options, (progress) => {
        setExportProgress(progress);
      });

      setIsComplete(true);
      toast({
        title: 'موفقیت',
        description: `فایل با موفقیت دانلود شد. ${dataCount} رکورد export شد.`,
      });

      // Reset after 2 seconds
      setTimeout(() => {
        setIsComplete(false);
        setExportProgress(0);
        setIsExporting(false);
      }, 2000);
    } catch (error) {
      toast({
        title: 'خطا',
        description: error instanceof Error ? error.message : 'خطا در export کردن فایل',
        variant: 'destructive',
      });
      setIsExporting(false);
    }
  };

  const DataTypeIcon = dataTypes.find(dt => dt.value === selectedDataType)?.icon || Database;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">خروجی اکسل</h1>
            <p className="text-muted-foreground">خروجی گرفتن از داده‌های سیستم</p>
          </div>
        </div>

        {/* Export Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              تنظیمات خروجی
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Data Type Selection */}
            <div className="space-y-2">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Database className="w-4 h-4 text-muted-foreground" />
                نوع داده
              </Label>
              <Select
                value={selectedDataType}
                onValueChange={(value) => {
                  setSelectedDataType(value as ExportDataType);
                  setIsComplete(false);
                  setExportProgress(0);
                }}
                disabled={isExporting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="نوع داده را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  {dataTypes.map((dt) => {
                    const Icon = dt.icon;
                    return (
                      <SelectItem key={dt.value} value={dt.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {dt.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {dataCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {dataCount} رکورد موجود است
                </p>
              )}
            </div>

            <Separator />

            {/* Format Selection */}
            <div className="space-y-2">
              <Label className="text-base font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                فرمت خروجی
              </Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value="xlsx"
                    checked={selectedFormat === 'xlsx'}
                    onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                    disabled={isExporting}
                    className="w-4 h-4"
                  />
                  <FileSpreadsheet className="w-4 h-4 text-success" />
                  <span>Excel (XLSX)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value="csv"
                    checked={selectedFormat === 'csv'}
                    onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                    disabled={isExporting}
                    className="w-4 h-4"
                  />
                  <FileText className="w-4 h-4 text-info" />
                  <span>CSV</span>
                </label>
              </div>
            </div>

            <Separator />

            {/* Column Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  انتخاب ستون‌ها
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllColumns}
                  disabled={isExporting}
                >
                  {selectedColumns.length === availableColumns.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto p-4 border border-border rounded-lg bg-muted/30">
                {availableColumns.map((column) => (
                  <div key={column.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`column-${column.id}`}
                      checked={selectedColumns.includes(column.id)}
                      onCheckedChange={() => handleToggleColumn(column.id)}
                      disabled={isExporting}
                    />
                    <Label
                      htmlFor={`column-${column.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedColumns.length} از {availableColumns.length} ستون انتخاب شده
              </p>
            </div>

            <Separator />

            {/* Options */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeHeaders"
                  checked={includeHeaders}
                  onCheckedChange={setIncludeHeaders}
                  disabled={isExporting}
                />
                <Label htmlFor="includeHeaders" className="cursor-pointer">
                  شامل کردن سرستون‌ها
                </Label>
              </div>
            </div>

            <Separator />

            {/* Export Button */}
            <div className="flex flex-col gap-4">
              {isExporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">در حال export...</span>
                    <span className="font-medium">{exportProgress}%</span>
                  </div>
                  <Progress value={exportProgress} className="h-2" />
                </div>
              )}

              {isComplete && (
                <div className="flex items-center gap-2 text-success bg-success/10 p-3 rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Export با موفقیت انجام شد!</span>
                </div>
              )}

              <Button
                onClick={handleExport}
                disabled={isExporting || selectedColumns.length === 0 || data.length === 0}
                className="w-full min-h-[48px]"
                size="lg"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    در حال export...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 ml-2" />
                    دانلود فایل
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">راهنمای استفاده</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <p>نوع داده مورد نظر را از لیست انتخاب کنید.</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <p>فرمت خروجی (Excel یا CSV) را انتخاب کنید.</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <p>ستون‌های مورد نظر را انتخاب کنید.</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <p>روی دکمه "دانلود فایل" کلیک کنید.</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <p>فایل به صورت خودکار دانلود خواهد شد.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

