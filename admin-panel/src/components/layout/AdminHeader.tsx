import { Moon, Sun, Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { SearchBox } from '@/components/header/SearchBox';
import { useNavigate } from 'react-router-dom';
import { logout, clearSession } from '@/lib/utils/auth';

interface AdminHeaderProps {
  onMenuClick?: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header
      className={cn(
        'fixed top-0 left-0 h-16 bg-background/80 backdrop-blur-xl border-b border-border z-40 transition-all duration-300 flex items-center justify-between px-3 md:px-6',
        'right-0 md:right-64'
      )}
    >
      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden flex-shrink-0"
          onClick={onMenuClick}
        >
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
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={async () => {
            if (confirm('آیا از خروج اطمینان دارید؟')) {
              await logout();
              clearSession();
              navigate('/login', { replace: true });
            }
          }}
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
