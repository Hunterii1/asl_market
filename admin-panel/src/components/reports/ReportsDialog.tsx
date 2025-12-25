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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import {
  FileSpreadsheet,
  Download,
  Loader2,
  CheckCircle2,
  BarChart3,
  Calendar,
  Filter,
  Eye,
  FileText,
  FileSpreadsheet as ExcelIcon,
  File,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  generateReport,
  exportReport,
  type ReportType,
  type ReportFormat,
  type DateRange,
  type ReportOptions,
  type ReportData,
} from '@/lib/utils/reportUtils';

interface ReportsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const reportTypes: Array<{ value: ReportType; label: string; icon: React.ElementType; description: string }> = [
  { value: 'sales', label: 'گزارش فروش', icon: BarChart3, description: 'آمار فروش و درآمد' },
  { value: 'users', label: 'گزارش کاربران', icon: FileText, description: 'آمار کاربران و رشد' },
  { value: 'products', label: 'گزارش محصولات', icon: FileSpreadsheet, description: 'آمار محصولات و فروش' },
  { value: 'financial', label: 'گزارش مالی', icon: BarChart3, description: 'درآمد و هزینه‌ها' },
  { value: 'orders', label: 'گزارش سفارشات', icon: FileText, description: 'سفارشات و تراکنش‌ها' },
  { value: 'custom', label: 'گزارش سفارشی', icon: File, description: 'گزارش با فیلترهای دلخواه' },
];

const dateRanges: Array<{ value: DateRange; label: string }> = [
  { value: 'today', label: 'امروز' },
  { value: 'yesterday', label: 'دیروز' },
  { value: 'last7days', label: '۷ روز گذشته' },
  { value: 'last30days', label: '۳۰ روز گذشته' },
  { value: 'thisMonth', label: 'این ماه' },
  { value: 'lastMonth', label: 'ماه گذشته' },
  { value: 'thisYear', label: 'امسال' },
  { value: 'custom', label: 'سفارشی' },
];

const formats: Array<{ value: ReportFormat; label: string; icon: React.ElementType }> = [
  { value: 'excel', label: 'Excel', icon: ExcelIcon },
  { value: 'csv', label: 'CSV', icon: FileText },
  { value: 'pdf', label: 'PDF', icon: File },
];

