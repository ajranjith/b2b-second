"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button, Card, CardContent, Input } from "@/ui";
import { DensityToggle } from "@/components/portal/DensityToggle";
import { useLoadingCursor } from "@/hooks/useLoadingCursor";

type NewsType =
  | "SPECIAL_PRICE_LIST"
  | "NEW_TO_RANGE"
  | "ACCESSORIES"
  | "DISPATCH_UPDATE"
  | "GENERAL";

interface NewsAttachment {
  id: string;
  fileName: string;
  mimeType: string;
}

interface NewsArticle {
  id: string;
  type: NewsType;
  title: string;
  bodyMd: string;
  startsAt?: string | null;
  endsAt?: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
  isArchived: boolean;
  attachments: NewsAttachment[];
}

export default function AdminNewsPage() {
  const [density, setDensity] = useState<"comfortable" | "dense">("comfortable");
  const [type, setType] = useState<NewsType>("GENERAL");
  const [title, setTitle] = useState("");
  const [bodyMd, setBodyMd] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [publishNow, setPublishNow] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-news", includeArchived],
    queryFn: async () => {
      const response = await api.get("/admin/news", {
        params: { includeArchived },
      });
      return response.data.news as NewsArticle[];
    },
  });

  useLoadingCursor(isLoading || isSubmitting);

  const handleAttachmentDownload = async (
    articleId: string,
    attachmentId: string,
    fileName: string,
  ) => {
    const response = await api.get(
      `/admin/news/${articleId}/attachments/${attachmentId}/download`,
      {
        responseType: "blob",
      },
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!title.trim()) {
      alert("Heading is required");
      return;
    }

    if (type === "SPECIAL_PRICE_LIST") {
      if (!startsAt || !endsAt) {
        alert("Start Date and End Date are required for Special Price List");
        return;
      }
      if (!file) {
        alert("CSV attachment is required for Special Price List");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (file) {
        // Use FormData for file uploads
        const formData = new FormData();
        formData.append("type", type);
        formData.append("title", title.trim());
        formData.append("bodyMd", bodyMd.trim());
        formData.append("publish", publishNow ? "true" : "false");
        if (startsAt) formData.append("startsAt", startsAt);
        if (endsAt) formData.append("endsAt", endsAt);
        formData.append("file", file);

        await api.post("/admin/news", formData);
      } else {
        // Use JSON for simple requests without files
        await api.post("/admin/news", {
          type,
          title: title.trim(),
          bodyMd: bodyMd.trim(),
          publish: publishNow ? "true" : "false",
          startsAt: startsAt || undefined,
          endsAt: endsAt || undefined,
        });
      }

      setTitle("");
      setBodyMd("");
      setStartsAt("");
      setEndsAt("");
      setFile(null);
      setPublishNow(false);
      await refetch();
      alert("News article saved.");
    } catch (error: any) {
      console.error("Failed to save news article:", error);
      alert(error.response?.data?.message || "Failed to save news article");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">News Articles</h1>
          <p className="text-slate-500 mt-1">
            Publish dealer updates, special price lists, and dispatch notices.
          </p>
        </div>
        <DensityToggle value={density} onChange={setDensity} />
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Article Type</label>
              <select
                className="w-full px-3 py-2 border border-slate-200 rounded-md"
                value={type}
                onChange={(event) => setType(event.target.value as NewsType)}
              >
                <option value="GENERAL">General</option>
                <option value="NEW_TO_RANGE">New to Range</option>
                <option value="ACCESSORIES">Accessories</option>
                <option value="DISPATCH_UPDATE">Dispatch Update</option>
                <option value="SPECIAL_PRICE_LIST">Special Price List</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Heading</label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Message / Body</label>
            <textarea
              value={bodyMd}
              onChange={(event) => setBodyMd(event.target.value)}
              className="w-full min-h-[120px] rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Start Date {type === "SPECIAL_PRICE_LIST" ? "(required)" : "(optional)"}
              </label>
              <Input
                type="date"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                End Date {type === "SPECIAL_PRICE_LIST" ? "(required)" : "(optional)"}
              </label>
              <Input
                type="date"
                value={endsAt}
                onChange={(event) => setEndsAt(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Attachment {type === "SPECIAL_PRICE_LIST" ? "(CSV required)" : "(optional, CSV/PDF)"}
            </label>
            <Input
              type="file"
              accept=".csv,.pdf"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
            {type === "SPECIAL_PRICE_LIST" ? (
              <a
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                href="/templates/special-price-list.csv"
              >
                Download CSV template
              </a>
            ) : null}
          </div>

          {type === "SPECIAL_PRICE_LIST" ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              Publishing a Special Price List will import prices and override tier pricing during
              the date window.
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={publishNow}
                onChange={(event) => setPublishNow(event.target.checked)}
              />
              Publish now
            </label>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Article"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Published Articles</h3>
            <label className="flex items-center gap-2 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(event) => setIncludeArchived(event.target.checked)}
              />
              Show archived
            </label>
          </div>

          {isLoading ? (
            <div className="text-sm text-slate-500">Loading news...</div>
          ) : data && data.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {data.map((article) => (
                <div key={article.id} className="py-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-900">{article.title}</div>
                    <span className="text-[11px] uppercase tracking-wide text-slate-500">
                      {article.type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {article.isPublished ? "Published" : "Draft"}
                    {article.startsAt
                      ? ` • ${new Date(article.startsAt).toLocaleDateString()}`
                      : ""}
                    {article.endsAt ? ` - ${new Date(article.endsAt).toLocaleDateString()}` : ""}
                    {article.isArchived ? " • Archived" : ""}
                  </div>
                  {article.attachments?.length ? (
                    <div className="mt-2 text-xs text-slate-600">
                      <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                        Attachments
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {article.attachments.map((file) => (
                          <Button
                            key={file.id}
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleAttachmentDownload(article.id, file.id, file.fileName)
                            }
                          >
                            Download {file.fileName}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500">No news articles yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
