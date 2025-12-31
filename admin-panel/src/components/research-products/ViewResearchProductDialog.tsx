import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Hash,
  Calendar,
  CheckCircle,
  XCircle,
  TrendingUp,
  Globe,
  DollarSign,
  Target,
  Award,
  AlertCircle,
  Building2,
  ClipboardList,
  Shield,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminApi } from '@/lib/api/adminApi';

interface ResearchProductData {
  id: string;
  name: string;
  hs_code?: string;
  category: string;
  description?: string;
  export_value?: string;
  import_value?: string;
  market_demand?: 'high' | 'medium' | 'low';
  profit_potential?: 'high' | 'medium' | 'low';
  competition_level?: 'high' | 'medium' | 'low';
  target_country?: string;
  target_countries?: string;
  iran_purchase_price?: string;
  target_country_price?: string;
  price_currency?: string;
  profit_margin?: string;
  seasonal_factors?: string;
  required_licenses?: string;
  quality_standards?: string;
  status: 'active' | 'inactive';
  priority?: number;
  created_at?: string;
  updated_at?: string;
}

interface ViewResearchProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ResearchProductData | null;
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
};

const levelConfig = {
  high: { label: 'زیاد', className: 'bg-destructive/10 text-destructive' },
  medium: { label: 'متوسط', className: 'bg-warning/10 text-warning' },
  low: { label: 'کم', className: 'bg-success/10 text-success' },
};

