import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Eye, EyeOff } from "lucide-react";
import HeaderAuth from "@/components/ui/HeaderAuth";

const Login = () => {
  const [step, setStep] = useState(1); // 1: phone+pass, 2: otp
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [animateError, setAnimateError] = useState(false);
  const [otpFade, setOtpFade] = useState(false); // fade for OTP
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^09\d{9}$/.test(phone) || !password) {
      setError("لطفا شماره موبایل معتبر و رمز عبور را وارد کنید");
      setAnimateError(true);
      setTimeout(() => setAnimateError(false), 500);
      return;
    }
    setError("");
    setOtp("");
    setTimeout(() => setStep(2), 200); // slight delay for fade
    setOtpFade(true);
  };

  const handleOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 4) {
      setError("کد تایید ۴ رقمی را وارد کنید");
      setAnimateError(true);
      setTimeout(() => setAnimateError(false), 500);
      return;
    }
    setOtpFade(false); // start fade-out
    setTimeout(() => {
      localStorage.setItem("authUser", JSON.stringify({ phone }));
      navigate("/");
    }, 400); // match fade duration
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-orange-900 px-2 sm:px-0" dir="rtl">
      <HeaderAuth />
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="w-full max-w-md bg-white/90 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col items-center animate-fade-in">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-2">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">ورود به اصل مارکت</h1>
            <p className="text-sm text-gray-500 mt-1">سیستم هوشمند فروش بین‌المللی</p>
          </div>
          {step === 1 && (
            <form onSubmit={handleLogin} className="w-full">
              <div className="relative mb-4">
                <Input
                  type="tel"
                  placeholder="شماره موبایل (مثال: 09123456789)"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 text-right text-black placeholder-gray-700 pr-12"
                  inputMode="tel"
                  maxLength={11}
                  style={{color:'#111',fontWeight:600,fontSize:'1rem',background:'#fff'}}
                />
                {/* div خالی برای تراز با آیکون چشم */}
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" />
              </div>
              <div className="relative mb-4">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="رمز عبور"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 text-right text-black placeholder-gray-700 pr-12"
                  style={{color:'#111',fontWeight:600,fontSize:'1rem',background:'#fff'}}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-orange-500 focus:outline-none"
                  aria-label={showPassword ? "مخفی کردن رمز" : "نمایش رمز"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {error && (
                <div className={`text-red-500 mb-4 text-sm text-center font-medium transition-all duration-300 ${animateError ? 'animate-shake' : ''}`}>
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full h-12 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-lg rounded-xl shadow-lg transition-all">دریافت کد تایید</Button>
            </form>
          )}
          {step === 2 && (
            <form onSubmit={handleOtp} className={`w-full transition-opacity duration-400 ${otpFade ? 'animate-fade-in-otp' : 'animate-fade-out-otp'}`}>
              <div className="mb-4 text-center text-gray-700 text-base font-medium">کد تایید به شماره <span className="text-orange-600 font-bold">{phone}</span> ارسال شد.</div>
              <Input
                type="text"
                placeholder="کد تایید ۴ رقمی"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0,4))}
                className="mb-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 text-center tracking-widest text-lg text-black placeholder-gray-700"
                inputMode="numeric"
                maxLength={4}
                style={{color:'#111',fontWeight:700,fontSize:'1.2rem',letterSpacing:'0.3em',background:'#fff'}}
              />
              {error && (
                <div className={`text-red-500 mb-4 text-sm text-center font-medium transition-all duration-300 ${animateError ? 'animate-shake' : ''}`}>
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full h-12 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-lg rounded-xl shadow-lg transition-all">ورود</Button>
              <div className="mt-4 text-center text-sm text-gray-600">
                کد را دریافت نکردید؟ <button type="button" className="text-orange-600 hover:underline font-bold" onClick={()=>{setStep(1); setOtpFade(false);}}>ویرایش شماره</button>
              </div>
            </form>
          )}
          <div className="mt-6 text-center text-sm text-gray-600">
            حساب کاربری ندارید؟ <a href="/signup" className="text-orange-600 hover:underline font-bold">ثبت‌نام</a>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: none; }
        }
        .animate-fade-in {
          animation: fade-in 0.7s cubic-bezier(.4,0,.2,1);
        }
        @keyframes fade-in-otp {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-otp {
          animation: fade-in-otp 0.4s cubic-bezier(.4,0,.2,1);
        }
        @keyframes fade-out-otp {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        .animate-fade-out-otp {
          animation: fade-out-otp 0.4s cubic-bezier(.4,0,.2,1);
        }
        @keyframes shake {
          0% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
          100% { transform: translateX(0); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.4,0,.2,1);
        }
      `}</style>
    </div>
  );
};

export default Login; 