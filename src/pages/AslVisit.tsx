import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  MapPin, 
  Star, 
  Phone, 
  Mail, 
  Globe,
  Passport,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Languages,
  Briefcase,
  Award
} from "lucide-react";

const AslVisit = () => {
  const [activeTab, setActiveTab] = useState("browse");
  const [selectedCountry, setSelectedCountry] = useState("");

  const countries = [
    { 
      code: "AE", 
      name: "امارات متحده عربی", 
      flag: "🇦🇪",
      cities: ["دبی", "ابوظبی", "شارجه", "عجمان"],
      visitors: 12
    },
    { 
      code: "SA", 
      name: "عربستان سعودی", 
      flag: "🇸🇦",
      cities: ["ریاض", "جده", "دمام", "مکه"],
      visitors: 8
    },
    { 
      code: "KW", 
      name: "کویت", 
      flag: "🇰🇼",
      cities: ["کویت سیتی", "الاحمدی", "حولی"],
      visitors: 5
    },
    { 
      code: "QA", 
      name: "قطر", 
      flag: "🇶🇦",
      cities: ["دوحه", "الریان", "الوکره"],
      visitors: 4
    },
    { 
      code: "BH", 
      name: "بحرین", 
      flag: "🇧🇭",
      cities: ["منامه", "المحرق", "مدینه حمد"],
      visitors: 3
    },
    { 
      code: "OM", 
      name: "عمان", 
      flag: "🇴🇲",
      cities: ["مسقط", "صلاله", "نزوا"],
      visitors: 6
    }
  ];

  const visitors = [
    {
      id: 1,
      name: "احمد محمدی",
      country: "AE",
      city: "دبی",
      phone: "+971501234567",
      email: "ahmad@example.com",
      languages: ["فارسی", "عربی", "انگلیسی"],
      experience: "۵ سال",
      rating: 4.9,
      reviewCount: 23,
      specialties: ["زعفران", "خرما", "صنایع دستی"],
      isVerified: true,
      passportVerified: true,
      description: "متخصص در بازاریابی محصولات ایرانی در بازار امارات"
    },
    {
      id: 2,
      name: "فاطمه احمدی",
      country: "SA",
      city: "ریاض",
      phone: "+966501234567",
      email: "fateme@example.com",
      languages: ["فارسی", "عربی"],
      experience: "۳ سال",
      rating: 4.7,
      reviewCount: 18,
      specialties: ["پسته", "فرش", "زعفران"],
      isVerified: true,
      passportVerified: true,
      description: "نماینده فروش با تجربه در بازار عربستان"
    },
    {
      id: 3,
      name: "علی رضایی",
      country: "KW",
      city: "کویت سیتی",
      phone: "+965501234567",
      email: "ali@example.com",
      languages: ["فارسی", "عربی", "انگلیسی"],
      experience: "۷ سال",
      rating: 4.8,
      reviewCount: 31,
      specialties: ["خرما", "زعفران", "چای"],
      isVerified: true,
      passportVerified: true,
      description: "ویزیتور باتجربه با شبکه گسترده در کویت"
    }
  ];

  const filteredVisitors = selectedCountry 
    ? visitors.filter(visitor => visitor.country === selectedCountry)
    : visitors;

  const VisitorRegistrationForm = () => (
    <Card className="bg-gray-900/50 border-gray-800 rounded-3xl">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Plus className="w-6 h-6 text-blue-400" />
          ثبت‌نام ویزیتور
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personal Information */}
        <div>
          <h4 className="text-white font-medium mb-3">اطلاعات شخصی</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              placeholder="نام و نام خانوادگی"
              className="bg-gray-800 border-gray-700 text-white rounded-2xl"
            />
            <Input
              placeholder="شماره تماس"
              className="bg-gray-800 border-gray-700 text-white rounded-2xl"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <Input
              placeholder="ایمیل"
              type="email"
              className="bg-gray-800 border-gray-700 text-white rounded-2xl"
            />
            <Select>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white rounded-2xl">
                <SelectValue placeholder="کشور فعالیت" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.code} className="text-white">
                    {country.flag} {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Passport Information */}
        <div>
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <Passport className="w-5 h-5 text-blue-400" />
            اطلاعات پاسپورت
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              placeholder="شماره پاسپورت"
              className="bg-gray-800 border-gray-700 text-white rounded-2xl"
            />
            <Input
              placeholder="تاریخ انقضا"
              type="date"
              className="bg-gray-800 border-gray-700 text-white rounded-2xl"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            آدرس محل سکونت
          </h4>
          <Textarea
            placeholder="آدرس کامل محل سکونت در کشور مقصد"
            className="bg-gray-800 border-gray-700 text-white rounded-2xl"
            rows={3}
          />
        </div>

        {/* Experience and Specialties */}
        <div>
          <h4 className="text-white font-medium mb-3">تجربه و تخصص</h4>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <Input
              placeholder="سال‌های تجربه"
              className="bg-gray-800 border-gray-700 text-white rounded-2xl"
            />
            <Input
              placeholder="زبان‌های تسلط (جدا شده با کاما)"
              className="bg-gray-800 border-gray-700 text-white rounded-2xl"
            />
          </div>
          <Textarea
            placeholder="تخصص‌ها و محصولات مورد علاقه"
            className="bg-gray-800 border-gray-700 text-white rounded-2xl"
            rows={3}
          />
        </div>

        {/* Documents Upload */}
        <div>
          <h4 className="text-white font-medium mb-3">بارگذاری مدارک</h4>
          <div className="space-y-3">
            <div className="border-2 border-dashed border-gray-700 rounded-2xl p-6 text-center">
              <div className="text-gray-400 mb-2">تصویر پاسپورت</div>
              <Button variant="outline" className="border-gray-700 text-gray-300 rounded-2xl">
                انتخاب فایل
              </Button>
            </div>
            <div className="border-2 border-dashed border-gray-700 rounded-2xl p-6 text-center">
              <div className="text-gray-400 mb-2">مدرک اقامت</div>
              <Button variant="outline" className="border-gray-700 text-gray-300 rounded-2xl">
                انتخاب فایل
              </Button>
            </div>
          </div>
        </div>

        <Button className="w-full bg-blue-500 hover:bg-blue-600 rounded-2xl">
          <Plus className="w-4 h-4 ml-2" />
          ثبت درخواست ویزیتور
        </Button>
      </CardContent>
    </Card>
  );

  const VisitorBrowser = () => (
    <div className="space-y-6">
      {/* Country Filter */}
      <Card className="bg-gray-900/50 border-gray-800 rounded-3xl">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <h4 className="text-white font-medium mb-3">انتخاب کشور</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {countries.map((country) => (
                  <Button
                    key={country.code}
                    variant={selectedCountry === country.code ? "default" : "outline"}
                    onClick={() => setSelectedCountry(selectedCountry === country.code ? "" : country.code)}
                    className={`rounded-2xl justify-start ${
                      selectedCountry === country.code
                        ? "bg-blue-500 hover:bg-blue-600"
                        : "border-gray-700 text-gray-300 hover:bg-gray-800"
                    }`}
                  >
                    <span className="ml-2">{country.flag}</span>
                    <span className="flex-1 text-right">{country.name}</span>
                    <Badge className="bg-gray-700 text-gray-300 rounded-full mr-2">
                      {country.visitors}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visitors List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVisitors.map((visitor) => {
          const country = countries.find(c => c.code === visitor.country);
          return (
            <Card key={visitor.id} className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-all rounded-3xl">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-white">{visitor.name}</h4>
                      {visitor.isVerified && (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                      {visitor.passportVerified && (
                        <Passport className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-yellow-400 font-medium">{visitor.rating}</span>
                      <span className="text-gray-400 text-sm">({visitor.reviewCount} نظر)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <MapPin className="w-4 h-4" />
                    {country?.flag} {visitor.city}، {country?.name}
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Briefcase className="w-4 h-4" />
                    {visitor.experience} تجربه
                  </div>

                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Languages className="w-4 h-4" />
                    {visitor.languages.join("، ")}
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-4">{visitor.description}</p>

                <div className="mb-4">
                  <span className="text-gray-400 text-sm block mb-2">تخصص‌ها:</span>
                  <div className="flex flex-wrap gap-1">
                    {visitor.specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary" className="bg-gray-800 text-gray-300 rounded-xl text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-white text-sm">{visitor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-white text-sm">{visitor.email}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-blue-500 hover:bg-blue-600 rounded-2xl"
                  >
                    <Phone className="w-4 h-4 ml-2" />
                    تماس
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-gray-700 text-gray-300 hover:bg-gray-800 rounded-2xl"
                  >
                    جزئیات
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 border-blue-700/50 rounded-3xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-3xl flex items-center justify-center">
              <Users className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">ویزیتورهای اصل مارکت</h2>
              <p className="text-blue-300">شبکه نمایندگان در کشورهای عربی</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex gap-4">
        <Button
          variant={activeTab === "browse" ? "default" : "outline"}
          onClick={() => setActiveTab("browse")}
          className={`rounded-2xl ${
            activeTab === "browse"
              ? "bg-blue-500 hover:bg-blue-600"
              : "border-gray-700 text-gray-300 hover:bg-gray-800"
          }`}
        >
          <Search className="w-4 h-4 ml-2" />
          جستجو ویزیتورها
        </Button>
        <Button
          variant={activeTab === "register" ? "default" : "outline"}
          onClick={() => setActiveTab("register")}
          className={`rounded-2xl ${
            activeTab === "register"
              ? "bg-blue-500 hover:bg-blue-600"
              : "border-gray-700 text-gray-300 hover:bg-gray-800"
          }`}
        >
          <Plus className="w-4 h-4 ml-2" />
          ثبت‌نام ویزیتور
        </Button>
      </div>

      {/* Content */}
      {activeTab === "browse" ? <VisitorBrowser /> : <VisitorRegistrationForm />}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900/50 border-gray-800 rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">۳۸</div>
            <p className="text-sm text-gray-400">ویزیتور فعال</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900/50 border-gray-800 rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">۶</div>
            <p className="text-sm text-gray-400">کشور تحت پوشش</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900/50 border-gray-800 rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">۴.۸</div>
            <p className="text-sm text-gray-400">امتیاز میانگین</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900/50 border-gray-800 rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">۹۲%</div>
            <p className="text-sm text-gray-400">نرخ موفقیت</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AslVisit;