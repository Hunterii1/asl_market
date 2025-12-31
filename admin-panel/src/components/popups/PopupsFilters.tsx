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

interface PopupsFiltersProps {
  statusFilter: ('active' | 'inactive')[];
  onStatusFilterChange: (status: ('active' | 'inactive')[]) => void;
  onReset: () => void;
}

export function PopupsFilters({
  statusFilter,
  onStatusFilterChange,
  onReset,
}: PopupsFiltersProps) {
  const [open, setOpen] = useState(false);

  const handleToggleStatus = (status: 'active' | 'inactive') => {
    if (statusFilter.includes(status)) {
      onStatusFilterChange(statusFilter.filter(s => s !== status));
    } else {
      onStatusFilterChange([...statusFilter, status]);
    }
  };

  const hasActiveFilters = statusFilter.length > 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="w-4 h-4 ml-2" />
          فیلترها
          {hasActiveFilters && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
              {statusFilter.length}
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
                      <button
                        onClick={() => handleToggleStatus(status)}
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
