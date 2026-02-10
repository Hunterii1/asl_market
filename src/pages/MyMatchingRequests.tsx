import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import HeaderAuth from "@/components/ui/HeaderAuth";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { MatchingRadar } from "@/components/MatchingRadar";
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
  CalendarClock,
  Loader2,
  CheckSquare
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
  const { isAuthenticated } = useAuth();
  const [requests, setRequests] = useState<MatchingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "نیاز به ورود",
        description: "برای مشاهده درخواست‌های خود، ابتدا باید وارد شوید.",
        variant: "default",
      });
      navigate('/login');
      return;
    }
    
    // Check if user is a supplier
    checkSupplierStatus();
  }, [isAuthenticated, page, statusFilter]);

  const checkSupplierStatus = async () => {
    try {
      const supplierStatus = await apiService.getSupplierStatus();
      if (!supplierStatus.has_supplier) {
        toast({
          title: "نیاز به ثبت‌نام تأمین‌کننده",
          description: "برای مشاهده درخواست‌های خود، ابتدا باید به عنوان تأمین‌کننده ثبت‌نام کنید.",
          variant: "default",
        });
        navigate('/supplier-registration');
        return;
      }
      loadRequests();
    } catch (error: any) {
      // 404 means user hasn't registered as supplier
      if (error?.response?.status === 404 || error?.statusCode === 404) {
        toast({
          title: "نیاز به ثبت‌نام تأمین‌کننده",
          description: "برای مشاهده درخواست‌های خود، ابتدا باید به عنوان تأمین‌کننده ثبت‌نام کنید.",
          variant: "default",
        });
        navigate('/supplier-registration');
      } else {
        toast({
          variant: "destructive",
          title: "خطا",
          description: error.message || "خطا در بررسی وضعیت تأمین‌کننده",
        });
      }
    }
  };

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
    // Check if expired (either by status or is_expired flag)
    if (isExpired || status === 'expired') {
      return (
        <Badge variant="secondary" className="bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg animate-pulse">
          <Clock className="w-3 h-3 ml-1" />
          منقضی شده
        </Badge>
      );
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

  const handleClose = async (id: number) => {
    if (!confirm("آیا از مختوم کردن این درخواست اطمینان دارید؟")) {
      return;
    }

    try {
      await apiService.closeMatchingRequest(id);
      toast({
        title: "موفقیت",
        description: "درخواست با موفقیت مختوم شد",
      });
      loadRequests();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در بستن درخواست",
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-300 dark:bg-indigo-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <HeaderAuth />
      <div className="container mx-auto px-2 sm:px-4 max-w-6xl py-4 sm:py-8 relative z-10">
        <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-2 shadow-2xl animate-in fade-in-0 slide-in-from-top-4 duration-500">
          <CardHeader className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-b">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg animate-pulse">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                    درخواست‌های Matching من
                  </CardTitle>
                </div>
                <p className="text-muted-foreground mt-1 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  مدیریت و پیگیری درخواست‌های Matching شما
                </p>
              </div>
              <Button 
                onClick={() => navigate("/matching/create")}
                className="relative overflow-hidden group hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <span className="relative z-10 flex items-center gap-2">
                  درخواست جدید
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-indigo-400/0 to-purple-400/0 group-hover:from-blue-400/20 group-hover:via-indigo-400/20 group-hover:to-purple-400/20 transition-all duration-500"></div>
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
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="relative">
                  <Loader2 className="w-16 h-16 animate-spin text-primary" />
                  <div className="absolute inset-0 w-16 h-16 border-4 border-primary/20 rounded-full animate-ping"></div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent animate-pulse">
                    در حال بارگذاری...
                  </p>
                  <p className="text-sm text-muted-foreground">لطفاً صبر کنید</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-16 space-y-4 animate-in fade-in-0 zoom-in-95 duration-500">
                <div className="relative inline-block">
                  <Package className="w-20 h-20 mx-auto mb-4 text-muted-foreground animate-bounce" />
                  <div className="absolute inset-0 w-20 h-20 border-4 border-muted rounded-full animate-ping opacity-75"></div>
                </div>
                <h3 className="text-2xl font-bold mb-2">درخواستی یافت نشد</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  هنوز درخواست Matching ایجاد نکرده‌اید
                </p>
                <Button 
                  onClick={() => navigate("/matching/create")}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  ایجاد درخواست جدید
                  <Plus className="w-4 h-4 mr-2" />
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  {requests.map((request, index) => (
                    <Card 
                      key={request.id} 
                      className={`group hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 border-l-4 animate-in fade-in-0 slide-in-from-right-4 ${
                        request.status === 'accepted' ? 'border-l-green-500 border-green-300 dark:border-green-700 bg-gradient-to-br from-green-50/50 via-emerald-50/50 to-teal-50/50 dark:from-green-900/10 dark:via-emerald-900/10 dark:to-teal-900/10' :
                        request.is_expired || request.status === 'expired' ? 'opacity-90 border-l-red-400 border-red-200 dark:border-red-700 bg-gradient-to-br from-red-50/30 via-gray-50/30 to-gray-50/30 dark:from-red-900/10 dark:via-gray-900/10 dark:to-gray-900/10' :
                        'border-l-blue-500 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-purple-50/50 dark:from-blue-900/10 dark:via-indigo-900/10 dark:to-purple-900/10 hover:border-l-blue-600'
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <CardContent className="p-6">
                        {/* Radar for active requests */}
                        {(request.status === 'active' || request.status === 'pending') && !request.is_expired && (
                          <div className="mb-6 animate-in fade-in-0 zoom-in-95 duration-500">
                            <MatchingRadar
                              totalVisitors={request.matched_visitor_count || 0}
                              acceptedCount={0} // Will be updated when we load responses
                              isActive={true}
                            />
                          </div>
                        )}
                        
                        <div className="flex flex-col lg:flex-row justify-between gap-4">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className={`relative p-3 rounded-xl shadow-lg transition-all duration-300 group-hover:scale-110 ${
                                    request.status === 'accepted' ? 'bg-gradient-to-br from-green-400 to-green-600 dark:from-green-600 dark:to-green-800' :
                                    request.is_expired ? 'bg-gray-100 dark:bg-gray-800' :
                                    'bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-600 dark:to-blue-800'
                                  }`}>
                                    <Package className={`w-6 h-6 ${
                                      request.status === 'accepted' ? 'text-white' :
                                      request.is_expired ? 'text-gray-600' :
                                      'text-white'
                                    }`} />
                                    {(request.status === 'active' || request.status === 'pending') && !request.is_expired && (
                                      <div className="absolute inset-0 rounded-xl bg-blue-400 animate-ping opacity-75"></div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="text-xl font-extrabold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                                      {request.product_name}
                                    </h3>
                                    {getStatusBadge(request.status, request.is_expired)}
                                  </div>
                                </div>
                                
                                {/* Expired Notice for Supplier */}
                                {(request.is_expired || request.status === 'expired') && (
                                  <Alert className="border-2 border-red-300 bg-gradient-to-r from-red-50 via-rose-50 to-pink-50 dark:from-red-900/20 dark:via-rose-900/20 dark:to-pink-900/20 shadow-lg mt-4 animate-in fade-in-0 slide-in-from-top-4 duration-500">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg shadow-lg">
                                        <Clock className="h-5 w-5 text-white" />
                                      </div>
                                      <AlertDescription className="text-red-800 dark:text-red-200 flex-1">
                                        <p className="font-extrabold text-base mb-1">⏰ این درخواست منقضی شده است</p>
                                        <p className="text-sm">
                                          این درخواست دیگر به ویزیتورها نمایش داده نمی‌شود و نمی‌توانید پاسخ جدیدی دریافت کنید.
                                          {request.matched_visitor_count > 0 && (
                                            <span className="block mt-1">
                                              تعداد ویزیتورهای مطلع شده: <strong className="text-red-700 dark:text-red-300">{request.matched_visitor_count}</strong>
                                            </span>
                                          )}
                                        </p>
                                      </AlertDescription>
                                    </div>
                                  </Alert>
                                )}
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
                          <div className="flex flex-col items-center justify-center gap-3 lg:min-w-[200px]">
                            <Button
                              variant="default"
                              size="lg"
                              onClick={() => navigate(`/matching/requests/${request.id}`)}
                              className="relative w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-blue-500/50 transition-all duration-500 overflow-hidden group/btn"
                            >
                              {/* Shimmer effect */}
                              <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                              <span className="relative z-10 flex items-center gap-2">
                                <Eye className="w-5 h-5 group-hover/btn:scale-110 transition-transform duration-300" />
                                <span className="font-extrabold text-base">مشاهده جزئیات</span>
                              </span>
                              <div className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full animate-ping"></div>
                            </Button>
                            {request.status === "pending" || request.status === "active" ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="default"
                                  onClick={() => navigate(`/matching/requests/${request.id}`)}
                                  className="w-full border-2"
                                >
                                  <Edit className="w-4 h-4 ml-2" />
                                  ویرایش
                                </Button>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="default"
                                    onClick={() => handleClose(request.id)}
                                    className="flex-1 border-2 text-emerald-600 hover:text-emerald-700 border-emerald-500/50 hover:border-emerald-500"
                                  >
                                    <CheckSquare className="w-4 h-4 ml-2" />
                                    مختوم
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="default"
                                    onClick={() => handleCancel(request.id)}
                                    className="flex-1 shadow-md hover:shadow-lg transition-all duration-300"
                                  >
                                    <Trash2 className="w-4 h-4 ml-2" />
                                    لغو
                                  </Button>
                                </div>
                              </>
                            ) : null}
                            {request.status === "accepted" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="default"
                                  onClick={() => handleClose(request.id)}
                                  className="w-full border-2 text-emerald-600 hover:text-emerald-700 border-emerald-500/50 hover:border-emerald-500"
                                >
                                  <CheckSquare className="w-4 h-4 ml-2" />
                                  مختوم کردن
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-3 mt-8 pt-6 border-t">
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="min-w-[100px]"
                    >
                      قبلی
                    </Button>
                    <span className="text-sm font-medium text-muted-foreground px-4">
                      صفحه {page} از {totalPages}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      (مجموع {total} درخواست)
                    </span>
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="min-w-[100px]"
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

