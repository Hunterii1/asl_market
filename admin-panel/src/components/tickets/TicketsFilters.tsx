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

interface TicketsFiltersProps {
  statusFilter: ('open' | 'in_progress' | 'resolved' | 'closed')[];
  onStatusFilterChange: (status: ('open' | 'in_progress' | 'resolved' | 'closed')[]) => void;
  categoryFilter: ('technical' | 'billing' | 'general' | 'bug' | 'feature' | 'other')[];
  onCategoryFilterChange: (category: ('technical' | 'billing' | 'general' | 'bug' | 'feature' | 'other')[]) => void;
  priorityFilter: ('low' | 'medium' | 'high' | 'urgent')[];
  onPriorityFilterChange: (priority: ('low' | 'medium' | 'high' | 'urgent')[]) => void;
  onReset: () => void;
}

export function TicketsFilters({
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  onReset,
}: TicketsFiltersProps) {
  const [open, setOpen] = useState(false);

  const handleToggleStatus = (status: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    if (statusFilter.includes(status)) {
      onStatusFilterChange(statusFilter.filter(s => s !== status));
    } else {
      onStatusFilterChange([...statusFilter, status]);
    }
  };

  const handleToggleCategory = (category: 'technical' | 'billing' | 'general' | 'bug' | 'feature' | 'other') => {
    if (categoryFilter.includes(category)) {
      onCategoryFilterChange(categoryFilter.filter(c => c !== category));
    } else {
      onCategoryFilterChange([...categoryFilter, category]);
    }
  };

  const handleTogglePriority = (priority: 'low' | 'medium' | 'high' | 'urgent') => {
    if (priorityFilter.includes(priority)) {
      onPriorityFilterChange(priorityFilter.filter(p => p !== priority));
    } else {
      onPriorityFilterChange([...priorityFilter, priority]);
    }
  };

  const hasActiveFilters = statusFilter.length > 0 || categoryFilter.length > 0 || priorityFilter.length > 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="w-4 h-4 ml-2" />
          فیلترها
          {hasActiveFilters && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
              {statusFilter.length + categoryFilter.length + priorityFilter.length}
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
                { value: 'open', label: 'باز' },
                { value: 'in_progress', label: 'در حال بررسی' },
                { value: 'resolved', label: 'حل شده' },
                { value: 'closed', label: 'بسته شده' },
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
              {([
                { value: 'technical', label: 'فنی' },
                { value: 'billing', label: 'مالی' },
                { value: 'general', label: 'عمومی' },
                { value: 'bug', label: 'باگ' },
                { value: 'feature', label: 'ویژگی جدید' },
                { value: 'other', label: 'سایر' },
              ] as const).map(({ value, label }) => (
                <div key={value} className="flex items-center gap-2">
                  <Checkbox
                    id={`filter-category-${value}`}
                    checked={categoryFilter.includes(value)}
                    onCheckedChange={() => handleToggleCategory(value)}
                  />
                  <Label
                    htmlFor={`filter-category-${value}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Priority Filter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">اولویت</Label>
            <div className="space-y-2">
              {([
                { value: 'low', label: 'پایین' },
                { value: 'medium', label: 'متوسط' },
                { value: 'high', label: 'بالا' },
                { value: 'urgent', label: 'فوری' },
              ] as const).map(({ value, label }) => (
                <div key={value} className="flex items-center gap-2">
                  <Checkbox
                    id={`filter-priority-${value}`}
                    checked={priorityFilter.includes(value)}
                    onCheckedChange={() => handleTogglePriority(value)}
                  />
                  <Label
                    htmlFor={`filter-priority-${value}`}
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
                      {status === 'open' && 'باز'}
                      {status === 'in_progress' && 'در حال بررسی'}
                      {status === 'resolved' && 'حل شده'}
                      {status === 'closed' && 'بسته شده'}
                      <button
                        onClick={() => handleToggleStatus(status)}
                        className="hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {categoryFilter.map(category => (
                    <Badge key={category} variant="secondary" className="gap-1">
                      {category === 'technical' && 'فنی'}
                      {category === 'billing' && 'مالی'}
                      {category === 'general' && 'عمومی'}
                      {category === 'bug' && 'باگ'}
                      {category === 'feature' && 'ویژگی جدید'}
                      {category === 'other' && 'سایر'}
                      <button
                        onClick={() => handleToggleCategory(category)}
                        className="hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {priorityFilter.map(priority => (
                    <Badge key={priority} variant="secondary" className="gap-1">
                      {priority === 'low' && 'پایین'}
                      {priority === 'medium' && 'متوسط'}
                      {priority === 'high' && 'بالا'}
                      {priority === 'urgent' && 'فوری'}
                      <button
                        onClick={() => handleTogglePriority(priority)}
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

