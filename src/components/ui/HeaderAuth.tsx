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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  LogOut, 
  Settings, 
  Bell,
  Shield,
  MessageSquare,
  Package,
  Check,
  X,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  FileText,
  UserCheck,
  Building
} from "lucide-react";
import { Logo } from "./Logo";
import { apiService, type LicenseStatus } from "@/services/api";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  priority: string;
  is_read: boolean;
  action_url?: string;
  action_text?: string;
  created_at: string;
}

const HeaderAuth = () => {
  const { user, isAuthenticated, logout, isLoading, licenseStatus: authLicenseStatus } = useAuth();
  const navigate = useNavigate();
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [hasVisitor, setHasVisitor] = useState(false);
  const [hasSupplier, setHasSupplier] = useState(false);

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
    if (isAuthenticated) {
      fetchNotifications();
      fetchUnreadCount();
      checkVisitorSupplierStatus();
    }
  }, [isAuthenticated, authLicenseStatus]);

  const checkVisitorSupplierStatus = async () => {
    if (!isAuthenticated) return;
    
    try {
      // Check visitor status
      try {
        const visitorStatus = await apiService.getMyVisitorStatus();
        setHasVisitor(visitorStatus.has_visitor || false);
      } catch (error) {
        setHasVisitor(false);
      }

      // Check supplier status
      try {
        const supplierStatus = await apiService.getSupplierStatus();
        setHasSupplier(supplierStatus.has_supplier || false);
      } catch (error) {
        setHasSupplier(false);
      }
    } catch (error) {
      console.error('Error checking visitor/supplier status:', error);
    }
  };

  // Fetch notifications every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const checkLicenseStatus = async () => {
    try {
      const status = await apiService.checkLicenseStatus();
      setLicenseStatus(status);
    } catch (error) {
      console.error('Error checking license status:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const response = await apiService.getNotifications({ page: 1, per_page: 10 });
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await apiService.getUnreadNotificationCount();
      setUnreadCount(response.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  if (isLoading) {
    return (
      <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/')}
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl sm:rounded-2xl flex items-center justify-center p-1">
                <Logo className="text-white" size={20} />
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
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/')}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center p-1">
                <Logo className="text-white" size={24} />
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
          <div 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl sm:rounded-2xl flex items-center justify-center p-1">
              <Logo className="text-white" size={20} />
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
            
            {/* My Products Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-xl hover:bg-muted transition-colors"
              onClick={() => navigate('/my-products')}
              title="محصولات من"
            >
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              <span className="hidden md:inline-block text-xs sm:text-sm text-muted-foreground">محصولات من</span>
            </Button>

            {/* Support Ticket Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-xl hover:bg-muted transition-colors"
              onClick={() => navigate('/support')}
              title="پشتیبانی"
            >
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              <span className="hidden md:inline-block text-xs sm:text-sm text-muted-foreground">پشتیبانی</span>
            </Button>

            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative hidden sm:flex">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 text-xs bg-orange-500 text-white rounded-full p-0 flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">نوتیفیکیشن‌ها</h3>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        همه را خوانده شده علامت‌گذاری کن
                      </Button>
                    )}
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="p-4 text-center text-muted-foreground">
                      در حال بارگذاری...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      هیچ نوتیفیکیشنی وجود ندارد
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-border hover:bg-muted/50 cursor-pointer ${
                          !notification.is_read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                        }`}
                        onClick={() => {
                          if (!notification.is_read) {
                            markNotificationAsRead(notification.id);
                          }
                          if (notification.action_url) {
                            navigate(notification.action_url);
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm text-foreground truncate">
                                {notification.title}
                              </h4>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getPriorityColor(notification.priority)}`}
                              >
                                {notification.priority}
                              </Badge>
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {new Date(notification.created_at).toLocaleDateString('fa-IR')}
                              </span>
                              {notification.action_text && (
                                <span className="text-xs text-blue-600 dark:text-blue-400">
                                  {notification.action_text}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-2 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => navigate('/notifications')}
                    >
                      مشاهده همه نوتیفیکیشن‌ها
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

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
                <DropdownMenuItem 
                  className="text-foreground hover:bg-muted rounded-xl cursor-pointer"
                  onClick={() => navigate('/edit-profile')}
                >
                  <User className="w-4 h-4 ml-2" />
                  ویرایش پروفایل
                </DropdownMenuItem>
                
                {/* Visitor Status */}
                {hasVisitor && (
                  <DropdownMenuItem 
                    className="text-foreground hover:bg-muted rounded-xl cursor-pointer"
                    onClick={() => navigate('/visitor-status')}
                  >
                    <UserCheck className="w-4 h-4 ml-2" />
                    وضعیت ویزیتور
                  </DropdownMenuItem>
                )}

                {/* Supplier Status */}
                {hasSupplier && (
                  <DropdownMenuItem 
                    className="text-foreground hover:bg-muted rounded-xl cursor-pointer"
                    onClick={() => navigate('/supplier-status')}
                  >
                    <Building className="w-4 h-4 ml-2" />
                    وضعیت تأمین‌کننده
                  </DropdownMenuItem>
                )}

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