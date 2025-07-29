import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Globe
} from "lucide-react";

const HeaderAuth = () => {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">اصل مارکت</h1>
                <p className="text-xs text-muted-foreground">سیستم هوشمند فروش بین‌المللی</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
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
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">اصل مارکت</h1>
                <p className="text-xs text-muted-foreground">سیستم هوشمند فروش بین‌المللی</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/login")}
                className="border-border text-foreground hover:bg-muted rounded-2xl"
              >
                ورود
              </Button>
              <Button 
                size="sm" 
                onClick={() => navigate("/signup")}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl"
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
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">اصل مارکت</h1>
              <p className="text-xs text-muted-foreground">سیستم هوشمند فروش بین‌المللی</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs bg-orange-500 text-white rounded-full p-0 flex items-center justify-center">
                3
              </Badge>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 p-2 rounded-2xl hover:bg-muted">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm font-bold">
                      {user ? getInitials(user.first_name, user.last_name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-right hidden md:block">
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
                <DropdownMenuLabel className="text-foreground">حساب کاربری</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem className="text-foreground hover:bg-muted rounded-xl cursor-pointer">
                  <User className="w-4 h-4 ml-2" />
                  پروفایل
                </DropdownMenuItem>
                <DropdownMenuItem className="text-foreground hover:bg-muted rounded-xl cursor-pointer">
                  <Settings className="w-4 h-4 ml-2" />
                  تنظیمات
                </DropdownMenuItem>
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