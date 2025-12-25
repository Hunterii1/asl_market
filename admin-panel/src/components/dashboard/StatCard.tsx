import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: 'primary' | 'success' | 'warning' | 'info' | 'destructive';
}

const iconColorClasses = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
  destructive: 'bg-destructive/10 text-destructive',
};

export function StatCard({
  title,
  value,
  change,
  changeLabel = 'از ماه گذشته',
  icon: Icon,
  iconColor = 'primary',
}: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card hover:shadow-xl transition-all duration-300 group animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value.toLocaleString('fa-IR')}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5 text-sm">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-success" />
              ) : isNegative ? (
                <TrendingDown className="w-4 h-4 text-destructive" />
              ) : null}
              <span
                className={cn(
                  'font-medium',
                  isPositive && 'text-success',
                  isNegative && 'text-destructive',
                  !isPositive && !isNegative && 'text-muted-foreground'
                )}
              >
                {isPositive && '+'}
                {change}%
              </span>
              <span className="text-muted-foreground">{changeLabel}</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
            iconColorClasses[iconColor]
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
