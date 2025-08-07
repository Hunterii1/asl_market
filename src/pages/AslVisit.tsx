import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LicenseGate } from '@/components/LicenseGate';
import { DailyLimitsDisplay } from '@/components/DailyLimitsDisplay';
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  MapPin, 
  Star, 
  Phone, 
  Mail, 
  User,
  CheckCircle,
  Clock,
  Plus,
  Languages,
  Briefcase,
  Award
} from "lucide-react";

const AslVisit = () => {
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState("");
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Load visitors data from API
  useEffect(() => {
    const loadVisitorsData = async () => {
      try {
        setLoading(true);
        const response = await apiService.getApprovedVisitors();
        setVisitors(response.visitors || []);
      } catch (error) {
        console.error('Error loading visitors:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVisitorsData();
  }, []);

  // Helper function for language level display
  const getLanguageText = (level: string) => {
    switch (level) {
      case 'excellent': return '🌟 عالی';
      case 'good': return '👍 خوب';
      case 'weak': return '👎 ضعیف';
      case 'none': return '❌ بلد نیستم';
      default: return level;
    }
  };

  const filteredVisitors = selectedCountry 
    ? visitors.filter(visitor => visitor.city_province?.includes(countries.find(c => c.code === selectedCountry)?.name || ''))
    : visitors;

  const VisitorBrowser = () => (
    <div className="space-y-6">
      {/* Daily Limits Display */}
      <DailyLimitsDisplay />

      {/* Visitor Registration */}
      <Card className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 border-blue-700/50 rounded-3xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">ویزیتور در کشورهای عربی هستید؟</h3>
              <p className="text-blue-300">در شبکه ویزیتورهای اصل مارکت عضو شوید</p>
            </div>
            <Button className="bg-blue-500 hover:bg-blue-600 rounded-2xl"
            onClick={() => navigate("/visitor-registration")}>
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
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">در حال بارگذاری ویزیتورها...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVisitors.map((visitor) => (
            <Card key={visitor.id} className="bg-card border-border hover:border-border transition-all rounded-3xl transition-colors duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-foreground">{visitor.full_name}</h4>
                      {visitor.status === 'approved' && (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                      {visitor.passport_number && (
                        <User className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-yellow-400 font-medium">4.5</span>
                      <span className="text-muted-foreground text-sm">(تازه عضو)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <MapPin className="w-4 h-4" />
                    {visitor.city_province}
                  </div>
                  
                  {visitor.has_marketing_experience && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Briefcase className="w-4 h-4" />
                      دارای تجربه بازاریابی
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Languages className="w-4 h-4" />
                    {getLanguageText(visitor.language_level)}
                  </div>
                </div>

                {visitor.marketing_experience_desc && (
                  <p className="text-muted-foreground text-sm mb-4">{visitor.marketing_experience_desc}</p>
                )}

                {visitor.special_skills && (
                  <div className="mb-4">
                    <span className="text-muted-foreground text-sm block mb-2">مهارت‌ها:</span>
                    <div className="flex flex-wrap gap-1">
                      {visitor.special_skills.split('، ').map((skill, index) => (
                        <Badge key={index} variant="secondary" className="bg-muted text-muted-foreground rounded-xl text-xs">
                          {skill.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground text-sm">{visitor.mobile}</span>
                  </div>
                  {visitor.user && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground text-sm">{visitor.user.email}</span>
                    </div>
                  )}
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
          ))}
        </div>
      )}
    </div>
  );



  return (
    <LicenseGate>
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

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => navigate("/visitor-status")}
          className="rounded-2xl border-border text-muted-foreground hover:bg-muted transition-colors duration-300"
        >
          <CheckCircle className="w-4 h-4 ml-2" />
          وضعیت ویزیتور
        </Button>
      </div>

      {/* Content */}
      <VisitorBrowser />

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
    </LicenseGate>
  );
};

export default AslVisit;