import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Mail,
  MessageSquare,
  Send,
  AlertCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  type: 'system' | 'email' | 'sms' | 'telegram' | 'push';
  status: 'sent' | 'pending' | 'failed' | 'draft';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  read?: boolean;
  actionUrl?: string;
}

const typeConfig = {
  system: { label: 'سیستمی', icon: Bell, className: 'bg-primary/10 text-primary' },
  email: { label: 'ایمیل', icon: Mail, className: 'bg-info/10 text-info' },
  sms: { label: 'پیامک', icon: MessageSquare, className: 'bg-success/10 text-success' },
  telegram: { label: 'تلگرام', icon: Send, className: 'bg-blue-500/10 text-blue-500' },
  push: { label: 'Push', icon: Bell, className: 'bg-warning/10 text-warning' },
};

const priorityConfig = {
  low: { className: 'bg-muted text-muted-foreground' },
  medium: { className: 'bg-info/10 text-info' },
  high: { className: 'bg-warning/10 text-warning' },
  urgent: { className: 'bg-destructive/10 text-destructive' },
};

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      loadNotifications();
    };
    
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(loadNotifications, 5000); // Check every 5 seconds
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const loadNotifications = () => {
    const stored = localStorage.getItem('asll-notifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Filter only sent notifications and sort by date
        const sentNotifications = parsed
          .filter((n: any) => n.status === 'sent')
          .sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt || a.sentAt || 0).getTime();
            const dateB = new Date(b.createdAt || b.sentAt || 0).getTime();
            return dateB - dateA;
          })
          .slice(0, 10) // Show only last 10
          .map((n: any) => ({
            id: n.id,
            title: n.title,
            content: n.content,
            type: n.type,
            status: n.status,
            priority: n.priority,
            createdAt: n.createdAt || n.sentAt || '',
            read: n.read !== false, // Default to unread if not specified
            actionUrl: n.actionUrl,
          }));
        
        setNotifications(sentNotifications);
        setUnreadCount(sentNotifications.filter((n: NotificationItem) => !n.read).length);
      } catch {
        setNotifications([]);
        setUnreadCount(0);
      }
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    handleMarkAsRead(notification.id);
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    } else {
      navigate('/notifications');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96 rounded-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <DropdownMenuLabel className="text-lg font-bold p-0">
            اعلان‌ها
            {unreadCount > 0 && (
              <Badge variant="secondary" className="mr-2">
                {unreadCount} خوانده نشده
              </Badge>
            )}
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              همه را خوانده شده علامت بزن
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">هیچ اعلانی وجود ندارد</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {notifications.map((notification) => {
                const TypeIcon = typeConfig[notification.type].icon;
                const isUnread = !notification.read;
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'rounded-lg p-3 cursor-pointer transition-colors hover:bg-muted/50',
                      isUnread && 'bg-primary/5 border border-primary/20'
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'rounded-full p-2',
                        typeConfig[notification.type].className
                      )}>
                        <TypeIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={cn(
                            'text-sm font-semibold line-clamp-1',
                            isUnread && 'font-bold'
                          )}>
                            {notification.title}
                          </h4>
                          {isUnread && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {notification.content}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={cn('text-xs', priorityConfig[notification.priority].className)}
                          >
                            {notification.priority === 'low' && 'پایین'}
                            {notification.priority === 'medium' && 'متوسط'}
                            {notification.priority === 'high' && 'بالا'}
                            {notification.priority === 'urgent' && 'فوری'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {notification.createdAt}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/notifications')}
              >
                مشاهده همه اعلان‌ها
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

