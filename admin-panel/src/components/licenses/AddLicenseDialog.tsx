import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Key, Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { generateLicenseSchema, type GenerateLicenseFormData } from '@/lib/validations/license';
import { toast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/api/adminApi';

interface AddLicenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const TYPE_OPTIONS = [
  { value: 'plus', label: 'پلاس (۱۲ ماه)', duration: '۱۲ ماه' },
  { value: 'plus4', label: 'پلاس ۴ ماهه', duration: '۴ ماه' },
  { value: 'pro', label: 'پرو', duration: '۳۰ ماه' },
] as const;

export function AddLicenseDialog({ open, onOpenChange, onSuccess }: AddLicenseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const form = useForm<GenerateLicenseFormData>({
    resolver: zodResolver(generateLicenseSchema),
    defaultValues: {
      count: 10,
      type: 'plus',
    },
  });

  const onSubmit = async (data: GenerateLicenseFormData) => {
    setIsSubmitting(true);
    setGeneratedCodes([]);
    try {
      const response = await adminApi.generateLicenses(data.count, data.type);
      // Admin API returns data.data from backend → { message, count, type, duration, licenses }
      const codes = Array.isArray(response?.licenses) ? response.licenses : [];
      setGeneratedCodes(codes);
      const typeLabel = TYPE_OPTIONS.find(t => t.value === data.type)?.label ?? data.type;
      if (codes.length > 0) {
        toast({
          title: 'تولید لایسنس',
          description: `${codes.length} لایسنس ${typeLabel} با موفقیت تولید شد.`,
          variant: 'default',
        });
        onSuccess?.();
      } else {
        toast({
          title: 'خطا',
          description: 'پاسخی از سرور دریافت شد اما لیست لایسنس‌ها خالی است.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Generate licenses error:', error);
      toast({
        title: 'خطا در تولید لایسنس',
        description: error?.message || 'خطا در ارتباط با سرور. لطفا دوباره تلاش کنید.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    toast({ title: 'کپی شد', description: 'کد لایسنس در کلیپ‌بورد کپی شد.' });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    const text = generatedCodes.join('\n');
    navigator.clipboard.writeText(text);
    toast({ title: 'کپی شد', description: 'همه کدها در کلیپ‌بورد کپی شدند.' });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      if (!newOpen) {
        form.reset({ count: 10, type: 'plus' });
        setGeneratedCodes([]);
      }
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Key className="w-5 h-5 text-primary" />
            تولید لایسنس جدید
          </DialogTitle>
          <DialogDescription>
            تعداد و نوع لایسنس را انتخاب کنید. کدها مانند ربات تلگرام در سیستم ذخیره می‌شوند و هر کد یک‌بار توسط کاربر قابل استفاده است.
          </DialogDescription>
        </DialogHeader>

        {generatedCodes.length === 0 ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع لایسنس</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="نوع را انتخاب کنید" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label} ({opt.duration})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تعداد لایسنس (۱ تا ۱۰۰)</FormLabel>
                    <FormControl>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-right text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={field.value || ''}
                        onChange={(e) => {
                          const v = e.target.value ? parseInt(e.target.value, 10) : undefined;
                          field.onChange(v === undefined || Number.isNaN(v) ? 1 : Math.min(100, Math.max(1, v)));
                        }}
                        onBlur={field.onBlur}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[140px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      در حال تولید...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 ml-2" />
                      تولید لایسنس
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isSubmitting}
                >
                  انصراف
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {generatedCodes.length} لایسنس با موفقیت تولید شد. هر لایسنس فقط یک بار توسط کاربر قابل استفاده است.
            </p>
            <div className="flex justify-start">
              <Button type="button" variant="outline" size="sm" onClick={handleCopyAll}>
                <Copy className="w-4 h-4 ml-2" />
                کپی همه
              </Button>
            </div>
            <div className="max-h-[320px] overflow-y-auto rounded-xl border border-border bg-muted/30 p-3 space-y-2">
              {generatedCodes.map((code, index) => (
                <div
                  key={`${code}-${index}`}
                  className="flex items-center justify-between gap-2 rounded-lg bg-background px-3 py-2 font-mono text-sm"
                >
                  <span className="truncate dir-ltr text-left">{code}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleCopyCode(code, index)}
                  >
                    {copiedIndex === index ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
            <DialogFooter className="flex-row-reverse">
              <Button type="button" onClick={() => { setGeneratedCodes([]); }}>
                تولید مجدد
              </Button>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                بستن
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
