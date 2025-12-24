import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import HeaderAuth from "@/components/ui/HeaderAuth";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Package, 
  ArrowLeft,
  Clock,
  Globe,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  MessageCircle,
  Calendar,
  MapPin,
  User,
  Send,
  RefreshCw,
  Edit,
  CalendarClock,
  Star
} from "lucide-react";
import { MatchingChat } from "@/components/MatchingChat";
import { MatchingRadar } from "@/components/MatchingRadar";

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
  accepted_visitor_id?: number;
  expires_at: string;
  remaining_time: string;
  is_expired: boolean;
  created_at: string;
  supplier?: {
    id: number;
    full_name: string;
    brand_name?: string;
    city: string;
    mobile: string;
  };
  accepted_visitor?: {
    id: number;
    full_name: string;
    city_province: string;
    destination_cities: string;
  };
  responses?: MatchingResponse[];
}

interface MatchingResponse {
  id: number;
  visitor_id: number;
  user_id?: number;
  response_type: 'accepted' | 'rejected' | 'question';
  message?: string;
  status: string;
  created_at: string;
  visitor?: {
    id: number;
    full_name: string;
    city_province: string;
    destination_cities: string;
  };
}

export default function MatchingRequestDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [request, setRequest] = useState<MatchingRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [responseType, setResponseType] = useState<'accepted' | 'rejected' | 'question'>('accepted');
  const [responseMessage, setResponseMessage] = useState('');
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [isSupplier, setIsSupplier] = useState(false);
  const [hasVisitor, setHasVisitor] = useState(false);
  const [myResponse, setMyResponse] = useState<MatchingResponse | null>(null);

  useEffect(() => {
    if (id) {
      loadRequest();
    }
  }, [id]);

  const loadRequest = async () => {
    setLoading(true);
    try {
      const response = await apiService.getMatchingRequestDetails(parseInt(id!));
      setRequest(response.data);
      
      // Check if current user is the supplier
      try {
        const supplierStatus = await apiService.getSupplierStatus();
        setIsSupplier(supplierStatus?.has_supplier || false);
      } catch {
        // User is not a supplier
        setIsSupplier(false);
      }

      // Check if current user is a visitor and find their response
      if (!isSupplier && user) {
        try {
          const visitorStatus = await apiService.getMyVisitorStatus();
          if (visitorStatus?.has_visitor && response.data?.responses) {
            setHasVisitor(true);
            // Find current user's response
            const myResp = response.data.responses.find(
              (r: MatchingResponse) => r.user_id === user.id || r.visitor_id === visitorStatus.visitor?.id
            );
            if (myResp) {
              setMyResponse(myResp);
            }
          }
        } catch {
          // User is not a visitor or hasn't responded
          setHasVisitor(false);
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در دریافت جزئیات درخواست",
      });
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!request || !id) return;

    if (responseType === 'question' && !responseMessage.trim()) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "لطفاً سوال خود را وارد کنید",
      });
      return;
    }

    setResponding(true);
    try {
      await apiService.respondToMatchingRequest(parseInt(id), {
        response_type: responseType,
        message: responseType === 'question' ? responseMessage : undefined,
      });

      toast({
        title: "موفقیت",
        description: responseType === 'accepted' 
          ? "درخواست با موفقیت پذیرفته شد. می‌توانید با تأمین‌کننده ارتباط برقرار کنید."
          : responseType === 'rejected'
          ? "درخواست رد شد"
          : "سوال شما ارسال شد",
      });

      setShowResponseDialog(false);
      setResponseMessage('');
      loadRequest();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در ارسال پاسخ",
      });
    } finally {
      setResponding(false);
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
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        <Card className="w-full max-w-md backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-2 shadow-2xl relative z-10">
          <CardContent className="p-8 text-center space-y-4">
            <div className="relative">
              <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
              <div className="absolute inset-0 w-12 h-12 border-4 border-blue-500/20 rounded-full animate-ping"></div>
            </div>
            <p className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent animate-pulse">
              در حال بارگذاری...
            </p>
            <div className="flex gap-2 justify-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!request) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-300 dark:bg-indigo-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <HeaderAuth />
      <div className="container mx-auto px-2 sm:px-4 max-w-4xl py-4 sm:py-8 relative z-10">
        <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-2 shadow-2xl animate-in fade-in-0 slide-in-from-top-4 duration-500">
          <CardHeader className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-b">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="rounded-full hover:scale-110 transition-transform duration-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <CardTitle className="text-3xl font-extrabold flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                    {request.product_name}
                  </span>
                  {getStatusBadge(request.status, request.is_expired)}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Matching Radar - Only for suppliers */}
            {isSupplier && (
              <div className="animate-in fade-in-0 zoom-in-95 duration-500">
                <MatchingRadar
                  totalVisitors={request.matched_visitor_count || 0}
                  acceptedCount={request.responses?.filter(r => r.response_type === 'accepted').length || 0}
                  pendingCount={request.responses?.filter(r => r.response_type === 'question').length || 0}
                  rejectedCount={request.responses?.filter(r => r.response_type === 'rejected').length || 0}
                  isActive={request.status === 'active' || request.status === 'pending'}
                />
              </div>
            )}

            {/* Request Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-extrabold text-xl mb-4 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    اطلاعات محصول
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 hover:scale-105 transition-transform duration-300 shadow-md">
                      <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground font-medium">قیمت</p>
                        <p className="font-extrabold text-lg text-gray-900 dark:text-gray-100">{request.price} {request.currency}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 hover:scale-105 transition-transform duration-300 shadow-md">
                      <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">مقدار</p>
                        <p className="font-bold text-lg">{request.quantity} {request.unit}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800 hover:scale-105 transition-transform duration-300 shadow-md">
                      <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-lg">
                        <Globe className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground font-medium">کشورهای مقصد</p>
                        <p className="font-extrabold text-sm text-gray-900 dark:text-gray-100">{request.destination_countries}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-900/20 dark:via-amber-900/20 dark:to-yellow-900/20 border-2 border-orange-200 dark:border-orange-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-extrabold text-xl mb-4 flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 bg-clip-text text-transparent">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg shadow-lg">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    اطلاعات زمانی
                  </h3>
                  <div className="space-y-4">
                    {request.delivery_time && (
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl border border-orange-200 dark:border-orange-800 hover:scale-105 transition-transform duration-300 shadow-md">
                        <div className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg shadow-lg">
                          <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground font-medium">زمان تحویل</p>
                          <p className="font-extrabold text-gray-900 dark:text-gray-100">{request.delivery_time}</p>
                        </div>
                      </div>
                    )}
                    {request.payment_terms && (
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 hover:scale-105 transition-transform duration-300 shadow-md">
                        <div className="p-2.5 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg shadow-lg">
                          <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground font-medium">شرایط پرداخت</p>
                          <p className="font-extrabold text-sm text-gray-900 dark:text-gray-100">{request.payment_terms}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl border border-red-200 dark:border-red-800 hover:scale-105 transition-transform duration-300 shadow-md">
                      <div className="p-2.5 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg shadow-lg">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground font-medium">تاریخ انقضا</p>
                        <p className="font-extrabold text-gray-900 dark:text-gray-100">{formatDate(request.expires_at)}</p>
                        {request.remaining_time && !request.is_expired && (
                          <p className="text-xs text-orange-600 dark:text-orange-400 font-bold mt-2 flex items-center gap-1 animate-pulse">
                            <Clock className="w-3 h-3" />
                            {request.remaining_time}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {request.description && (
              <div>
                <h3 className="font-semibold mb-2">توضیحات</h3>
                <p className="text-muted-foreground">{request.description}</p>
              </div>
            )}

            {/* Supplier Info (for visitors) */}
            {request.supplier && !isSupplier && (
              <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    اطلاعات تأمین‌کننده
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <User className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">نام</p>
                        <p className="font-semibold">{request.supplier.full_name}</p>
                      </div>
                    </div>
                    {request.supplier.brand_name && (
                      <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <Package className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">برند</p>
                          <p className="font-semibold">{request.supplier.brand_name}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <MapPin className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">شهر</p>
                        <p className="font-semibold">{request.supplier.city}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Responses (for suppliers) */}
            {isSupplier && request.responses && request.responses.length > 0 && (
              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    پاسخ‌های ویزیتورها
                    <Badge variant="secondary" className="mr-2">
                      {request.responses.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  {request.responses.map((response) => (
                    <Card 
                      key={response.id} 
                      className={`border-2 ${
                        response.response_type === 'accepted' 
                          ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10' :
                        response.response_type === 'rejected'
                          ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10' :
                          'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              response.response_type === 'accepted' 
                                ? 'bg-green-100 dark:bg-green-900/30' :
                              response.response_type === 'rejected'
                                ? 'bg-red-100 dark:bg-red-900/30' :
                                'bg-blue-100 dark:bg-blue-900/30'
                            }`}>
                              <User className={`w-4 h-4 ${
                                response.response_type === 'accepted' 
                                  ? 'text-green-600' :
                                response.response_type === 'rejected'
                                  ? 'text-red-600' :
                                  'text-blue-600'
                              }`} />
                            </div>
                            <div>
                              <p className="font-bold">
                                {response.visitor?.full_name || 'ویزیتور'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(response.created_at)}
                              </p>
                            </div>
                          </div>
                          {response.response_type === 'accepted' && (
                            <Badge className="bg-green-500">
                              <CheckCircle className="w-3 h-3 ml-1" />
                              پذیرفته شده
                            </Badge>
                          )}
                          {response.response_type === 'rejected' && (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 ml-1" />
                              رد شده
                            </Badge>
                          )}
                          {response.response_type === 'question' && (
                            <Badge className="bg-blue-500">
                              <MessageCircle className="w-3 h-3 ml-1" />
                              سوال
                            </Badge>
                          )}
                        </div>
                        {response.message && (
                          <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                            <p className="text-sm">{response.message}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* My Response Status (for visitors) */}
            {!isSupplier && myResponse && (
              <Card className={`border-2 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] animate-in fade-in-0 slide-in-from-left-4 duration-500 ${
                myResponse.response_type === 'accepted' 
                  ? 'border-green-300 dark:border-green-700 bg-gradient-to-r from-green-50/50 via-emerald-50/50 to-teal-50/50 dark:from-green-900/10 dark:via-emerald-900/10 dark:to-teal-900/10' :
                myResponse.response_type === 'rejected'
                  ? 'border-red-300 dark:border-red-700 bg-gradient-to-r from-red-50/50 to-rose-50/50 dark:from-red-900/10 dark:to-rose-900/10' :
                  'border-blue-300 dark:border-blue-700 bg-gradient-to-r from-blue-50/50 via-indigo-50/50 to-purple-50/50 dark:from-blue-900/10 dark:via-indigo-900/10 dark:to-purple-900/10'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`relative p-4 rounded-xl shadow-lg ${
                        myResponse.response_type === 'accepted' 
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                        myResponse.response_type === 'rejected'
                          ? 'bg-gradient-to-br from-red-500 to-rose-600' :
                          'bg-gradient-to-br from-blue-500 to-indigo-600'
                      }`}>
                        {myResponse.response_type === 'accepted' && (
                          <CheckCircle className="w-8 h-8 text-white animate-pulse" />
                        )}
                        {myResponse.response_type === 'rejected' && (
                          <XCircle className="w-8 h-8 text-white" />
                        )}
                        {myResponse.response_type === 'question' && (
                          <MessageCircle className="w-8 h-8 text-white animate-pulse" />
                        )}
                        {(myResponse.response_type === 'accepted' || myResponse.response_type === 'question') && (
                          <div className="absolute inset-0 rounded-xl bg-white/20 animate-ping"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-xl text-gray-900 dark:text-gray-100">
                          {myResponse.response_type === 'accepted' && 'شما این درخواست را پذیرفته‌اید'}
                          {myResponse.response_type === 'rejected' && 'شما این درخواست را رد کرده‌اید'}
                          {myResponse.response_type === 'question' && 'شما سوالی برای این درخواست پرسیده‌اید'}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          تاریخ پاسخ: {formatDate(myResponse.created_at)}
                        </p>
                        {myResponse.message && (
                          <div className="mt-4 p-4 bg-white/80 dark:bg-gray-800/80 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-md">
                            <p className="text-sm leading-relaxed text-gray-900 dark:text-gray-100">{myResponse.message}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {myResponse.response_type === 'accepted' && (
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg animate-pulse px-4 py-2">
                        <CheckCircle className="w-4 h-4 ml-1" />
                        پذیرفته شده
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons (for visitors who haven't responded yet) */}
            {!isSupplier && !myResponse && !request.is_expired && request.status !== 'accepted' && request.status !== 'completed' && (
              <Card className="bg-gradient-to-r from-green-50 via-emerald-50 to-blue-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-blue-900/20 border-2 border-green-200 dark:border-green-800 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] animate-in fade-in-0 slide-in-from-bottom-4 duration-500 relative overflow-hidden">
                {/* Animated connection lines */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-1/2 w-1 h-full bg-gradient-to-b from-green-500 via-blue-500 to-purple-500 animate-pulse"></div>
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl shadow-lg animate-pulse">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-extrabold text-2xl bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent">
                      پاسخ به درخواست
                    </h3>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
                      <DialogTrigger asChild>
                        <Button
                          className="relative flex-1 h-14 bg-gradient-to-r from-green-600 via-emerald-600 to-blue-600 hover:from-green-700 hover:via-emerald-700 hover:to-blue-700 text-white shadow-2xl hover:shadow-green-500/50 transition-all duration-500 overflow-hidden group/accept"
                          onClick={() => {
                            setResponseType('accepted');
                            setShowResponseDialog(true);
                          }}
                        >
                          {/* Shimmer effect */}
                          <div className="absolute inset-0 -translate-x-full group-hover/accept:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            <CheckCircle className="w-6 h-6 group-hover/accept:scale-110 transition-transform duration-300" />
                            <span className="font-extrabold text-base">پذیرش درخواست</span>
                          </span>
                          <div className="absolute top-0 right-0 w-3 h-3 bg-white rounded-full animate-ping"></div>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 border-2 shadow-2xl">
                        <DialogHeader className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 p-4 rounded-t-lg border-b">
                          <DialogTitle className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                              <MessageCircle className="w-5 h-5 text-white" />
                            </div>
                            پاسخ به درخواست Matching
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-6 px-4">
                          <div>
                            <label className="text-base font-extrabold mb-4 block text-gray-900 dark:text-gray-100">نوع پاسخ را انتخاب کنید</label>
                            <div className="grid grid-cols-3 gap-3">
                              <Button
                                variant={responseType === 'accepted' ? 'default' : 'outline'}
                                size="default"
                                onClick={() => setResponseType('accepted')}
                                className={`relative overflow-hidden transition-all duration-300 ${
                                  responseType === 'accepted' 
                                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg scale-105' 
                                    : 'hover:scale-105'
                                }`}
                              >
                                <CheckCircle className={`w-5 h-5 ml-1 ${responseType === 'accepted' ? 'animate-pulse' : ''}`} />
                                <span className="font-semibold">پذیرش</span>
                                {responseType === 'accepted' && (
                                  <div className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full animate-ping"></div>
                                )}
                              </Button>
                              <Button
                                variant={responseType === 'rejected' ? 'default' : 'outline'}
                                size="default"
                                onClick={() => setResponseType('rejected')}
                                className={`relative overflow-hidden transition-all duration-300 ${
                                  responseType === 'rejected' 
                                    ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg scale-105' 
                                    : 'hover:scale-105'
                                }`}
                              >
                                <XCircle className={`w-5 h-5 ml-1 ${responseType === 'rejected' ? 'animate-pulse' : ''}`} />
                                <span className="font-semibold">رد</span>
                                {responseType === 'rejected' && (
                                  <div className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full animate-ping"></div>
                                )}
                              </Button>
                              <Button
                                variant={responseType === 'question' ? 'default' : 'outline'}
                                size="default"
                                onClick={() => setResponseType('question')}
                                className={`relative overflow-hidden transition-all duration-300 ${
                                  responseType === 'question' 
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg scale-105' 
                                    : 'hover:scale-105'
                                }`}
                              >
                                <MessageCircle className={`w-5 h-5 ml-1 ${responseType === 'question' ? 'animate-pulse' : ''}`} />
                                <span className="font-semibold">سوال</span>
                                {responseType === 'question' && (
                                  <div className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full animate-ping"></div>
                                )}
                              </Button>
                            </div>
                          </div>
                          {responseType === 'question' && (
                            <div className="animate-in fade-in-0 slide-in-from-top-2 duration-300">
                              <label className="text-sm font-extrabold mb-2 block text-gray-900 dark:text-gray-100">سوال خود را بنویسید</label>
                              <Textarea
                                value={responseMessage}
                                onChange={(e) => setResponseMessage(e.target.value)}
                                placeholder="مثال: آیا امکان پرداخت اقساطی وجود دارد؟"
                                rows={4}
                                className="resize-none border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                              />
                            </div>
                          )}
                          <div className="flex gap-3 pt-4">
                            <Button
                              variant="outline"
                              onClick={() => setShowResponseDialog(false)}
                              className="flex-1 h-12 border-2 hover:scale-105 transition-transform duration-300"
                              disabled={responding}
                            >
                              انصراف
                            </Button>
                            <Button
                              onClick={handleRespond}
                              disabled={responding || (responseType === 'question' && !responseMessage.trim())}
                              className="relative flex-1 h-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-blue-500/50 transition-all duration-500 overflow-hidden group/send"
                            >
                              {/* Shimmer effect */}
                              <div className="absolute inset-0 -translate-x-full group-hover/send:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                              {responding ? (
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                  در حال ارسال...
                                  <RefreshCw className="w-5 h-5 animate-spin" />
                                </span>
                              ) : (
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                  <span className="font-extrabold">ارسال پاسخ</span>
                                  <Send className="w-5 h-5 group-hover/send:translate-x-1 transition-transform duration-300" />
                                </span>
                              )}
                              <div className="absolute top-0 right-0 w-3 h-3 bg-white rounded-full animate-ping"></div>
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Accepted Status */}
            {request.status === 'accepted' && request.accepted_visitor && (
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  این درخواست توسط <strong>{request.accepted_visitor.full_name}</strong> پذیرفته شده است.
                  می‌توانید با ویزیتور ارتباط برقرار کنید.
                </AlertDescription>
              </Alert>
            )}

            {/* Expired Status */}
            {request.is_expired && (
              <Alert className="border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20">
                <Clock className="h-4 w-4 text-gray-600" />
                <AlertDescription className="text-gray-800 dark:text-gray-200">
                  این درخواست منقضی شده است.
                </AlertDescription>
              </Alert>
            )}

            {/* Chat Section - Only for accepted requests */}
            {request.status === 'accepted' && (
              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                    چت با {isSupplier ? request.accepted_visitor?.full_name : request.supplier?.full_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <MatchingChat requestId={request.id} />
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

