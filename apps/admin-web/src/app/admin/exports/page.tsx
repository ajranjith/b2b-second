"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { AdminExportButtons } from "@/components/admin/AdminExportButtons";

export default function AdminExportsPage() {
  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Exports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Download order and backorder exports for reporting and reconciliation.
          </p>
          <AdminExportButtons />
        </CardContent>
      </Card>
    </div>
  );
}
