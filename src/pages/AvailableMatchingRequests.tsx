import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import HeaderAuth from "@/components/ui/HeaderAuth";
import { Pagination } from "@/components/ui/pagination";
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
import { MatchingConnection } from "@/components/MatchingConnection";

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
    user_id: number;
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
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadRequests();
    }
  }, [page, isAuthenticated]);

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
      // loadRequests will be called by useEffect when page changes
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
                    درخواست‌های Matching موجود
                  </CardTitle>
                </div>
                <p className="text-muted-foreground mt-1 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  درخواست‌های فروش کالا که با مشخصات شما همخوانی دارند
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={loadRequests} 
                disabled={loading}
                className="relative overflow-hidden group hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl"
              >
                <span className="relative z-10 flex items-center gap-2">
                  بروزرسانی
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                </span>
                {loading && (
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 animate-pulse"></span>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
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
                <p className="text-muted-foreground max-w-md mx-auto">
                  در حال حاضر درخواست Matching مناسب برای شما وجود ندارد
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  {requests.map((request, index) => (
                    <Card 
                      key={request.id} 
                      className={`group hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 border-l-4 animate-in fade-in-0 slide-in-from-right-4 ${
                        request.is_expired 
                          ? 'opacity-60 border-l-gray-400 border-gray-300 dark:border-gray-700' 
                          : 'border-l-green-500 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50/50 via-blue-50/50 to-indigo-50/50 dark:from-green-900/10 dark:via-blue-900/10 dark:to-indigo-900/10 hover:border-l-green-600'
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <CardContent className="p-6">
                        {/* Matching Connection Animation */}
                        {!request.is_expired && (
                          <div className="mb-6 animate-in fade-in-0 zoom-in-95 duration-500">
                            <MatchingConnection 
                              isConnected={true}
                              visitorCount={request.matched_visitor_count || 0}
                            />
                          </div>
                        )}
                        
                        <div className="flex flex-col lg:flex-row justify-between gap-4">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className={`relative p-3 rounded-xl shadow-lg transition-all duration-300 group-hover:scale-110 ${
                                    request.is_expired 
                                      ? 'bg-gray-100 dark:bg-gray-800' 
                                      : 'bg-gradient-to-br from-green-400 to-green-600 dark:from-green-600 dark:to-green-800'
                                  }`}>
                                    <Package className={`w-6 h-6 ${
                                      request.is_expired 
                                        ? 'text-gray-600' 
                                        : 'text-white'
                                    }`} />
                                    {!request.is_expired && (
                                      <div className="absolute inset-0 rounded-xl bg-green-400 animate-ping opacity-75"></div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="text-xl font-extrabold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                                      {request.product_name}
                                    </h3>
                                    {request.is_expired ? (
                                      <Badge variant="secondary" className="bg-gray-500 animate-pulse">منقضی شده</Badge>
                                    ) : (
                                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg animate-pulse">
                                        <CheckCircle className="w-3 h-3 ml-1 animate-pulse" />
                                        فعال
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                {request.supplier && (
                                  <div className="mb-4 p-5 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group/supplier">
                                    {/* Animated background gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-indigo-400/0 to-purple-400/0 group-hover/supplier:from-blue-400/10 group-hover/supplier:via-indigo-400/10 group-hover/supplier:to-purple-400/10 transition-all duration-500"></div>
                                    <div className="relative z-10">
                                      <div className="flex items-center gap-3 mb-2">
                                        <div className="relative p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover/supplier:scale-110 transition-transform duration-300">
                                          <User className="w-6 h-6 text-white" />
                                          <div className="absolute inset-0 rounded-xl bg-blue-400 animate-ping opacity-20"></div>
                                        </div>
                                        <div className="flex-1">
                                          <button
                                            onClick={() => navigate(`/profile/${request.supplier.user_id}`)}
                                            className="text-lg font-extrabold text-gray-900 dark:text-gray-100 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent hover:from-purple-600 hover:to-pink-600 dark:hover:from-purple-400 dark:hover:to-pink-400 transition-all duration-300 text-right"
                                          >
                                            {request.supplier.full_name || "نام نامشخص"}
                                          </button>
                                          {request.supplier.brand_name && (
                                            <p className="text-sm text-muted-foreground mt-1 font-medium">
                                              {request.supplier.brand_name}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                                          <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                          {request.supplier.city || "شهر نامشخص"}
                                        </p>
                                      </div>
                                      <Button
                                        onClick={() => navigate(`/profile/${request.supplier.user_id}`)}
                                        variant="outline"
                                        size="sm"
                                        className="w-full mt-3 rounded-xl border-purple-500/30 hover:bg-purple-500/10 hover:border-purple-500/50 transition-all"
                                      >
                                        <User className="w-4 h-4 mr-2" />
                                        مشاهده پروفایل تأمین‌کننده
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-gradient-to-br from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
                                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg hover:scale-105 transition-transform duration-300 border border-green-200 dark:border-green-800">
                                    <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg">
                                      <DollarSign className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground font-medium">قیمت</p>
                                      <p className="font-extrabold text-lg text-gray-900 dark:text-gray-100">{request.price} {request.currency}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg hover:scale-105 transition-transform duration-300 border border-blue-200 dark:border-blue-800">
                                    <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                                      <Package className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground font-medium">مقدار</p>
                                      <p className="font-extrabold text-lg text-gray-900 dark:text-gray-100">{request.quantity} {request.unit}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg hover:scale-105 transition-transform duration-300 border border-purple-200 dark:border-purple-800">
                                    <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-lg">
                                      <Globe className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground font-medium">مقصد</p>
                                      <p className="font-extrabold text-sm text-gray-900 dark:text-gray-100">{request.destination_countries}</p>
                                    </div>
                                  </div>
                                  {request.delivery_time && (
                                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg hover:scale-105 transition-transform duration-300 border border-orange-200 dark:border-orange-800">
                                      <div className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg shadow-lg">
                                        <Clock className="w-5 h-5 text-white" />
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground font-medium">تحویل</p>
                                        <p className="font-extrabold text-sm text-gray-900 dark:text-gray-100">{request.delivery_time}</p>
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
                              className="relative w-full bg-gradient-to-r from-green-600 via-emerald-600 to-blue-600 hover:from-green-700 hover:via-emerald-700 hover:to-blue-700 text-white shadow-2xl hover:shadow-green-500/50 transition-all duration-500 overflow-hidden group/btn"
                              disabled={request.is_expired}
                              size="lg"
                            >
                              {/* Shimmer effect */}
                              <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                              <span className="relative z-10 flex items-center gap-2">
                                <Eye className="w-5 h-5 group-hover/btn:scale-110 transition-transform duration-300" />
                                <span className="font-extrabold text-base">مشاهده و پاسخ</span>
                              </span>
                              {!request.is_expired && (
                                <div className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full animate-ping"></div>
                              )}
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
                  <div className="mt-8 pt-6 border-t">
                    <Pagination
                      currentPage={page}
                      totalPages={totalPages}
                      totalItems={total}
                      onPageChange={setPage}
                    />
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

