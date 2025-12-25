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
  Boxes,
  Package,
  Hash,
  MapPin,
  Warehouse,
  DollarSign,
  FileText,
  Calendar,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryData {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  minStock?: number;
  maxStock?: number;
  location?: string;
  warehouse?: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'reserved';
  cost?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ViewInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: InventoryData | null;
}

const statusConfig = {
  in_stock: {
    label: 'موجود',
    className: 'bg-success/10 text-success border-success/20',
    icon: CheckCircle,
  },
  low_stock: {
    label: 'موجودی کم',
    className: 'bg-warning/10 text-warning border-warning/20',
    icon: AlertTriangle,
  },
  out_of_stock: {
    label: 'ناموجود',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: XCircle,
  },
  reserved: {
    label: 'رزرو شده',
    className: 'bg-info/10 text-info border-info/20',
    icon: Lock,
  },
};

export function ViewInventoryDialog({ open, onOpenChange, inventory }: ViewInventoryDialogProps) {
  if (!inventory) return null;

  const StatusIcon = statusConfig[inventory.status].icon;
  const availableQuantity = inventory.availableQuantity !== undefined 
    ? inventory.availableQuantity 
    : inventory.quantity - (inventory.reservedQuantity || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Boxes className="w-5 h-5 text-primary" />
            {inventory.productName}
          </DialogTitle>
          <DialogDescription className="text-right">
            جزئیات کامل موجودی انبار
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2">{inventory.productName}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn('border-2', statusConfig[inventory.status].className)}
                    >
                      <StatusIcon className="w-3 h-3 ml-1" />
                      {statusConfig[inventory.status].label}
                    </Badge>
                    {inventory.sku && (
                      <Badge variant="outline" className="bg-muted text-muted-foreground">
                        <Hash className="w-3 h-3 ml-1" />
                        {inventory.sku}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quantity Information */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4">اطلاعات موجودی</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Boxes className="w-4 h-4" />
                    تعداد کل
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {inventory.quantity.toLocaleString('fa-IR')}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Lock className="w-4 h-4" />
                    رزرو شده
                  </div>
                  <p className="text-xl font-bold text-warning">
                    {(inventory.reservedQuantity || 0).toLocaleString('fa-IR')}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <CheckCircle className="w-4 h-4" />
                    موجود
                  </div>
                  <p className={cn(
                    "text-xl font-bold",
                    availableQuantity <= (inventory.minStock || 0) ? 'text-destructive' : 'text-success'
                  )}>
                    {availableQuantity.toLocaleString('fa-IR')}
                  </p>
                </div>
                {inventory.cost !== undefined && inventory.cost > 0 && (
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <DollarSign className="w-4 h-4" />
                      هزینه کل
                    </div>
                    <p className="text-xl font-bold text-foreground">
                      {(inventory.cost * inventory.quantity).toLocaleString('fa-IR')} تومان
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stock Limits */}
          {(inventory.minStock !== undefined || inventory.maxStock !== undefined) && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  محدودیت‌های موجودی
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {inventory.minStock !== undefined && (
                    <div className="bg-muted/50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        حداقل موجودی
                      </div>
                      <p className={cn(
                        "text-xl font-bold",
                        availableQuantity <= inventory.minStock ? 'text-destructive' : 'text-foreground'
                      )}>
                        {inventory.minStock.toLocaleString('fa-IR')}
                      </p>
                      {availableQuantity <= inventory.minStock && (
                        <p className="text-xs text-destructive mt-1">⚠️ هشدار: موجودی به حداقل رسیده است</p>
                      )}
                    </div>
                  )}
                  {inventory.maxStock !== undefined && (
                    <div className="bg-muted/50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Boxes className="w-4 h-4" />
                        حداکثر موجودی
                      </div>
                      <p className="text-xl font-bold text-foreground">
                        {inventory.maxStock.toLocaleString('fa-IR')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location Information */}
          {(inventory.location || inventory.warehouse) && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-foreground mb-4">اطلاعات مکان</h4>
                <div className="grid grid-cols-2 gap-4">
                  {inventory.warehouse && (
                    <div className="flex items-center gap-2">
                      <Warehouse className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">انبار</p>
                        <p className="text-sm font-medium text-foreground">{inventory.warehouse}</p>
                      </div>
                    </div>
                  )}
                  {inventory.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">مکان</p>
                        <p className="text-sm font-medium text-foreground">{inventory.location}</p>
                      </div>
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
                {inventory.productId && (
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">شناسه محصول</p>
                      <p className="text-sm font-medium text-foreground">{inventory.productId}</p>
                    </div>
                  </div>
                )}
                {inventory.cost !== undefined && inventory.cost > 0 && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">هزینه واحد</p>
                      <p className="text-sm font-medium text-foreground">
                        {inventory.cost.toLocaleString('fa-IR')} تومان
                      </p>
                    </div>
                  </div>
                )}
                {inventory.createdAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">تاریخ ایجاد</p>
                      <p className="text-sm font-medium text-foreground">{inventory.createdAt}</p>
                    </div>
                  </div>
                )}
                {inventory.updatedAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">آخرین بروزرسانی</p>
                      <p className="text-sm font-medium text-foreground">{inventory.updatedAt}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {inventory.notes && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  یادداشت
                </h4>
                <p className="text-sm text-foreground whitespace-pre-wrap">{inventory.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

