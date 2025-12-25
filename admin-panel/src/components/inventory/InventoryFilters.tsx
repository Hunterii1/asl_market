import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';

interface InventoryFiltersProps {
  statusFilter: ('in_stock' | 'low_stock' | 'out_of_stock' | 'reserved')[];
  onStatusFilterChange: (status: ('in_stock' | 'low_stock' | 'out_of_stock' | 'reserved')[]) => void;
  minQuantity: string;
  maxQuantity: string;
  onMinQuantityChange: (quantity: string) => void;
  onMaxQuantityChange: (quantity: string) => void;
  warehouseFilter: string[];
  onWarehouseFilterChange: (warehouse: string[]) => void;
  onReset: () => void;
}

export function InventoryFilters({
  statusFilter,
  onStatusFilterChange,
  minQuantity,
  maxQuantity,
  onMinQuantityChange,
  onMaxQuantityChange,
  warehouseFilter,
  onWarehouseFilterChange,
  onReset,
}: InventoryFiltersProps) {
  const [open, setOpen] = useState(false);

  const handleToggleStatus = (status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'reserved') => {
    if (statusFilter.includes(status)) {
      onStatusFilterChange(statusFilter.filter(s => s !== status));
    } else {
      onStatusFilterChange([...statusFilter, status]);
    }
  };

  const handleToggleWarehouse = (warehouse: string) => {
    if (warehouseFilter.includes(warehouse)) {
      onWarehouseFilterChange(warehouseFilter.filter(w => w !== warehouse));
    } else {
      onWarehouseFilterChange([...warehouseFilter, warehouse]);
    }
  };

  const hasActiveFilters = statusFilter.length > 0 || minQuantity || maxQuantity || warehouseFilter.length > 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="w-4 h-4 ml-2" />
          فیلترها
          {hasActiveFilters && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
              {statusFilter.length + warehouseFilter.length + (minQuantity ? 1 : 0) + (maxQuantity ? 1 : 0)}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto" side="right">
        <SheetHeader className="text-right">
          <SheetTitle>فیلترها</SheetTitle>
          <SheetDescription>
            فیلترهای مورد نظر را اعمال کنید
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Status Filter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">وضعیت</Label>
            <div className="space-y-2">
              {([
                { value: 'in_stock', label: 'موجود' },
                { value: 'low_stock', label: 'موجودی کم' },
                { value: 'out_of_stock', label: 'ناموجود' },
                { value: 'reserved', label: 'رزرو شده' },
              ] as const).map(({ value, label }) => (
                <div key={value} className="flex items-center gap-2">
                  <Checkbox
                    id={`filter-status-${value}`}
                    checked={statusFilter.includes(value)}
                    onCheckedChange={() => handleToggleStatus(value)}
                  />
                  <Label
                    htmlFor={`filter-status-${value}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Quantity Range */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">محدوده موجودی</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min-quantity" className="text-sm text-muted-foreground">حداقل</Label>
                <Input
                  id="min-quantity"
                  type="number"
                  placeholder="0"
                  value={minQuantity}
                  onChange={(e) => onMinQuantityChange(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="max-quantity" className="text-sm text-muted-foreground">حداکثر</Label>
                <Input
                  id="max-quantity"
                  type="number"
                  placeholder="نامحدود"
                  value={maxQuantity}
                  onChange={(e) => onMaxQuantityChange(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">فیلترهای فعال</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4 ml-1" />
                    پاک کردن همه
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {statusFilter.map(status => (
                    <Badge key={status} variant="secondary" className="gap-1">
                      {status === 'in_stock' && 'موجود'}
                      {status === 'low_stock' && 'موجودی کم'}
                      {status === 'out_of_stock' && 'ناموجود'}
                      {status === 'reserved' && 'رزرو شده'}
                      <button
                        onClick={() => handleToggleStatus(status)}
                        className="hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {minQuantity && (
                    <Badge variant="secondary" className="gap-1">
                      موجودی از {minQuantity}
                      <button
                        onClick={() => onMinQuantityChange('')}
                        className="hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {maxQuantity && (
                    <Badge variant="secondary" className="gap-1">
                      موجودی تا {maxQuantity}
                      <button
                        onClick={() => onMaxQuantityChange('')}
                        className="hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {warehouseFilter.map(warehouse => (
                    <Badge key={warehouse} variant="secondary" className="gap-1">
                      {warehouse}
                      <button
                        onClick={() => handleToggleWarehouse(warehouse)}
                        className="hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              بستن
            </Button>
            {hasActiveFilters && (
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  onReset();
                  setOpen(false);
                }}
              >
                پاک کردن همه
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

