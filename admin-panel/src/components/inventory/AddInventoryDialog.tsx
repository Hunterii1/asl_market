import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Boxes, Package, Hash, MapPin, Warehouse, DollarSign, FileText, AlertTriangle } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { addInventorySchema, type AddInventoryFormData } from '@/lib/validations/inventory';
import { toast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/api/adminApi';

interface AddInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddInventoryDialog({ open, onOpenChange, onSuccess }: AddInventoryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddInventoryFormData>({
    resolver: zodResolver(addInventorySchema),
    defaultValues: {
      productId: '',
      productName: '',
      sku: '',
      quantity: 0,
      reservedQuantity: 0,
      availableQuantity: 0,
      minStock: 0,
      maxStock: 0,
      location: '',
      warehouse: '',
      status: 'in_stock',
      cost: 0,
      notes: '',
    },
  });

  const { watch, setValue } = form;
  const quantity = watch('quantity');
  const reservedQuantity = watch('reservedQuantity') || 0;
  const minStock = watch('minStock') || 0;

  // Calculate available quantity
  const availableQuantity = quantity - reservedQuantity;

  // Update status based on quantity
  useEffect(() => {
    if (quantity === 0) {
      setValue('status', 'out_of_stock');
    } else if (quantity <= minStock) {
      setValue('status', 'low_stock');
    } else if (reservedQuantity > 0 && availableQuantity === 0) {
      setValue('status', 'reserved');
    } else {
      setValue('status', 'in_stock');
    }
    setValue('availableQuantity', availableQuantity >= 0 ? availableQuantity : 0);
  }, [quantity, reservedQuantity, minStock, availableQuantity, setValue]);

  const onSubmit = async (data: AddInventoryFormData) => {
    setIsSubmitting(true);
    try {
      // Map inventory form to available product payload
      const payload: any = {
        sale_type: 'wholesale',
        product_name: data.productName,
        category: data.productId || 'general',
        subcategory: '',
        description: data.notes || '',
        wholesale_price: data.cost ? String(data.cost) : '0',
        retail_price: '',
        export_price: '',
        currency: 'IRR',
        available_quantity: data.availableQuantity ?? data.quantity,
        min_order_quantity: data.minStock ?? 0,
        max_order_quantity: data.maxStock ?? 0,
        unit: 'unit',
        brand: '',
        model: data.sku || '',
        origin: data.warehouse || '',
        quality: '',
        packaging_type: '',
        weight: '',
        dimensions: '',
        shipping_cost: '',
        location: data.location || 'warehouse',
        contact_phone: '',
        contact_email: '',
        contact_whatsapp: '',
        can_export: false,
        requires_license: false,
        license_type: '',
        export_countries: '',
        image_urls: '',
        video_url: '',
        catalog_url: '',
        is_featured: false,
        is_hot_deal: false,
        tags: '',
        notes: data.notes || '',
      };

      await adminApi.createAvailableProduct(payload);
      toast({
        title: 'موفقیت',
        description: 'موجودی انبار با موفقیت ثبت شد.',
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Boxes className="w-5 h-5 text-primary" />
            افزودن موجودی انبار
          </DialogTitle>
          <DialogDescription>
            اطلاعات موجودی انبار را وارد کنید.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Product ID */}
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    شناسه محصول *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="شناسه محصول"
                      {...field}
                      disabled={isSubmitting}
                      className="text-right"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Product Name */}
            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    نام محصول *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="نام محصول"
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
                        placeholder="SKU-001"
                        {...field}
                        disabled={isSubmitting}
                        className="text-right"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cost */}
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      هزینه (تومان)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
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
            </div>

            {/* Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-muted-foreground" />
                    تعداد کل *
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Reserved Quantity */}
              <FormField
                control={form.control}
                name="reservedQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تعداد رزرو شده</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        disabled={isSubmitting}
                        className="text-right"
                        min="0"
                        max={quantity}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Available Quantity (Read-only) */}
              <FormItem>
                <FormLabel>تعداد موجود</FormLabel>
                <Input
                  type="number"
                  value={availableQuantity >= 0 ? availableQuantity : 0}
                  disabled
                  className="text-right bg-muted"
                />
                <FormDescription>
                  تعداد کل - تعداد رزرو شده
                </FormDescription>
              </FormItem>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Min Stock */}
              <FormField
                control={form.control}
                name="minStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                      حداقل موجودی
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
                      هشدار در صورت رسیدن به این مقدار
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Max Stock */}
              <FormField
                control={form.control}
                name="maxStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>حداکثر موجودی</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Location */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      مکان
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="قفسه A-12"
                        {...field}
                        disabled={isSubmitting}
                        className="text-right"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Warehouse */}
              <FormField
                control={form.control}
                name="warehouse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Warehouse className="w-4 h-4 text-muted-foreground" />
                      انبار
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="انبار مرکزی"
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

            {/* Status */}
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
                      <SelectItem value="in_stock">موجود</SelectItem>
                      <SelectItem value="low_stock">موجودی کم</SelectItem>
                      <SelectItem value="out_of_stock">ناموجود</SelectItem>
                      <SelectItem value="reserved">رزرو شده</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    یادداشت
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="یادداشت‌های اضافی..."
                      className="min-h-[100px]"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0} / 2000 کاراکتر
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    در حال ثبت...
                  </>
                ) : (
                  <>
                    <Boxes className="w-4 h-4 ml-2" />
                    ثبت موجودی
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

