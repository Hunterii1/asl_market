import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { affiliateApi } from "@/lib/affiliateApi";

// Helper function to get image URL based on environment
const getImageUrl = (path: string): string => {
  if (typeof window === "undefined") return path;
  
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Development
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `${protocol}//localhost:8080${path}`;
  }
  
  // Production - use relative path (nginx will serve it)
  return path;
};

export default function Register() {
  const [searchParams] = useSearchParams();
  const promoterId = searchParams.get("promoter");
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!promoterId) {
      toast.error("لینک ثبت‌نام نامعتبر است");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    }
  }, [promoterId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!promoterId) {
      toast.error("لینک ثبت‌نام نامعتبر است");
      return;
    }

    // Validation
    if (!formData.full_name.trim()) {
      toast.error("نام و نام خانوادگی را وارد کنید");
      return;
    }

    if (!formData.phone.trim()) {
      toast.error("شماره موبایل را وارد کنید");
      return;
    }

    // Validate phone number format (should be digits only)
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      toast.error("شماره موبایل باید به فرمت 09XXXXXXXXX باشد");
      return;
    }

    setLoading(true);
    try {
      // Split full name into first and last name
      const nameParts = formData.full_name.trim().split(/\s+/);
      const first_name = nameParts[0] || "";
      const last_name = nameParts.slice(1).join(" ") || "";

      // Generate a random password (user can reset it later)
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

      await affiliateApi.registerWithPromoter({
        first_name,
        last_name,
        phone: formData.phone.trim(),
        password: randomPassword,
        promoter_id: parseInt(promoterId),
      });
      
      setSuccess(true);
      toast.success("ثبت‌نام با موفقیت انجام شد!");
      
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطا در ثبت‌نام");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // For phone input, only allow English digits
    if (e.target.name === "phone") {
      const digitsOnly = value.replace(/[^0-9]/g, "");
      setFormData({
        ...formData,
        [e.target.name]: digitsOnly,
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: value,
      });
    }
  };

  if (!promoterId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4" dir="rtl">
        <div className="text-center">
          <p className="text-white mb-4">لینک ثبت‌نام نامعتبر است</p>
          <Button onClick={() => navigate("/login")}>بازگشت به صفحه ورود</Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4" dir="rtl">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white">ثبت‌نام موفق!</h2>
          <p className="text-gray-300">حساب کاربری شما با موفقیت ایجاد شد.</p>
          <p className="text-sm text-gray-400">در حال انتقال به صفحه ورود...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black" dir="rtl">
      {/* Hero Section with Image */}
      <div className="relative w-full" style={{ minHeight: "60vh" }}>
        {/* Background Image */}
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            height: "821px",
            backgroundImage: `url('${getImageUrl("/uploads/videos/IMG_6747.JPG")}')`,
          }}
        />
      </div>

      {/* Black Gradient - below image, transitioning to black */}
      <div 
        className="w-full"
        style={{
          height: "118px",
          background: "linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 1) 100%)",
        }}
      />

      {/* Registration Form Card */}
      <div className="relative px-4 pb-8 -mt-32" style={{ backgroundColor: "rgba(7, 7, 7, 1)" }}>
        <div 
          className="bg-white rounded-t-3xl rounded-b-2xl shadow-2xl p-6 md:p-8 max-w-md mx-auto"
          style={{
            paddingTop: "24px",
            paddingBottom: "24px",
            borderWidth: "1px",
            borderColor: "rgba(0, 0, 0, 1)",
            fontSize: "8px",
            lineHeight: "21px",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name Field */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700" style={{ fontWeight: 800 }}>
                نام و نام خانوادگی
              </Label>
              <Input
                type="text"
                name="full_name"
                placeholder="نام و نام خانوادگی"
                value={formData.full_name}
                onChange={handleChange}
                disabled={loading}
                className="h-12 text-right border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                required
              />
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700" style={{ fontSize: "16px" }}>
                شماره موبایل (اعداد به انگلیسی وارد شود)
              </Label>
              <Input
                type="tel"
                name="phone"
                placeholder="09XXXXXXXXX"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
                maxLength={11}
                className="h-12 text-right text-[13px] dir-ltr border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                dir="ltr"
                required
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg text-base"
            >
              {loading ? "در حال ثبت‌نام..." : "ثبت نام"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
