"use client";

import { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/ui";

export function AdminExportButtons() {
  const [isExportingOrders, setIsExportingOrders] = useState(false);
  const [isExportingBackorders, setIsExportingBackorders] = useState(false);

  const downloadFile = async (endpoint: string, filename: string) => {
    const response = await api.get(endpoint, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportOrders = async () => {
    setIsExportingOrders(true);
    try {
      await downloadFile("/admin/orders/export", `orders-export-${Date.now()}.csv`);
    } catch (err) {
      console.error("Failed to export orders:", err);
      alert("Failed to export orders. Please try again.");
    } finally {
      setIsExportingOrders(false);
    }
  };

  const handleExportBackorders = async () => {
    setIsExportingBackorders(true);
    try {
      await downloadFile("/admin/backorders/export", `backorders-export-${Date.now()}.csv`);
    } catch (err) {
      console.error("Failed to export backorders:", err);
      alert("Failed to export backorders. Please try again.");
    } finally {
      setIsExportingBackorders(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" onClick={handleExportOrders} disabled={isExportingOrders}>
        {isExportingOrders ? "Exporting Orders..." : "Export Orders"}
      </Button>
      <Button variant="outline" onClick={handleExportBackorders} disabled={isExportingBackorders}>
        {isExportingBackorders ? "Exporting Backorders..." : "Export Backorders"}
      </Button>
    </div>
  );
}
