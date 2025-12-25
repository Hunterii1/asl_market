import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  DollarSign,
  Box,
  Folder,
  Hash,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Image as ImageIcon,
  Tag,
  Percent,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { productCategories } from '@/lib/validations/product';

interface ProductData {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  tags?: string[];
  imageUrl?: string;
  discount?: number;
  sku?: string;
  createdAt: string;
  sales?: number;
  revenue?: number;
}

interface ViewProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductData | null;
}

const statusConfig = {
  active: {
    label: 'فعال',
    className: 'bg-success/10 text-success border-success/20',
    icon: CheckCircle,
  },
  inactive: {
    label: 'غیرفعال',
    className: 'bg-muted text-muted-foreground border-border',
    icon: XCircle,
  },
  out_of_stock: {
    label: 'ناموجود',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: AlertCircle,
  },
};

export function ViewProductDialog({ open, onOpenChange, product }: ViewProductDialogProps) {
  if (!product) return null;

  const StatusIcon = statusConfig[product.status].icon;
  const categoryLabel = productCategories.find(cat => cat.value === product.category)?.label || product.category;
  const finalPrice = product.discount && product.discount > 0
    ? product.price * (1 - product.discount / 100)
    : product.price;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="w-5 h-5 text-primary" />
            {product.name}
          </DialogTitle>
          <DialogDescription className="text-right">
            جزئیات کامل محصول
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2">{product.name}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn('border-2', statusConfig[product.status].className)}
                    >
                      <StatusIcon className="w-3 h-3 ml-1" />
                      {statusConfig[product.status].label}
                    </Badge>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {categoryLabel}
                    </Badge>
                    {product.discount && product.discount > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <Percent className="w-3 h-3" />
                        {product.discount}% تخفیف
                      </Badge>
                    )}
                  </div>
                </div>
                {product.imageUrl && (
                  <div className="w-32 h-32 rounded-xl overflow-hidden border border-border flex items-center justify-center shrink-0">
                    <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {product.description && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  توضیحات
                </h4>
                <p className="text-sm text-foreground whitespace-pre-wrap">{product.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Price & Stock */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4">قیمت و موجودی</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <DollarSign className="w-4 h-4" />
                    قیمت اصلی
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {product.price.toLocaleString('fa-IR')} تومان
                  </p>
                </div>
                {product.discount && product.discount > 0 && (
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Percent className="w-4 h-4" />
                      تخفیف
                    </div>
                    <p className="text-xl font-bold text-destructive">{product.discount}%</p>
                  </div>
                )}
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <DollarSign className="w-4 h-4" />
                    قیمت نهایی
                  </div>
                  <p className="text-xl font-bold text-success">
                    {finalPrice.toLocaleString('fa-IR')} تومان
                  </p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Box className="w-4 h-4" />
                    موجودی
                  </div>
                  <p className={cn(
                    "text-xl font-bold",
                    product.stock === 0 ? 'text-destructive' : 'text-foreground'
                  )}>
                    {product.stock} عدد
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          {(product.sales !== undefined || product.revenue !== undefined) && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  آمار فروش
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {product.sales !== undefined && (
                    <div className="bg-muted/50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Package className="w-4 h-4" />
                        تعداد فروش
                      </div>
                      <p className="text-xl font-bold text-foreground">
                        {product.sales.toLocaleString('fa-IR')} عدد
                      </p>
                    </div>
                  )}
                  {product.revenue !== undefined && (
                    <div className="bg-muted/50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <DollarSign className="w-4 h-4" />
                        درآمد
                      </div>
                      <p className="text-xl font-bold text-success">
                        {product.revenue.toLocaleString('fa-IR')} تومان
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Info */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4">اطلاعات تکمیلی</h4>
              <div className="grid grid-cols-2 gap-4">
                {product.sku && (
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">SKU</p>
                      <p className="text-sm font-medium text-foreground font-mono">{product.sku}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">دسته‌بندی</p>
                    <p className="text-sm font-medium text-foreground">{categoryLabel}</p>
                  </div>
                </div>
                {product.createdAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">تاریخ ایجاد</p>
                      <p className="text-sm font-medium text-foreground">{product.createdAt}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary" />
                  برچسب‌ها
                </h4>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

