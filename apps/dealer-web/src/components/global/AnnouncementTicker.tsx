"use client";

import { useState, useEffect, useRef } from "react";
import { Info, Tag, AlertTriangle, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Announcement, AnnouncementType } from "@repo/lib";
import { Badge } from "@repo/ui";

interface AnnouncementTickerProps {
  announcements: Announcement[];
  onAnnouncementClick?: (announcement: Announcement) => void;
  className?: string;
  autoRotateInterval?: number; // in seconds
}

const typeConfig: Record<
  AnnouncementType,
  { icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }
> = {
  info: {
    icon: Info,
    color: "text-blue-700",
    bgColor: "bg-blue-50 hover:bg-blue-100",
  },
  promo: {
    icon: Tag,
    color: "text-green-700",
    bgColor: "bg-green-50 hover:bg-green-100",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-700",
    bgColor: "bg-amber-50 hover:bg-amber-100",
  },
  urgent: {
    icon: AlertCircle,
    color: "text-red-700",
    bgColor: "bg-red-50 hover:bg-red-100",
  },
};

/**
 * Announcement Ticker Component
 *
 * Auto-rotating ticker that displays announcements
 * - Rotates items every 8-10 seconds
 * - Pauses on hover/focus
 * - Click opens MessageDrawer with full message
 * - Shows type chip (info/promo/warning/urgent)
 */
export function AnnouncementTicker({
  announcements,
  onAnnouncementClick,
  className,
  autoRotateInterval = 8,
}: AnnouncementTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sort announcements by priority (0 = highest)
  const sortedAnnouncements = [...announcements].sort((a, b) => a.priority - b.priority);

  useEffect(() => {
    if (isPaused || sortedAnnouncements.length <= 1 || isDismissed) {
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sortedAnnouncements.length);
    }, autoRotateInterval * 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPaused, sortedAnnouncements.length, autoRotateInterval, isDismissed]);

  if (isDismissed || sortedAnnouncements.length === 0) {
    return null;
  }

  const currentAnnouncement = sortedAnnouncements[currentIndex];
  const config = typeConfig[currentAnnouncement.type];
  const Icon = config.icon;

  const handleClick = () => {
    if (onAnnouncementClick) {
      onAnnouncementClick(currentAnnouncement);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
  };

  return (
    <div
      className={cn(
        "h-full flex items-center px-4 transition-colors",
        config.bgColor,
        "cursor-pointer",
        className,
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Icon */}
        <Icon className={cn("w-5 h-5 flex-shrink-0", config.color)} />

        {/* Type Badge */}
        <Badge
          variant="outline"
          className={cn("text-xs font-medium capitalize flex-shrink-0", config.color)}
        >
          {currentAnnouncement.type}
        </Badge>

        {/* Title */}
        <span className={cn("font-medium text-sm", config.color)}>
          {currentAnnouncement.title}:
        </span>

        {/* Short Text */}
        <span className="text-sm text-slate-700 truncate flex-1">
          {currentAnnouncement.shortText}
        </span>

        {/* Pagination Dots (if multiple announcements) */}
        {sortedAnnouncements.length > 1 && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {sortedAnnouncements.map((_, idx) => (
              <button
                key={idx}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  idx === currentIndex ? "bg-slate-700 w-4" : "bg-slate-300 hover:bg-slate-400",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                aria-label={`Go to announcement ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className={cn(
            "flex-shrink-0 p-1 rounded hover:bg-slate-200 transition-colors",
            config.color,
          )}
          aria-label="Dismiss announcement"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Loading State for Ticker
 */
export function AnnouncementTickerSkeleton() {
  return (
    <div className="h-full flex items-center px-4 bg-slate-100 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-full max-w-md" />
    </div>
  );
}
