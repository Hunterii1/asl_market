import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Boxes, 
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  Boxes as BoxesIcon,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Lock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus as PlusIcon,
  Minus,
  Package,
  Hash,
  MapPin,
  Warehouse,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/api/adminApi';
import { AddInventoryDialog } from '@/components/inventory/AddInventoryDialog';
import { EditInventoryDialog } from '@/components/inventory/EditInventoryDialog';
import { ViewInventoryDialog } from '@/components/inventory/ViewInventoryDialog';
import { DeleteInventoryDialog } from '@/components/inventory/DeleteInventoryDialog';
import { AdjustInventoryDialog } from '@/components/inventory/AdjustInventoryDialog';
import { InventoryFilters } from '@/components/inventory/InventoryFilters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Inventory {
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
  createdAt: string;
  updatedAt: string;
}

const statusConfig = {
  in_stock: {
    label: 'موجود',
    className: 'bg-success/10 text-success',
    icon: CheckCircle,
  },
  low_stock: {
    label: 'موجودی کم',
    className: 'bg-warning/10 text-warning',
    icon: AlertTriangle,
  },
  out_of_stock: {
    label: 'ناموجود',
    className: 'bg-destructive/10 text-destructive',
    icon: XCircle,
  },
  reserved: {
    label: 'رزرو شده',
    className: 'bg-info/10 text-info',
    icon: Lock,
  },
};

