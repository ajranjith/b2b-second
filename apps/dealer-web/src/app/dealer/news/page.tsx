"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { getNewsArticles, type NewsArticle } from "@/lib/services/dealerApi";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@repo/ui";

export default function DealerNewsPage() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNewsArticles()
      .then(setNews)
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (articleId: string, attachmentId: string, fileName: string) => {
    const response = await api.get(
      `/dealer/news/${articleId}/attachments/${attachmentId}/download`,
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">News & Updates</h2>
        <p className="text-slate-600 mt-1">
          Latest announcements, pricing lists, and dispatch updates.
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-16 text-center text-slate-500">Loading news...</CardContent>
        </Card>
      ) : news.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-slate-500">
            No news articles available.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {news.map((article) => (
            <Card key={article.id} className="border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-lg">{article.title}</CardTitle>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    {article.type.replace(/_/g, " ")}
                  </span>
                </div>
                {article.startsAt || article.endsAt ? (
                  <div className="text-xs text-slate-500 mt-2">
                    {article.startsAt
                      ? `From ${new Date(article.startsAt).toLocaleDateString()}`
                      : "Live now"}
                    {article.endsAt ? ` to ${new Date(article.endsAt).toLocaleDateString()}` : ""}
                  </div>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">{article.bodyMd || "No message provided."}</p>
                {article.type === "SPECIAL_PRICE_LIST" ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                    Prices update automatically during this period.
                  </div>
                ) : null}
                {article.attachments?.length ? (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase">
                      Attachments
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {article.attachments.map((attachment) => (
                        <Button
                          key={attachment.id}
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDownload(article.id, attachment.id, attachment.fileName)
                          }
                        >
                          Download {attachment.fileName}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
