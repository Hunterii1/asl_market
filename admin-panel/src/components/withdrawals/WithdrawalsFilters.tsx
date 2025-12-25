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

interface WithdrawalsFiltersProps {
  statusFilter: ('pending' | 'processing' | 'completed' | 'rejected' | 'cancelled')[];
  onStatusFilterChange: (status: ('pending' | 'processing' | 'completed' | 'rejected' | 'cancelled')[]) => void;
  methodFilter: ('bank_transfer' | 'card' | 'wallet' | 'crypto')[];
  onMethodFilterChange: (method: ('bank_transfer' | 'card' | 'wallet' | 'crypto')[]) => void;
  minAmount: string;
  onMinAmountChange: (value: string) => void;
  maxAmount: string;
  onMaxAmountChange: (value: string) => void;
  onReset: () => void;
}

export function WithdrawalsFilters({
  statusFilter,
  onStatusFilterChange,
  methodFilter,
  onMethodFilterChange,
  minAmount,
  onMinAmountChange,
  maxAmount,
  onMaxAmountChange,
  onReset,
}: WithdrawalsFiltersProps) {
  const [open, setOpen] = useState(false);

  const handleToggleStatus = (status: 'pending' | 'processing' | 'completed' | 'rejected' | 'cancelled') => {
    if (statusFilter.includes(status)) {
      onStatusFilterChange(statusFilter.filter(s => s !== status));
    } else {
      onStatusFilterChange([...statusFilter, status]);
    }
  };

  const handleToggleMethod = (method: 'bank_transfer' | 'card' | 'wallet' | 'crypto') => {
    if (methodFilter.includes(method)) {
      onMethodFilterChange(methodFilter.filter(m => m !== method));
    } else {
      onMethodFilterChange([...methodFilter, method]);
    }
  };

  const hasActiveFilters = statusFilter.length > 0 || methodFilter.length > 0 || minAmount || maxAmount;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="w-4 h-4 ml-2" />
          فیلترها
          {hasActiveFilters && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
              {statusFilter.length + methodFilter.length + (minAmount ? 1 : 0) + (maxAmount ? 1 : 0)}
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
                { value: 'pending', label: 'در انتظار' },
                { value: 'processing', label: 'در حال پردازش' },
                { value: 'completed', label: 'تکمیل شده' },
                { value: 'rejected', label: 'رد شده' },
                { value: 'cancelled', label: 'لغو شده' },
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

          {/* Method Filter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">روش پرداخت</Label>
            <div className="space-y-2">
              {([
                { value: 'bank_transfer', label: 'انتقال بانکی' },
                { value: 'card', label: 'کارت به کارت' },
                { value: 'wallet', label: 'کیف پول' },
                { value: 'crypto', label: 'ارز دیجیتال' },
              ] as const).map(({ value, label }) => (
                <div key={value} className="flex items-center gap-2">
                  <Checkbox
                    id={`filter-method-${value}`}
                    checked={methodFilter.includes(value)}
                    onCheckedChange={() => handleToggleMethod(value)}
                  />
                  <Label
                    htmlFor={`filter-method-${value}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Amount Range */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">محدوده مبلغ</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">حداقل مبلغ</Label>
                <Input
                  type="text"
                  placeholder="۰"
                  value={minAmount}
                  onChange={(e) => onMinAmountChange(e.target.value)}
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">حداکثر مبلغ</Label>
                <Input
                  type="text"
                  placeholder="نامحدود"
                  value={maxAmount}
                  onChange={(e) => onMaxAmountChange(e.target.value)}
                  className="text-right"
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
                      {status === 'pending' && 'در انتظار'}
                      {status === 'processing' && 'در حال پردازش'}
                      {status === 'completed' && 'تکمیل شده'}
                      {status === 'rejected' && 'رد شده'}
                      {status === 'cancelled' && 'لغو شده'}
                      <button
                        onClick={() => handleToggleStatus(status)}
                        className="hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {methodFilter.map(method => (
                    <Badge key={method} variant="secondary" className="gap-1">
                      {method === 'bank_transfer' && 'انتقال بانکی'}
                      {method === 'card' && 'کارت به کارت'}
                      {method === 'wallet' && 'کیف پول'}
                      {method === 'crypto' && 'ارز دیجیتال'}
                      <button
                        onClick={() => handleToggleMethod(method)}
                        className="hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {minAmount && (
                    <Badge variant="secondary" className="gap-1">
                      حداقل: {minAmount}
                      <button
                        onClick={() => onMinAmountChange('')}
                        className="hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {maxAmount && (
                    <Badge variant="secondary" className="gap-1">
                      حداکثر: {maxAmount}
                      <button
                        onClick={() => onMaxAmountChange('')}
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