type SortField = 'productName' | 'sku' | 'quantity' | 'availableQuantity' | 'status' | 'warehouse' | 'cost' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInventory, setSelectedInventory] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewInventory, setViewInventory] = useState<Inventory | null>(null);
  const [editInventory, setEditInventory] = useState<Inventory | null>(null);
  const [deleteInventory, setDeleteInventory] = useState<Inventory | null>(null);
  const [adjustInventory, setAdjustInventory] = useState<Inventory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<('in_stock' | 'low_stock' | 'out_of_stock' | 'reserved')[]>([]);
  const [minQuantity, setMinQuantity] = useState('');
  const [maxQuantity, setMaxQuantity] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  const mapStatusFromBackend = (status: string): Inventory['status'] => {
    switch (status) {
      case 'out_of_stock':
        return 'out_of_stock';
      case 'low_stock':
        return 'low_stock';
      case 'reserved':
        return 'reserved';
      default:
        return 'in_stock';
    }
  };

  const reloadInventory = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAvailableProducts({
        page: currentPage,
        per_page: itemsPerPage,
      });

      const products = response.products || response.data?.products || [];
      const transformed: Inventory[] = products.map((p: any) => ({
        id: (p.id ?? p.ID ?? '').toString(),
        productId: (p.id ?? p.ID ?? '').toString(),
        productName: p.product_name || 'بدون نام',
        sku: p.model || '',
        quantity: p.available_quantity ?? 0,
        reservedQuantity: 0,
        availableQuantity: p.available_quantity ?? 0,
        minStock: p.min_order_quantity ?? 0,
        maxStock: p.max_order_quantity ?? 0,
        location: p.location || '',
        warehouse: p.origin || '',
        status: mapStatusFromBackend(p.status || 'active'),
        cost: parseInt(p.wholesale_price || '0', 10) || 0,
        notes: p.notes || '',
        createdAt: p.created_at || new Date().toISOString(),
        updatedAt: p.updated_at || p.created_at || new Date().toISOString(),
      }));

      setInventory(transformed);
      setTotalItems(response.total || response.data?.total || transformed.length);
    } catch (error: any) {
      console.error('Error loading inventory:', error);
      toast({
        title: 'خطا',
        description: error?.message || 'خطا در بارگذاری موجودی انبار',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadInventory();
  }, [currentPage, itemsPerPage]);

  // Get unique warehouses for filter
  const uniqueWarehouses = Array.from(new Set(inventory.map(i => i.warehouse).filter(Boolean))) as string[];

  // Filter inventory
  const filteredInventory = inventory.filter(item => {
    // Search filter
    const matchesSearch = 
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.productId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.warehouse?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.includes(searchQuery);

    // Status filter
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(item.status);

    // Quantity filter
    const matchesQuantity = (!minQuantity || item.quantity >= parseInt(minQuantity)) &&
                           (!maxQuantity || item.quantity <= parseInt(maxQuantity));

    // Warehouse filter
    const matchesWarehouse = warehouseFilter.length === 0 || (item.warehouse && warehouseFilter.includes(item.warehouse));

    return matchesSearch && matchesStatus && matchesQuantity && matchesWarehouse;
  });

  // Sort inventory
  const sortedInventory = [...filteredInventory].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'productName' || sortField === 'sku' || sortField === 'warehouse') {
      aValue = String(aValue || '').toLowerCase();
      bValue = String(bValue || '').toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedInventory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInventory = sortedInventory.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handleInventoryAdded = async () => {
    setCurrentPage(1);
    await reloadInventory();
  };

  const toggleSelectInventory = (inventoryId: string) => {
    setSelectedInventory(prev =>
      prev.includes(inventoryId)
        ? prev.filter(id => id !== inventoryId)
        : [...prev, inventoryId]
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleDeleteInventory = async () => {
    if (!deleteInventory) return;
    
    setIsDeleting(true);
    try {
      await adminApi.deleteAvailableProduct(parseInt(deleteInventory.id, 10));
      setDeleteInventory(null);
      setSelectedInventory(prev => prev.filter(id => id !== deleteInventory.id));
      await reloadInventory();
      toast({
        title: 'موفقیت',
        description: 'موجودی انبار با موفقیت حذف شد.',
      });
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error?.message || 'خطا در حذف موجودی انبار',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkAction = async (action: 'delete') => {
    if (selectedInventory.length === 0) return;

    try {
      if (action === 'delete') {
        for (const id of selectedInventory) {
          await adminApi.deleteAvailableProduct(parseInt(id, 10));
        }
      }

      setSelectedInventory([]);
      await reloadInventory();
      
      toast({
        title: 'موفقیت',
        description: `عملیات با موفقیت انجام شد.`,
      });
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error?.message || 'خطا در انجام عملیات',
        variant: 'destructive',
      });
    }
  };

  const handleResetFilters = () => {
    setStatusFilter([]);
    setMinQuantity('');
    setMaxQuantity('');
    setWarehouseFilter([]);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-primary" />
    ) : (
      <ArrowDown className="w-4 h-4 text-primary" />
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">مدیریت موجودی انبار</h1>
            <p className="text-muted-foreground">لیست تمامی موجودی‌های انبار</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              افزودن موجودی
            </Button>
          </div>
        </div>

        {/* Filters & Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="جستجو بر اساس نام محصول، SKU، شناسه، مکان یا انبار..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pr-10 pl-4 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                  />
                </div>
                <InventoryFilters
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  minQuantity={minQuantity}
                  maxQuantity={maxQuantity}
                  onMinQuantityChange={setMinQuantity}
                  onMaxQuantityChange={setMaxQuantity}
                  warehouseFilter={warehouseFilter}
                  onWarehouseFilterChange={setWarehouseFilter}
                  onReset={handleResetFilters}
                />
              </div>
              {(statusFilter.length > 0 || minQuantity || maxQuantity || warehouseFilter.length > 0) && (
                <div className="flex items-center justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4 ml-1" />
                    پاک کردن فیلترها
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedInventory.length > 0 && (
          <Card className="border-primary/50 bg-primary/5 animate-scale-in">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <span className="text-sm text-foreground font-medium">
                  {selectedInventory.length} موجودی انتخاب شده
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (confirm(`آیا از حذف ${selectedInventory.length} موجودی اطمینان دارید؟`)) {
                        handleBulkAction('delete');
                      }
                    }}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    حذف
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inventory Table */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">لیست موجودی انبار ({sortedInventory.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {paginatedInventory.length === 0 ? (
              <div className="p-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <BoxesIcon className="w-12 h-12 text-muted-foreground" />
                  <p className="text-muted-foreground">هیچ موجودی‌ای یافت نشد</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground w-12">
                        <input
                          type="checkbox"
                          checked={selectedInventory.length === paginatedInventory.length && paginatedInventory.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInventory(paginatedInventory.map(i => i.id));
                            } else {
                              setSelectedInventory([]);
                            }
                          }}
                          className="w-4 h-4 rounded border-border"
                        />
                      </th>
                      <th className="p-4 text-right">
                        <button
                          onClick={() => handleSort('productName')}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          محصول
                          {getSortIcon('productName')}
                        </button>
                      </th>
                      <th className="p-4 text-right">
                        <button
                          onClick={() => handleSort('sku')}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          SKU
                          {getSortIcon('sku')}
                        </button>
                      </th>
                      <th className="p-4 text-right">
                        <button
                          onClick={() => handleSort('quantity')}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          تعداد کل
                          {getSortIcon('quantity')}
                        </button>
                      </th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">رزرو شده</th>
                      <th className="p-4 text-right">
                        <button
                          onClick={() => handleSort('availableQuantity')}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          موجود
                          {getSortIcon('availableQuantity')}
                        </button>
                      </th>
                      <th className="p-4 text-right">
                        <button
                          onClick={() => handleSort('status')}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          وضعیت
                          {getSortIcon('status')}
                        </button>
                      </th>
                      <th className="p-4 text-right">
                        <button
                          onClick={() => handleSort('warehouse')}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          انبار
                          {getSortIcon('warehouse')}
                        </button>
                      </th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedInventory.map((item, index) => {
                      const StatusIcon = statusConfig[item.status].icon;
                      const availableQuantity = item.availableQuantity !== undefined 
                        ? item.availableQuantity 
                        : item.quantity - (item.reservedQuantity || 0);
                      return (
                        <tr
                          key={item.id}
                          className={cn(
                            "border-b border-border/50 hover:bg-muted/30 transition-colors animate-fade-in",
                            item.status === 'low_stock' && "bg-warning/5",
                            item.status === 'out_of_stock' && "bg-destructive/5"
                          )}
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedInventory.includes(item.id)}
                              onChange={() => toggleSelectInventory(item.id)}
                              className="w-4 h-4 rounded border-border"
                            />
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-foreground">{item.productName}</p>
                              {item.location && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {item.location}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            {item.sku ? (
                              <p className="text-sm font-mono text-foreground">{item.sku}</p>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            <p className="text-sm font-medium text-foreground">
                              {item.quantity.toLocaleString('fa-IR')}
                            </p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm text-warning">
                              {(item.reservedQuantity || 0).toLocaleString('fa-IR')}
                            </p>
                          </td>
                          <td className="p-4">
                            <p className={cn(
                              "text-sm font-bold",
                              availableQuantity <= (item.minStock || 0) ? 'text-destructive' : 'text-success'
                            )}>
                              {availableQuantity.toLocaleString('fa-IR')}
                            </p>
                            {item.minStock !== undefined && availableQuantity <= item.minStock && (
                              <p className="text-xs text-destructive mt-1">⚠️ زیر حداقل</p>
                            )}
                          </td>
                          <td className="p-4">
                            <Badge
                              variant="outline"
                              className={cn('text-xs', statusConfig[item.status].className)}
                            >
                              <StatusIcon className="w-3 h-3 ml-1" />
                              {statusConfig[item.status].label}
                            </Badge>
                          </td>
                          <td className="p-4">
                            {item.warehouse ? (
                              <div className="flex items-center gap-1">
                                <Warehouse className="w-3 h-3 text-muted-foreground" />
                                <p className="text-sm text-foreground">{item.warehouse}</p>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon-sm"
                                onClick={() => setViewInventory(item)}
                                title="مشاهده"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon-sm"
                                onClick={() => setEditInventory(item)}
                                title="ویرایش"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon-sm"
                                onClick={() => setAdjustInventory(item)}
                                title="تغییر موجودی"
                                className="text-primary hover:bg-primary/10"
                              >
                                <PlusIcon className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon-sm" 
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteInventory(item)}
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border gap-4 mt-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  نمایش {startIndex + 1} تا {Math.min(endIndex, sortedInventory.length)} از {sortedInventory.length} موجودی
                </span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">۲۰</SelectItem>
                    <SelectItem value="50">۵۰</SelectItem>
                    <SelectItem value="100">۱۰۰</SelectItem>
                    <SelectItem value="200">۲۰۰</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  قبلی
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={currentPage === pageNum ? "gradient-primary text-primary-foreground" : ""}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  بعدی
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog افزودن موجودی */}
      <AddInventoryDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleInventoryAdded}
      />

      {/* Dialog مشاهده موجودی */}
      <ViewInventoryDialog
        open={!!viewInventory}
        onOpenChange={(open) => !open && setViewInventory(null)}
        inventory={viewInventory}
      />

      {/* Dialog ویرایش موجودی */}
      <EditInventoryDialog
        open={!!editInventory}
        onOpenChange={(open) => !open && setEditInventory(null)}
        inventory={editInventory}
        onSuccess={() => {
          const stored = localStorage.getItem('asll-inventory');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              setInventory(parsed);
            } catch {}
          }
          setEditInventory(null);
        }}
      />

      {/* Dialog تغییر موجودی */}
      <AdjustInventoryDialog
        open={!!adjustInventory}
        onOpenChange={(open) => !open && setAdjustInventory(null)}
        inventory={adjustInventory}
        onSuccess={() => {
          const stored = localStorage.getItem('asll-inventory');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              setInventory(parsed);
            } catch {}
          }
          setAdjustInventory(null);
        }}
      />

      {/* Dialog حذف موجودی */}
      <DeleteInventoryDialog
        open={!!deleteInventory}
        onOpenChange={(open) => !open && setDeleteInventory(null)}
        inventory={deleteInventory}
        onConfirm={handleDeleteInventory}
        isDeleting={isDeleting}
      />
    </AdminLayout>
  );
}

