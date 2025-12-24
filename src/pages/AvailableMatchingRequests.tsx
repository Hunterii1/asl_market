import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import HeaderAuth from "@/components/ui/HeaderAuth";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Package, 
  Eye,
  Clock,
  Globe,
  DollarSign,
  Users,
  RefreshCw,
  CheckCircle,
  XCircle,
  MessageCircle,
  Calendar,
  User,
  MapPin,
  Loader2
} from "lucide-react";

interface MatchingRequest {
  id: number;
  product_name: string;
  quantity: string;
  unit: string;
  destination_countries: string;
  price: string;
  currency: string;
  payment_terms?: string;
  delivery_time?: string;
  description?: string;
  status: string;
  matched_visitor_count: number;
  expires_at: string;
  remaining_time: string;
  is_expired: boolean;
  created_at: string;
  supplier?: {
    id: number;
    full_name: string;
    brand_name?: string;
    city: string;
  };
}

export default function AvailableMatchingRequests() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [requests, setRequests] = useState<MatchingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "نیاز به ورود",
        description: "برای مشاهده درخواست‌های موجود، ابتدا باید وارد شوید.",
        variant: "default",
      });
      navigate('/login');
      return;
    }
    
    // Check if user is a visitor
    checkVisitorStatus();
  }, [isAuthenticated, page]);

  const checkVisitorStatus = async () => {
    try {
      const visitorStatus = await apiService.getMyVisitorStatus();
      if (!visitorStatus.has_visitor) {
        toast({
          title: "نیاز به ثبت‌نام ویزیتور",
          description: "برای مشاهده درخواست‌های موجود، ابتدا باید به عنوان ویزیتور ثبت‌نام کنید.",
          variant: "default",
        });
        navigate('/visitor-registration');
        return;
      }
      loadRequests();
    } catch (error: any) {
      // 404 means user hasn't registered as visitor
      if (error?.response?.status === 404 || error?.statusCode === 404) {
        toast({
          title: "نیاز به ثبت‌نام ویزیتور",
          description: "برای مشاهده درخواست‌های موجود، ابتدا باید به عنوان ویزیتور ثبت‌نام کنید.",
          variant: "default",
        });
        navigate('/visitor-registration');
      } else {
        toast({
          variant: "destructive",
          title: "خطا",
          description: error.message || "خطا در بررسی وضعیت ویزیتور",
        });
      }
    }
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAvailableMatchingRequests({
        page,
        per_page: 10,
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
                <CardTitle className="text-2xl font-bold">درخواست‌های Matching موجود</CardTitle>
                <p className="text-muted-foreground mt-1">
                  درخواست‌های فروش کالا که با مشخصات شما همخوانی دارند
                </p>
              </div>
              <Button variant="outline" onClick={loadRequests} disabled={loading}>
                بروزرسانی
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium text-muted-foreground">در حال بارگذاری...</p>
                <p className="text-sm text-muted-foreground mt-2">لطفاً صبر کنید</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">درخواستی یافت نشد</h3>
                <p className="text-muted-foreground">
                  در حال حاضر درخواست Matching مناسب برای شما وجود ندارد
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {requests.map((request) => (
                    <Card 
                      key={request.id} 
                      className={`hover:shadow-2xl transition-all duration-300 border-l-4 ${
                        request.is_expired 
                          ? 'opacity-60 border-l-gray-400 border-gray-300 dark:border-gray-700' 
                          : 'border-l-green-500 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50/50 to-blue-50/50 dark:from-green-900/10 dark:to-blue-900/10'
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row justify-between gap-4">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className={`p-2 rounded-lg ${
                                    request.is_expired 
                                      ? 'bg-gray-100 dark:bg-gray-800' 
                                      : 'bg-green-100 dark:bg-green-900/30'
                                  }`}>
                                    <Package className={`w-5 h-5 ${
                                      request.is_expired 
                                        ? 'text-gray-600' 
                                        : 'text-green-600'
                                    }`} />
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="text-lg font-bold mb-1">{request.product_name}</h3>
                                    {request.is_expired ? (
                                      <Badge variant="secondary" className="bg-gray-500">منقضی شده</Badge>
                                    ) : (
                                      <Badge className="bg-green-500">
                                        <CheckCircle className="w-3 h-3 ml-1" />
                                        فعال
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                {request.supplier && (
                                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-sm">
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                                        <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                                          {request.supplier.full_name || "نام نامشخص"}
                                        </p>
                                        {request.supplier.brand_name && (
                                          <p className="text-sm text-muted-foreground mt-0.5">
                                            {request.supplier.brand_name}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                                      <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {request.supplier.city || "شهر نامشخص"}
                                      </p>
                                    </div>
                                  </div>
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
                                  {request.delivery_time && (
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                        <Clock className="w-4 h-4 text-orange-600" />
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">تحویل</p>
                                        <p className="font-semibold text-sm">{request.delivery_time}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {request.payment_terms && (
                                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                    <p className="text-xs text-muted-foreground mb-1">شرایط پرداخت:</p>
                                    <p className="text-sm font-medium">{request.payment_terms}</p>
                                  </div>
                                )}

                                {request.description && (
                                  <div className="p-3 bg-muted/30 rounded-lg">
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {request.description}
                                    </p>
                                  </div>
                                )}

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
                          <div className="flex flex-col items-center justify-center gap-3 lg:min-w-[220px]">
                            <Button
                              onClick={() => navigate(`/matching/requests/${request.id}`)}
                              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                              disabled={request.is_expired}
                              size="lg"
                            >
                              <Eye className="w-5 h-5 ml-2" />
                              <span className="font-semibold">مشاهده و پاسخ</span>
                            </Button>
                            {request.is_expired && (
                              <div className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <p className="text-xs text-center text-muted-foreground">
                                  ⏰ این درخواست منقضی شده است
                                </p>
                              </div>
                            )}
                            {!request.is_expired && (
                              <p className="text-xs text-center text-muted-foreground px-2">
                                برای مشاهده جزئیات و پاسخ دادن کلیک کنید
                              </p>
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

