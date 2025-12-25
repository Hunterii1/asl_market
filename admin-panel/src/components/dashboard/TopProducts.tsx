import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';

const products = [
  { name: 'پکیج آموزشی طلایی', sales: 234, revenue: '۲۳,۴۰۰,۰۰۰', growth: 12 },
  { name: 'اشتراک ویژه سالانه', sales: 189, revenue: '۱۸,۹۰۰,۰۰۰', growth: 8 },
  { name: 'دوره جامع برنامه‌نویسی', sales: 156, revenue: '۱۵,۶۰۰,۰۰۰', growth: -3 },
  { name: 'بسته استارتر', sales: 142, revenue: '۷,۱۰۰,۰۰۰', growth: 15 },
  { name: 'مشاوره تخصصی', sales: 98, revenue: '۴,۹۰۰,۰۰۰', growth: 5 },
];

export function TopProducts() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">پرفروش‌ترین محصولات</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.map((product, index) => (
          <div
            key={product.name}
            className="flex items-center gap-4 animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
              <p className="text-xs text-muted-foreground">{product.sales} فروش</p>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">{product.revenue}</p>
              <p className={`text-xs ${product.growth >= 0 ? 'text-success' : 'text-destructive'}`}>
                {product.growth >= 0 ? '+' : ''}{product.growth}%
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
