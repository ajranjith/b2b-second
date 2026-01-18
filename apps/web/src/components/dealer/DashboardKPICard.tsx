import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

/**
 * Dashboard KPI Card Component
 *
 * Displays key performance indicators with:
 * - Icon with colored background
 * - Primary value (large)
 * - Subtitle (smaller)
 * - Optional action button
 * - Optional trend indicator
 */
export function DashboardKPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-100',
  action,
  trend,
  className,
}: DashboardKPICardProps) {
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">
          {title}
        </CardTitle>
        <div className={cn('p-2 rounded-lg', iconBgColor)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Main Value */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{value}</span>
            {trend && (
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value}%
              </span>
            )}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-sm text-slate-500">{subtitle}</p>
          )}

          {/* Action Button */}
          {action && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading Skeleton for KPI Card
 */
export function DashboardKPICardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}
