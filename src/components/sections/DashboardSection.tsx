
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

  const salesData = [
    { name: 'شنبه', sales: 2400 },
    { name: 'یکشنبه', sales: 1398 },
    { name: 'دوشنبه', sales: 9800 },
    { name: 'سه‌شنبه', sales: 3908 },
    { name: 'چهارشنبه', sales: 4800 },
    { name: 'پنج‌شنبه', sales: 3800 },
    { name: 'جمعه', sales: 4300 },
  ];

  const recentOrders = [
    { id: '#۱۲۴۵۳', customer: 'احمد المصری', product: 'زعفران ممتاز', amount: '$۸۹۰', status: 'تکمیل شده', country: 'امارات' },
    { id: '#۱۲۴۵۲', customer: 'فاطمه الزهرانی', product: 'خرما مجول', amount: '$۱،۲۵۰', status: 'در حال پردازش', country: 'عربستان' },
    { id: '#۱۲۴۵۱', customer: 'عبدالله الکویتی', product: 'پسته اکبری', amount: '$۶۷۵', status: 'ارسال شده', country: 'کویت' },
    { id: '#۱۲۴۵۰', customer: 'مریم القطری', product: 'برنج هندی', amount: '$۴۲۰', status: 'تکمیل شده', country: 'قطر' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'تکمیل شده': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'در حال پردازش': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'ارسال شده': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-3 shadow-xl">
          <p className="text-gray-300">{`${label}`}</p>
          <p className="text-orange-400 font-bold">
            {`فروش: ${toFarsiNumber(payload[0].value)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  const AddProductModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-gray-900 border-gray-700 w-full max-w-md rounded-3xl">
        <CardHeader>
          <CardTitle className="text-white text-center">افزودن محصول جدید</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="text"
            placeholder="نام محصول"
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-2xl text-white"
          />
          <input
            type="text"
            placeholder="قیمت (دلار)"
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-2xl text-white"
          />
          <textarea
            placeholder="توضیحات محصول"
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-2xl text-white h-24"
          />
          <div className="flex gap-3">
            <Button 
              onClick={() => setActiveModal(null)}
              variant="outline" 
              className="flex-1 border-gray-700 rounded-2xl"
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-gray-900 border-gray-700 w-full max-w-2xl rounded-3xl max-h-[80vh] overflow-auto">
        <CardHeader>
          <CardTitle className="text-white text-center">مدیریت مشتریان</CardTitle>
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
              <div key={index} className="p-4 bg-gray-800/50 rounded-2xl border border-gray-700">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">{order.customer}</p>
                    <p className="text-sm text-gray-400">{order.country}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="border-gray-700 rounded-xl">
                      ویرایش
                    </Button>
                    <Button size="sm" variant="outline" className="border-gray-700 rounded-xl">
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
              className="w-full border-gray-700 rounded-2xl"
            >
              بستن
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const AnalyticsModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-gray-900 border-gray-700 w-full max-w-4xl rounded-3xl max-h-[80vh] overflow-auto">
        <CardHeader>
          <CardTitle className="text-white text-center">گزارش‌های تحلیلی</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gray-800/50 border-gray-700 rounded-2xl">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{toFarsiNumber(15600)}</div>
                <p className="text-sm text-gray-400">کل فروش (دلار)</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/50 border-gray-700 rounded-2xl">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{toFarsiNumber(24)}</div>
                <p className="text-sm text-gray-400">تعداد سفارش</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/50 border-gray-700 rounded-2xl">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{toFarsiNumber(87)}%</div>
                <p className="text-sm text-gray-400">رضایت مشتریان</p>
              </CardContent>
            </Card>
          </div>
          <div className="h-[300px] mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
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
            className="w-full border-gray-700 rounded-2xl"
          >
            بستن
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Sales Chart */}
      <Card className="bg-gray-900/50 border-gray-800 rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="w-5 h-5 text-orange-400" />
            نمودار فروش هفتگی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
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
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card className="bg-gray-900/50 border-gray-800 rounded-3xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Package className="w-5 h-5 text-orange-400" />
              سفارش‌های اخیر
            </CardTitle>
            <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800 rounded-2xl">
              <Eye className="w-4 h-4 ml-2" />
              مشاهده همه
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentOrders.map((order, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-2xl border border-gray-700/50 hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium text-white">{order.id}</p>
                    <p className="text-sm text-gray-400">{order.customer}</p>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm text-white">{order.product}</p>
                    <p className="text-xs text-gray-400">{order.country}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <p className="font-bold text-white">{order.amount}</p>
                    <Badge variant="secondary" className={`${getStatusColor(order.status)} rounded-2xl`}>
                      {order.status}
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

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card 
          className="bg-gradient-to-br from-orange-900/30 to-orange-800/20 border-orange-700/50 hover:border-orange-600/70 transition-all cursor-pointer group rounded-3xl"
          onClick={() => setActiveModal('addProduct')}
        >
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">افزودن محصول جدید</h3>
            <p className="text-sm text-gray-400">محصول جدید خود را به کاتالوگ اضافه کنید</p>
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
            <h3 className="font-semibold text-white mb-2">مدیریت مشتریان</h3>
            <p className="text-sm text-gray-400">مشتریان و سفارش‌هایشان را مدیریت کنید</p>
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
            <h3 className="font-semibold text-white mb-2">گزارش‌های تحلیلی</h3>
            <p className="text-sm text-gray-400">عملکرد فروش خود را تحلیل کنید</p>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {activeModal === 'addProduct' && <AddProductModal />}
      {activeModal === 'customerManagement' && <CustomerManagementModal />}
      {activeModal === 'analytics' && <AnalyticsModal />}
    </div>
  );
};

export default DashboardSection;
