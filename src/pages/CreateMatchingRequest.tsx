import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import HeaderAuth from "@/components/ui/HeaderAuth";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  Globe,
  DollarSign,
  Clock,
  Send,
  ArrowLeft,
  Calendar,
  MapPin,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface MatchingRequestForm {
  product_name: string;
  product_id?: number;
  quantity: string;
  unit: string;
  destination_countries: string;
  price: string;
  currency: string;
  payment_terms: string;
  delivery_time: string;
  description: string;
  expires_at: string;
}

const UNITS = [
  { value: "kg", label: "کیلوگرم" },
  { value: "ton", label: "تن" },
  { value: "piece", label: "عدد" },
  { value: "package", label: "بسته" },
  { value: "box", label: "جعبه" },
  { value: "carton", label: "کارتن" },
];

const CURRENCIES = [
  { value: "USD", label: "دلار آمریکا" },
  { value: "EUR", label: "یورو" },
  { value: "AED", label: "درهم امارات" },
  { value: "SAR", label: "ریال عربستان" },
  { value: "IRR", label: "ریال ایران" },
];

const ARABIC_COUNTRIES = [
  "امارات متحده عربی",
  "عربستان سعودی",
  "قطر",
  "کویت",
  "بحرین",
  "عمان",
  "یمن",
  "اردن",
  "سوریه",
  "لبنان",
  "عراق",
  "فلسطین",
  "مصر",
  "لیبی",
  "تونس",
  "الجزایر",
  "مراکش",
  "سودان",
];

