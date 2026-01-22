"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DealerLoginPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
      Redirecting to login...
    </div>
  );
}
