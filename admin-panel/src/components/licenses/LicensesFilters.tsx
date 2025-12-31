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
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';

interface LicensesFiltersProps {
  statusFilter: ('used' | 'available')[];
  onStatusFilterChange: (status: ('used' | 'available')[]) => void;
  typeFilter: ('pro' | 'plus' | 'plus4')[];
  onTypeFilterChange: (type: ('pro' | 'plus' | 'plus4')[]) => void;
  onReset: () => void;
}

export function LicensesFilters({
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  onReset,
}: LicensesFiltersProps) {
  const [open, setOpen] = useState(false);

  const handleToggleStatus = (status: 'used' | 'available') => {
    if (statusFilter.includes(status)) {
      onStatusFilterChange(statusFilter.filter(s => s !== status));
    } else {
      onStatusFilterChange([...statusFilter, status]);
    }
  };

  const handleToggleType = (type: 'pro' | 'plus' | 'plus4') => {
    if (typeFilter.includes(type)) {
      onTypeFilterChange(typeFilter.filter(t => t !== type));
    } else {
      onTypeFilterChange([...typeFilter, type]);
    }
  };

  const hasActiveFilters = statusFilter.length > 0 || typeFilter.length > 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="w-4 h-4 ml-2" />
          فیلترها
          {hasActiveFilters && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
              {statusFilter.length + typeFilter.length}
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
                { value: 'used', label: 'استفاده شده' },
                { value: 'available', label: 'در دسترس' },
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

          {/* Type Filter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">نوع لایسنس</Label>
            <div className="space-y-2">
              {([
                { value: 'pro', label: 'پرو' },
                { value: 'plus', label: 'پلاس' },
                { value: 'plus4', label: 'پلاس ۴' },
              ] as const).map(({ value, label }) => (
                <div key={value} className="flex items-center gap-2">
                  <Checkbox
                    id={`filter-type-${value}`}
                    checked={typeFilter.includes(value)}
                    onCheckedChange={() => handleToggleType(value)}
                  />
                  <Label
                    htmlFor={`filter-type-${value}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {label}
                  </Label>
                </div>
              ))}
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
                      {status === 'used' && 'استفاده شده'}
                      {status === 'available' && 'در دسترس'}
                      <button
                        onClick={() => handleToggleStatus(status)}
                        className="hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {typeFilter.map(type => (
                    <Badge
                      key={type}
                      variant="secondary"
                      className="gap-1"
                    >
                      {type === 'pro' && 'پرو'}
                      {type === 'plus' && 'پلاس'}
                      {type === 'plus4' && 'پلاس ۴'}
                      <button
                        onClick={() => handleToggleType(type)}
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

