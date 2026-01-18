'use client';

import { AppShell } from '@/components/portal/AppShell';
import { DealerCartProvider } from '@/context/DealerCartContext';

export default function DealerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DealerCartProvider>
      <AppShell>{children}</AppShell>
    </DealerCartProvider>
  );
}
