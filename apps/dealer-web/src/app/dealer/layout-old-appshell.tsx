"use client";

import { DealerCartProvider } from "@/context/DealerCartContext";
import { AppShell } from "@/components/portal/AppShell";

export default function DealerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DealerCartProvider>
      <AppShell>{children}</AppShell>
    </DealerCartProvider>
  );
}
