'use client';

import { useCallback, useMemo, useState } from 'react';
import { type Announcement } from '@/lib/mock/dealerData';

type AnnouncementTickerProps = {
  announcements: Announcement[];
  onOpenMessage: (announcement: Announcement) => void;
};

export function AnnouncementTicker({ announcements, onOpenMessage }: AnnouncementTickerProps) {
  const [isPaused, setIsPaused] = useState(false);

  const items = useMemo(() => {
    if (announcements.length === 0) return [];
    return [...announcements, ...announcements];
  }, [announcements]);

  const handlePause = useCallback(() => setIsPaused(true), []);
  const handleResume = useCallback(() => setIsPaused(false), []);

  return (
    <div
      className="border-b border-slate-200 bg-white"
      role="region"
      aria-live="polite"
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
      onFocus={handlePause}
      onBlur={handleResume}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="overflow-hidden py-2">
          <div
            className="flex gap-6 min-w-max animate-ticker"
            style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
          >
            {items.map((announcement, index) => (
              <button
                key={`${announcement.id}-${index}`}
                type="button"
                className="text-sm font-medium text-slate-700 hover:text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 whitespace-nowrap"
                onClick={() => onOpenMessage(announcement)}
              >
                {announcement.title}
              </button>
            ))}
          </div>
        </div>
      </div>
      <style jsx>{`
        .animate-ticker {
          animation: ticker-scroll 28s linear infinite;
        }
        @keyframes ticker-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
