import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Loader2,
  Package,
  DollarSign,
  Folder,
  Box,
  Image as ImageIcon,
  Tag,
  Hash,
  FileText,
  Percent,
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
import { Label } from '@/components/ui/label';
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
import { addProductSchema, productCategories, type AddProductFormData } from '@/lib/validations/product';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Mock API function
const createProduct = async (data: AddProductFormData): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.1) {
        reject(new Error('خطا در ارتباط با سرور. لطفا دوباره تلاش کنید.'));
      } else {
        // Save to localStorage
        const products = JSON.parse(localStorage.getItem('asll-products') || '[]');
        const newProduct = {
          id: Date.now().toString(),
          ...data,
          createdAt: new Date().toLocaleDateString('fa-IR'),
          sales: 0,
          revenue: 0,
        };
        products.push(newProduct);
        localStorage.setItem('asll-products', JSON.stringify(products));
        resolve();
      }
    }, 1500);
  });
};

export function AddProductDialog({ open, onOpenChange, onSuccess }: AddProductDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddProductFormData>({
    resolver: zodResolver(addProductSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category: '',
      stock: 0,
      status: 'active',
      tags: [],
      imageUrl: '',
      discount: 0,
      sku: '',
    },
  });

  const onSubmit = async (data: AddProductFormData) => {
    setIsSubmitting(true);
    try {
      await createProduct(data);
      toast({
        title: 'موفقیت',
        description: 'محصول با موفقیت افزوده شد.',
        variant: 'default',
      });
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'خطا',
        description: error instanceof Error ? error.message : 'خطایی رخ داد. لطفا دوباره تلاش کنید.',
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
      }
      onOpenChange(newOpen);
    }
  };

  const finalPrice = form.watch('price') && form.watch('discount')
    ? form.watch('price') * (1 - form.watch('discount')! / 100)
    : form.watch('price') || 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="w-5 h-5 text-primary" />
            افزودن محصول جدید
          </DialogTitle>
          <DialogDescription>
            اطلاعات محصول جدید را وارد کنید. فیلدهای ستاره‌دار الزامی هستند.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">اطلاعات پایه</TabsTrigger>
                <TabsTrigger value="details">جزئیات</TabsTrigger>
                <TabsTrigger value="advanced">پیشرفته</TabsTrigger>
              </TabsList>

              {/* Basic Information */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                {/* نام محصول */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        نام محصول <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="مثال: پکیج آموزشی طلایی"
                          {...field}
                          disabled={isSubmitting}
                          className="text-right"
                        />
                      </FormControl>
                      <FormDescription>
                        نام محصول باید واضح و قابل فهم باشد
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* دسته‌بندی */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-muted-foreground" />
                        دسته‌بندی <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger className="text-right">
                            <SelectValue placeholder="دسته‌بندی را انتخاب کنید" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {productCategories.map(category => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        دسته‌بندی محصول را انتخاب کنید
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* قیمت */}
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        قیمت (تومان) <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="۰"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={isSubmitting}
                          className="text-right"
                          min="0"
                          step="1000"
                        />
                      </FormControl>
                      <FormDescription>
                        قیمت محصول به تومان
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* تخفیف */}
                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-muted-foreground" />
                        تخفیف (درصد)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="۰"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={isSubmitting}
                          className="text-right"
                          min="0"
                          max="100"
                        />
                      </FormControl>
                      <FormDescription>
                        درصد تخفیف محصول (۰ تا ۱۰۰)
                      </FormDescription>
                      {form.watch('discount') && form.watch('discount')! > 0 && (
                        <div className="text-sm text-success font-medium">
                          قیمت نهایی: {finalPrice.toLocaleString('fa-IR')} تومان
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* وضعیت */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وضعیت محصول <span className="text-destructive">*</span></FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger className="text-right">
                            <SelectValue placeholder="وضعیت را انتخاب کنید" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">فعال</SelectItem>
                          <SelectItem value="inactive">غیرفعال</SelectItem>
                          <SelectItem value="out_of_stock">ناموجود</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        وضعیت محصول در سیستم
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Details */}
              <TabsContent value="details" className="space-y-4 mt-4">
                {/* توضیحات */}
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
                          placeholder="توضیحات کامل محصول را اینجا وارد کنید..."
                          {...field}
                          disabled={isSubmitting}
                          className="min-h-[120px] text-right resize-none"
                          maxLength={2000}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0} / 2000 کاراکتر
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* موجودی */}
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Box className="w-4 h-4 text-muted-foreground" />
                        موجودی انبار
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="۰"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={isSubmitting}
                          className="text-right"
                          min="0"
                        />
                      </FormControl>
                      <FormDescription>
                        تعداد موجودی محصول در انبار
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* تصویر */}
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        آدرس تصویر
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://example.com/image.jpg"
                          {...field}
                          disabled={isSubmitting}
                          dir="ltr"
                          className="text-left"
                        />
                      </FormControl>
                      <FormDescription>
                        آدرس URL تصویر محصول
                      </FormDescription>
                      {field.value && (
                        <div className="mt-2">
                          <img
                            src={field.value}
                            alt="Preview"
                            className="w-full h-32 object-cover rounded-lg border border-border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Advanced */}
              <TabsContent value="advanced" className="space-y-4 mt-4">
                {/* SKU */}
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-muted-foreground" />
                        کد محصول (SKU)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="مثال: PROD-001"
                          {...field}
                          disabled={isSubmitting}
                          dir="ltr"
                          className="text-left"
                        />
                      </FormControl>
                      <FormDescription>
                        کد یکتا شناسایی محصول
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tags - در آینده می‌تواند با یک component پیشرفته‌تر جایگزین شود */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    برچسب‌ها
                  </Label>
                  <Input
                    placeholder="برچسب‌ها را با کاما جدا کنید (مثال: آموزشی، پیشرفته، محبوب)"
                    disabled={isSubmitting}
                    className="text-right"
                    onBlur={(e) => {
                      const tags = e.target.value
                        .split(',')
                        .map(tag => tag.trim())
                        .filter(tag => tag.length > 0);
                      form.setValue('tags', tags);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    برچسب‌ها را با کاما جدا کنید
                  </p>
                  {form.watch('tags') && form.watch('tags')!.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.watch('tags')!.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
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
                    در حال افزودن...
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4 ml-2" />
                    افزودن محصول
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

