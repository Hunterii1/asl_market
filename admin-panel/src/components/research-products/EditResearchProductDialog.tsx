import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Loader2,
  FileText,
  Hash,
  DollarSign,
  Globe,
  Target,
  TrendingUp,
  Calendar,
  Shield,
  ClipboardList,
  Award,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { addResearchProductSchema, type AddResearchProductFormData } from '@/lib/validations/research-product';
import { toast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/api/adminApi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ResearchProduct {
  id: string;
  name: string;
  hs_code?: string;
  category: string;
  description?: string;
  export_value?: string;
  import_value?: string;
  market_demand?: 'high' | 'medium' | 'low';
  profit_potential?: 'high' | 'medium' | 'low';
  competition_level?: 'high' | 'medium' | 'low';
  target_country?: string;
  target_countries?: string;
  iran_purchase_price?: string;
  target_country_price?: string;
  price_currency?: string;
  profit_margin?: string;
  seasonal_factors?: string;
  required_licenses?: string;
  quality_standards?: string;
  status: 'active' | 'inactive';
  priority?: number;
  created_at?: string;
  updated_at?: string;
  createdAt: string;
}

interface EditResearchProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ResearchProduct | null;
  onSuccess?: () => void;
}

export function EditResearchProductDialog({ open, onOpenChange, product, onSuccess }: EditResearchProductDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');

  const form = useForm<AddResearchProductFormData>({
    resolver: zodResolver(addResearchProductSchema),
    defaultValues: {
      name: '',
      hs_code: '',
      category: '',
      description: '',
      export_value: '',
      import_value: '',
      market_demand: undefined,
      profit_potential: undefined,
      competition_level: undefined,
      target_country: '',
      iran_purchase_price: '',
      target_country_price: '',
      price_currency: 'USD',
      target_countries: '',
      seasonal_factors: '',
      required_licenses: '',
      quality_standards: '',
      priority: 0,
    },
  });

  useEffect(() => {
    if (product && open) {
      form.reset({
        name: product.name || '',
        hs_code: product.hs_code || '',
        category: product.category || '',
        description: product.description || '',
        export_value: product.export_value || '',
        import_value: product.import_value || '',
        market_demand: product.market_demand || undefined,
        profit_potential: product.profit_potential || undefined,
        competition_level: product.competition_level || undefined,
        target_country: product.target_country || '',
        iran_purchase_price: product.iran_purchase_price || '',
        target_country_price: product.target_country_price || '',
        price_currency: product.price_currency || 'USD',
        target_countries: product.target_countries || '',
        seasonal_factors: product.seasonal_factors || '',
        required_licenses: product.required_licenses || '',
        quality_standards: product.quality_standards || '',
        priority: product.priority || 0,
      });
      setCurrentTab('basic');
    }
  }, [product, open, form]);

  const onSubmit = async (data: AddResearchProductFormData) => {
    if (!product) return;
    
    setIsSubmitting(true);
    try {
      await adminApi.updateResearchProduct(Number(product.id), data);
      toast({
        title: 'موفقیت',
        description: 'محصول تحقیقی با موفقیت به‌روزرسانی شد.',
        variant: 'default',
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطایی رخ داد. لطفا دوباره تلاش کنید.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      if (!newOpen) {
        form.reset();
        setCurrentTab('basic');
      }
      onOpenChange(newOpen);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-5 h-5 text-primary" />
            ویرایش محصول تحقیقی
          </DialogTitle>
          <DialogDescription>
            اطلاعات محصول تحقیقی را ویرایش کنید.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">اطلاعات پایه</TabsTrigger>
                <TabsTrigger value="market">تحلیل بازار</TabsTrigger>
                <TabsTrigger value="pricing">قیمت‌گذاری</TabsTrigger>
                <TabsTrigger value="advanced">اطلاعات تکمیلی</TabsTrigger>
              </TabsList>

              {/* Basic Information */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        نام محصول <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="نام محصول تحقیقی"
                          {...field}
                          disabled={isSubmitting}
                          className="text-right"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="hs_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-muted-foreground" />
                          HS Code
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="کد HS"
                            {...field}
                            disabled={isSubmitting}
                            className="text-right"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          دسته‌بندی <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="دسته‌بندی محصول"
                            {...field}
                            disabled={isSubmitting}
                            className="text-right"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        توضیحات
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="توضیحات کامل محصول..."
                          {...field}
                          disabled={isSubmitting}
                          className="min-h-[100px] text-right"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="export_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مقدار صادرات</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="حجم صادرات"
                            {...field}
                            disabled={isSubmitting}
                            className="text-right"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="import_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مقدار واردات</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="حجم واردات"
                            {...field}
                            disabled={isSubmitting}
                            className="text-right"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-muted-foreground" />
                        اولویت
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          disabled={isSubmitting}
                          className="text-right"
                          min="0"
                        />
                      </FormControl>
                      <FormDescription>
                        عدد بالاتر = اولویت بیشتر در نمایش
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Market Analysis */}
              <TabsContent value="market" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="market_demand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-muted-foreground" />
                          تقاضای بازار
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger className="text-right">
                              <SelectValue placeholder="انتخاب کنید" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="high">زیاد</SelectItem>
                            <SelectItem value="medium">متوسط</SelectItem>
                            <SelectItem value="low">کم</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="profit_potential"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          پتانسیل سود
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger className="text-right">
                              <SelectValue placeholder="انتخاب کنید" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="high">زیاد</SelectItem>
                            <SelectItem value="medium">متوسط</SelectItem>
                            <SelectItem value="low">کم</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="competition_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          سطح رقابت
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger className="text-right">
                              <SelectValue placeholder="انتخاب کنید" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="high">زیاد</SelectItem>
                            <SelectItem value="medium">متوسط</SelectItem>
                            <SelectItem value="low">کم</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="target_country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        کشور هدف اصلی
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="کشور هدف"
                          {...field}
                          disabled={isSubmitting}
                          className="text-right"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="target_countries"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        کشورهای هدف
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="لیست کشورهای هدف را وارد کنید..."
                          {...field}
                          disabled={isSubmitting}
                          className="min-h-[80px] text-right"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Pricing */}
              <TabsContent value="pricing" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="iran_purchase_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          قیمت خرید از ایران
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="قیمت"
                            {...field}
                            disabled={isSubmitting}
                            className="text-right"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="target_country_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          قیمت فروش در کشور هدف
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="قیمت"
                            {...field}
                            disabled={isSubmitting}
                            className="text-right"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price_currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>واحد پول</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger className="text-right">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="IRR">IRR</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Additional Information */}
              <TabsContent value="advanced" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="seasonal_factors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        عوامل فصلی
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="عوامل فصلی موثر بر این محصول..."
                          {...field}
                          disabled={isSubmitting}
                          className="min-h-[80px] text-right"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="required_licenses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        مجوزهای مورد نیاز
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="مجوزهای مورد نیاز برای صادرات..."
                          {...field}
                          disabled={isSubmitting}
                          className="min-h-[80px] text-right"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quality_standards"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-muted-foreground" />
                        استانداردهای کیفی
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="استانداردهای کیفی مورد نیاز..."
                          {...field}
                          disabled={isSubmitting}
                          className="min-h-[80px] text-right"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 ml-2" />
                    ذخیره تغییرات
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
      </DialogContent>
    </Dialog>
  );
}
