"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Card, CardContent, Button } from "@repo/ui";
import { deleteBanner, uploadBanner } from "@/lib/services/bannerApi";

type BannerItem = {
  name: string;
  url: string;
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const loadBanners = async () => {
    const response = await api.get("/admin/banners");
    setBanners(response.data?.banners || []);
  };

  useEffect(() => {
    loadBanners().catch(() => {
      toast.error("Failed to load banners.");
    });
  }, []);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      await uploadBanner(file);
      toast.success("Banner uploaded.");
      await loadBanners();
      window.dispatchEvent(new Event("banners:updated"));
    } catch {
      toast.error("Banner upload failed.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm("Remove this banner image?")) return;
    try {
      setIsDeleting(name);
      await deleteBanner(name);
      toast.success("Banner deleted.");
      await loadBanners();
      window.dispatchEvent(new Event("banners:updated"));
    } catch {
      toast.error("Failed to delete banner.");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Banner Manager</h2>
        <p className="text-slate-600 mt-1">
          Upload or remove banner images. Updates show in both admin and dealer headers.
        </p>
      </div>

      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Upload Banner</h3>
              <p className="text-sm text-slate-600">Supported formats: JPG, PNG, WEBP, SVG.</p>
            </div>
            <label className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer">
              <UploadCloud className="h-4 w-4" />
              {isUploading ? "Uploading..." : "Add Banner"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleUpload}
                disabled={isUploading}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Current Banners</h3>
          {banners.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
              No banners uploaded yet. Upload a banner to start the rotation.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map((banner) => (
                <div
                  key={banner.name}
                  className="rounded-md border border-slate-200 bg-slate-50 p-3 flex items-center gap-3"
                >
                  <div className="relative h-16 w-40 overflow-hidden rounded-md border border-slate-200 bg-white">
                    <Image
                      src={banner.url}
                      alt={banner.name}
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">{banner.name}</div>
                    <div className="text-xs text-slate-500">{banner.url}</div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(banner.name)}
                    disabled={isDeleting === banner.name}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