export function ReportsDialog({ open, onOpenChange }: ReportsDialogProps) {
  const [reportType, setReportType] = useState<ReportType>('sales');
  const [dateRange, setDateRange] = useState<DateRange>('last30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [format, setFormat] = useState<ReportFormat>('excel');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [exportProgress, setExportProgress] = useState(0);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (open) {
      setIsGenerating(false);
      setIsExporting(false);
      setGenerateProgress(0);
      setExportProgress(0);
      setReportData(null);
      setShowPreview(false);
    }
  }, [open]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerateProgress(0);

    const progressInterval = setInterval(() => {
      setGenerateProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 100);

    try {
      const options: ReportOptions = {
        type: reportType,
        format,
        dateRange,
        startDate: dateRange === 'custom' ? startDate : undefined,
        endDate: dateRange === 'custom' ? endDate : undefined,
        includeCharts,
        includeDetails,
      };

      const data = await generateReport(options);
      clearInterval(progressInterval);
      setGenerateProgress(100);
      setReportData(data);
      setShowPreview(true);
      
      toast({
        title: 'موفقیت',
        description: 'گزارش با موفقیت تولید شد.',
      });
    } catch (error) {
      clearInterval(progressInterval);
      toast({
        title: 'خطا',
        description: error instanceof Error ? error.message : 'خطا در تولید گزارش',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!reportData) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      await exportReport(reportData, format, (progress) => {
        setExportProgress(progress);
      });

      toast({
        title: 'موفقیت',
        description: 'گزارش با موفقیت دانلود شد.',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: error instanceof Error ? error.message : 'خطا در export کردن گزارش',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating && !isExporting) {
      setReportData(null);
      setShowPreview(false);
      onOpenChange(false);
    }
  };

  const selectedReportType = reportTypes.find(rt => rt.value === reportType);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            گزارش‌گیری
          </DialogTitle>
          <DialogDescription className="text-right">
            نوع گزارش و تنظیمات را انتخاب کرده و گزارش را تولید کنید
          </DialogDescription>
        </DialogHeader>

        {!showPreview && (
          <div className="space-y-6">
            {/* Report Type Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                نوع گزارش
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {reportTypes.map(type => {
                  const Icon = type.icon;
                  const isSelected = reportType === type.value;
                  return (
                    <Card
                      key={type.value}
                      className={cn(
                        'cursor-pointer transition-all border-2',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                      onClick={() => setReportType(type.value)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center',
                            isSelected ? 'bg-primary/10' : 'bg-muted'
                          )}>
                            <Icon className={cn(
                              'w-5 h-5',
                              isSelected ? 'text-primary' : 'text-muted-foreground'
                            )} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{type.label}</p>
                            <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Date Range */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                بازه زمانی
              </Label>
              <Select
                value={dateRange}
                onValueChange={(value: DateRange) => setDateRange(value)}
                disabled={isGenerating}
              >
                <SelectTrigger className="text-right">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateRanges.map(range => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>از تاریخ</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      disabled={isGenerating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>تا تاریخ</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      disabled={isGenerating}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Export Format */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <Download className="w-4 h-4 text-muted-foreground" />
                فرمت خروجی
              </Label>
              <div className="flex gap-3">
                {formats.map(formatOption => {
                  const Icon = formatOption.icon;
                  const isSelected = format === formatOption.value;
                  return (
                    <Button
                      key={formatOption.value}
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => setFormat(formatOption.value)}
                      disabled={isGenerating}
                      className="flex-1 gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      {formatOption.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Options */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">گزینه‌ها</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="include-charts"
                    checked={includeCharts}
                    onCheckedChange={(checked) => setIncludeCharts(checked === true)}
                    disabled={isGenerating}
                  />
                  <Label htmlFor="include-charts" className="text-sm font-normal cursor-pointer">
                    شامل نمودارها
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="include-details"
                    checked={includeDetails}
                    onCheckedChange={(checked) => setIncludeDetails(checked === true)}
                    disabled={isGenerating}
                  />
                  <Label htmlFor="include-details" className="text-sm font-normal cursor-pointer">
                    شامل جزئیات کامل
                  </Label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generating Progress */}
        {isGenerating && !reportData && (
          <div className="space-y-4 py-8">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">در حال تولید گزارش...</p>
              <p className="text-sm text-muted-foreground">
                لطفا صبر کنید، این فرآیند ممکن است چند لحظه طول بکشد
              </p>
            </div>
            <Progress value={generateProgress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">
              {generateProgress}% تکمیل شده
            </p>
          </div>
        )}

        {/* Preview */}
        {showPreview && reportData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{reportData.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {reportData.dateRange} - {reportData.generatedAt}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                تغییر تنظیمات
              </Button>
            </div>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">خلاصه گزارش</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">کل</p>
                    <p className="text-2xl font-bold text-foreground">
                      {reportData.summary.total.toLocaleString('fa-IR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">تعداد</p>
                    <p className="text-2xl font-bold text-foreground">
                      {reportData.summary.count.toLocaleString('fa-IR')}
                    </p>
                  </div>
                  {reportData.summary.average && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">میانگین</p>
                      <p className="text-2xl font-bold text-foreground">
                        {reportData.summary.average.toLocaleString('fa-IR')}
                      </p>
                    </div>
                  )}
                  {reportData.summary.growth !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">رشد</p>
                      <p className={cn(
                        'text-2xl font-bold',
                        reportData.summary.growth >= 0 ? 'text-success' : 'text-destructive'
                      )}>
                        {reportData.summary.growth >= 0 ? '+' : ''}{reportData.summary.growth}%
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Chart */}
            {includeCharts && reportData.data.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">نمودار</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={reportData.data.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                        <XAxis
                          dataKey={Object.keys(reportData.data[0])[0]}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '12px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey={Object.keys(reportData.data[0])[1]}
                          stroke="hsl(35, 92%, 50%)"
                          fill="hsl(35, 92%, 50%)"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Data Table */}
            {includeDetails && reportData.data.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">جزئیات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(reportData.data[0]).map(key => (
                            <TableHead key={key} className="text-right">
                              {key}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.data.slice(0, 20).map((row, index) => (
                          <TableRow key={index}>
                            {Object.values(row).map((value, cellIndex) => (
                              <TableCell key={cellIndex} className="text-right">
                                {typeof value === 'number' ? value.toLocaleString('fa-IR') : String(value)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {reportData.data.length > 20 && (
                    <p className="text-sm text-muted-foreground mt-4 text-center">
                      نمایش ۲۰ ردیف اول از {reportData.data.length} ردیف
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Export Progress */}
        {isExporting && (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">در حال آماده‌سازی فایل...</p>
            </div>
            <Progress value={exportProgress} className="h-2" />
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse">
          {!showPreview && (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isGenerating}>
                انصراف
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || (dateRange === 'custom' && (!startDate || !endDate))}
                className="gap-2 min-w-[120px]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    در حال تولید...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4" />
                    تولید گزارش
                  </>
                )}
              </Button>
            </>
          )}

          {showPreview && reportData && (
            <>
              <Button variant="outline" onClick={() => setShowPreview(false)} disabled={isExporting}>
                تغییر تنظیمات
              </Button>
              <Button
                onClick={handleExport}
                disabled={isExporting}
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
                    دانلود ({formats.find(f => f.value === format)?.label})
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

