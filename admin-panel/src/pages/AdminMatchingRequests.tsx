import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Package,
  Eye,
  Search,
  Filter,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  MessageCircle,
  User,
  Trash2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api/adminApi";

const toFarsiNumber = (num: number | string | null | undefined) => {
  if (num === null || num === undefined) {
    return "۰";
  }
  if (typeof num === "string") {
    if (num.trim().length === 0) {
      return "۰";
    }
    return num.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
  }
  if (Number.isNaN(num)) {
    return "۰";
  }
  return num.toLocaleString("fa-IR");
};

interface MatchingRequest {
  id: number;
  supplier: {
    id: number;
    full_name: string;
    brand_name: string;
    city: string;
  };
  product_name: string;
  quantity: string;
  unit: string;
  destination_countries: string;
  price: string;
  currency: string;
  status: string;
  matched_visitor_count: number;
  responses_count: number;
  remaining_time: string;
  is_expired: boolean;
  created_at: string;
  description?: string;
}

interface Stats {
  total_requests: number;
  active_requests: number;
  accepted_requests: number;
  expired_requests: number;
  completed_requests: number;
  total_responses: number;
  total_chats: number;
}

export default function AdminMatchingRequests() {
  const [requests, setRequests] = useState<MatchingRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MatchingRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadStats();
    loadRequests();
  }, [statusFilter, page]);

  const loadStats = async () => {
    try {
      const response = await adminApi.getAdminMatchingStats();
      const raw = response.stats || response.data?.stats || response;

      const normalized: Stats = {
        total_requests: raw.total_requests ?? raw.TotalRequests ?? 0,
        active_requests: raw.active_requests ?? raw.ActiveRequests ?? 0,
        accepted_requests: raw.accepted_requests ?? raw.AcceptedRequests ?? 0,
        expired_requests: raw.expired_requests ?? raw.ExpiredRequests ?? 0,
        completed_requests: raw.completed_requests ?? raw.CompletedRequests ?? 0,
        total_responses: raw.total_responses ?? raw.TotalResponses ?? 0,
        total_chats: raw.total_chats ?? raw.TotalChats ?? 0,
      };

      setStats(normalized);
    } catch (error: any) {
      console.error("خطا در بارگذاری آمار:", error);
    }
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAdminMatchingRequests({
        status: statusFilter === "all" ? undefined : statusFilter,
        page,
        per_page: 20,
      });
      const data = response.data || response.requests || response;
      setRequests((data as MatchingRequest[]) || []);
      setTotalPages(
        response.total_pages ||
          response.data?.total_pages ||
          response.pagination?.total_pages ||
          1
      );
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "خطا در بارگذاری درخواست‌ها",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, isExpired: boolean) => {
    if (isExpired) {
      return (
        <Badge variant="outline" className="bg-slate-500/20 text-slate-300 border-slate-500/40">
          منقضی شده
        </Badge>
      );
    }
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
            فعال
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/40">
            پذیرفته شده
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/40">
            مختوم شده
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-500/20 text-red-300 border-red-500/40">
            لغو شده
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRequests = requests.filter(
    (req) =>
      req.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.supplier?.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.supplier?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">مدیریت درخواست‌های مچینگ</h1>
        <p className="text-muted-foreground">مشاهده و مدیریت تمام درخواست‌های مچینگ تأمین‌کننده‌ها</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">کل درخواست‌ها</p>
                  <p className="text-2xl font-bold text-foreground">
                    {toFarsiNumber(stats.total_requests)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">فعال</p>
                  <p className="text-2xl font-bold text-foreground">
                    {toFarsiNumber(stats.active_requests)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">مختوم شده</p>
                  <p className="text-2xl font-bold text-foreground">
                    {toFarsiNumber(stats.completed_requests)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">کل پاسخ‌ها</p>
                  <p className="text-2xl font-bold text-foreground">
                    {toFarsiNumber(stats.total_responses)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو در نام محصول، تأمین‌کننده..."
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="w-4 h-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="active">فعال</SelectItem>
                <SelectItem value="accepted">پذیرفته شده</SelectItem>
                <SelectItem value="completed">مختوم شده</SelectItem>
                <SelectItem value="expired">منقضی شده</SelectItem>
                <SelectItem value="cancelled">لغو شده</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">درخواستی یافت نشد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="hover:border-blue-500/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{request.product_name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      تأمین‌کننده: {request.supplier?.brand_name || request.supplier?.full_name} (
                      {request.supplier?.city})
                    </p>
                  </div>
                  {getStatusBadge(request.status, request.is_expired)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">مقدار</p>
                    <p className="text-sm font-semibold">
                      {toFarsiNumber(request.quantity)} {request.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">قیمت</p>
                    <p className="text-sm font-semibold">
                      {toFarsiNumber(request.price)} {request.currency}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">تعداد پاسخ‌ها</p>
                    <p className="text-sm font-semibold">{toFarsiNumber(request.responses_count)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">زمان باقیمانده</p>
                    <p className="text-sm font-semibold">{request.remaining_time}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedRequest(request);
                      setDetailsOpen(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    مشاهده جزئیات
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const newStatus = window.prompt(
                        "وضعیت جدید درخواست را وارد کنید (pending, active, accepted, expired, cancelled, completed):",
                        request.status
                      );
                      if (!newStatus || newStatus === request.status) {
                        return;
                      }
                      const normalized = newStatus.trim();
                      const validStatuses = [
                        "pending",
                        "active",
                        "accepted",
                        "expired",
                        "cancelled",
                        "completed",
                      ];
                      if (!validStatuses.includes(normalized)) {
                        toast({
                          title: "خطا",
                          description: "وضعیت وارد شده نامعتبر است.",
                          variant: "destructive",
                        });
                        return;
                      }
                      try {
                        setIsUpdating(true);
                        await adminApi.updateAdminMatchingRequest(request.id, {
                          status: normalized,
                        });
                        toast({
                          title: "موفقیت",
                          description:
                            "وضعیت درخواست با موفقیت به‌روزرسانی شد.",
                        });
                        await loadRequests();
                      } catch (error: any) {
                        toast({
                          title: "خطا",
                          description:
                            error.message || "خطا در به‌روزرسانی درخواست",
                          variant: "destructive",
                        });
                      } finally {
                        setIsUpdating(false);
                      }
                    }}
                    disabled={isUpdating}
                  >
                    تغییر وضعیت
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 border-red-500/40 hover:bg-red-500/10"
                    onClick={async () => {
                      if (
                        !window.confirm(
                          `آیا از حذف درخواست برای «${request.product_name}» اطمینان دارید؟`
                        )
                      ) {
                        return;
                      }
                      try {
                        setIsDeleting(true);
                        await adminApi.deleteAdminMatchingRequest(request.id);
                        toast({
                          title: "موفقیت",
                          description: "درخواست با موفقیت حذف شد.",
                        });
                        await loadRequests();
                      } catch (error: any) {
                        toast({
                          title: "خطا",
                          description:
                            error.message || "خطا در حذف درخواست",
                          variant: "destructive",
                        });
                      } finally {
                        setIsDeleting(false);
                      }
                    }}
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            قبلی
          </Button>
          <span className="text-sm text-muted-foreground">
            صفحه {toFarsiNumber(page)} از {toFarsiNumber(totalPages)}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            بعدی
          </Button>
        </div>
      )}
      
      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) {
            setSelectedRequest(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              جزئیات درخواست مچینگ
              {selectedRequest ? ` - ${selectedRequest.product_name}` : ""}
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">تأمین‌کننده</p>
                  <p className="text-base font-semibold">
                    {selectedRequest.supplier?.brand_name ||
                      selectedRequest.supplier?.full_name ||
                      "نامشخص"}
                  </p>
                  {selectedRequest.supplier?.city && (
                    <p className="text-xs text-muted-foreground mt-1">
                      شهر: {selectedRequest.supplier.city}
                    </p>
                  )}
                </div>
                {getStatusBadge(selectedRequest.status, selectedRequest.is_expired)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">محصول</p>
                  <p className="text-sm font-semibold">{selectedRequest.product_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">مقدار</p>
                  <p className="text-sm font-semibold">
                    {toFarsiNumber(selectedRequest.quantity)} {selectedRequest.unit}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">قیمت</p>
                  <p className="text-sm font-semibold">
                    {toFarsiNumber(selectedRequest.price)} {selectedRequest.currency}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">تعداد پاسخ‌ها</p>
                  <p className="text-sm font-semibold">
                    {toFarsiNumber(selectedRequest.responses_count)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">زمان باقیمانده / وضعیت انقضا</p>
                  <p className="text-sm font-semibold">
                    {selectedRequest.remaining_time}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">مقصدها</p>
                  <p className="text-sm font-semibold">
                    {selectedRequest.destination_countries || "نامشخص"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">تاریخ ایجاد</p>
                  <p className="text-sm font-semibold">
                    {selectedRequest.created_at
                      ? new Date(selectedRequest.created_at).toLocaleString("fa-IR")
                      : "نامشخص"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">آخرین به‌روزرسانی</p>
                  <p className="text-sm font-semibold">
                    {/* created_at را به عنوان جای‌گزین نشان می‌دهیم اگر فیلد جدا نیاید */}
                    {selectedRequest.created_at
                      ? new Date(selectedRequest.created_at).toLocaleString("fa-IR")
                      : "نامشخص"}
                  </p>
                </div>
              </div>

              {selectedRequest.description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">توضیحات</p>
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedRequest.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  );
}
