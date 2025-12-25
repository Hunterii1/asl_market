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

interface VisitorsFiltersProps {
  deviceFilter: ('desktop' | 'mobile' | 'tablet' | 'other')[];
  onDeviceFilterChange: (device: ('desktop' | 'mobile' | 'tablet' | 'other')[]) => void;
  isBotFilter: boolean | null;
  onIsBotFilterChange: (isBot: boolean | null) => void;
  countryFilter: string[];
  onCountryFilterChange: (country: string[]) => void;
  onReset: () => void;
}

export function VisitorsFilters({
  deviceFilter,
  onDeviceFilterChange,
  isBotFilter,
  onIsBotFilterChange,
  countryFilter,
  onCountryFilterChange,
  onReset,
}: VisitorsFiltersProps) {
  const [open, setOpen] = useState(false);

  const handleToggleDevice = (device: 'desktop' | 'mobile' | 'tablet' | 'other') => {
    if (deviceFilter.includes(device)) {
      onDeviceFilterChange(deviceFilter.filter(d => d !== device));
    } else {
      onDeviceFilterChange([...deviceFilter, device]);
    }
  };

  const handleToggleCountry = (country: string) => {
    if (countryFilter.includes(country)) {
      onCountryFilterChange(countryFilter.filter(c => c !== country));
    } else {
      onCountryFilterChange([...countryFilter, country]);
    }
  };

  const hasActiveFilters = deviceFilter.length > 0 || isBotFilter !== null || countryFilter.length > 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="w-4 h-4 ml-2" />
          فیلترها
          {hasActiveFilters && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
              {deviceFilter.length + countryFilter.length + (isBotFilter !== null ? 1 : 0)}
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
          {/* Device Filter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">نوع دستگاه</Label>
            <div className="space-y-2">
              {([
                { value: 'desktop', label: 'دسکتاپ' },
                { value: 'mobile', label: 'موبایل' },
                { value: 'tablet', label: 'تبلت' },
                { value: 'other', label: 'سایر' },
              ] as const).map(({ value, label }) => (
                <div key={value} className="flex items-center gap-2">
                  <Checkbox
                    id={`filter-device-${value}`}
                    checked={deviceFilter.includes(value)}
                    onCheckedChange={() => handleToggleDevice(value)}
                  />
                  <Label
                    htmlFor={`filter-device-${value}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Bot Filter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">نوع بازدیدکننده</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="filter-bot-true"
                  checked={isBotFilter === true}
                  onCheckedChange={(checked) => onIsBotFilterChange(checked ? true : null)}
                />
                <Label
                  htmlFor="filter-bot-true"
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  ربات / Crawler
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="filter-bot-false"
                  checked={isBotFilter === false}
                  onCheckedChange={(checked) => onIsBotFilterChange(checked ? false : null)}
                />
                <Label
                  htmlFor="filter-bot-false"
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  کاربر واقعی
                </Label>
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
                  {deviceFilter.map(device => (
                    <Badge key={device} variant="secondary" className="gap-1">
                      {device === 'desktop' && 'دسکتاپ'}
                      {device === 'mobile' && 'موبایل'}
                      {device === 'tablet' && 'تبلت'}
                      {device === 'other' && 'سایر'}
                      <button
                        onClick={() => handleToggleDevice(device)}
                        className="hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {isBotFilter === true && (
                    <Badge variant="secondary" className="gap-1">
                      ربات
                      <button
                        onClick={() => onIsBotFilterChange(null)}
                        className="hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {isBotFilter === false && (
                    <Badge variant="secondary" className="gap-1">
                      کاربر واقعی
                      <button
                        onClick={() => onIsBotFilterChange(null)}
                        className="hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {countryFilter.map(country => (
                    <Badge key={country} variant="secondary" className="gap-1">
                      {country}
                      <button
                        onClick={() => handleToggleCountry(country)}
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

