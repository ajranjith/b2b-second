import api from "@/lib/api";

export type BannerSlide = {
  src: string;
  alt: string;
};

const normalizeSlides = (items: Array<{ url: string; name?: string }>) =>
  items.map((item) => ({
    src: item.url,
    alt: item.name || "Hotbray banner",
  }));

export const fetchAdminBanners = async (): Promise<BannerSlide[]> => {
  const response = await api.get("/admin/banners");
  return normalizeSlides(response.data?.banners || []);
};

export const fetchDealerBanners = async (): Promise<BannerSlide[]> => {
  const response = await api.get("/dealer/banners");
  return normalizeSlides(response.data?.banners || []);
};

export const uploadBanner = async (file: File): Promise<void> => {
  const formData = new FormData();
  formData.append("file", file);
  await api.post("/admin/banners", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteBanner = async (fileName: string): Promise<void> => {
  await api.delete(`/admin/banners/${encodeURIComponent(fileName)}`);
};
