import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import HeaderAuth from "@/components/ui/HeaderAuth";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  Plus,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Globe,
  DollarSign,
  Users,
  RefreshCw,
  Edit,
  Trash2,
  CalendarClock
} from "lucide-react";

interface MatchingRequest {
  id: number;
  product_name: string;
  quantity: string;
  unit: string;
  destination_countries: string;
  price: string;
  currency: string;
  status: string;
  matched_visitor_count: number;
  accepted_visitor_id?: number;
  expires_at: string;
  remaining_time: string;
  is_expired: boolean;
  created_at: string;
  updated_at: string;
}

export default function MyMatchingRequests() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<MatchingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadRequests();
  }, [page, statusFilter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await apiService.getMyMatchingRequests({
        page,
        per_page: 10,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      setRequests(response.data || []);
      setTotal(response.total || 0);
      setTotalPages(response.total_pages || 1);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در دریافت درخواست‌ها",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, isExpired: boolean) => {
    if (isExpired) {
      return <Badge variant="secondary" className="bg-gray-500">منقضی شده</Badge>;
    }

    switch (status) {
      case "pending":
        return <Badge variant="secondary">در انتظار</Badge>;
      case "active":
        return <Badge className="bg-blue-500">فعال</Badge>;
      case "accepted":
        return <Badge className="bg-green-500">پذیرفته شده</Badge>;
      case "completed":
        return <Badge className="bg-purple-500">تکمیل شده</Badge>;
      case "cancelled":
        return <Badge variant="destructive">لغو شده</Badge>;
      case "expired":
        return <Badge variant="secondary" className="bg-gray-500">منقضی شده</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("آیا از لغو این درخواست اطمینان دارید؟")) {
      return;
    }

    try {
      await apiService.cancelMatchingRequest(id);
      toast({
        title: "موفقیت",
        description: "درخواست با موفقیت لغو شد",
      });
      loadRequests();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در لغو درخواست",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <HeaderAuth />
      <div className="container mx-auto px-2 sm:px-4 max-w-6xl py-4 sm:py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold">درخواست‌های Matching من</CardTitle>
                <p className="text-muted-foreground mt-1">
                  مدیریت و پیگیری درخواست‌های Matching شما
                </p>
              </div>
              <Button onClick={() => navigate("/matching/create")}>
                درخواست جدید
                <Plus className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="فیلتر بر اساس وضعیت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="pending">در انتظار</SelectItem>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="accepted">پذیرفته شده</SelectItem>
                  <SelectItem value="completed">تکمیل شده</SelectItem>
                  <SelectItem value="cancelled">لغو شده</SelectItem>
                  <SelectItem value="expired">منقضی شده</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={loadRequests} disabled={loading}>
                بروزرسانی
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Requests List */}
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">در حال بارگذاری...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">درخواستی یافت نشد</h3>
                <p className="text-muted-foreground mb-4">
                  هنوز درخواست Matching ایجاد نکرده‌اید
                </p>
                <Button onClick={() => navigate("/matching/create")}>
                  ایجاد درخواست جدید
                  <Plus className="w-4 h-4 mr-2" />
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {requests.map((request) => (
                    <Card 
                      key={request.id} 
                      className={`hover:shadow-xl transition-all duration-300 ${
                        request.status === 'accepted' ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10' :
                        request.is_expired ? 'opacity-75 border-gray-300 dark:border-gray-700' :
                        'border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row justify-between gap-4">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className={`p-2 rounded-lg ${
                                    request.status === 'accepted' ? 'bg-green-100 dark:bg-green-900/30' :
                                    request.is_expired ? 'bg-gray-100 dark:bg-gray-800' :
                                    'bg-blue-100 dark:bg-blue-900/30'
                                  }`}>
                                    <Package className={`w-5 h-5 ${
                                      request.status === 'accepted' ? 'text-green-600' :
                                      request.is_expired ? 'text-gray-600' :
                                      'text-blue-600'
                                    }`} />
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="text-lg font-bold mb-1">{request.product_name}</h3>
                                    {getStatusBadge(request.status, request.is_expired)}
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                      <DollarSign className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">قیمت</p>
                                      <p className="font-semibold">{request.price} {request.currency}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                      <Package className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">مقدار</p>
                                      <p className="font-semibold">{request.quantity} {request.unit}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                      <Globe className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">مقصد</p>
                                      <p className="font-semibold text-sm">{request.destination_countries}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                      <Users className="w-4 h-4 text-orange-600" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">ویزیتورها</p>
                                      <p className="font-semibold">{request.matched_visitor_count} پیشنهادی</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>ایجاد: {formatDate(request.created_at)}</span>
                                  </div>
                                  {request.remaining_time && !request.is_expired && (
                                    <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                                      <Clock className="w-3 h-3" />
                                      <span className="font-medium">{request.remaining_time}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 lg:min-w-[180px]">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => navigate(`/matching/requests/${request.id}`)}
                              className="w-full"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              مشاهده جزئیات
                            </Button>
                            {request.status === "pending" || request.status === "active" ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/matching/requests/${request.id}`)}
                                  className="w-full"
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  ویرایش
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleCancel(request.id)}
                                  className="w-full"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  لغو درخواست
                                </Button>
                              </>
                            ) : null}
                            {request.status === "accepted" && (
                              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <p className="text-xs text-green-800 dark:text-green-200 text-center">
                                  ✓ پذیرفته شده
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      قبلی
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      صفحه {page} از {totalPages} (مجموع {total} درخواست)
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      بعدی
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

