"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button, Card, CardContent, Input } from "@repo/ui";
import { DensityToggle } from "@/components/portal/DensityToggle";
import { useLoadingCursor } from "@/hooks/useLoadingCursor";

type NewsType =
  | "SPECIAL_PRICE_LIST"
  | "NEW_TO_RANGE"
  | "ACCESSORIES"
  | "DISPATCH_UPDATE"
  | "GENERAL";

interface NewsArticle {
  id: string;
  type: NewsType;
  title: string;
  bodyMd: string;
  startsAt?: string | null;
  endsAt?: string | null;
  isPublished: boolean;
  isArchived: boolean;
}

export default function AdminNewsPage() {
  const [density, setDensity] = useState<"comfortable" | "dense">("comfortable");
  const [type, setType] = useState<NewsType>("GENERAL");
  const [title, setTitle] = useState("");
  const [bodyMd, setBodyMd] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [publishNow, setPublishNow] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-news", includeArchived],
    queryFn: async () => {
      const response = await api.get("/admin/news");
      return response.data.news as NewsArticle[];
    },
  });

  useLoadingCursor(isLoading || isSubmitting);

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert("Heading is required");
      return;
    }

    if (type === "SPECIAL_PRICE_LIST" && (!startsAt || !endsAt)) {
      alert("Start Date and End Date are required for Special Price List");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/admin/news", {
        type,
        title: title.trim(),
        bodyMd: bodyMd.trim(),
        publish: publishNow ? "true" : "false",
        startsAt: startsAt || undefined,
        endsAt: endsAt || undefined,
      });

      setTitle("");
      setBodyMd("");
      setStartsAt("");
      setEndsAt("");
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

  const handlePublish = async (articleId: string) => {
    setActionLoadingId(articleId);
    try {
      await api.post(`/admin/news/${articleId}/publish`);
      await refetch();
    } catch (error: any) {
      console.error("Publish failed:", error);
      alert(error.response?.data?.message || "Failed to publish article");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleArchive = async (articleId: string) => {
    setActionLoadingId(articleId);
    try {
      await api.post(`/admin/news/${articleId}/archive`);
      await refetch();
    } catch (error: any) {
      console.error("Archive failed:", error);
      alert(error.response?.data?.message || "Failed to archive article");
    } finally {
      setActionLoadingId(null);
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

          {type === "SPECIAL_PRICE_LIST" ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              Publishing a Special Price List will import prices and notify dealers.
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
                <div key={article.id} className="py-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{article.title}</div>
                      <div className="text-[11px] uppercase tracking-wide text-slate-500">
                        {article.type.replace(/_/g, " ")}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {article.isPublished ? "Published" : "Draft"}
                        {article.startsAt
                          ? ` – ${new Date(article.startsAt).toLocaleDateString()}`
                          : ""}
                        {article.endsAt ? ` / ${new Date(article.endsAt).toLocaleDateString()}` : ""}
                        {article.isArchived ? " / Archived" : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!article.isPublished && !article.isArchived && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePublish(article.id)}
                          disabled={!!actionLoadingId}
                        >
                          {actionLoadingId === article.id ? "Publishing..." : "Publish"}
                        </Button>
                      )}
                      {article.isPublished && !article.isArchived && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleArchive(article.id)}
                          disabled={!!actionLoadingId}
                        >
                          {actionLoadingId === article.id ? "Archiving..." : "Archive"}
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">{article.bodyMd || "No message"}</p>
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
