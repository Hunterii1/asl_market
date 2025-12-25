import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Minus, Boxes, FileText } from 'lucide-react';
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
import { adjustInventorySchema, type AdjustInventoryFormData } from '@/lib/validations/inventory';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Inventory {
  id: string;
  productName: string;
  quantity: number;
  availableQuantity?: number;
}

interface AdjustInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: Inventory | null;
  onSuccess?: () => void;
}

// Mock API function
const adjustInventory = async (data: AdjustInventoryFormData): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.1) {
        reject(new Error('خطا در ارتباط با سرور. لطفا دوباره تلاش کنید.'));
      } else {
        const inventories = JSON.parse(localStorage.getItem('asll-inventory') || '[]');
        const index = inventories.findIndex((i: Inventory) => i.id === data.inventoryId);
        if (index !== -1) {
          const currentQuantity = inventories[index].quantity;
          const newQuantity = data.type === 'add' 
            ? currentQuantity + data.quantity 
            : currentQuantity - data.quantity;
          
          if (newQuantity < 0) {
            reject(new Error('تعداد نهایی نمی‌تواند منفی باشد.'));
            return;
          }

          inventories[index].quantity = newQuantity;
          inventories[index].availableQuantity = inventories[index].availableQuantity !== undefined
            ? inventories[index].availableQuantity + (data.type === 'add' ? data.quantity : -data.quantity)
            : newQuantity;
          
          // Update status
          const minStock = inventories[index].minStock || 0;
          if (newQuantity === 0) {
            inventories[index].status = 'out_of_stock';
          } else if (newQuantity <= minStock) {
            inventories[index].status = 'low_stock';
          } else {
            inventories[index].status = 'in_stock';
          }
          
          inventories[index].updatedAt = new Date().toLocaleDateString('fa-IR');
          localStorage.setItem('asll-inventory', JSON.stringify(inventories));
        }
        resolve();
      }
    }, 1000);
  });
};

export function AdjustInventoryDialog({ open, onOpenChange, inventory, onSuccess }: AdjustInventoryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AdjustInventoryFormData>({
    resolver: zodResolver(adjustInventorySchema),
    defaultValues: {
      inventoryId: '',
      quantity: 0,
      type: 'add',
      reason: '',
      notes: '',
    },
  });

  // Update form when inventory changes
  useEffect(() => {
    if (inventory && open) {
      form.reset({
        inventoryId: inventory.id,
        quantity: 0,
        type: 'add',
        reason: '',
        notes: '',
      });
    }
  }, [inventory, open, form]);

  const onSubmit = async (data: AdjustInventoryFormData) => {
    setIsSubmitting(true);
    try {
      await adjustInventory(data);
      toast({
        title: 'موفقیت',
        description: `موجودی با موفقیت ${data.type === 'add' ? 'افزایش' : 'کاهش'} یافت.`,
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

  const { watch } = form;
  const type = watch('type');
  const quantity = watch('quantity');

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Boxes className="w-5 h-5 text-primary" />
            تغییر موجودی
          </DialogTitle>
          <DialogDescription>
            موجودی محصول <span className="font-semibold">{inventory.productName}</span> را تغییر دهید.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Current Quantity */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">موجودی فعلی:</span>
                <span className="text-lg font-bold text-foreground">
                  {inventory.quantity.toLocaleString('fa-IR')} عدد
                </span>
              </div>
            </div>

            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع تغییر</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="نوع تغییر را انتخاب کنید" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="add">
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4 text-success" />
                          افزودن موجودی
                        </div>
                      </SelectItem>
                      <SelectItem value="subtract">
                        <div className="flex items-center gap-2">
                          <Minus className="w-4 h-4 text-destructive" />
                          کاهش موجودی
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    {type === 'add' ? (
                      <Plus className="w-4 h-4 text-success" />
                    ) : (
                      <Minus className="w-4 h-4 text-destructive" />
                    )}
                    تعداد {type === 'add' ? 'افزایش' : 'کاهش'} *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      disabled={isSubmitting}
                      className="text-right"
                      min="1"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* New Quantity Preview */}
            {quantity > 0 && (
              <div className={cn(
                "bg-muted/50 rounded-lg p-4",
                type === 'subtract' && inventory.quantity - quantity < 0 && "bg-destructive/10 border border-destructive/20"
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">موجودی جدید:</span>
                  <span className={cn(
                    "text-lg font-bold",
                    type === 'subtract' && inventory.quantity - quantity < 0 
                      ? 'text-destructive' 
                      : 'text-foreground'
                  )}>
                    {type === 'add' 
                      ? (inventory.quantity + quantity).toLocaleString('fa-IR')
                      : (inventory.quantity - quantity).toLocaleString('fa-IR')
                    } عدد
                  </span>
                </div>
                {type === 'subtract' && inventory.quantity - quantity < 0 && (
                  <p className="text-xs text-destructive mt-2">
                    ⚠️ تعداد نهایی نمی‌تواند منفی باشد
                  </p>
                )}
              </div>
            )}

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    دلیل تغییر *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="مثال: ورود کالا، فروش، برگشت..."
                      {...field}
                      disabled={isSubmitting}
                      className="text-right"
                    />
                  </FormControl>
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
                      className="min-h-[80px]"
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
                disabled={isSubmitting || (type === 'subtract' && inventory.quantity - quantity < 0)}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    در حال اعمال...
                  </>
                ) : (
                  <>
                    {type === 'add' ? (
                      <Plus className="w-4 h-4 ml-2" />
                    ) : (
                      <Minus className="w-4 h-4 ml-2" />
                    )}
                    اعمال تغییر
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

