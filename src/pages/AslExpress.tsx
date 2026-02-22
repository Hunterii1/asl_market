import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LicenseGate } from '@/components/LicenseGate';
import { 
  Truck, 
  Phone,
  Building,
  MapPin,
  Clock,
  ExternalLink,
  FileText
} from "lucide-react";
import Slider from "@/components/Slider";

interface Contact {
  name?: string;
  phone: string;
}

interface ShippingCompany {
  id: number;
  name: string;
  services: string;
  address?: string;
  postalCode?: string;
  workingHours?: string;
  mapLinks?: { label: string; url: string }[];
  notes?: string[];
  contacts: Contact[];
}

const AslExpress = () => {
  const shippingCompanies: ShippingCompany[] = [
    {
      id: 1,
      name: "مجموعه PSP اکسپرس",
      services: "ارسال",
      contacts: [
        { name: "خانم سعیدپور", phone: "09204228105" },
        { phone: "02142281" },
        { phone: "02191200900" }
      ]
    },
    {
      id: 2,
      name: "مجموعه PTD اکسپرس",
      services: "ارسال و ترخیص",
      contacts: [
        { phone: "09395020825" },
        { phone: "09018317541" },
        { phone: "02142326" }
      ]
    },
    {
      id: 3,
      name: "پرشین تجارت دوان",
      services: "خدمات گمرکی و بازرگانی ترخیص کالا از گمرکات امام - بندرعباس - بازرگان - خرمشهر و بوشهر، ثبت سفارش و مجوزها، حمل و ترخیص",
      contacts: [
        { phone: "02142326" },
        { phone: "09018317541" }
      ]
    },
    {
      id: 4,
      name: "آنی بار",
      services: "حمل بار به صورت هوایی، زمینی، دریایی، مسافری",
      contacts: [
        { phone: "02157669" },
        { phone: "09223349350" }
      ]
    },
    {
      id: 5,
      name: "سکان طلایی لیان",
      services: "حمل و نقل بین‌المللی، ترخیص، بیمه، بارگیری کالا، بسته بندی، امور گمرکی، حمل کالاهای صادراتی به صورت درب به درب، حمل و نقل کالا به صورت مستقیم و غیر مستقیم از مبادی مختلف به مقصد ایران و بالعکس، حمل خرده بار و کامیون دربست، حمل زمینی برای محمولات ترافیکی سنگین و نیمه سنگین، حمل دریایی به صورت کانتینری از کلیه بنادر، انجام تشریفات ری اکسپورتینگ، حمل محمولات به صورت برک بالک، فرایند ترانزیت از کلیه مبادی ورودی کشور به گمرکات داخلی و مقاصد خارجی",
      address: "خ مطهری، خیابان علی اکبری، کوچه آزادی، پلاک ۵۳",
      contacts: [
        { phone: "02188522933" }
      ]
    },
    {
      id: 6,
      name: "اسدی اکسپرس کارگو",
      services: "خرده بار و بارهای بزرگ به مسقط (عمان)، دبی و جبل‌علی (امارات)، استانبول (ترکیه)، گوانجو (چین). انبار تحویل، ترخیص در گمرک، حمل و ترخیص در مقصد، تحویل به گیرنده نهایی. دفتر و انبار در تهران و شیراز. پکینگ کارتن و پالت‌بندی حرفه‌ای در انبار تهران.",
      address: "تهران، کهریزک، ۶۰متری شوراباد (بلوار امام حسین)، خیابان حمزه‌آباد (یکم شمالی-معدن یکم)، خیابان کشاورز، کوچه ایثار (سمت راست اولین کوچه)، پلاک ۲",
      postalCode: "۱۸۱۸۱۵۰۱۵۱",
      workingHours: "شنبه تا چهارشنبه: ۸ صبح الی ۱۷ | پنج‌شنبه: ۸ صبح الی ۱۲ | ایام تعطیل رسمی تعطیل",
      mapLinks: [
        { label: "Google Map", url: "https://maps.app.goo.gl/jsbNKqubz1xACJzK8?g_st=awb" },
        { label: "بلد", url: "https://balad.ir/location?latitude=35.480949&longitude=51.361805&zoom=16.500000" },
        { label: "نشان", url: "https://nshn.ir/rbQMY_Qx4sx6" }
      ],
      notes: [
        "لطفاً قبل از تحویل بار به انبار حتماً برگه باسکول را همراه داشته باشید.",
        "قبل از ارسال بار به انبار جهت تأیید امکان ارسال، محاسبه قیمت حمل و ترخیص یا تحویل بار با مشاور هماهنگ کنید.",
        "قابلیت پکینگ کارتن و پالت‌بندی کامل و حرفه‌ای کالاها در انبار تهران."
      ],
      contacts: [
        { name: "دفتر تهران — آقای علیرضا نامداری", phone: "+989981118990" },
        { name: "دفتر تهران — آقای علیرضا نامداری", phone: "+989106735256" },
        { name: "انبار تهران — آقای مهدی نوری", phone: "+989106735351" },
        { name: "انبار تهران — آقای محمدامین راستین", phone: "+989109355505" }
      ]
    }
  ];

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
                <p className="text-green-600 dark:text-green-300">شرکت‌های همکار ارسال بین‌المللی</p>
            </div>
          </div>
        </CardContent>
      </Card>

        {/* Section Banner Slider */}
        <Slider section="aslexpress" />

        {/* Main Content */}
        <Card className="bg-card/80 border-border rounded-3xl">
          <CardHeader>
            <CardTitle className="text-foreground text-center text-xl">
              برای هماهنگی‌های ارسال مرسوله‌هاتون می‌تونید با شرکت‌های زیر تماس حاصل فرمایید:
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {shippingCompanies.map((company, index) => (
              <div key={company.id} className="space-y-4">
                {/* Company Header */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 font-bold text-sm">
                      {index + 1}
                    </span>
                  </div>
            <div>
                    <h3 className="text-lg font-bold text-foreground">{company.name}</h3>
                    <p className="text-muted-foreground text-sm">{company.services}</p>
              </div>
            </div>

                {/* Address (if available) */}
                {company.address && (
                  <div className="flex items-start gap-3 bg-blue-500/10 rounded-2xl p-3">
                    <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-muted-foreground text-sm">
                      {company.address}
                      {company.postalCode && (
                        <span className="block mt-1 font-medium text-foreground/80">کد پستی: {company.postalCode}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Working hours */}
                {company.workingHours && (
                  <div className="flex items-start gap-3 bg-amber-500/10 rounded-2xl p-3">
                    <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-muted-foreground text-sm">{company.workingHours}</div>
                  </div>
                )}

                {/* Map links */}
                {company.mapLinks && company.mapLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {company.mapLinks.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/15 text-green-700 dark:text-green-400 rounded-xl text-sm hover:bg-green-500/25 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {company.notes && company.notes.length > 0 && (
                  <div className="space-y-2">
                    {company.notes.map((note, i) => (
                      <div key={i} className="flex items-start gap-3 bg-muted/50 rounded-2xl p-3">
                        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="text-muted-foreground text-sm">{note}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Contact Information */}
                <div className="bg-muted/30 rounded-2xl p-4 space-y-3">
                  {company.contacts.map((contact, contactIndex) => (
                    <div key={contactIndex} className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <div className="flex-1">
                        {contact.name && (
                          <div className="text-foreground font-medium text-sm">{contact.name}</div>
                        )}
                        <div className="text-muted-foreground font-mono text-sm">{contact.phone}</div>
                        </div>
                      </div>
                  ))}
            </div>

                {/* Separator */}
                {index < shippingCompanies.length - 1 && (
                  <div className="border-t border-border/50"></div>
                )}
            </div>
            ))}
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card className="bg-blue-500/10 border-blue-500/30 rounded-3xl">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto">
                <Building className="w-6 h-6 text-blue-400" />
                  </div>
              <h3 className="text-foreground font-bold">راهنمای تماس</h3>
                <p className="text-muted-foreground text-sm">
                برای کسب اطلاعات بیشتر در مورد خدمات ارسال، هزینه‌ها و شرایط، 
                با شماره‌های ارائه شده تماس حاصل فرمایید.
              </p>
              </div>
            </CardContent>
          </Card>
    </div>
    </LicenseGate>
  );
};

export default AslExpress;