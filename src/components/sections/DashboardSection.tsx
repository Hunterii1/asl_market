
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users,
  Globe,
  ArrowUpRight,
  Eye,
  Plus,
  ShoppingCart,
  FileText,
  UserPlus
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useState } from 'react';

const DashboardSection = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Convert numbers to Farsi
  const toFarsiNumber = (num: number) => {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/\d/g, (digit) => farsiDigits[parseInt(digit)]);
  };

  // Sample sales data connected to payment confirmations
  const salesData = [
    { name: '۱۴۰۳/۰۸/۱۰', sales: 850 },
    { name: '۱۴۰۳/۰۸/۱۲', sales: 1250 },
    { name: '۱۴۰۳/۰۸/۱۵', sales: 675 },
    { name: '۱۴۰۳/۰۸/۱۸', sales: 420 },
    { name: '۱۴۰۳/۰۸/۲۰', sales: 890 },
    { name: '۱۴۰۳/۰۸/۲۲', sales: 1100 },
  ];

  // Learning path steps
  const learningSteps = [
    { id: 1, title: "انتخاب محصول", completed: true, current: false },
    { id: 2, title: "یافتن تأمین‌کننده", completed: true, current: false },
    { id: 3, title: "تنظیم قیمت و بازاریابی", completed: false, current: true },
    { id: 4, title: "راه‌اندازی فروش", completed: false, current: false },
    { id: 5, title: "مدیریت ارسال", completed: false, current: false },
    { id: 6, title: "دریافت پول و رشد", completed: false, current: false },
  ];

  const recentPayments = [
    { id: '#PAY-۱۲۴۵۳', customer: 'احمد المصری', amount: '$۸۹۰', status: 'تکمیل شده', country: 'امارات', date: '۱۴۰۳/۰۸/۱۵' },
    { id: '#PAY-۱۲۴۵۲', customer: 'فاطمه الزهرانی', amount: '$۱،۲۵۰', status: 'در حال پردازش', country: 'عربستان', date: '۱۴۰۳/۰۸/۲۰' },
    { id: '#PAY-۱۲۴۵۱', customer: 'عبدالله الکویتی', amount: '$۶۷۵', status: 'تایید شده', country: 'کویت', date: '۱۴۰۳/۰۸/۱۸' },
    { id: '#PAY-۱۲۴۵۰', customer: 'مریم القطری', amount: '$۴۲۰', status: 'تکمیل شده', country: 'قطر', date: '۱۴۰۳/۰۸/۱۲' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'تکمیل شده': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'در حال پردازش': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'تایید شده': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-2xl p-3 shadow-xl">
          <p className="text-muted-foreground">{`${label}`}</p>
          <p className="text-orange-400 font-bold">
            {`فروش: ${toFarsiNumber(payload[0].value)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  const AddProductModal = () => (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="bg-card border-border w-full max-w-md rounded-3xl">
        <CardHeader>
          <CardTitle className="text-foreground text-center">افزودن محصول جدید</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="text"
            placeholder="نام محصول"
            className="w-full p-3 bg-background border border-border rounded-2xl text-foreground"
          />
          <input
            type="text"
            placeholder="قیمت (دلار)"
            className="w-full p-3 bg-background border border-border rounded-2xl text-foreground"
          />
          <textarea
            placeholder="توضیحات محصول"
            className="w-full p-3 bg-background border border-border rounded-2xl text-foreground h-24"
          />
          <div className="flex gap-3">
            <Button 
              onClick={() => setActiveModal(null)}
              variant="outline" 
              className="flex-1 border-border rounded-2xl"
            >
              لغو
            </Button>
            <Button 
              onClick={() => setActiveModal(null)}
              className="flex-1 bg-orange-500 hover:bg-orange-600 rounded-2xl"
            >
              افزودن
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const CustomerManagementModal = () => (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="bg-card border-border w-full max-w-2xl rounded-3xl max-h-[80vh] overflow-auto">
        <CardHeader>
          <CardTitle className="text-foreground text-center">مدیریت مشتریان</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-4">
            <Button className="w-full bg-green-500 hover:bg-green-600 rounded-2xl">
              <UserPlus className="w-4 h-4 ml-2" />
              افزودن مشتری جدید
            </Button>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order, index) => (
              <div key={index} className="p-4 bg-muted/50 rounded-2xl border border-border">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-foreground font-medium">{order.customer}</p>
                    <p className="text-sm text-muted-foreground">{order.country}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="border-border rounded-xl">
                      ویرایش
                    </Button>
                    <Button size="sm" variant="outline" className="border-border rounded-xl">
                      مشاهده
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Button 
              onClick={() => setActiveModal(null)}
              variant="outline" 
              className="w-full border-border rounded-2xl"
            >
              بستن
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const AnalyticsModal = () => (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="bg-card border-border w-full max-w-4xl rounded-3xl max-h-[80vh] overflow-auto">
        <CardHeader>
          <CardTitle className="text-foreground text-center">گزارش‌های تحلیلی</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-muted/50 border-border rounded-2xl">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{toFarsiNumber(15600)}</div>
                <p className="text-sm text-muted-foreground">کل فروش (دلار)</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50 border-border rounded-2xl">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{toFarsiNumber(24)}</div>
                <p className="text-sm text-muted-foreground">تعداد سفارش</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50 border-border rounded-2xl">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{toFarsiNumber(87)}%</div>
                <p className="text-sm text-muted-foreground">رضایت مشتریان</p>
              </CardContent>
            </Card>
          </div>
          <div className="h-[300px] mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#F97316" 
                  fill="url(#colorGradient)" 
                  strokeWidth={3}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <Button 
            onClick={() => setActiveModal(null)}
            variant="outline" 
            className="w-full border-border rounded-2xl"
          >
            بستن
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Learning Progress */}
      <Card className="bg-gradient-to-r from-orange-900/20 to-orange-800/20 border-orange-700/50 rounded-3xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-foreground">مسیر یادگیری شما</h3>
              <p className="text-orange-300">مرحله ۳ از ۶ - در حال پیشرفت</p>
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold text-orange-400">۳۳%</div>
              <p className="text-orange-300 text-sm">تکمیل شده</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {learningSteps.map((step) => (
              <div
                key={step.id}
                className={`p-3 rounded-2xl border transition-all ${
                  step.completed
                    ? 'bg-green-500/20 border-green-500/30'
                    : step.current
                    ? 'bg-orange-500/20 border-orange-500/30 ring-2 ring-orange-500/50'
                    : 'bg-muted/30 border-border'
                }`}
              >
                <div className="text-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    step.completed
                      ? 'bg-green-500 text-white'
                      : step.current
                      ? 'bg-orange-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-bold">{step.id}</span>
                    )}
                  </div>
                  <p className={`text-xs font-medium ${
                    step.completed
                      ? 'text-green-400'
                      : step.current
                      ? 'text-orange-400'
                      : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <Button className="bg-orange-500 hover:bg-orange-600 rounded-2xl">
              <PlayCircle className="w-4 h-4 ml-2" />
              ادامه مرحله فعلی
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Compact Sales Chart */}
      <Card className="rounded-2xl border border-border bg-card/90 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-foreground text-xl font-bold">
            <BarChart3 className="w-5 h-5 text-orange-400" />
            نمودار فروش (متصل به دریافت پول)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] px-0 pt-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 16, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.3)" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))" 
                  tick={{ fontSize: 12, fontFamily: 'Vazirmatn', fill: 'hsl(var(--muted-foreground))' }} 
                  axisLine={false} 
                  tickLine={false} 
                  interval={0} 
                  padding={{ left: 4, right: 4 }} 
                  angle={-30}
                  dy={16}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 14, fontFamily: 'Vazirmatn', fill: 'hsl(var(--muted-foreground))', dx: 8 }} axisLine={false} tickLine={false} width={48} tickFormatter={toFarsiNumber} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent)/0.08)' }} />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#F97316" 
                  fill="url(#colorGradient)" 
                  strokeWidth={4}
                  dot={{ r: 4, fill: '#F97316', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#F97316', stroke: '#fff', strokeWidth: 2 }}
                  isAnimationActive={true}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.18}/>
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card className="bg-card/50 border-border rounded-3xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <CreditCard className="w-5 h-5 text-orange-400" />
              دریافت‌های اخیر
            </CardTitle>
            <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:bg-accent rounded-2xl">
              <Eye className="w-4 h-4 ml-2" />
              مشاهده همه
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentPayments.map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium text-foreground">{payment.id}</p>
                    <p className="text-sm text-muted-foreground">{payment.customer}</p>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm text-foreground">{payment.date}</p>
                    <p className="text-xs text-muted-foreground">{payment.country}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <p className="font-bold text-foreground">{payment.amount}</p>
                    <Badge variant="secondary" className={`${getStatusColor(payment.status)} rounded-2xl`}>
                      {payment.status}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="text-orange-400 hover:bg-orange-500/10 rounded-2xl">
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Cards */}
      {/**
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <Card 
          className="bg-gradient-to-br from-orange-900/30 to-orange-800/20 border-orange-700/50 hover:border-orange-600/70 transition-all cursor-pointer group rounded-3xl"
          onClick={() => setActiveModal('addProduct')}
        >
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">افزودن محصول جدید</h3>
            <p className="text-sm text-muted-foreground">محصول جدید خود را به کاتالوگ اضافه کنید</p>
          </CardContent>
        </Card>

        <Card 
          className="bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-700/50 hover:border-green-600/70 transition-all cursor-pointer group rounded-3xl"
          onClick={() => setActiveModal('customerManagement')}
        >
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">مدیریت مشتریان</h3>
            <p className="text-sm text-muted-foreground">مشتریان و سفارش‌هایشان را مدیریت کنید</p>
          </CardContent>
        </Card>

        <Card 
          className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-700/50 hover:border-blue-600/70 transition-all cursor-pointer group rounded-3xl"
          onClick={() => setActiveModal('analytics')}
        >
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">گزارش‌های تحلیلی</h3>
            <p className="text-sm text-muted-foreground">عملکرد فروش خود را تحلیل کنید</p>
          </CardContent>
        </Card>
      </div>
      */}
      {/* TODO: کارت‌های پایین داشبورد موقتاً غیرفعال شدند. برای استفاده مجدد فقط این بخش را از کامنت خارج کنید. */}

      {/* Modals */}
      {activeModal === 'addProduct' && <AddProductModal />}
      {activeModal === 'customerManagement' && <CustomerManagementModal />}
      {activeModal === 'analytics' && <AnalyticsModal />}
    </div>
  );
};

export default DashboardSection;
