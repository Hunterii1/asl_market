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
import { editInventorySchema, type EditInventoryFormData } from '@/lib/validations/inventory';
import { toast } from '@/hooks/use-toast';

interface Inventory {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  minStock?: number;
  maxStock?: number;
  location?: string;
  warehouse?: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'reserved';
  cost?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface EditInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: Inventory | null;
  onSuccess?: () => void;
}

// Mock API function
const updateInventory = async (data: EditInventoryFormData): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.1) {
        reject(new Error('خطا در ارتباط با سرور. لطفا دوباره تلاش کنید.'));
      } else {
        const inventories = JSON.parse(localStorage.getItem('asll-inventory') || '[]');
        const index = inventories.findIndex((i: Inventory) => i.id === data.id);
        if (index !== -1) {
          const availableQuantity = data.quantity - (data.reservedQuantity || 0);
          inventories[index] = {
            ...inventories[index],
            ...data,
            availableQuantity: availableQuantity >= 0 ? availableQuantity : 0,
            updatedAt: new Date().toLocaleDateString('fa-IR'),
          };
          localStorage.setItem('asll-inventory', JSON.stringify(inventories));
        }
        resolve();
      }
    }, 1000);
  });
};

export function EditInventoryDialog({ open, onOpenChange, inventory, onSuccess }: EditInventoryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditInventoryFormData>({
    resolver: zodResolver(editInventorySchema),
    defaultValues: {
      id: '',
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

  // Update form when inventory changes
  useEffect(() => {
    if (inventory && open) {
      form.reset({
        id: inventory.id,
        productId: inventory.productId,
        productName: inventory.productName,
        sku: inventory.sku || '',
        quantity: inventory.quantity,
        reservedQuantity: inventory.reservedQuantity || 0,
        availableQuantity: inventory.availableQuantity || 0,
        minStock: inventory.minStock || 0,
        maxStock: inventory.maxStock || 0,
        location: inventory.location || '',
        warehouse: inventory.warehouse || '',
        status: inventory.status,
        cost: inventory.cost || 0,
        notes: inventory.notes || '',
      });
    }
  }, [inventory, open, form]);

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

  const onSubmit = async (data: EditInventoryFormData) => {
    setIsSubmitting(true);
    try {
      await updateInventory(data);
      toast({
        title: 'موفقیت',
        description: 'اطلاعات موجودی انبار با موفقیت به‌روزرسانی شد.',
        variant: 'default',
      });
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

  if (!inventory) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Boxes className="w-5 h-5 text-primary" />
            ویرایش موجودی انبار
          </DialogTitle>
          <DialogDescription>
            اطلاعات موجودی انبار را ویرایش کنید.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      کد محصول (SKU)
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
              <FormField
                control={form.control}
                name="reservedQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تعداد رزرو شده</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
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

              <FormField
                control={form.control}
                name="maxStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>حداکثر موجودی</FormLabel>
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                name="warehouse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Warehouse className="w-4 h-4 text-muted-foreground" />
                      انبار
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
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <Boxes className="w-4 h-4 ml-2" />
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

