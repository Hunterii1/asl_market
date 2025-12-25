import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  CheckCircle2,
  Filter,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  exportUsers,
  getAvailableColumns,
  type ExportOptions,
  type UserExportData,
} from '@/lib/utils/exportUtils';

interface ExportUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserExportData[];
  selectedUserIds?: string[];
}

export function ExportUsersDialog({
  open,
  onOpenChange,
  users,
  selectedUserIds,
}: ExportUsersDialogProps) {
  const [format, setFormat] = useState<'csv' | 'xlsx'>('xlsx');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => {
    // Default columns
    return getAvailableColumns()
      .filter(col => col.default)
      .map(col => col.id);
  });
  const [exportScope, setExportScope] = useState<'all' | 'selected' | 'filtered'>(
    selectedUserIds && selectedUserIds.length > 0 ? 'selected' : 'all'
  );
  const [statusFilter, setStatusFilter] = useState<('active' | 'inactive' | 'banned')[]>([]);
  const [minBalance, setMinBalance] = useState<string>('');
  const [maxBalance, setMaxBalance] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const availableColumns = getAvailableColumns();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setIsExporting(false);
      setExportProgress(0);
      setIsComplete(false);
      if (selectedUserIds && selectedUserIds.length > 0) {
        setExportScope('selected');
      }
    }
  }, [open, selectedUserIds]);

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

  const handleToggleStatus = (status: 'active' | 'inactive' | 'banned') => {
    setStatusFilter(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const getFilteredCount = (): number => {
    let filtered = users;

    if (exportScope === 'selected' && selectedUserIds) {
      filtered = filtered.filter(user => selectedUserIds.includes(user.id));
    }

    if (statusFilter.length > 0) {
      filtered = filtered.filter(user => statusFilter.includes(user.status));
    }

    if (minBalance) {
      const min = parseFloat(minBalance.replace(/,/g, ''));
      if (!isNaN(min)) {
        filtered = filtered.filter(user => user.balance >= min);
      }
    }

    if (maxBalance) {
      const max = parseFloat(maxBalance.replace(/,/g, ''));
      if (!isNaN(max)) {
        filtered = filtered.filter(user => user.balance <= max);
      }
    }

    return filtered.length;
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

    setIsExporting(true);
    setExportProgress(0);
    setIsComplete(false);

    const options: ExportOptions = {
      format,
      columns: selectedColumns,
      includeHeaders,
      selectedUsers: exportScope === 'selected' ? selectedUserIds : undefined,
      filters: {
        status: statusFilter.length > 0 ? statusFilter : undefined,
        minBalance: minBalance ? parseFloat(minBalance.replace(/,/g, '')) : undefined,
        maxBalance: maxBalance ? parseFloat(maxBalance.replace(/,/g, '')) : undefined,
      },
    };

    try {
      await exportUsers(users, options, (progress) => {
        setExportProgress(progress);
      });

      setIsComplete(true);
      toast({
        title: 'موفقیت',
        description: `فایل با موفقیت دانلود شد. ${getFilteredCount()} کاربر export شد.`,
      });

      // Auto close after 2 seconds
      setTimeout(() => {
        handleClose();
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

  const handleClose = () => {
    if (!isExporting) {
      setIsComplete(false);
      setExportProgress(0);
      onOpenChange(false);
    }
  };

  const filteredCount = getFilteredCount();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Download className="w-5 h-5 text-primary" />
            خروجی اکسل / CSV
          </DialogTitle>
          <DialogDescription className="text-right">
            تنظیمات export را انتخاب کرده و فایل را دانلود کنید
          </DialogDescription>
        </DialogHeader>

        {!isComplete && (
          <div className="space-y-6">
            {/* Format Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                فرمت فایل
              </Label>
              <div className="flex gap-3">
                <Button
                  variant={format === 'xlsx' ? 'default' : 'outline'}
                  onClick={() => setFormat('xlsx')}
                  className="flex-1 gap-2"
                  disabled={isExporting}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel (.xlsx)
                </Button>
                <Button
                  variant={format === 'csv' ? 'default' : 'outline'}
                  onClick={() => setFormat('csv')}
                  className="flex-1 gap-2"
                  disabled={isExporting}
                >
                  <FileText className="w-4 h-4" />
                  CSV (.csv)
                </Button>
              </div>
            </div>

            <Separator />

            {/* Export Scope */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <Settings className="w-4 h-4 text-muted-foreground" />
                محدوده Export
              </Label>
              <Select
                value={exportScope}
                onValueChange={(value: 'all' | 'selected' | 'filtered') => setExportScope(value)}
                disabled={isExporting}
              >
                <SelectTrigger className="text-right">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    همه کاربران ({users.length})
                  </SelectItem>
                  {selectedUserIds && selectedUserIds.length > 0 && (
                    <SelectItem value="selected">
                      کاربران انتخاب شده ({selectedUserIds.length})
                    </SelectItem>
                  )}
                  <SelectItem value="filtered">
                    کاربران فیلتر شده ({filteredCount})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filters */}
            {exportScope === 'filtered' && (
              <div className="space-y-4 bg-muted/50 rounded-xl p-4 border border-border">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  فیلترها
                </Label>

                {/* Status Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">وضعیت</Label>
                  <div className="flex flex-wrap gap-3">
                    {(['active', 'inactive', 'banned'] as const).map(status => (
                      <div key={status} className="flex items-center gap-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={statusFilter.includes(status)}
                          onCheckedChange={() => handleToggleStatus(status)}
                          disabled={isExporting}
                        />
                        <Label
                          htmlFor={`status-${status}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {status === 'active' && 'فعال'}
                          {status === 'inactive' && 'غیرفعال'}
                          {status === 'banned' && 'مسدود'}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Balance Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">حداقل موجودی</Label>
                    <Input
                      type="text"
                      placeholder="۰"
                      value={minBalance}
                      onChange={(e) => setMinBalance(e.target.value)}
                      disabled={isExporting}
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">حداکثر موجودی</Label>
                    <Input
                      type="text"
                      placeholder="نامحدود"
                      value={maxBalance}
                      onChange={(e) => setMaxBalance(e.target.value)}
                      disabled={isExporting}
                      className="text-right"
                    />
                  </div>
                </div>

                <div className="text-sm text-muted-foreground bg-background/50 rounded-lg p-2">
                  تعداد کاربران فیلتر شده: <span className="font-semibold text-foreground">{filteredCount}</span>
                </div>
              </div>
            )}

            <Separator />

            {/* Column Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  انتخاب ستون‌ها
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllColumns}
                  disabled={isExporting}
                  className="text-xs"
                >
                  {selectedColumns.length === availableColumns.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border border-border rounded-xl p-4">
                {availableColumns.map(column => (
                  <div key={column.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`column-${column.id}`}
                      checked={selectedColumns.includes(column.id)}
                      onCheckedChange={() => handleToggleColumn(column.id)}
                      disabled={isExporting}
                    />
                    <Label
                      htmlFor={`column-${column.id}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Options */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">گزینه‌ها</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-headers"
                  checked={includeHeaders}
                  onCheckedChange={(checked) => setIncludeHeaders(checked === true)}
                  disabled={isExporting}
                />
                <Label htmlFor="include-headers" className="text-sm font-normal cursor-pointer">
                  شامل کردن نام ستون‌ها در فایل
                </Label>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">تعداد کاربران برای export:</span>
                <span className="text-lg font-bold text-primary">
                  {exportScope === 'selected' && selectedUserIds
                    ? selectedUserIds.length
                    : exportScope === 'filtered'
                    ? filteredCount
                    : users.length}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-muted-foreground">تعداد ستون‌های انتخاب شده:</span>
                <span className="text-lg font-bold text-primary">{selectedColumns.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Export Progress */}
        {isExporting && !isComplete && (
          <div className="space-y-4 py-8">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">در حال آماده‌سازی فایل...</p>
              <p className="text-sm text-muted-foreground">
                لطفا صبر کنید، این فرآیند ممکن است چند لحظه طول بکشد
              </p>
            </div>
            <Progress value={exportProgress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">
              {exportProgress}% تکمیل شده
            </p>
          </div>
        )}

        {/* Complete */}
        {isComplete && (
          <div className="space-y-4 py-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">فایل با موفقیت دانلود شد!</p>
              <p className="text-sm text-muted-foreground">
                فایل export شده شامل {filteredCount} کاربر می‌باشد
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse">
          {!isComplete && (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isExporting}>
                انصراف
              </Button>
              <Button
                onClick={handleExport}
                disabled={isExporting || selectedColumns.length === 0}
                className="gap-2 min-w-[120px]"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    در حال export...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    دانلود فایل
                  </>
                )}
              </Button>
            </>
          )}

          {isComplete && (
            <Button onClick={handleClose} className="w-full">
              بستن
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

