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

interface EducationFiltersProps {
  statusFilter: ('draft' | 'published' | 'archived')[];
  onStatusFilterChange: (status: ('draft' | 'published' | 'archived')[]) => void;
  categoryFilter: ('video' | 'article' | 'course' | 'tutorial' | 'documentation' | 'other')[];
  onCategoryFilterChange: (category: ('video' | 'article' | 'course' | 'tutorial' | 'documentation' | 'other')[]) => void;
  levelFilter: ('beginner' | 'intermediate' | 'advanced')[];
  onLevelFilterChange: (level: ('beginner' | 'intermediate' | 'advanced')[]) => void;
  onReset: () => void;
}

export function EducationFilters({
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  levelFilter,
  onLevelFilterChange,
  onReset,
}: EducationFiltersProps) {
  const [open, setOpen] = useState(false);

  const handleToggleStatus = (status: 'draft' | 'published' | 'archived') => {
    if (statusFilter.includes(status)) {
      onStatusFilterChange(statusFilter.filter(s => s !== status));
    } else {
      onStatusFilterChange([...statusFilter, status]);
    }
  };

  const handleToggleCategory = (category: 'video' | 'article' | 'course' | 'tutorial' | 'documentation' | 'other') => {
    if (categoryFilter.includes(category)) {
      onCategoryFilterChange(categoryFilter.filter(c => c !== category));
    } else {
      onCategoryFilterChange([...categoryFilter, category]);
    }
  };

  const handleToggleLevel = (level: 'beginner' | 'intermediate' | 'advanced') => {
    if (levelFilter.includes(level)) {
      onLevelFilterChange(levelFilter.filter(l => l !== level));
    } else {
      onLevelFilterChange([...levelFilter, level]);
    }
  };

  const hasActiveFilters = statusFilter.length > 0 || categoryFilter.length > 0 || levelFilter.length > 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="w-4 h-4 ml-2" />
          فیلترها
          {hasActiveFilters && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
              {statusFilter.length + categoryFilter.length + levelFilter.length}
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
                { value: 'draft', label: 'پیش‌نویس' },
                { value: 'published', label: 'منتشر شده' },
                { value: 'archived', label: 'آرشیو شده' },
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
                { value: 'video', label: 'ویدیو' },
                { value: 'article', label: 'مقاله' },
                { value: 'course', label: 'دوره' },
                { value: 'tutorial', label: 'آموزش' },
                { value: 'documentation', label: 'مستندات' },
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

          {/* Level Filter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">سطح</Label>
            <div className="space-y-2">
              {([
                { value: 'beginner', label: 'مبتدی' },
                { value: 'intermediate', label: 'متوسط' },
                { value: 'advanced', label: 'پیشرفته' },
              ] as const).map(({ value, label }) => (
                <div key={value} className="flex items-center gap-2">
                  <Checkbox
                    id={`filter-level-${value}`}
                    checked={levelFilter.includes(value)}
                    onCheckedChange={() => handleToggleLevel(value)}
                  />
                  <Label
                    htmlFor={`filter-level-${value}`}
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
                      {status === 'draft' && 'پیش‌نویس'}
                      {status === 'published' && 'منتشر شده'}
                      {status === 'archived' && 'آرشیو شده'}
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
                      {category === 'video' && 'ویدیو'}
                      {category === 'article' && 'مقاله'}
                      {category === 'course' && 'دوره'}
                      {category === 'tutorial' && 'آموزش'}
                      {category === 'documentation' && 'مستندات'}
                      {category === 'other' && 'سایر'}
                      <button
                        onClick={() => handleToggleCategory(category)}
                        className="hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {levelFilter.map(level => (
                    <Badge key={level} variant="secondary" className="gap-1">
                      {level === 'beginner' && 'مبتدی'}
                      {level === 'intermediate' && 'متوسط'}
                      {level === 'advanced' && 'پیشرفته'}
                      <button
                        onClick={() => handleToggleLevel(level)}
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

