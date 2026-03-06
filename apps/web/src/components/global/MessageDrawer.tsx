"use client";

import { useEffect, useRef } from "react";
import { X, Download, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Announcement, AnnouncementType } from "@/types/dealer";
import { cn } from "@/lib/utils";

interface MessageDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Announcement | null;
}

const typeConfig: Record<AnnouncementType, { color: string; bgColor: string }> = {
  info: {
    color: "text-blue-700",
    bgColor: "bg-blue-50",
  },
  promo: {
    color: "text-green-700",
    bgColor: "bg-green-50",
  },
  warning: {
    color: "text-amber-700",
    bgColor: "bg-amber-50",
  },
  urgent: {
    color: "text-red-700",
    bgColor: "bg-red-50",
  },
};

export function MessageDrawer({ isOpen, onClose, announcement }: MessageDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const drawer = drawerRef.current;
    if (!drawer) return;

    // Focus close button when drawer opens
    closeButtonRef.current?.focus();

    const focusableElements = drawer.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    drawer.addEventListener("keydown", handleTabKey);
    return () => drawer.removeEventListener("keydown", handleTabKey);
  }, [isOpen]);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!announcement) return null;

  const config = typeConfig[announcement.type];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          "fixed top-0 right-0 bottom-0 w-full md:w-[480px] bg-white shadow-xl z-50 transform transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Badge variant="outline" className={cn("mb-2", config.color, config.bgColor)}>
                {announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
              </Badge>
              <h2 id="drawer-title" className="text-2xl font-bold text-slate-900">
                {announcement.title}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {new Date(announcement.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="Close message drawer"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto h-[calc(100vh-140px)]">
          {/* Full Text */}
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
              {announcement.fullText || announcement.shortText}
            </p>
          </div>

          {/* Attachments */}
          {announcement.attachments && announcement.attachments.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Attachments ({announcement.attachments.length})
              </h3>
              <div className="space-y-2">
                {announcement.attachments.map((file) => (
                  <a
                    key={file.id}
                    href={file.url}
                    download
                    className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all group"
                  >
                    <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <Download className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Link Target */}
          {announcement.linkTarget && (
            <div className="mt-8">
              <Button asChild className="w-full">
                <a href={announcement.linkTarget} target="_blank" rel="noopener noreferrer">
                  Learn More
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
