import { useState, useEffect } from 'react';
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
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { adminApi } from '@/lib/api/adminApi';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  tags?: string[];
  imageUrl?: string;
  discount?: number;
  sku?: string;
  createdAt: string;
  sales?: number;
  revenue?: number;
}

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSuccess?: () => void;
}


export function EditProductDialog({ open, onOpenChange, product, onSuccess }: EditProductDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');
  const [tagsInput, setTagsInput] = useState('');

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

  // Update form when product changes
  useEffect(() => {
    if (product && open) {
      form.reset({
        name: product.name,
        description: product.description || '',
        price: product.price,
        category: product.category,
        stock: product.stock,
        status: product.status,
        tags: product.tags || [],
        imageUrl: product.imageUrl || '',
        discount: product.discount || 0,
        sku: product.sku || '',
      });
      setCurrentTab('basic');
      setTagsInput('');
    }
  }, [product, open, form]);

  const { watch, setValue } = form;
  const tags = watch('tags');
  const imageUrl = watch('imageUrl');
  const price = watch('price');
  const discount = watch('discount');

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagsInput.trim() !== '') {
      e.preventDefault();
      const newTag = tagsInput.trim();
      if (newTag && !tags?.includes(newTag)) {
        setValue('tags', [...(tags || []), newTag]);
        setTagsInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue('tags', (tags || []).filter(tag => tag !== tagToRemove));
  };

  const finalPrice = price && discount
    ? price * (1 - discount / 100)
    : price || 0;

  const onSubmit = async (data: AddProductFormData) => {
    if (!product) return;
    
    setIsSubmitting(true);
    try {
      // Convert tags array to comma-separated string
      const tagsString = (data.tags || []).join(',');
      
      // Convert imageUrl to JSON array string (backend expects JSON string)
      const imageUrlsString = data.imageUrl 
        ? JSON.stringify([data.imageUrl])
        : '';
      
      // Prepare update data according to backend UpdateAvailableProductRequest
      const updateData = {
        product_name: data.name,
        description: data.description || '',
        category: data.category,
        wholesale_price: data.price.toString(),
        retail_price: '',
        export_price: '',
        available_quantity: data.stock,
        status: data.status,
        tags: tagsString,
        image_urls: imageUrlsString,
      };
      
      await adminApi.updateAvailableProduct(Number(product.id), updateData);
      
      toast({
        title: 'موفقیت',
        description: 'اطلاعات محصول با موفقیت به‌روزرسانی شد.',
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
        setTagsInput('');
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
            <Package className="w-5 h-5 text-primary" />
            ویرایش محصول
          </DialogTitle>
          <DialogDescription>
            اطلاعات محصول را ویرایش کنید.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">اطلاعات پایه</TabsTrigger>
                <TabsTrigger value="details">جزئیات</TabsTrigger>
                <TabsTrigger value="advanced">تنظیمات پیشرفته</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        نام محصول *
                      </FormLabel>
                      <FormControl>
                        <Input
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        توضیحات
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-[100px]"
                          {...field}
                          disabled={isSubmitting}
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
                        <Folder className="w-4 h-4 text-muted-foreground" />
                        دسته‌بندی *
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
                          {productCategories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
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
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        آدرس تصویر
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/image.jpg"
                          {...field}
                          disabled={isSubmitting}
                          dir="ltr"
                          className="text-left"
                        />
                      </FormControl>
                      {imageUrl && (
                        <div className="mt-2 w-32 h-32 rounded-md overflow-hidden border border-border flex items-center justify-center">
                          <img src={imageUrl} alt="Product Preview" className="object-cover w-full h-full" />
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          قیمت (تومان) *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            disabled={isSubmitting}
                            className="text-right"
                            min="0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Percent className="w-4 h-4 text-muted-foreground" />
                          تخفیف (%)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            disabled={isSubmitting}
                            className="text-right"
                            min="0"
                            max="100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {price > 0 && discount > 0 && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">قیمت نهایی:</span>
                      <span className="text-lg font-bold text-foreground">
                        {finalPrice.toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Box className="w-4 h-4 text-muted-foreground" />
                          موجودی *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            disabled={isSubmitting}
                            className="text-right"
                            min="0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-muted-foreground" />
                          SKU
                        </FormLabel>
                        <FormControl>
                          <Input
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
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وضعیت</FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    برچسب‌ها
                  </FormLabel>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {(tags || []).map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="برچسب جدید را وارد کرده و Enter بزنید"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    disabled={isSubmitting}
                  />
                  <FormDescription>
                    با فشردن Enter برچسب‌ها را اضافه کنید.
                  </FormDescription>
                </FormItem>
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
                    <Package className="w-4 h-4 ml-2" />
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

