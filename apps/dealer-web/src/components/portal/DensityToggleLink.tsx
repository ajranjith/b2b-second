"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DensityToggle } from "@/components/portal/DensityToggle";

export function DensityToggleLink() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("density") === "dense" ? "dense" : "comfortable";

  const handleChange = (value: "comfortable" | "dense") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("density", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return <DensityToggle value={current} onChange={handleChange} />;
}
