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

interface NotificationsFiltersProps {
  statusFilter: ('sent' | 'pending' | 'failed' | 'draft')[];
  onStatusFilterChange: (status: ('sent' | 'pending' | 'failed' | 'draft')[]) => void;
  typeFilter: ('system' | 'email' | 'sms' | 'telegram' | 'push')[];
  onTypeFilterChange: (type: ('system' | 'email' | 'sms' | 'telegram' | 'push')[]) => void;
  priorityFilter: ('low' | 'medium' | 'high' | 'urgent')[];
  onPriorityFilterChange: (priority: ('low' | 'medium' | 'high' | 'urgent')[]) => void;
  onReset: () => void;
}

export function NotificationsFilters({
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  onReset,
}: NotificationsFiltersProps) {
  const [open, setOpen] = useState(false);

  const handleToggleStatus = (status: 'sent' | 'pending' | 'failed' | 'draft') => {
    if (statusFilter.includes(status)) {
      onStatusFilterChange(statusFilter.filter(s => s !== status));
    } else {
      onStatusFilterChange([...statusFilter, status]);
    }
  };

  const handleToggleType = (type: 'system' | 'email' | 'sms' | 'telegram' | 'push') => {
    if (typeFilter.includes(type)) {
      onTypeFilterChange(typeFilter.filter(t => t !== type));
    } else {
      onTypeFilterChange([...typeFilter, type]);
    }
  };

  const handleTogglePriority = (priority: 'low' | 'medium' | 'high' | 'urgent') => {
    if (priorityFilter.includes(priority)) {
      onPriorityFilterChange(priorityFilter.filter(p => p !== priority));
    } else {
      onPriorityFilterChange([...priorityFilter, priority]);
    }
  };

  const hasActiveFilters = statusFilter.length > 0 || typeFilter.length > 0 || priorityFilter.length > 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="w-4 h-4 ml-2" />
          فیلترها
          {hasActiveFilters && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
              {statusFilter.length + typeFilter.length + priorityFilter.length}
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
                { value: 'sent', label: 'ارسال شده' },
                { value: 'pending', label: 'در انتظار' },
                { value: 'failed', label: 'ناموفق' },
                { value: 'draft', label: 'پیش‌نویس' },
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
            <Label className="text-base font-semibold">نوع اعلان</Label>
            <div className="space-y-2">
              {([
                { value: 'system', label: 'سیستمی' },
                { value: 'email', label: 'ایمیل' },
                { value: 'sms', label: 'پیامک' },
                { value: 'telegram', label: 'تلگرام' },
                { value: 'push', label: 'Push' },
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
                      {status === 'sent' && 'ارسال شده'}
                      {status === 'pending' && 'در انتظار'}
                      {status === 'failed' && 'ناموفق'}
                      {status === 'draft' && 'پیش‌نویس'}
                      <button
                        onClick={() => handleToggleStatus(status)}
                        className="hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {typeFilter.map(type => (
                    <Badge key={type} variant="secondary" className="gap-1">
                      {type === 'system' && 'سیستمی'}
                      {type === 'email' && 'ایمیل'}
                      {type === 'sms' && 'پیامک'}
                      {type === 'telegram' && 'تلگرام'}
                      {type === 'push' && 'Push'}
                      <button
                        onClick={() => handleToggleType(type)}
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

