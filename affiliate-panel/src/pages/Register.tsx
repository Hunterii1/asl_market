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
            minHeight: "60vh",
            backgroundImage: `url('${getImageUrl("/uploads/videos/IMG_6747.JPG")}')`,
          }}
        />
      </div>

      {/* Black Gradient - below image, transitioning to black */}
      <div 
        className="w-full"
        style={{
          height: "200px",
          background: "linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 1) 100%)",
        }}
      />

      {/* Registration Form Card */}
      <div className="relative px-4 pb-8 -mt-32">
        <div className="bg-white rounded-t-3xl rounded-b-2xl shadow-2xl p-6 md:p-8 max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name Field */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
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
              <Label className="text-sm font-medium text-gray-700">
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
                className="h-12 text-left dir-ltr border-gray-300 focus:border-purple-500 focus:ring-purple-500"
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

            {/* eNAMAD Trust Seal */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex flex-col items-center justify-center space-y-2">
                {/* eNAMAD Logo */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-lg">e</span>
                  </div>
                  <span className="text-blue-500 font-semibold text-sm">eNAMAD.ir</span>
                </div>
                
                {/* Star Rating */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4].map((star) => (
                    <svg
                      key={star}
                      className="w-5 h-5 text-yellow-400 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.564-.955L10 0l2.947 5.955 6.564.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                  <svg
                    className="w-5 h-5 text-yellow-400 fill-current"
                    viewBox="0 0 20 20"
                  >
                    <defs>
                      <linearGradient id="half">
                        <stop offset="50%" stopColor="currentColor" />
                        <stop offset="50%" stopColor="transparent" stopOpacity="1" />
                      </linearGradient>
                    </defs>
                    <path
                      fill="url(#half)"
                      d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.564-.955L10 0l2.947 5.955 6.564.955-4.756 4.635 1.123 6.545z"
                    />
                  </svg>
                </div>

                {/* Trust Text */}
                <p className="text-xs text-gray-500 text-center">
                  جهت اطمینان کلیک نمایید
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
