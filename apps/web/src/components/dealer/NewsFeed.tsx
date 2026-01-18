import { formatDistanceToNow } from 'date-fns';
import { Newspaper, Package, Bell } from 'lucide-react';
import type { NewsItem } from '@/types/dealer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface NewsFeedProps {
  news: NewsItem[];
  onNewsClick?: (newsItem: NewsItem) => void;
  className?: string;
}

const categoryConfig = {
  product: {
    icon: Package,
    label: 'Product',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  service: {
    icon: Bell,
    label: 'Service',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  general: {
    icon: Newspaper,
    label: 'General',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
  },
};

/**
 * News Feed Component
 *
 * Displays latest news and updates as a card list:
 * - Category icon and badge
 * - Title
 * - Summary
 * - Published date
 * - Click to expand (optional)
 */
export function NewsFeed({ news, onNewsClick, className }: NewsFeedProps) {
  if (news.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>News & Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No news available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>News & Updates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {news.map((item) => {
          const config = categoryConfig[item.category];
          const Icon = config.icon;

          return (
            <div
              key={item.id}
              className={cn(
                'p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors',
                onNewsClick && 'cursor-pointer'
              )}
              onClick={() => onNewsClick?.(item)}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={cn('p-2 rounded-lg flex-shrink-0', config.bgColor)}>
                  <Icon className={cn('w-5 h-5', config.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge
                      variant="outline"
                      className={cn('text-xs', config.color)}
                    >
                      {config.label}
                    </Badge>
                    <span className="text-xs text-slate-500 flex-shrink-0">
                      {formatDistanceToNow(new Date(item.publishedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1">
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-600 line-clamp-2">
                    {item.summary}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/**
 * Loading Skeleton for News Feed
 */
export function NewsFeedSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 rounded-lg border border-slate-200">
            <div className="flex items-start gap-3">
              <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
