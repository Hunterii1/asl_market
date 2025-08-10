import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  LogOut, 
  Settings, 
  Bell,
  Shield
} from "lucide-react";
import { Logo } from "./Logo";
import { apiService, LicenseStatus } from "@/services/api";

const HeaderAuth = () => {
  const { user, isAuthenticated, logout, isLoading, licenseStatus: authLicenseStatus } = useAuth();
  const navigate = useNavigate();
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Use license status from auth context or fallback to local state
  const currentLicenseStatus = authLicenseStatus || licenseStatus;

  useEffect(() => {
    if (isAuthenticated && !authLicenseStatus) {
      checkLicenseStatus();
    }
  }, [isAuthenticated, authLicenseStatus]);

  const checkLicenseStatus = async () => {
    try {
      const status = await apiService.checkLicenseStatus();
      setLicenseStatus(status);
    } catch (error) {
      console.error('Error checking license status:', error);
    }
  };

  if (isLoading) {
    return (
      <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center p-1">
                <Logo className="" textColor="text-orange-400" size={20} />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-foreground">اصل مارکت</h1>
                <p className="text-xs text-muted-foreground">سیستم هوشمند فروش بین‌المللی</p>
              </div>
              <div className="block sm:hidden">
                <h1 className="text-lg font-bold text-foreground">اصل مارکت</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-muted rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  if (!isAuthenticated) {
    return (
      <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center p-1">
                <Logo className="" textColor="text-orange-400" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">اصل مارکت</h1>
                <p className="text-xs text-muted-foreground">سیستم هوشمند فروش بین‌المللی</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/login")}
                className="border-border text-foreground hover:bg-muted rounded-xl sm:rounded-2xl text-xs sm:text-sm px-2 sm:px-3"
              >
                ورود
              </Button>
              <Button 
                size="sm" 
                onClick={() => navigate("/signup")}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm px-2 sm:px-3"
              >
                ثبت‌نام
              </Button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center p-1">
              <Logo className="" textColor="text-orange-400" size={20} />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-bold text-foreground">اصل مارکت</h1>
              <p className="text-xs text-muted-foreground">سیستم هوشمند فروش بین‌المللی</p>
            </div>
            <div className="block sm:hidden">
              <h1 className="text-lg font-bold text-foreground">اصل مارکت</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* License Status */}
            {currentLicenseStatus && (
              <Badge 
                variant={currentLicenseStatus.is_approved ? "default" : (currentLicenseStatus.has_license ? "secondary" : "destructive")}
                className={`hidden sm:flex ${currentLicenseStatus.is_approved ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                onClick={currentLicenseStatus.is_approved ? () => navigate('/license-info') : undefined}
              >
                {currentLicenseStatus.is_approved ? "لایسنس فعال" : (currentLicenseStatus.has_license ? "در انتظار تأیید" : "بدون لایسنس")}
              </Badge>
            )}
            
            {/* Notifications - hidden on mobile when authenticated */}
            <Button variant="ghost" size="sm" className="relative hidden sm:flex">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              <Badge className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 text-xs bg-orange-500 text-white rounded-full p-0 flex items-center justify-center">
                3
              </Badge>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 sm:gap-3 p-1 sm:p-2 rounded-xl sm:rounded-2xl hover:bg-muted">
                  <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs sm:text-sm font-bold">
                      {user ? getInitials(user.first_name, user.last_name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-right hidden lg:block">
                    <p className="text-sm font-medium text-foreground">
                      {user ? `${user.first_name} ${user.last_name}` : "کاربر"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email || "user@example.com"}
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background border-border rounded-2xl">
                <DropdownMenuLabel className="text-foreground">
                  حساب کاربری
                  {currentLicenseStatus && (
                    <Badge 
                      variant={currentLicenseStatus.is_approved ? "default" : (currentLicenseStatus.has_license ? "secondary" : "destructive")}
                      className="mt-2 sm:hidden"
                    >
                      {currentLicenseStatus.is_approved ? "لایسنس فعال" : (currentLicenseStatus.has_license ? "در انتظار تأیید" : "بدون لایسنس")}
                    </Badge>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem className="text-foreground hover:bg-muted rounded-xl cursor-pointer">
                  <User className="w-4 h-4 ml-2" />
                  پروفایل
                </DropdownMenuItem>
                <DropdownMenuItem className="text-foreground hover:bg-muted rounded-xl cursor-pointer">
                  <Settings className="w-4 h-4 ml-2" />
                  تنظیمات
                </DropdownMenuItem>
                {currentLicenseStatus?.is_approved && (
                  <DropdownMenuItem 
                    className="text-foreground hover:bg-muted rounded-xl cursor-pointer"
                    onClick={() => navigate('/license-info')}
                  >
                    <Shield className="w-4 h-4 ml-2" />
                    اطلاعات لایسنس
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-red-400 hover:bg-red-500/10 rounded-xl cursor-pointer"
                >
                  <LogOut className="w-4 h-4 ml-2" />
                  خروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderAuth; 