export default function CreateMatchingRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [supplierProducts, setSupplierProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [supplierStatus, setSupplierStatus] = useState<any>(null);

  const [formData, setFormData] = useState<MatchingRequestForm>({
    product_name: "",
    product_id: undefined,
    quantity: "",
    unit: "kg",
    destination_countries: "",
    price: "",
    currency: "USD",
    payment_terms: "",
    delivery_time: "",
    description: "",
    expires_at: "",
  });

  useEffect(() => {
    // Set default expiration to 10 days from now
    const defaultExpiresAt = new Date();
    defaultExpiresAt.setDate(defaultExpiresAt.getDate() + 10);
    setFormData(prev => ({
      ...prev,
      expires_at: defaultExpiresAt.toISOString().split('T')[0] + 'T23:59:59'
    }));

    // Load supplier products if available
    loadSupplierProducts();
  }, []);

  const loadSupplierProducts = async () => {
    try {
      setLoadingProducts(true);
      const status = await apiService.getSupplierStatus();
      setSupplierStatus(status);
      
      if (status?.has_supplier && status?.supplier?.status === 'approved') {
        if (status.supplier.products && status.supplier.products.length > 0) {
          setSupplierProducts(status.supplier.products);
        } else {
          toast({
            variant: "default",
            title: "توجه",
            description: "شما هنوز محصولی ثبت نکرده‌اید. می‌توانید نام محصول را به صورت دستی وارد کنید.",
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "خطا",
          description: "شما باید تأمین‌کننده تأیید شده باشید",
        });
        navigate("/supplier-status");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در بارگذاری اطلاعات تأمین‌کننده",
      });
      navigate("/supplier-status");
    } finally {
      setLoadingProducts(false);
    }
  };

  const updateFormData = (field: keyof MatchingRequestForm, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProductSelect = (productId: string) => {
    if (productId === "new") {
      updateFormData("product_id", undefined);
      updateFormData("product_name", "");
      return;
    }

    const product = supplierProducts.find(p => p.id === parseInt(productId));
    if (product) {
      updateFormData("product_id", product.id);
      updateFormData("product_name", product.product_name);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.product_name.trim()) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "نام محصول الزامی است",
      });
      return false;
    }

    if (!formData.quantity.trim()) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "مقدار محصول الزامی است",
      });
      return false;
    }

    if (!formData.destination_countries.trim()) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "کشورهای مقصد الزامی است",
      });
      return false;
    }

    if (!formData.price.trim()) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "قیمت الزامی است",
      });
      return false;
    }

    if (!formData.expires_at) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "تاریخ انقضا الزامی است",
      });
      return false;
    }

    // Validate expiration is in the future
    const expiresAt = new Date(formData.expires_at);
    if (expiresAt <= new Date()) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "تاریخ انقضا باید در آینده باشد",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Convert expires_at to ISO 8601 format
      const expiresAtISO = new Date(formData.expires_at).toISOString();

      const response = await apiService.createMatchingRequest({
        product_name: formData.product_name,
        product_id: formData.product_id,
        quantity: formData.quantity,
        unit: formData.unit,
        destination_countries: formData.destination_countries,
        price: formData.price,
        currency: formData.currency,
        payment_terms: formData.payment_terms,
        delivery_time: formData.delivery_time,
        description: formData.description,
        expires_at: expiresAtISO,
      });

      toast({
        title: "موفقیت",
        description: "درخواست Matching با موفقیت ایجاد شد. ویزیتورهای مناسب به زودی مطلع خواهند شد.",
      });

      navigate("/matching/my-requests");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در ایجاد درخواست Matching",
      });
    } finally {
      setLoading(false);
    }
  };

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
              <div>
                <CardTitle className="text-2xl font-bold">ایجاد درخواست Matching</CardTitle>
                <p className="text-muted-foreground mt-1">
                  درخواست فروش کالا را ثبت کنید تا ویزیتورهای مناسب پیدا شوند
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingProducts ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-muted-foreground">در حال بارگذاری اطلاعات...</p>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Selection */}
              <div className="space-y-2">
                <Label htmlFor="product" className="flex items-center gap-2 text-base font-semibold">
                  <Package className="w-5 h-5 text-blue-500" />
                  انتخاب محصول
                </Label>
                {supplierProducts.length > 0 ? (
                  <>
                    <Select
                      value={formData.product_id?.toString() || "new"}
                      onValueChange={handleProductSelect}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="انتخاب محصول از لیست یا وارد کردن جدید" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">
                          <span className="font-medium">➕ محصول جدید (وارد کردن دستی)</span>
                        </SelectItem>
                        {supplierProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{product.product_name}</span>
                              {product.product_type && (
                                <span className="text-xs text-muted-foreground">
                                  نوع: {product.product_type}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.product_id && (
                      <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          ✓ محصول از لیست محصولات شما انتخاب شده است
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      ⚠ شما هنوز محصولی ثبت نکرده‌اید. نام محصول را به صورت دستی وارد کنید.
                    </p>
                  </div>
                )}
                <Input
                  id="product_name"
                  placeholder="نام محصول (مثال: زعفران سرگل، خرما مجول، پسته اکبری)"
                  value={formData.product_name}
                  onChange={(e) => updateFormData("product_name", e.target.value)}
                  required
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.product_id 
                    ? "محصول از لیست محصولات شما انتخاب شده است"
                    : "نام محصول را دقیق و واضح وارد کنید"}
                </p>
              </div>

              {/* Quantity and Unit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-base font-semibold">
                    مقدار محصول
                  </Label>
                  <Input
                    id="quantity"
                    type="text"
                    placeholder="مثال: 500، 1000، 2000"
                    value={formData.quantity}
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      updateFormData("quantity", value);
                    }}
                    required
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    فقط اعداد مجاز است
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit" className="text-base font-semibold">
                    واحد اندازه‌گیری
                  </Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => updateFormData("unit", value)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Destination Countries */}
              <div className="space-y-2">
                <Label htmlFor="destination_countries" className="flex items-center gap-2 text-base font-semibold">
                  <Globe className="w-5 h-5 text-green-500" />
                  کشورهای مقصد
                </Label>
                <Input
                  id="destination_countries"
                  placeholder="مثال: امارات متحده عربی، عربستان سعودی، قطر"
                  value={formData.destination_countries}
                  onChange={(e) => updateFormData("destination_countries", e.target.value)}
                  required
                  className="h-11"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {ARABIC_COUNTRIES.slice(0, 6).map((country) => (
                    <Button
                      key={country}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => {
                        const current = formData.destination_countries;
                        if (current.includes(country)) {
                          updateFormData("destination_countries", current.replace(new RegExp(`\\s*${country}\\s*,?`), '').trim());
                        } else {
                          updateFormData("destination_countries", current ? `${current}، ${country}` : country);
                        }
                      }}
                    >
                      {formData.destination_countries.includes(country) && <CheckCircle2 className="w-3 h-3 ml-1" />}
                      {country}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  می‌توانید چند کشور را با کاما یا از دکمه‌های بالا انتخاب کنید
                </p>
              </div>

              {/* Price and Currency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="flex items-center gap-2 text-base font-semibold">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    قیمت
                  </Label>
                  <Input
                    id="price"
                    type="text"
                    placeholder="مثال: 3000، 5000، 10000"
                    value={formData.price}
                    onChange={(e) => {
                      // Allow numbers and comma for thousands
                      const value = e.target.value.replace(/[^0-9,]/g, '').replace(/,/g, ',');
                      updateFormData("price", value);
                    }}
                    required
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    قیمت به {formData.currency} برای {formData.quantity || '...'} {formData.unit}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-base font-semibold">
                    ارز
                  </Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => updateFormData("currency", value)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label} ({currency.value})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Payment Terms */}
              <div className="space-y-2">
                <Label htmlFor="payment_terms">شرایط پرداخت (اختیاری)</Label>
                <Input
                  id="payment_terms"
                  placeholder="مثال: 30% پیش‌پرداخت، 70% در زمان تحویل"
                  value={formData.payment_terms}
                  onChange={(e) => updateFormData("payment_terms", e.target.value)}
                />
              </div>

              {/* Delivery Time */}
              <div className="space-y-2">
                <Label htmlFor="delivery_time" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  زمان تحویل (اختیاری)
                </Label>
                <Input
                  id="delivery_time"
                  placeholder="مثال: 30 روز، 2 هفته"
                  value={formData.delivery_time}
                  onChange={(e) => updateFormData("delivery_time", e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">توضیحات (اختیاری)</Label>
                <Textarea
                  id="description"
                  placeholder="توضیحات اضافی درباره محصول و شرایط فروش..."
                  value={formData.description}
                  onChange={(e) => updateFormData("description", e.target.value)}
                  rows={4}
                />
              </div>

              {/* Expiration Date */}
              <div className="space-y-2">
                <Label htmlFor="expires_at" className="flex items-center gap-2 text-base font-semibold">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  تاریخ و زمان انقضا
                </Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={formData.expires_at ? formData.expires_at.slice(0, 16) : ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Convert to ISO format
                    const date = new Date(value);
                    updateFormData("expires_at", date.toISOString());
                  }}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  className="h-11"
                />
                <div className="flex gap-2 mt-2">
                  {[7, 10, 15, 30].map((days) => (
                    <Button
                      key={days}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const date = new Date();
                        date.setDate(date.getDate() + days);
                        date.setHours(23, 59, 59, 0);
                        updateFormData("expires_at", date.toISOString());
                      }}
                      className="text-xs"
                    >
                      {days} روز
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  پس از این تاریخ، درخواست به صورت خودکار منقضی می‌شود. می‌توانید از دکمه‌های بالا استفاده کنید.
                </p>
              </div>

              {/* Summary Card */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-500" />
                    خلاصه درخواست
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">محصول:</span>
                      <span className="font-medium">{formData.product_name || "وارد نشده"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">مقدار:</span>
                      <span className="font-medium">{formData.quantity || "..."} {formData.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">قیمت:</span>
                      <span className="font-medium">{formData.price || "..."} {formData.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">مقصد:</span>
                      <span className="font-medium text-left max-w-[60%] truncate">
                        {formData.destination_countries || "وارد نشده"}
                      </span>
                    </div>
                    {formData.expires_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">انقضا:</span>
                        <span className="font-medium">
                          {new Date(formData.expires_at).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1 h-12"
                  disabled={loading}
                >
                  بازگشت
                  <ArrowLeft className="w-4 h-4 mr-2" />
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.product_name || !formData.quantity || !formData.price || !formData.destination_countries}
                  className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {loading ? (
                    <>
                      در حال ارسال...
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    </>
                  ) : (
                    <>
                      ایجاد درخواست Matching
                      <Send className="w-4 h-4 mr-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

