"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { removeAuthToken } from "@/lib/auth";

export default function AdminLogoutPage() {
  const router = useRouter();

  useEffect(() => {
    removeAuthToken();
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
      Logging out...
    </div>
  );
}
