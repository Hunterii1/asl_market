import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  MessageSquare, 
  Languages, 
  FileText, 
  Palette, 
  Briefcase,
  Send,
  Download,
  Copy,
  Sparkles,
  Globe,
  Target,
  Zap,
  Image,
  Type,
  Wand2
} from "lucide-react";

const AslAI = () => {
  const [activeTab, setActiveTab] = useState("coach");
  const [chatMessage, setChatMessage] = useState("");
  const [translationText, setTranslationText] = useState("");
  const [brandName, setBrandName] = useState("");
  const [businessType, setBusinessType] = useState("");

  const chatHistory = [
    {
      id: 1,
      type: "user",
      message: "چطور می‌تونم زعفران رو در بازار امارات بفروشم؟",
      time: "الان"
    },
    {
      id: 2,
      type: "ai",
      message: "برای فروش زعفران در امارات، این مراحل را دنبال کنید:\n\n1. **تحقیق بازار**: بازار امارات تقاضای بالایی برای زعفران ایرانی دارد\n2. **مجوزهای لازم**: گواهی کیفیت و مجوز صادرات\n3. **قیمت‌گذاری**: قیمت رقابتی با کیفیت بالا\n4. **کانال‌های فروش**: فروشگاه‌های آنلاین و حضوری\n\nآیا سوال خاصی در مورد هر کدام از این مراحل دارید؟",
      time: "الان"
    }
  ];

  const aiServices = [
    {
      id: "coach",
      title: "کوچینگ هوشمند",
      icon: Bot,
      description: "راهنمای گام به گام برای فروش",
      color: "blue"
    },
    {
      id: "translator",
      title: "مترجم تخصصی",
      icon: Languages,
      description: "ترجمه متون تجاری و قراردادها",
      color: "green"
    },
    {
      id: "marketing",
      title: "بازاریابی هوشمند",
      icon: Target,
      description: "تولید محتوای بازاریابی مؤثر",
      color: "orange"
    },
    {
      id: "branding",
      title: "طراحی برند",
      icon: Palette,
      description: "ساخت لوگو و بسته‌بندی",
      color: "purple"
    }
  ];

  const marketingTemplates = [
    {
      id: 1,
      title: "پست اینستاگرام زعفران",
      content: "🌟 زعفران طلایی ایران 🌟\n\nبهترین کیفیت زعفران سرگل\n✅ ۱۰۰٪ طبیعی و خالص\n✅ تست شده در آزمایشگاه\n✅ ارسال سریع به سراسر امارات\n\n#زعفران #ایران #امارات #طبیعی",
      type: "social"
    },
    {
      id: 2,
      title: "ایمیل بازاریابی خرما",
      content: "موضوع: خرمای مجول درجه یک - پیشنهاد ویژه\n\nسلام و احترام،\n\nخرمای مجول تازه و درجه یک از بهترین باغات ایران آماده ارسال است.\n\nویژگی‌ها:\n- کیفیت صادراتی\n- بسته‌بندی مناسب\n- قیمت رقابتی\n\nبرای سفارش تماس بگیرید.",
      type: "email"
    }
  ];

  const CoachingSection = () => (
    <div className="space-y-6">
      <Card className="bg-card/80 border-border rounded-3xl h-[500px] flex flex-col">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-foreground flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-400" />
            کوچ هوشمند اصل مارکت
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {chatHistory.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'ai' && (
                  <div className="w-8 h-8 bg-blue-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-blue-400" />
                  </div>
                )}
                
                <div
                  className={`max-w-[70%] p-4 rounded-3xl ${
                    message.type === 'user'
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
                      : 'bg-muted/50 text-muted-foreground'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line">{message.message}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs opacity-70">{message.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>

        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="سوال خود را بپرسید..."
                className="w-full bg-muted border border-border rounded-3xl text-foreground placeholder-muted-foreground resize-none"
                rows={2}
              />
            </div>
            
            <Button
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-3xl p-3"
              disabled={!chatMessage.trim()}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Questions */}
      <Card className="bg-card/80 border-border rounded-3xl">
        <CardHeader>
          <CardTitle className="text-foreground">سوالات متداول</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              "چطور محصولم رو قیمت‌گذاری کنم؟",
              "بهترین کشور برای شروع کدومه؟",
              "چه مدارکی برای صادرات لازمه؟",
              "چطور مشتری پیدا کنم؟"
            ].map((question, index) => (
              <Button
                key={index}
                variant="outline"
                className="text-right border-border text-muted-foreground hover:bg-muted rounded-2xl p-4 h-auto"
                onClick={() => setChatMessage(question)}
              >
                {question}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const TranslatorSection = () => (
    <div className="space-y-6">
      <Card className="bg-card/80 border-border rounded-3xl">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Languages className="w-5 h-5 text-green-400" />
            مترجم تخصصی تجاری
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-foreground font-medium mb-3 block">متن فارسی</label>
              <Textarea
                value={translationText}
                onChange={(e) => setTranslationText(e.target.value)}
                placeholder="متن خود را برای ترجمه وارد کنید..."
                className="bg-muted border-border text-foreground rounded-2xl h-40"
              />
            </div>
            
            <div>
              <label className="text-foreground font-medium mb-3 block">ترجمه عربی</label>
              <div className="bg-muted border border-border rounded-2xl h-40 p-3 text-foreground">
                {translationText ? (
                  <div className="text-muted-foreground">
                    ترجمه متن شما اینجا نمایش داده می‌شود...
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center mt-12">
                    متن خود را وارد کنید
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button className="bg-green-500 hover:bg-green-600 rounded-2xl">
              <Languages className="w-4 h-4 ml-2" />
              ترجمه
            </Button>
            <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted rounded-2xl">
              <Copy className="w-4 h-4 ml-2" />
              کپی
            </Button>
            <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted rounded-2xl">
              <Download className="w-4 h-4 ml-2" />
              دانلود
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Translation Templates */}
      <Card className="bg-card/80 border-border rounded-3xl">
        <CardHeader>
          <CardTitle className="text-foreground">قالب‌های آماده</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: "قرارداد فروش", type: "contract" },
              { title: "فاکتور تجاری", type: "invoice" },
              { title: "ایمیل رسمی", type: "email" },
              { title: "کاتالوگ محصول", type: "catalog" }
            ].map((template, index) => (
              <Button
                key={index}
                variant="outline"
                className="text-right border-border text-muted-foreground hover:bg-muted rounded-2xl p-4 h-auto"
              >
                <FileText className="w-4 h-4 ml-2" />
                {template.title}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const MarketingSection = () => (
    <div className="space-y-6">
      <Card className="bg-card/80 border-border rounded-3xl">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-400" />
            تولید محتوای بازاریابی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              placeholder="نام محصول"
              className="bg-muted border-border text-foreground rounded-2xl"
            />
            <Select>
              <SelectTrigger className="bg-muted border-border text-foreground rounded-2xl">
                <SelectValue placeholder="نوع محتوا" />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                <SelectItem value="social" className="text-foreground">پست شبکه اجتماعی</SelectItem>
                <SelectItem value="email" className="text-foreground">ایمیل بازاریابی</SelectItem>
                <SelectItem value="ad" className="text-foreground">تبلیغ آنلاین</SelectItem>
                <SelectItem value="catalog" className="text-foreground">کاتالوگ محصول</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Textarea
            placeholder="توضیحات محصول و نکات مهم..."
            className="bg-muted border-border text-foreground rounded-2xl"
            rows={4}
          />

          <Button className="bg-orange-500 hover:bg-orange-600 rounded-2xl">
            <Sparkles className="w-4 h-4 ml-2" />
            تولید محتوا
          </Button>
        </CardContent>
      </Card>

      {/* Marketing Templates */}
      <div>
        <h3 className="text-foreground font-bold mb-4">نمونه محتواهای تولید شده</h3>
        <div className="space-y-4">
          {marketingTemplates.map((template) => (
            <Card key={template.id} className="bg-card/80 border-border rounded-3xl">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="text-foreground font-medium">{template.title}</h4>
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 rounded-full">
                    {template.type === 'social' ? 'شبکه اجتماعی' : 'ایمیل'}
                  </Badge>
                </div>
                <div className="bg-muted/50 rounded-2xl p-4 mb-4">
                  <pre className="text-muted-foreground text-sm whitespace-pre-wrap font-sans">
                    {template.content}
                  </pre>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="border-border text-muted-foreground hover:bg-muted rounded-2xl">
                    <Copy className="w-4 h-4 ml-2" />
                    کپی
                  </Button>
                  <Button size="sm" variant="outline" className="border-border text-muted-foreground hover:bg-muted rounded-2xl">
                    <Download className="w-4 h-4 ml-2" />
                    دانلود
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const BrandingSection = () => (
    <div className="space-y-6">
      <Card className="bg-card/80 border-border rounded-3xl">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-400" />
            طراحی برند و بسته‌بندی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              placeholder="نام تجاری"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="bg-muted border-border text-foreground rounded-2xl"
            />
            <Select value={businessType} onValueChange={setBusinessType}>
              <SelectTrigger className="bg-muted border-border text-foreground rounded-2xl">
                <SelectValue placeholder="نوع کسب‌وکار" />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                <SelectItem value="food" className="text-foreground">مواد غذایی</SelectItem>
                <SelectItem value="handicraft" className="text-foreground">صنایع دستی</SelectItem>
                <SelectItem value="textile" className="text-foreground">نساجی</SelectItem>
                <SelectItem value="cosmetic" className="text-foreground">آرایشی بهداشتی</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Textarea
            placeholder="توضیحات برند، ارزش‌ها و پیام مورد نظر..."
            className="bg-muted border-border text-foreground rounded-2xl"
            rows={4}
          />

          <div className="grid md:grid-cols-2 gap-4">
            <Button className="bg-purple-500 hover:bg-purple-600 rounded-2xl">
              <Image className="w-4 h-4 ml-2" />
              طراحی لوگو
            </Button>
            <Button className="bg-purple-500 hover:bg-purple-600 rounded-2xl">
              <Type className="w-4 h-4 ml-2" />
              طراحی بسته‌بندی
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Design Gallery */}
      <Card className="bg-card/80 border-border rounded-3xl">
        <CardHeader>
          <CardTitle className="text-foreground">گالری طراحی‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="bg-muted/50 rounded-2xl p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Wand2 className="w-8 h-8 text-purple-400" />
                </div>
                <h4 className="text-foreground font-medium mb-2">طراحی {item}</h4>
                <p className="text-muted-foreground text-sm mb-3">نمونه طراحی لوگو</p>
                <Button size="sm" variant="outline" className="border-border text-muted-foreground hover:bg-muted rounded-2xl">
                  مشاهده
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeTab) {
      case "coach": return <CoachingSection />;
      case "translator": return <TranslatorSection />;
      case "marketing": return <MarketingSection />;
      case "branding": return <BrandingSection />;
      default: return <CoachingSection />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in transition-colors duration-300">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-900/20 to-purple-800/20 border-purple-700/50 rounded-3xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-3xl flex items-center justify-center">
              <Bot className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">اصل AI</h2>
              <p className="text-purple-300">کوچینگ و مترجم هوش مصنوعی</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {aiServices.map((service) => {
          const Icon = service.icon;
          const isActive = activeTab === service.id;
          return (
            <Button
              key={service.id}
              variant={isActive ? "default" : "outline"}
              className={`h-20 flex flex-col gap-2 rounded-3xl transition-all duration-300 ${
                isActive
                  ? `bg-gradient-to-br from-${service.color}-500 to-${service.color}-600 border-${service.color}-500 text-white shadow-lg`
                  : "border-border bg-muted/30 hover:bg-muted/50 hover:border-border text-muted-foreground"
              }`}
              onClick={() => setActiveTab(service.id)}
            >
              <Icon className={`w-6 h-6 ${isActive ? "text-white" : "text-muted-foreground"}`} />
              <div className="text-center">
                <div className="text-sm font-medium">{service.title}</div>
                <div className="text-xs opacity-70">{service.description}</div>
              </div>
            </Button>
          );
        })}
      </div>

      {/* Dynamic Content */}
      <div className="animate-fade-in">
        {renderActiveSection()}
      </div>

      {/* AI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">۱,۲۳۴</div>
            <p className="text-sm text-muted-foreground">سوال پاسخ داده شده</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">۸۹۲</div>
            <p className="text-sm text-muted-foreground">متن ترجمه شده</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">۴۵۶</div>
            <p className="text-sm text-muted-foreground">محتوای تولید شده</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">۱۲۳</div>
            <p className="text-sm text-muted-foreground">طراحی انجام شده</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AslAI;