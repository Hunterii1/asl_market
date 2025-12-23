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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-muted-foreground">در حال بارگذاری...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!request) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <HeaderAuth />
      <div className="container mx-auto px-2 sm:px-4 max-w-4xl py-4 sm:py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <Package className="w-6 h-6 text-blue-500" />
                  {request.product_name}
                  {getStatusBadge(request.status, request.is_expired)}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Request Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-500" />
                    اطلاعات محصول
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">قیمت</p>
                        <p className="font-bold text-lg">{request.price} {request.currency}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">مقدار</p>
                        <p className="font-bold text-lg">{request.quantity} {request.unit}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Globe className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">کشورهای مقصد</p>
                        <p className="font-semibold">{request.destination_countries}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-orange-200 dark:border-orange-800">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    اطلاعات زمانی
                  </h3>
                  <div className="space-y-4">
                    {request.delivery_time && (
                      <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                          <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">زمان تحویل</p>
                          <p className="font-semibold">{request.delivery_time}</p>
                        </div>
                      </div>
                    )}
                    {request.payment_terms && (
                      <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                          <DollarSign className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">شرایط پرداخت</p>
                          <p className="font-semibold text-sm">{request.payment_terms}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <Calendar className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">تاریخ انقضا</p>
                        <p className="font-semibold">{formatDate(request.expires_at)}</p>
                        {request.remaining_time && !request.is_expired && (
                          <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-1">
                            ⏰ {request.remaining_time}
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

            {/* Action Buttons (for visitors) */}
            {!isSupplier && !request.is_expired && request.status !== 'accepted' && request.status !== 'completed' && (
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">پاسخ به درخواست</h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
                      <DialogTrigger asChild>
                        <Button
                          className="flex-1 h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                          onClick={() => {
                            setResponseType('accepted');
                            setShowResponseDialog(true);
                          }}
                        >
                          <CheckCircle className="w-5 h-5 ml-2" />
                          پذیرش درخواست
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-xl">پاسخ به درخواست Matching</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                          <div>
                            <label className="text-sm font-semibold mb-3 block">نوع پاسخ را انتخاب کنید</label>
                            <div className="grid grid-cols-3 gap-2">
                              <Button
                                variant={responseType === 'accepted' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setResponseType('accepted')}
                                className={responseType === 'accepted' ? 'bg-green-600 hover:bg-green-700' : ''}
                              >
                                <CheckCircle className="w-4 h-4 ml-1" />
                                پذیرش
                              </Button>
                              <Button
                                variant={responseType === 'rejected' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setResponseType('rejected')}
                                className={responseType === 'rejected' ? 'bg-red-600 hover:bg-red-700' : ''}
                              >
                                <XCircle className="w-4 h-4 ml-1" />
                                رد
                              </Button>
                              <Button
                                variant={responseType === 'question' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setResponseType('question')}
                                className={responseType === 'question' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                              >
                                <MessageCircle className="w-4 h-4 ml-1" />
                                سوال
                              </Button>
                            </div>
                          </div>
                          {responseType === 'question' && (
                            <div>
                              <label className="text-sm font-semibold mb-2 block">سوال خود را بنویسید</label>
                              <Textarea
                                value={responseMessage}
                                onChange={(e) => setResponseMessage(e.target.value)}
                                placeholder="مثال: آیا امکان پرداخت اقساطی وجود دارد؟"
                                rows={4}
                                className="resize-none"
                              />
                            </div>
                          )}
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              onClick={() => setShowResponseDialog(false)}
                              className="flex-1"
                              disabled={responding}
                            >
                              انصراف
                            </Button>
                            <Button
                              onClick={handleRespond}
                              disabled={responding || (responseType === 'question' && !responseMessage.trim())}
                              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                            >
                              {responding ? (
                                <>
                                  <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                                  در حال ارسال...
                                </>
                              ) : (
                                <>
                                  <Send className="w-4 h-4 ml-2" />
                                  ارسال پاسخ
                                </>
                              )}
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

