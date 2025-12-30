import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/utils/auth';
import { useSidebarStats } from '@/hooks/useSidebarStats';
import { canSeeSidebarItem } from '@/lib/utils/permissions';
import {
  LayoutDashboard,
  Users,
  Shield,
  BarChart3,
  Wallet,
  Key,
  MessageSquare,
  Truck,
  Package,
  Box,
  Eye,
  Megaphone,
  Bell,
  // FileSpreadsheet, // Commented out - Export page is not needed
  ChevronRight,
  ChevronLeft,
  LogOut,
} from 'lucide-react';

interface NavItem {
  title: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
  permissionKey?: string; // Key for permission checking (e.g., 'users', 'admins')
}

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AdminSidebar({ mobileOpen = false, onMobileClose }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const user = getCurrentUser();
  const { stats } = useSidebarStats();
  
  // Check if user is support admin (moderator role)
  const isSupportAdmin = user?.role === 'moderator' || user?.role === 'support_admin';
  
  // Get user permissions
  const userPermissions = user?.permissions || [];
  
  // Full admin navigation items with real stats and permission checks
  const allNavItems: NavItem[] = [
    { title: 'داشبورد', icon: LayoutDashboard, href: '/' }, // Always accessible
    { title: 'کاربران', icon: Users, href: '/users', badge: stats.users > 0 ? stats.users : undefined, permissionKey: 'users' },
    { title: 'مدیران', icon: Shield, href: '/admins', permissionKey: 'admins' },
    { title: 'آمار سیستم', icon: BarChart3, href: '/statistics', permissionKey: 'statistics' },
    { title: 'برداشت‌ها', icon: Wallet, href: '/withdrawals', badge: stats.withdrawals > 0 ? stats.withdrawals : undefined, permissionKey: 'withdrawals' },
    { title: 'لایسنس‌ها', icon: Key, href: '/licenses', permissionKey: 'licenses' },
    { title: 'تیکت‌ها', icon: MessageSquare, href: '/tickets', badge: stats.tickets > 0 ? stats.tickets : undefined, permissionKey: 'tickets' },
    { title: 'تامین‌کنندگان', icon: Truck, href: '/suppliers', permissionKey: 'suppliers' },
    { title: 'کالاهای موجود', icon: Package, href: '/products/available', permissionKey: 'products/available' },
    { title: 'محصولات تحقیقی', icon: Box, href: '/products/research', permissionKey: 'products/research' },
    { title: 'ویزیتورها', icon: Eye, href: '/visitors', permissionKey: 'visitors' },
    { title: 'پاپ‌آپ‌ها', icon: Megaphone, href: '/popups', permissionKey: 'popups' },
    { title: 'اعلان‌ها', icon: Bell, href: '/notifications', permissionKey: 'notifications' },
    // { title: 'خروجی اکسل', icon: FileSpreadsheet, href: '/export' },
  ];
  
  // Filter nav items based on permissions (only for non-support admins)
  const fullAdminNavItems: NavItem[] = allNavItems.filter(item => {
    // Dashboard is always accessible
    if (item.href === '/') return true;
    // If no permission key, allow access
    if (!item.permissionKey) return true;
    // Check permission
    return canSeeSidebarItem(userPermissions, item.permissionKey);
  });

  // Support admin navigation items (limited access - only tickets)
  const supportAdminNavItems: NavItem[] = [
    { title: 'تیکت‌های پشتیبانی', icon: MessageSquare, href: '/support/tickets', badge: stats.tickets > 0 ? stats.tickets : undefined },
  ];
  
  // Use appropriate nav items based on user role
  const navItems = isSupportAdmin ? supportAdminNavItems : fullAdminNavItems;

  // Close sidebar on mobile when clicking a link
  const handleLinkClick = () => {
    if (window.innerWidth < 768 && onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <aside
      className={cn(
        'fixed top-0 right-0 h-screen bg-sidebar border-l border-sidebar-border z-50 transition-all duration-300 flex flex-col',
        'md:flex',
        !mobileOpen && 'hidden',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-sidebar-border px-4">
        {collapsed ? (
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">A</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">A</span>
            </div>
            <div>
              <h1 className="font-bold text-sidebar-foreground">ASLL Market</h1>
              <p className="text-xs text-muted-foreground">پنل مدیریت</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )}
                >
                  <item.icon
                    className={cn(
                      'w-5 h-5 shrink-0 transition-colors',
                      isActive ? 'text-sidebar-primary' : 'text-muted-foreground group-hover:text-sidebar-foreground'
                    )}
                  />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {collapsed && item.badge && (
                    <span className="absolute top-1 left-1 w-2 h-2 rounded-full bg-primary" />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-sidebar-accent/50">
            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-medium">م</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">مدیر سیستم</p>
              <p className="text-xs text-muted-foreground truncate">admin@asllmarket.com</p>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'default'}
          className={cn(
            'w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10',
            collapsed ? 'justify-center' : 'justify-start'
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>خروج</span>}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full text-muted-foreground hover:text-sidebar-foreground"
        >
          {collapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </Button>
      </div>
    </aside>
  );
}
