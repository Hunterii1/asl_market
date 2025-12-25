import { useState, useRef } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  parseAndValidateCSV,
  downloadCSVTemplate,
  type ParsedUserRow,
} from '@/lib/utils/csvParser';
import { type AddUserFormData } from '@/lib/validations/user';

interface ImportUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (count: number) => void;
}

// Mock API function for bulk import
const importUsers = async (users: AddUserFormData[]): Promise<{ success: number; failed: number }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate import with 95% success rate
      const success = Math.floor(users.length * 0.95);
      const failed = users.length - success;
      
      // Save to localStorage
      const existingUsers = JSON.parse(localStorage.getItem('asll-users') || '[]');
      const newUsers = users.slice(0, success).map((user, index) => ({
        id: (Date.now() + index).toString(),
        ...user,
        createdAt: new Date().toLocaleDateString('fa-IR'),
      }));
      existingUsers.push(...newUsers);
      localStorage.setItem('asll-users', JSON.stringify(existingUsers));
      
      resolve({ success, failed });
    }, 2000);
  });
};

export function ImportUsersDialog({ open, onOpenChange, onSuccess }: ImportUsersDialogProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [parsedRows, setParsedRows] = useState<ParsedUserRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validRows = parsedRows.filter(row => row.isValid);
  const invalidRows = parsedRows.filter(row => !row.isValid);
  const allValidSelected = validRows.length > 0 && selectedRows.size === validRows.length;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      toast({
        title: 'خطا',
        description: 'فقط فایل‌های CSV و Excel مجاز هستند.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'خطا',
        description: 'حجم فایل نباید بیشتر از ۵ مگابایت باشد.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const text = await file.text();
      const result = parseAndValidateCSV(text, true);
      
      if (result.rows.length === 0) {
        toast({
          title: 'خطا',
          description: 'هیچ داده‌ای در فایل یافت نشد.',
          variant: 'destructive',
        });
        return;
      }

      setParsedRows(result.rows);
      // Auto-select all valid rows
      const validIndices = new Set(
        result.rows
          .map((row, index) => row.isValid ? index : -1)
          .filter(index => index !== -1)
      );
      setSelectedRows(validIndices);
      setStep('preview');
      
      toast({
        title: 'موفقیت',
        description: `${result.rows.length} ردیف از فایل خوانده شد.`,
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: error instanceof Error ? error.message : 'خطا در خواندن فایل',
        variant: 'destructive',
      });
    }
  };

  const handleToggleRow = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const handleToggleAll = () => {
    if (allValidSelected) {
      setSelectedRows(new Set());
    } else {
      const validIndices = new Set(
        validRows.map((_, index) => parsedRows.indexOf(validRows[index]))
      );
      setSelectedRows(validIndices);
    }
  };

  const handleImport = async () => {
    const rowsToImport = parsedRows.filter((_, index) => selectedRows.has(index));
    const usersToImport = rowsToImport
      .filter(row => row.isValid)
      .map(row => row.data as AddUserFormData);

    if (usersToImport.length === 0) {
      toast({
        title: 'خطا',
        description: 'لطفا حداقل یک ردیف معتبر انتخاب کنید.',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    setStep('importing');
    setImportProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const result = await importUsers(usersToImport);
      clearInterval(progressInterval);
      setImportProgress(100);
      setImportResult(result);
      setStep('complete');
      
      toast({
        title: 'موفقیت',
        description: `${result.success} کاربر با موفقیت وارد شد.`,
      });
      
      onSuccess?.(result.success);
    } catch (error) {
      clearInterval(progressInterval);
      toast({
        title: 'خطا',
        description: error instanceof Error ? error.message : 'خطا در واردسازی کاربران',
        variant: 'destructive',
      });
      setStep('preview');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setParsedRows([]);
    setSelectedRows(new Set());
    setImportProgress(0);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      handleReset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Upload className="w-5 h-5 text-primary" />
            واردسازی گروهی کاربران
          </DialogTitle>
          <DialogDescription className="text-right">
            فایل CSV یا Excel حاوی اطلاعات کاربران را آپلود کنید
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6">
            {/* Download Template */}
            <div className="bg-muted/50 rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">دانلود قالب فایل</p>
                    <p className="text-sm text-muted-foreground">
                      برای اطمینان از فرمت صحیح، ابتدا قالب را دانلود کنید
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={downloadCSVTemplate}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  دانلود قالب
                </Button>
              </div>
            </div>

            {/* Upload Area */}
            <div
              className={cn(
                'border-2 border-dashed rounded-xl p-12 text-center transition-all',
                'hover:border-primary/50 hover:bg-primary/5 cursor-pointer',
                'flex flex-col items-center justify-center gap-4'
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">
                  فایل را اینجا رها کنید یا کلیک کنید
                </p>
                <p className="text-sm text-muted-foreground">
                  فرمت‌های مجاز: CSV, Excel (حداکثر ۵ مگابایت)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Instructions */}
            <div className="bg-info/10 border border-info/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-info shrink-0 mt-0.5" />
                <div className="text-sm space-y-2 text-right">
                  <p className="font-medium text-foreground">نکات مهم:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>ستون‌های مورد نیاز: نام، ایمیل، تلفن، تلگرام، موجودی، وضعیت</li>
                    <li>ردیف اول فایل باید شامل نام ستون‌ها باشد</li>
                    <li>وضعیت می‌تواند: فعال، غیرفعال یا مسدود باشد</li>
                    <li>موجودی باید عدد باشد (می‌تواند صفر باشد)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{parsedRows.length}</p>
                    <p className="text-sm text-muted-foreground">کل ردیف‌ها</p>
                  </div>
                </div>
              </div>
              <div className="bg-success/10 border border-success/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <div>
                    <p className="text-2xl font-bold text-success">{validRows.length}</p>
                    <p className="text-sm text-muted-foreground">معتبر</p>
                  </div>
                </div>
              </div>
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-destructive" />
                  <div>
                    <p className="text-2xl font-bold text-destructive">{invalidRows.length}</p>
                    <p className="text-sm text-muted-foreground">نامعتبر</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs for Valid/Invalid */}
            <Tabs defaultValue="valid" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="valid" className="gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  معتبر ({validRows.length})
                </TabsTrigger>
                {invalidRows.length > 0 && (
                  <TabsTrigger value="invalid" className="gap-2">
                    <XCircle className="w-4 h-4" />
                    نامعتبر ({invalidRows.length})
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="valid" className="mt-4">
                {validRows.length > 0 ? (
                  <div className="border border-border rounded-xl overflow-hidden">
                    <div className="bg-muted/50 p-4 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={allValidSelected}
                          onChange={handleToggleAll}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-foreground">
                          انتخاب همه ({selectedRows.size} از {validRows.length})
                        </span>
                      </div>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead className="text-right">ردیف</TableHead>
                            <TableHead className="text-right">نام</TableHead>
                            <TableHead className="text-right">ایمیل</TableHead>
                            <TableHead className="text-right">تلفن</TableHead>
                            <TableHead className="text-right">تلگرام</TableHead>
                            <TableHead className="text-right">موجودی</TableHead>
                            <TableHead className="text-right">وضعیت</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validRows.map((row, index) => {
                            const globalIndex = parsedRows.indexOf(row);
                            const isSelected = selectedRows.has(globalIndex);
                            return (
                              <TableRow key={globalIndex}>
                                <TableCell>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleRow(globalIndex)}
                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                  />
                                </TableCell>
                                <TableCell className="text-right">{row.rowNumber}</TableCell>
                                <TableCell className="text-right">{row.data.name}</TableCell>
                                <TableCell className="text-right font-mono text-sm">{row.data.email}</TableCell>
                                <TableCell className="text-right">{row.data.phone}</TableCell>
                                <TableCell className="text-right font-mono text-sm">{row.data.telegramId}</TableCell>
                                <TableCell className="text-right">
                                  {row.data.balance?.toLocaleString('fa-IR')} تومان
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      row.data.status === 'active' && 'bg-success/10 text-success border-success/20',
                                      row.data.status === 'inactive' && 'bg-muted text-muted-foreground',
                                      row.data.status === 'banned' && 'bg-destructive/10 text-destructive border-destructive/20'
                                    )}
                                  >
                                    {row.data.status === 'active' && 'فعال'}
                                    {row.data.status === 'inactive' && 'غیرفعال'}
                                    {row.data.status === 'banned' && 'مسدود'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    هیچ ردیف معتبری یافت نشد
                  </div>
                )}
              </TabsContent>

              <TabsContent value="invalid" className="mt-4">
                {invalidRows.length > 0 ? (
                  <div className="border border-destructive/20 rounded-xl overflow-hidden">
                    <div className="max-h-[400px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right">ردیف</TableHead>
                            <TableHead className="text-right">داده‌ها</TableHead>
                            <TableHead className="text-right">خطاها</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invalidRows.map((row, index) => {
                            const globalIndex = parsedRows.indexOf(row);
                            return (
                              <TableRow key={globalIndex}>
                                <TableCell className="text-right">{row.rowNumber}</TableCell>
                                <TableCell className="text-right">
                                  <div className="space-y-1 text-sm">
                                    <p><span className="text-muted-foreground">نام:</span> {row.data.name || '-'}</p>
                                    <p><span className="text-muted-foreground">ایمیل:</span> {row.data.email || '-'}</p>
                                    <p><span className="text-muted-foreground">تلفن:</span> {row.data.phone || '-'}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    {row.errors.map((error, errIndex) => (
                                      <Badge
                                        key={errIndex}
                                        variant="destructive"
                                        className="block text-xs text-right"
                                      >
                                        {error}
                                      </Badge>
                                    ))}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {step === 'importing' && (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">در حال واردسازی...</p>
              <p className="text-sm text-muted-foreground">
                لطفا صبر کنید، این فرآیند ممکن است چند لحظه طول بکشد
              </p>
            </div>
            <Progress value={importProgress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">
              {importProgress}% تکمیل شده
            </p>
          </div>
        )}

        {step === 'complete' && importResult && (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">واردسازی با موفقیت انجام شد!</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✅ {importResult.success} کاربر با موفقیت وارد شد</p>
                {importResult.failed > 0 && (
                  <p className="text-destructive">❌ {importResult.failed} کاربر با خطا مواجه شد</p>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse">
          {step === 'upload' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                انصراف
              </Button>
              <Button onClick={downloadCSVTemplate} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                دانلود قالب
              </Button>
            </>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={handleReset} disabled={isImporting}>
                شروع مجدد
              </Button>
              <Button
                onClick={handleImport}
                disabled={selectedRows.size === 0 || isImporting}
                className="gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    در حال واردسازی...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    واردسازی ({selectedRows.size})
                  </>
                )}
              </Button>
            </>
          )}

          {step === 'complete' && (
            <Button onClick={handleClose} className="w-full">
              بستن
            </Button>
          )}

          {step === 'importing' && (
            <Button disabled className="w-full">
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              در حال واردسازی...
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

