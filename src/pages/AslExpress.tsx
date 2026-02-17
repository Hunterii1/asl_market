import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LicenseGate } from '@/components/LicenseGate';
import { 
  Truck, 
  Phone,
  Building,
  Users,
  Mail,
  MapPin
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
                    <div className="text-muted-foreground text-sm">{company.address}</div>
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