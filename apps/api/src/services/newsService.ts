import { AdminNewsCreateSchema, AdminNewsResponseSchema, AdminNewsMutationResponseSchema, DealerNewsResponseSchema } from "@repo/lib";
import {
  fetchNewsArticles,
  fetchPublishedNews,
  fetchNewsAttachment,
  insertNewsArticle,
  updateNewsArticle,
  type NewsArticleRow,
  type NewsAttachmentRow,
} from "../repositories/newsRepo";

const toIsoString = (value: Date | null) => (value ? value.toISOString() : null);

const mapArticle = (article: NewsArticleRow, attachments: NewsAttachmentRow[]) => ({
  id: article.id,
  type: article.type,
  title: article.title,
  bodyMd: article.bodyMd,
  startsAt: toIsoString(article.startsAt),
  endsAt: toIsoString(article.endsAt),
  isPublished: article.isPublished,
  publishedAt: toIsoString(article.publishedAt),
  isArchived: article.isArchived,
  archivedAt: toIsoString(article.archivedAt),
  attachments: attachments.map((attachment) => ({
    id: attachment.id,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
  })),
});

export async function listAdminNews() {
  const rows = await fetchNewsArticles();
  const news = rows.map(({ article, attachments }) => mapArticle(article, attachments));
  return AdminNewsResponseSchema.parse({ news });
}

export async function createNews(payload: Parameters<typeof AdminNewsCreateSchema.parse>[0]) {
  const parsed = AdminNewsCreateSchema.parse(payload);
  const startsAt = parsed.startsAt ? new Date(parsed.startsAt) : null;
  const endsAt = parsed.endsAt ? new Date(parsed.endsAt) : null;

  const record = await insertNewsArticle({
    type: parsed.type,
    title: parsed.title,
    bodyMd: parsed.bodyMd ?? "",
    startsAt,
    endsAt,
    isPublished: parsed.publish ?? false,
    publishedAt: parsed.publish ? new Date() : null,
  });

  const article = mapArticle(record, []);
  return AdminNewsMutationResponseSchema.parse({ article });
}

export async function publishNews(id: string) {
  const record = await updateNewsArticle(id, { isPublished: true, publishedAt: new Date(), isArchived: false });
  if (!record) {
    return null;
  }

  return AdminNewsMutationResponseSchema.parse({ article: mapArticle(record, []) });
}

export async function archiveNews(id: string) {
  const record = await updateNewsArticle(id, { isArchived: true, archivedAt: new Date() });
  if (!record) {
    return null;
  }

  return AdminNewsMutationResponseSchema.parse({ article: mapArticle(record, []) });
}

export async function listDealerNews(limit = 6) {
  const rows = await fetchPublishedNews(limit);
  const news = rows.map(({ article, attachments }) => ({
    id: article.id,
    type: article.type,
    title: article.title,
    bodyMd: article.bodyMd,
    startsAt: toIsoString(article.startsAt),
    endsAt: toIsoString(article.endsAt),
    publishedAt: toIsoString(article.publishedAt),
    attachments: attachments.map((attachment) => ({
      id: attachment.id,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
    })),
  }));

  return DealerNewsResponseSchema.parse({ news });
}

export async function getNewsAttachment(articleId: string, attachmentId: string) {
  const attachment = await fetchNewsAttachment(articleId, attachmentId);
  if (!attachment) {
    return null;
  }

  return {
    downloadUrl: attachment.blobPath,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
  };
}