export function ViewResearchProductDialog({ open, onOpenChange, product: initialProduct }: ViewResearchProductDialogProps) {
  const [fullProduct, setFullProduct] = useState<ResearchProductData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && initialProduct) {
      const loadFullProduct = async () => {
        try {
          setLoading(true);
          const response = await adminApi.getResearchProduct(Number(initialProduct.id));
          if (response && response.product) {
            const p = response.product;
            setFullProduct({
              id: p.id?.toString() || '',
              name: p.name || '',
              hs_code: p.hs_code || '',
              category: p.category || '',
              description: p.description || '',
              export_value: p.export_value || '',
              import_value: p.import_value || '',
              market_demand: p.market_demand || undefined,
              profit_potential: p.profit_potential || undefined,
              competition_level: p.competition_level || undefined,
              target_country: p.target_country || '',
              target_countries: p.target_countries || '',
              iran_purchase_price: p.iran_purchase_price || '',
              target_country_price: p.target_country_price || '',
              price_currency: p.price_currency || 'USD',
              profit_margin: p.profit_margin || '',
              seasonal_factors: p.seasonal_factors || '',
              required_licenses: p.required_licenses || '',
              quality_standards: p.quality_standards || '',
              status: (p.status || 'active') as 'active' | 'inactive',
              priority: p.priority || 0,
              created_at: p.created_at,
              updated_at: p.updated_at,
            });
          } else {
            setFullProduct(initialProduct);
          }
        } catch (error) {
          console.error('Error loading full product:', error);
          setFullProduct(initialProduct);
        } finally {
          setLoading(false);
        }
      };
      loadFullProduct();
    } else {
      setFullProduct(null);
    }
  }, [open, initialProduct]);

  if (!fullProduct && !initialProduct) return null;
  const product = fullProduct || initialProduct!;

  const StatusIcon = statusConfig[product.status].icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-5 h-5 text-primary" />
            {product.name}
          </DialogTitle>
          <DialogDescription className="text-right">
            جزئیات کامل محصول تحقیقی
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
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
                        {product.category && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            {product.category}
                          </Badge>
                        )}
                        {product.hs_code && (
                          <Badge variant="outline" className="font-mono">
                            <Hash className="w-3 h-3 ml-1" />
                            {product.hs_code}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
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

            {/* Market Analysis */}
            {(product.market_demand || product.profit_potential || product.competition_level) && (
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    تحلیل بازار
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {product.market_demand && (
                      <div className="bg-muted/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Target className="w-4 h-4" />
                          تقاضای بازار
                        </div>
                        <Badge className={cn('text-xs', levelConfig[product.market_demand].className)}>
                          {levelConfig[product.market_demand].label}
                        </Badge>
                      </div>
                    )}
                    {product.profit_potential && (
                      <div className="bg-muted/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <DollarSign className="w-4 h-4" />
                          پتانسیل سود
                        </div>
                        <Badge className={cn('text-xs', levelConfig[product.profit_potential].className)}>
                          {levelConfig[product.profit_potential].label}
                        </Badge>
                      </div>
                    )}
                    {product.competition_level && (
                      <div className="bg-muted/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <AlertCircle className="w-4 h-4" />
                          سطح رقابت
                        </div>
                        <Badge className={cn('text-xs', levelConfig[product.competition_level].className)}>
                          {levelConfig[product.competition_level].label}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pricing */}
            {(product.iran_purchase_price || product.target_country_price || product.profit_margin) && (
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    اطلاعات قیمت
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {product.iran_purchase_price && (
                      <div className="bg-muted/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Building2 className="w-4 h-4" />
                          قیمت خرید از ایران
                        </div>
                        <p className="text-lg font-bold text-foreground">
                          {product.iran_purchase_price} {product.price_currency || 'USD'}
                        </p>
                      </div>
                    )}
                    {product.target_country_price && (
                      <div className="bg-muted/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Globe className="w-4 h-4" />
                          قیمت فروش در کشور هدف
                        </div>
                        <p className="text-lg font-bold text-foreground">
                          {product.target_country_price} {product.price_currency || 'USD'}
                        </p>
                      </div>
                    )}
                    {product.profit_margin && (
                      <div className="bg-muted/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Award className="w-4 h-4" />
                          حاشیه سود
                        </div>
                        <p className="text-lg font-bold text-success">
                          {product.profit_margin}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trade Values */}
            {(product.export_value || product.import_value) && (
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    حجم معاملات
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {product.export_value && (
                      <div className="bg-muted/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          مقدار صادرات
                        </div>
                        <p className="text-lg font-bold text-foreground">{product.export_value}</p>
                      </div>
                    )}
                    {product.import_value && (
                      <div className="bg-muted/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          مقدار واردات
                        </div>
                        <p className="text-lg font-bold text-foreground">{product.import_value}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Target Countries */}
            {product.target_countries && (
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    کشورهای هدف
                  </h4>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{product.target_countries}</p>
                </CardContent>
              </Card>
            )}

            {/* Additional Information */}
            {(product.seasonal_factors || product.required_licenses || product.quality_standards) && (
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-foreground mb-4">اطلاعات تکمیلی</h4>
                  <div className="space-y-4">
                    {product.seasonal_factors && (
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Calendar className="w-4 h-4" />
                          عوامل فصلی
                        </div>
                        <p className="text-sm text-foreground">{product.seasonal_factors}</p>
                      </div>
                    )}
                    {product.required_licenses && (
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Shield className="w-4 h-4" />
                          مجوزهای مورد نیاز
                        </div>
                        <p className="text-sm text-foreground">{product.required_licenses}</p>
                      </div>
                    )}
                    {product.quality_standards && (
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <ClipboardList className="w-4 h-4" />
                          استانداردهای کیفی
                        </div>
                        <p className="text-sm text-foreground">{product.quality_standards}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-foreground mb-4">اطلاعات تکمیلی</h4>
                <div className="grid grid-cols-2 gap-4">
                  {product.created_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">تاریخ ایجاد</p>
                        <p className="text-sm font-medium text-foreground">
                          {new Date(product.created_at).toLocaleDateString('fa-IR')}
                        </p>
                      </div>
                    </div>
                  )}
                  {product.priority !== undefined && (
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">اولویت</p>
                        <p className="text-sm font-medium text-foreground">{product.priority}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
