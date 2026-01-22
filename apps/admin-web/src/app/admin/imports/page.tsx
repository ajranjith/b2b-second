"use client";

import { ImportModernView } from "@/components/admin/ImportModernView";
import { useImportProcessor } from "@/hooks/useImportProcessor";

export default function ImportsPage() {
  const importProps = useImportProcessor();
  return <ImportModernView {...importProps} />;
}
