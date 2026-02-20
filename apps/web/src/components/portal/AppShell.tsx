'use client';

import { useEffect, useState } from 'react';
import { AnnouncementTicker } from '@/components/portal/AnnouncementTicker';
import { MessageDrawer } from '@/components/portal/MessageDrawer';
import { DealerHeaderBar } from '@/components/portal/DealerHeaderBar';
import { SideNav } from '@/components/portal/SideNav';
import { BottomNav } from '@/components/portal/BottomNav';
import { fetchAnnouncements } from '@/lib/services/dealerApi';
import { type Announcement } from '@/types/portal';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetchAnnouncements().then(setAnnouncements);
  }, []);

  const handleOpenMessage = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <DealerHeaderBar />
      <AnnouncementTicker announcements={announcements} onOpenMessage={handleOpenMessage} />
      <div className="max-w-7xl mx-auto px-6 py-8 pb-24 lg:pb-8">
        <div className="flex gap-6">
          <SideNav />
          <main className="flex-1 max-w-[1280px] space-y-6">{children}</main>
        </div>
      </div>
      <BottomNav />
      <MessageDrawer
        open={drawerOpen}
        announcement={selectedAnnouncement}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
