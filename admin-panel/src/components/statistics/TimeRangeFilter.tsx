import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarIcon } from 'lucide-react';

export type TimeRange = 'today' | 'week' | 'month' | 'year' | 'custom';

interface TimeRangeFilterProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomDateChange?: (start: Date | undefined, end: Date | undefined) => void;
}

export function TimeRangeFilter({
  value,
  onChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
}: TimeRangeFilterProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant={value === 'today' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('today')}
        className={value === 'today' ? 'gradient-primary text-primary-foreground' : ''}
      >
        امروز
      </Button>
      <Button
        variant={value === 'week' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('week')}
        className={value === 'week' ? 'gradient-primary text-primary-foreground' : ''}
      >
        هفته جاری
      </Button>
      <Button
        variant={value === 'month' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('month')}
        className={value === 'month' ? 'gradient-primary text-primary-foreground' : ''}
      >
        ماه جاری
      </Button>
      <Button
        variant={value === 'year' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('year')}
        className={value === 'year' ? 'gradient-primary text-primary-foreground' : ''}
      >
        سال جاری
      </Button>
      <Button
        variant={value === 'custom' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('custom')}
        className={value === 'custom' ? 'gradient-primary text-primary-foreground' : ''}
      >
        بازه سفارشی
      </Button>

      {value === 'custom' && onCustomDateChange && (
        <div className="flex items-center gap-2">
          <div className="relative">
            <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="از تاریخ (مثال: ۱۴۰۳/۰۹/۰۱)"
              value={customStartDate ? customStartDate.toLocaleDateString('fa-IR') : ''}
              onChange={(e) => {
                // Simple date parsing for Persian format
                const dateStr = e.target.value;
                if (dateStr) {
                  const date = new Date(dateStr);
                  if (!isNaN(date.getTime())) {
                    onCustomDateChange?.(date, customEndDate);
                  }
                }
              }}
              className="w-[180px] pr-10 text-right"
            />
          </div>
          <div className="relative">
            <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="تا تاریخ (مثال: ۱۴۰۳/۰۹/۳۰)"
              value={customEndDate ? customEndDate.toLocaleDateString('fa-IR') : ''}
              onChange={(e) => {
                const dateStr = e.target.value;
                if (dateStr) {
                  const date = new Date(dateStr);
                  if (!isNaN(date.getTime())) {
                    onCustomDateChange?.(customStartDate, date);
                  }
                }
              }}
              className="w-[180px] pr-10 text-right"
            />
          </div>
        </div>
      )}
    </div>
  );
}

