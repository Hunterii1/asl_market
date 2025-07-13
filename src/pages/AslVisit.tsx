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
  User,
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

  const VisitorBrowser = () => (
    <div className="space-y-6">
      {/* Visitor Registration */}
      <Card className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 border-blue-700/50 rounded-3xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">ویزیتور در کشورهای عربی هستید؟</h3>
              <p className="text-blue-300">در شبکه ویزیتورهای اصل مارکت عضو شوید</p>
            </div>
            <Button className="bg-blue-500 hover:bg-blue-600 rounded-2xl">
              <Plus className="w-4 h-4 ml-2" />
              ثبت‌نام ویزیتور
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Country Filter */}
      <Card className="bg-card border-border rounded-3xl transition-colors duration-300">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <h4 className="text-foreground font-medium mb-3">انتخاب کشور</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {countries.map((country) => (
                  <Button
                    key={country.code}
                    variant={selectedCountry === country.code ? "default" : "outline"}
                    onClick={() => setSelectedCountry(selectedCountry === country.code ? "" : country.code)}
                    className={`rounded-2xl flex justify-between items-center transition-colors duration-300 ${
                      selectedCountry === country.code
                        ? "bg-blue-500 hover:bg-blue-600"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="shrink-0">{country.flag}</span>
                      <span className="truncate text-right">{country.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{country.code}</span>
                    </span>
                    <Badge className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full shrink-0">
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
            <Card key={visitor.id} className="bg-card border-border hover:border-border transition-all rounded-3xl transition-colors duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-foreground">{visitor.name}</h4>
                      {visitor.isVerified && (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                      {visitor.passportVerified && (
                        <User className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-yellow-400 font-medium">{visitor.rating}</span>
                      <span className="text-muted-foreground text-sm">({visitor.reviewCount} نظر)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <MapPin className="w-4 h-4" />
                    {country?.flag} {visitor.city}، {country?.name}
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Briefcase className="w-4 h-4" />
                    {visitor.experience} تجربه
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Languages className="w-4 h-4" />
                    {visitor.languages.join("، ")}
                  </div>
                </div>

                <p className="text-muted-foreground text-sm mb-4">{visitor.description}</p>

                <div className="mb-4">
                  <span className="text-muted-foreground text-sm block mb-2">تخصص‌ها:</span>
                  <div className="flex flex-wrap gap-1">
                    {visitor.specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary" className="bg-muted text-muted-foreground rounded-xl text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground text-sm">{visitor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground text-sm">{visitor.email}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-blue-500 hover:bg-blue-600 rounded-2xl transition-colors duration-300"
                  >
                    <Phone className="w-4 h-4 ml-2" />
                    تماس
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-border text-muted-foreground hover:bg-muted rounded-2xl transition-colors duration-300"
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

  const VisitorRegistration = () => (
    <Card className="bg-card border-border rounded-3xl max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-foreground text-center">ثبت‌نام ویزیتور</CardTitle>
        <p className="text-muted-foreground text-center">برای عضویت در شبکه ویزیتورهای اصل مارکت فرم زیر را تکمیل کنید</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-foreground font-medium mb-2 block">نام و نام خانوادگی</label>
            <Input
              placeholder="نام کامل خود را وارد کنید"
              className="bg-muted border-border text-foreground rounded-2xl"
            />
          </div>
          <div>
            <label className="text-foreground font-medium mb-2 block">شماره تلفن</label>
            <Input
              placeholder="شماره تلفن همراه"
              className="bg-muted border-border text-foreground rounded-2xl"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-foreground font-medium mb-2 block">کشور محل سکونت</label>
            <Select>
              <SelectTrigger className="bg-muted border-border text-foreground rounded-2xl">
                <SelectValue placeholder="انتخاب کشور" />
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
          <div>
            <label className="text-foreground font-medium mb-2 block">شهر</label>
            <Input
              placeholder="نام شهر محل سکونت"
              className="bg-muted border-border text-foreground rounded-2xl"
            />
          </div>
        </div>

        <div>
          <label className="text-foreground font-medium mb-2 block">شماره پاسپورت</label>
          <Input
            placeholder="شماره پاسپورت معتبر"
            className="bg-muted border-border text-foreground rounded-2xl"
          />
        </div>

        <div>
          <label className="text-foreground font-medium mb-2 block">آدرس کامل</label>
          <Textarea
            placeholder="آدرس کامل محل سکونت خود را وارد کنید"
            className="bg-muted border-border text-foreground rounded-2xl"
            rows={3}
          />
        </div>

        <div>
          <label className="text-foreground font-medium mb-2 block">زبان‌های تسلط</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {["فارسی", "عربی", "انگلیسی", "فرانسوی", "آلمانی", "اسپانیایی"].map((lang) => (
              <label key={lang} className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-foreground text-sm">{lang}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-foreground font-medium mb-2 block">تجربه کاری</label>
          <Textarea
            placeholder="تجربه کاری و تخصص‌های خود را شرح دهید"
            className="bg-muted border-border text-foreground rounded-2xl"
            rows={3}
          />
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
          <h5 className="text-blue-300 font-medium mb-2">مدارک مورد نیاز:</h5>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>• کپی پاسپورت معتبر</li>
            <li>• مدرک اقامت در کشور مربوطه</li>
            <li>• رزومه کاری</li>
            <li>• معرفی‌نامه (در صورت وجود)</li>
          </ul>
        </div>

        <Button className="w-full bg-blue-500 hover:bg-blue-600 rounded-2xl">
          <User className="w-4 h-4 ml-2" />
          ثبت درخواست ویزیتور
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in transition-colors duration-300">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 border-blue-700/50 rounded-3xl transition-colors duration-300">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-3xl flex items-center justify-center">
              <Users className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">ویزیتورهای اصل مارکت</h2>
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
          className={`rounded-2xl transition-colors duration-300 ${
            activeTab === "browse"
              ? "bg-blue-500 hover:bg-blue-600"
              : "border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          <Search className="w-4 h-4 ml-2" />
          جستجو ویزیتورها
        </Button>
        <Button
          variant={activeTab === "register" ? "default" : "outline"}
          onClick={() => setActiveTab("register")}
          className={`rounded-2xl transition-colors duration-300 ${
            activeTab === "register"
              ? "bg-blue-500 hover:bg-blue-600"
              : "border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          <Plus className="w-4 h-4 ml-2" />
          ثبت‌نام ویزیتور
        </Button>
      </div>

      {/* Content */}
      {activeTab === "browse" ? <VisitorBrowser /> : <VisitorRegistration />}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border rounded-3xl transition-colors duration-300">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">۳۸</div>
            <p className="text-sm text-muted-foreground">ویزیتور فعال</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border rounded-3xl transition-colors duration-300">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">۶</div>
            <p className="text-sm text-muted-foreground">کشور تحت پوشش</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border rounded-3xl transition-colors duration-300">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">۴.۸</div>
            <p className="text-sm text-muted-foreground">امتیاز میانگین</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border rounded-3xl transition-colors duration-300">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">۹۲%</div>
            <p className="text-sm text-muted-foreground">نرخ موفقیت</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AslVisit;