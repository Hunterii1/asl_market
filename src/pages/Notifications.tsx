import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Bell, 
  Check, 
  CheckCircle, 
  Info, 
  AlertTriangle, 
  AlertCircle, 
  Clock,
  User,
  Calendar,
  MessageSquare
} from "lucide-react";
import { apiService } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import HeaderAuth from "@/components/ui/HeaderAuth";

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
  created_by: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

const Notifications = () => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params: any = { page: 1, per_page: 50 };
      if (filter === "unread") {
        params.unread_only = true;
      }
      
      const response = await apiService.getNotifications(params);
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "خطا",
        description: "خطا در دریافت نوتیفیکیشن‌ها",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      toast({
        title: "موفق",
        description: "نوتیفیکیشن به عنوان خوانده شده علامت‌گذاری شد",
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({
        title: "خطا",
        description: "خطا در علامت‌گذاری نوتیفیکیشن",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      toast({
        title: "موفق",
        description: "همه نوتیفیکیشن‌ها به عنوان خوانده شده علامت‌گذاری شدند",
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast({
        title: "خطا",
        description: "خطا در علامت‌گذاری همه نوتیفیکیشن‌ها",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
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

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'فوری';
      case 'high':
        return 'بالا';
      case 'normal':
        return 'متوسط';
      case 'low':
        return 'پایین';
      default:
        return 'متوسط';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'success':
        return 'موفقیت';
      case 'warning':
        return 'هشدار';
      case 'error':
        return 'خطا';
      case 'info':
      default:
        return 'اطلاعات';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === "unread") return !notification.is_read;
    if (filter === "read") return notification.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-4xl mx-auto pt-20">
          <Card>
            <CardContent className="p-6 text-center">
              <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">دسترسی محدود</h3>
              <p className="text-muted-foreground">برای مشاهده نوتیفیکیشن‌ها وارد حساب کاربری خود شوید.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <HeaderAuth />
      <div className="max-w-4xl mx-auto pt-20 p-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Bell className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">نوتیفیکیشن‌ها</h1>
              <p className="text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} نوتیفیکیشن خوانده نشده` : "همه نوتیفیکیشن‌ها خوانده شده"}
              </p>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              همه ({notifications.length})
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("unread")}
            >
              خوانده نشده ({unreadCount})
            </Button>
            <Button
              variant={filter === "read" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("read")}
            >
              خوانده شده ({notifications.length - unreadCount})
            </Button>
          </div>

          {/* Mark All Read Button */}
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="mb-4"
            >
              <Check className="w-4 h-4 mr-2" />
              همه را خوانده شده علامت‌گذاری کن
            </Button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Notifications List */}
        {!loading && (
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {filter === "unread" ? "نوتیفیکیشن خوانده نشده‌ای وجود ندارد" : 
                     filter === "read" ? "نوتیفیکیشن خوانده شده‌ای وجود ندارد" : 
                     "نوتیفیکیشنی وجود ندارد"}
                  </h3>
                  <p className="text-muted-foreground">
                    زمانی که نوتیفیکیشن جدیدی دریافت کنید، در اینجا نمایش داده می‌شود.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`transition-all duration-200 hover:shadow-lg ${
                    !notification.is_read ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground truncate">
                            {notification.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getPriorityColor(notification.priority)}`}
                          >
                            {getPriorityText(notification.priority)}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {getTypeText(notification.type)}
                          </Badge>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>

                        <p className="text-muted-foreground mb-3 leading-relaxed">
                          {notification.message}
                        </p>

                        {/* Footer */}
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>
                                {notification.created_by.first_name} {notification.created_by.last_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(notification.created_at).toLocaleDateString('fa-IR')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {notification.action_text && notification.action_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(notification.action_url, '_blank')}
                              >
                                {notification.action_text}
                              </Button>
                            )}
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                خوانده شده
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
