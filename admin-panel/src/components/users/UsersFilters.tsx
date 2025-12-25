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
import { cn } from '@/lib/utils';

interface UsersFiltersProps {
  statusFilter: ('active' | 'inactive' | 'banned')[];
  onStatusFilterChange: (status: ('active' | 'inactive' | 'banned')[]) => void;
  minBalance: string;
  onMinBalanceChange: (value: string) => void;
  maxBalance: string;
  onMaxBalanceChange: (value: string) => void;
  onReset: () => void;
}

export function UsersFilters({
  statusFilter,
  onStatusFilterChange,
  minBalance,
  onMinBalanceChange,
  maxBalance,
  onMaxBalanceChange,
  onReset,
}: UsersFiltersProps) {
  const [open, setOpen] = useState(false);

  const handleToggleStatus = (status: 'active' | 'inactive' | 'banned') => {
    if (statusFilter.includes(status)) {
      onStatusFilterChange(statusFilter.filter(s => s !== status));
    } else {
      onStatusFilterChange([...statusFilter, status]);
    }
  };

  const hasActiveFilters = statusFilter.length > 0 || minBalance || maxBalance;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="w-4 h-4 ml-2" />
          فیلترها
          {hasActiveFilters && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
              {statusFilter.length + (minBalance ? 1 : 0) + (maxBalance ? 1 : 0)}
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
              {(['active', 'inactive', 'banned'] as const).map(status => (
                <div key={status} className="flex items-center gap-2">
                  <Checkbox
                    id={`filter-status-${status}`}
                    checked={statusFilter.includes(status)}
                    onCheckedChange={() => handleToggleStatus(status)}
                  />
                  <Label
                    htmlFor={`filter-status-${status}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {status === 'active' && 'فعال'}
                    {status === 'inactive' && 'غیرفعال'}
                    {status === 'banned' && 'مسدود'}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Balance Range */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">محدوده موجودی</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">حداقل موجودی</Label>
                <Input
                  type="text"
                  placeholder="۰"
                  value={minBalance}
                  onChange={(e) => onMinBalanceChange(e.target.value)}
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">حداکثر موجودی</Label>
                <Input
                  type="text"
                  placeholder="نامحدود"
                  value={maxBalance}
                  onChange={(e) => onMaxBalanceChange(e.target.value)}
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
                    <Badge
                      key={status}
                      variant="secondary"
                      className="gap-1"
                    >
                      {status === 'active' && 'فعال'}
                      {status === 'inactive' && 'غیرفعال'}
                      {status === 'banned' && 'مسدود'}
                      <button
                        onClick={() => handleToggleStatus(status)}
                        className="hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {minBalance && (
                    <Badge variant="secondary" className="gap-1">
                      حداقل: {minBalance}
                      <button
                        onClick={() => onMinBalanceChange('')}
                        className="hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {maxBalance && (
                    <Badge variant="secondary" className="gap-1">
                      حداکثر: {maxBalance}
                      <button
                        onClick={() => onMaxBalanceChange('')}
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

