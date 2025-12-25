import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Search,
  Users,
  Package,
  Shield,
  Wallet,
  Key,
  MessageSquare,
  GraduationCap,
  Truck,
  Eye,
  Boxes,
  Megaphone,
  Bell,
  FileSpreadsheet,
  Settings,
  LayoutDashboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: any;
  href: string;
}

const searchCategories = [
  {
    title: 'صفحات',
    items: [
      { id: 'dashboard', title: 'داشبورد', description: 'صفحه اصلی', icon: LayoutDashboard, href: '/' },
      { id: 'users', title: 'کاربران', description: 'مدیریت کاربران', icon: Users, href: '/users' },
      { id: 'products', title: 'محصولات', description: 'مدیریت محصولات', icon: Package, href: '/products' },
      { id: 'admins', title: 'مدیران', description: 'مدیریت مدیران', icon: Shield, href: '/admins' },
      { id: 'statistics', title: 'آمار سیستم', description: 'آمار و گزارش‌ها', icon: LayoutDashboard, href: '/statistics' },
      { id: 'withdrawals', title: 'برداشت‌ها', description: 'مدیریت برداشت‌ها', icon: Wallet, href: '/withdrawals' },
      { id: 'licenses', title: 'لایسنس‌ها', description: 'مدیریت لایسنس‌ها', icon: Key, href: '/licenses' },
      { id: 'tickets', title: 'تیکت‌ها', description: 'پشتیبانی و تیکت‌ها', icon: MessageSquare, href: '/tickets' },
      { id: 'education', title: 'آموزش', description: 'محتوای آموزشی', icon: GraduationCap, href: '/education' },
      { id: 'suppliers', title: 'تامین‌کنندگان', description: 'مدیریت تامین‌کنندگان', icon: Truck, href: '/suppliers' },
      { id: 'visitors', title: 'بازدیدکنندگان', description: 'مدیریت بازدیدکنندگان', icon: Eye, href: '/visitors' },
      { id: 'inventory', title: 'موجودی انبار', description: 'مدیریت موجودی', icon: Boxes, href: '/inventory' },
      { id: 'popups', title: 'پاپ‌آپ‌ها', description: 'مدیریت پاپ‌آپ‌ها', icon: Megaphone, href: '/popups' },
      { id: 'notifications', title: 'اعلان‌ها', description: 'مدیریت اعلان‌ها', icon: Bell, href: '/notifications' },
      { id: 'export', title: 'خروجی اکسل', description: 'خروجی گرفتن از داده‌ها', icon: FileSpreadsheet, href: '/export' },
      { id: 'settings', title: 'تنظیمات', description: 'تنظیمات سیستم', icon: Settings, href: '/settings' },
    ],
  },
];

export function SearchBox() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const filteredResults: SearchResult[] = [];
  
  if (searchQuery.trim()) {
    searchCategories.forEach(category => {
      category.items.forEach(item => {
        if (
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          filteredResults.push({
            id: item.id,
            title: item.title,
            description: item.description,
            category: category.title,
            icon: item.icon,
            href: item.href,
          });
        }
      });
    });
  } else {
    searchCategories.forEach(category => {
      category.items.forEach(item => {
        filteredResults.push({
          id: item.id,
          title: item.title,
          description: item.description,
          category: category.title,
          icon: item.icon,
          href: item.href,
        });
      });
    });
  }

  const handleSelect = (href: string) => {
    navigate(href);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <div
        className="relative max-w-md flex-1 cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="جستجوی سریع..."
          readOnly
          className="w-full h-10 pr-10 pl-4 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm placeholder:text-muted-foreground cursor-pointer"
        />
        <kbd className="absolute left-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground pointer-events-none">
          ⌘K
        </kbd>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          ref={inputRef}
          placeholder="جستجو کنید..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          className="text-right"
        />
        <CommandList>
          <CommandEmpty>نتیجه‌ای یافت نشد</CommandEmpty>
          {searchCategories.map((category) => {
            const categoryItems = filteredResults.filter(
              item => item.category === category.title
            );
            
            if (categoryItems.length === 0) return null;

            return (
              <CommandGroup key={category.title} heading={category.title}>
                {categoryItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={item.id}
                      onSelect={() => handleSelect(item.href)}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}

