'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { AnnouncementTicker } from '@/components/portal/AnnouncementTicker';
import { MessageDrawer } from '@/components/portal/MessageDrawer';
import { AdminHeaderBar } from '@/components/portal/AdminHeaderBar';
import { AdminSideNav } from '@/components/portal/AdminSideNav';
import { AdminBottomNav } from '@/components/portal/AdminBottomNav';
import { fetchAnnouncements } from '@/lib/services/dealerApi';
import { type Announcement } from '@/lib/mock/dealerData';
import { useLoadingCursor } from '@/hooks/useLoadingCursor';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useLoadingCursor(loading);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  useEffect(() => {
    fetchAnnouncements().then((data) => {
      setAnnouncements(data);
      setLoading(false);
    });
  }, []);

  const handleOpenMessage = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setDrawerOpen(true);
  };

  const drawerProps = useMemo(
    () => ({
      open: drawerOpen,
      announcement: selectedAnnouncement,
      onClose: () => setDrawerOpen(false),
    }),
    [drawerOpen, selectedAnnouncement]
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeaderBar />
      <AnnouncementTicker announcements={announcements} onOpenMessage={handleOpenMessage} />
      <div className="max-w-7xl mx-auto px-6 py-8 pb-24 lg:pb-8">
        <div className="flex gap-6">
          <AdminSideNav />
          <main className="flex-1 max-w-[1280px] space-y-6">{children}</main>
        </div>
      </div>
      <AdminBottomNav />
      <MessageDrawer {...drawerProps} />
    </div>
  );
}
