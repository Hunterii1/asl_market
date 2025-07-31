import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LicenseGate } from '@/components/LicenseGate';
import { 
  Truck, 
  Calculator, 
  Package, 
  Clock, 
  MapPin, 
  DollarSign,
  Plane,
  Ship,
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react";

const AslExpress = () => {
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [destination, setDestination] = useState("");
  const [shippingMethod, setShippingMethod] = useState("");
  const [calculationResult, setCalculationResult] = useState(null);

  const countries = [
    { code: "AE", name: "امارات متحده عربی", flag: "🇦🇪" },
    { code: "SA", name: "عربستان سعودی", flag: "🇸🇦" },
    { code: "KW", name: "کویت", flag: "🇰🇼" },
    { code: "QA", name: "قطر", flag: "🇶🇦" },
    { code: "BH", name: "بحرین", flag: "🇧🇭" },
    { code: "OM", name: "عمان", flag: "🇴🇲" },
    { code: "JO", name: "اردن", flag: "🇯🇴" },
    { code: "LB", name: "لبنان", flag: "🇱🇧" }
  ];

  const shippingMethods = [
    {
      id: "air_express",
      name: "هوایی اکسپرس",
      icon: Plane,
      deliveryTime: "۲-۳ روز کاری",
      description: "سریع‌ترین روش ارسال",
      priceMultiplier: 3.5
    },
    {
      id: "air_standard",
      name: "هوایی استاندارد",
      icon: Plane,
      deliveryTime: "۵-۷ روز کاری",
      description: "متعادل بین سرعت و هزینه",
      priceMultiplier: 2.2
    },
    {
      id: "sea_express",
      name: "دریایی اکسپرس",
      icon: Ship,
      deliveryTime: "۱۰-۱۵ روز کاری",
      description: "مناسب برای محموله‌های متوسط",
      priceMultiplier: 1.5
    },
    {
      id: "sea_standard",
      name: "دریایی استاندارد",
      icon: Ship,
      deliveryTime: "۲۰-۳۰ روز کاری",
      description: "اقتصادی‌ترین روش ارسال",
      priceMultiplier: 1.0
    }
  ];

  const calculateShipping = () => {
    if (!weight || !length || !width || !height || !destination || !shippingMethod) {
      alert("لطفا تمام فیلدها را پر کنید");
      return;
    }

    const weightNum = parseFloat(weight);
    const lengthNum = parseFloat(length);
    const widthNum = parseFloat(width);
    const heightNum = parseFloat(height);

    // Calculate volumetric weight (length × width × height ÷ 5000)
    const volumetricWeight = (lengthNum * widthNum * heightNum) / 5000;
    const chargeableWeight = Math.max(weightNum, volumetricWeight);

    // Base price calculation (example rates)
    const basePrice = chargeableWeight * 15; // $15 per kg base rate

    const selectedMethod = shippingMethods.find(method => method.id === shippingMethod);
    const finalPrice = basePrice * selectedMethod.priceMultiplier;

    // Add destination surcharge
    const destinationSurcharge = destination === "AE" ? 1.0 : 1.2;
    const totalPrice = finalPrice * destinationSurcharge;

    setCalculationResult({
      weight: weightNum,
      volumetricWeight: volumetricWeight.toFixed(2),
      chargeableWeight: chargeableWeight.toFixed(2),
      basePrice: basePrice.toFixed(2),
      finalPrice: totalPrice.toFixed(2),
      method: selectedMethod,
      destination: countries.find(c => c.code === destination),
      estimatedDelivery: selectedMethod.deliveryTime
    });
  };

  const resetCalculation = () => {
    setWeight("");
    setLength("");
    setWidth("");
    setHeight("");
    setDestination("");
    setShippingMethod("");
    setCalculationResult(null);
  };

  return (
    <LicenseGate>
    <div className="space-y-6 animate-fade-in transition-colors duration-300">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-900/20 to-green-800/20 border-green-700/50 rounded-3xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-3xl flex items-center justify-center">
              <Truck className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">اصل اکسپرس</h2>
              <p className="text-green-600 dark:text-green-300">محاسبه هزینه و زمان ارسال بین‌المللی</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calculator Form */}
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Calculator className="w-6 h-6 text-green-400" />
              محاسبه هزینه ارسال
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Package Dimensions */}
            <div>
              <h4 className="text-foreground font-medium mb-3 flex items-center gap-2">
                <Package className="w-5 h-5 text-green-400" />
                ابعاد و وزن بسته
              </h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Input
                  placeholder="طول (سانتی‌متر)"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="bg-muted border-border text-foreground rounded-2xl"
                  type="number"
                />
                <Input
                  placeholder="عرض (سانتی‌متر)"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="bg-muted border-border text-foreground rounded-2xl"
                  type="number"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="ارتفاع (سانتی‌متر)"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="bg-muted border-border text-foreground rounded-2xl"
                  type="number"
                />
                <Input
                  placeholder="وزن (کیلوگرم)"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="bg-muted border-border text-foreground rounded-2xl"
                  type="number"
                />
              </div>
            </div>

            {/* Destination */}
            <div>
              <h4 className="text-foreground font-medium mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-400" />
                کشور مقصد
              </h4>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger className="bg-muted border-border text-foreground rounded-2xl">
                  <SelectValue placeholder="انتخاب کشور مقصد" />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border">
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code} className="text-foreground">
                      {country.flag} {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Shipping Method */}
            <div>
              <h4 className="text-foreground font-medium mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-400" />
                روش ارسال
              </h4>
              <div className="space-y-3">
                {shippingMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <div
                      key={method.id}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        shippingMethod === method.id
                          ? "border-green-500 bg-green-500/10"
                          : "border-border bg-muted/30 hover:border-border"
                      }`}
                      onClick={() => setShippingMethod(method.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${
                          shippingMethod === method.id ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`font-medium ${
                              shippingMethod === method.id ? "text-green-600 dark:text-green-300" : "text-foreground"
                            }`}>
                              {method.name}
                            </span>
                            <Badge className="bg-muted text-muted-foreground rounded-full">
                              {method.deliveryTime}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm mt-1">{method.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={calculateShipping}
                className="flex-1 bg-green-500 hover:bg-green-600 rounded-2xl"
              >
                <Calculator className="w-4 h-4 ml-2" />
                محاسبه هزینه
              </Button>
              <Button 
                onClick={resetCalculation}
                variant="outline"
                className="border-border text-muted-foreground hover:bg-muted rounded-2xl"
              >
                پاک کردن
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-6">
          {calculationResult ? (
            <Card className="bg-card/80 border-border rounded-3xl">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  نتیجه محاسبه
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-2xl p-4">
                    <div className="text-muted-foreground text-sm">وزن واقعی</div>
                    <div className="text-foreground font-bold">{calculationResult.weight} کیلوگرم</div>
                  </div>
                  <div className="bg-muted/50 rounded-2xl p-4">
                    <div className="text-muted-foreground text-sm">وزن حجمی</div>
                    <div className="text-foreground font-bold">{calculationResult.volumetricWeight} کیلوگرم</div>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-5 h-5 text-blue-400" />
                    <span className="text-blue-300 font-medium">وزن قابل محاسبه</span>
                  </div>
                  <div className="text-foreground text-lg font-bold">{calculationResult.chargeableWeight} کیلوگرم</div>
                  <div className="text-blue-300 text-sm">بیشترین مقدار بین وزن واقعی و حجمی</div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">روش ارسال:</span>
                    <div className="flex items-center gap-2">
                      <calculationResult.method.icon className="w-4 h-4 text-green-400" />
                      <span className="text-foreground">{calculationResult.method.name}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">مقصد:</span>
                    <span className="text-foreground">
                      {calculationResult.destination.flag} {calculationResult.destination.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">زمان تحویل:</span>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 rounded-full">
                      {calculationResult.estimatedDelivery}
                    </Badge>
                  </div>
                </div>

                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <span className="text-green-600 dark:text-green-300 font-medium">هزینه کل ارسال</span>
                    </div>
                    <div className="text-right">
                                      <div className="text-green-600 dark:text-green-400 text-2xl font-bold">${calculationResult.finalPrice}</div>
                <div className="text-green-600 dark:text-green-300 text-sm">تومان تقریبی: {(parseFloat(calculationResult.finalPrice) * 50000).toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-green-500 hover:bg-green-600 rounded-2xl">
                  <Package className="w-4 h-4 ml-2" />
                  ثبت درخواست ارسال
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card/80 border-border rounded-3xl">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Calculator className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-foreground font-medium mb-2">محاسبه هزینه ارسال</h3>
                <p className="text-muted-foreground text-sm">
                  اطلاعات بسته و مقصد را وارد کنید تا هزینه ارسال محاسبه شود
                </p>
              </CardContent>
            </Card>
          )}

          {/* Shipping Info */}
          <Card className="bg-card/80 border-border rounded-3xl">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Info className="w-6 h-6 text-blue-400" />
                اطلاعات مهم ارسال
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <div className="text-foreground font-medium">محاسبه وزن حجمی</div>
                  <div className="text-muted-foreground text-sm">طول × عرض × ارتفاع ÷ ۵۰۰۰</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <div className="text-foreground font-medium">بیمه رایگان</div>
                  <div className="text-muted-foreground text-sm">تا ۱۰۰۰ دلار برای تمام محموله‌ها</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <div className="text-foreground font-medium">پیگیری آنلاین</div>
                  <div className="text-muted-foreground text-sm">امکان پیگیری لحظه‌ای محموله</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">۸</div>
            <p className="text-sm text-muted-foreground">کشور تحت پوشش</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">۲-۳</div>
            <p className="text-sm text-muted-foreground">روز ارسال سریع</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">۹۸%</div>
            <p className="text-sm text-muted-foreground">نرخ تحویل موفق</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">۲۴/۷</div>
            <p className="text-sm text-muted-foreground">پشتیبانی</p>
          </CardContent>
        </Card>
      </div>
    </div>
    </LicenseGate>
  );
};

export default AslExpress;