import { Moon, Sun, Menu, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { SearchBox } from '@/components/header/SearchBox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout, clearSession } from '@/lib/utils/auth';

interface AdminHeaderProps {
  sidebarCollapsed?: boolean;
}

export function AdminHeader({ sidebarCollapsed }: AdminHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  return (
    <header
      className={cn(
        'fixed top-0 left-0 h-16 bg-background/80 backdrop-blur-xl border-b border-border z-40 transition-all duration-300 flex items-center justify-between px-4 sm:px-6',
        sidebarCollapsed ? 'right-20' : 'right-64'
      )}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Button variant="ghost" size="icon" className="lg:hidden flex-shrink-0">
          <Menu className="w-5 h-5" />
        </Button>

        {/* Search Box */}
        <div className="flex-1 max-w-md min-w-0">
          <SearchBox />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="relative overflow-hidden"
          title={theme === 'dark' ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'}
        >
          <Sun
            className={cn(
              'w-5 h-5 transition-all duration-300',
              theme === 'dark' ? 'rotate-90 scale-0' : 'rotate-0 scale-100'
            )}
          />
          <Moon
            className={cn(
              'w-5 h-5 absolute transition-all duration-300',
              theme === 'dark' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'
            )}
          />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{currentUser?.name || 'مدیر سیستم'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {currentUser?.email || 'admin@example.com'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/admins')}>
              <User className="w-4 h-4 ml-2" />
              پروفایل
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={async () => {
                if (confirm('آیا از خروج اطمینان دارید؟')) {
                  await logout();
                  clearSession();
                  navigate('/login', { replace: true });
                }
              }}
            >
              <LogOut className="w-4 h-4 ml-2" />
              خروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
