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
import { productCategories } from '@/lib/validations/product';

interface ProductsFiltersProps {
  statusFilter: ('active' | 'inactive' | 'out_of_stock')[];
  onStatusFilterChange: (status: ('active' | 'inactive' | 'out_of_stock')[]) => void;
  categoryFilter: string[];
  onCategoryFilterChange: (category: string[]) => void;
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (price: string) => void;
  onMaxPriceChange: (price: string) => void;
  minStock: string;
  maxStock: string;
  onMinStockChange: (stock: string) => void;
  onMaxStockChange: (stock: string) => void;
  onReset: () => void;
}

export function ProductsFilters({
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  minStock,
  maxStock,
  onMinStockChange,
  onMaxStockChange,
  onReset,
}: ProductsFiltersProps) {
  const [open, setOpen] = useState(false);

  const handleToggleStatus = (status: 'active' | 'inactive' | 'out_of_stock') => {
    if (statusFilter.includes(status)) {
      onStatusFilterChange(statusFilter.filter(s => s !== status));
    } else {
      onStatusFilterChange([...statusFilter, status]);
    }
  };

  const handleToggleCategory = (category: string) => {
    if (categoryFilter.includes(category)) {
      onCategoryFilterChange(categoryFilter.filter(c => c !== category));
    } else {
      onCategoryFilterChange([...categoryFilter, category]);
    }
  };

  const hasActiveFilters = statusFilter.length > 0 || categoryFilter.length > 0 || minPrice || maxPrice || minStock || maxStock;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="w-4 h-4 ml-2" />
          فیلترها
          {hasActiveFilters && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
              {statusFilter.length + categoryFilter.length + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + (minStock ? 1 : 0) + (maxStock ? 1 : 0)}
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
                { value: 'active', label: 'فعال' },
                { value: 'inactive', label: 'غیرفعال' },
                { value: 'out_of_stock', label: 'ناموجود' },
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

          {/* Category Filter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">دسته‌بندی</Label>
            <div className="space-y-2">
              {productCategories.map((category) => (
                <div key={category.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`filter-category-${category.value}`}
                    checked={categoryFilter.includes(category.value)}
                    onCheckedChange={() => handleToggleCategory(category.value)}
                  />
                  <Label
                    htmlFor={`filter-category-${category.value}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {category.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Price Range */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">محدوده قیمت (تومان)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min-price" className="text-sm text-muted-foreground">حداقل</Label>
                <Input
                  id="min-price"
                  type="number"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => onMinPriceChange(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="max-price" className="text-sm text-muted-foreground">حداکثر</Label>
                <Input
                  id="max-price"
                  type="number"
                  placeholder="نامحدود"
                  value={maxPrice}
                  onChange={(e) => onMaxPriceChange(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Stock Range */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">محدوده موجودی</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min-stock" className="text-sm text-muted-foreground">حداقل</Label>
                <Input
                  id="min-stock"
                  type="number"
                  placeholder="0"
                  value={minStock}
                  onChange={(e) => onMinStockChange(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="max-stock" className="text-sm text-muted-foreground">حداکثر</Label>
                <Input
                  id="max-stock"
                  type="number"
                  placeholder="نامحدود"
                  value={maxStock}
                  onChange={(e) => onMaxStockChange(e.target.value)}
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
                      {status === 'active' && 'فعال'}
                      {status === 'inactive' && 'غیرفعال'}
                      {status === 'out_of_stock' && 'ناموجود'}
                      <button
                        onClick={() => handleToggleStatus(status)}
                        className="hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {categoryFilter.map(category => {
                    const categoryLabel = productCategories.find(c => c.value === category)?.label || category;
                    return (
                      <Badge key={category} variant="secondary" className="gap-1">
                        {categoryLabel}
                        <button
                          onClick={() => handleToggleCategory(category)}
                          className="hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                  {minPrice && (
                    <Badge variant="secondary" className="gap-1">
                      قیمت از {minPrice}
                      <button
                        onClick={() => onMinPriceChange('')}
                        className="hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {maxPrice && (
                    <Badge variant="secondary" className="gap-1">
                      قیمت تا {maxPrice}
                      <button
                        onClick={() => onMaxPriceChange('')}
                        className="hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {minStock && (
                    <Badge variant="secondary" className="gap-1">
                      موجودی از {minStock}
                      <button
                        onClick={() => onMinStockChange('')}
                        className="hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {maxStock && (
                    <Badge variant="secondary" className="gap-1">
                      موجودی تا {maxStock}
                      <button
                        onClick={() => onMaxStockChange('')}
                        className="hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
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

