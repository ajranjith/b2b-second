import crypto from "crypto";
import { readClient, writeClient } from "../db";

export type NewsArticleRow = {
  id: string;
  type: string;
  title: string;
  bodyMd: string | null;
  isPublished: boolean;
  publishedAt: Date | null;
  startsAt: Date | null;
  endsAt: Date | null;
  isArchived: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NewsAttachmentRow = {
  id: string;
  articleId: string;
  fileName: string;
  blobPath: string;
  mimeType: string | null;
};

export async function fetchNewsArticles() {
  const result = await readClient.query<NewsArticleRow>(
    `
      SELECT
        id,
        type,
        title,
        "bodyMd",
        "isPublished",
        "publishedAt",
        "startsAt",
        "endsAt",
        "isArchived",
        "archivedAt",
        "createdAt",
        "updatedAt"
      FROM "NewsArticle"
      ORDER BY "createdAt" DESC;
    `,
  );

  const articles = result.rows;
  if (articles.length === 0) {
    return [];
  }

  const ids = articles.map((article) => article.id);
  const attachmentsResult = await readClient.query<NewsAttachmentRow>(
    `
      SELECT
        id,
        "articleId",
        "fileName",
        "blobPath",
        "mimeType"
      FROM "NewsAttachment"
      WHERE "articleId" = ANY($1::text[])
      ORDER BY "uploadedAt" DESC;
    `,
    [ids],
  );

  const attachmentsByArticle = new Map<string, NewsAttachmentRow[]>();
  attachmentsResult.rows.forEach((attachment) => {
    const list = attachmentsByArticle.get(attachment.articleId) ?? [];
    list.push(attachment);
    attachmentsByArticle.set(attachment.articleId, list);
  });

  return articles.map((article) => ({
    article,
    attachments: attachmentsByArticle.get(article.id) ?? [],
  }));
}

export async function fetchPublishedNews(limit = 10) {
  const result = await readClient.query<NewsArticleRow>(
    `
      SELECT
        id,
        type,
        title,
        "bodyMd",
        "isPublished",
        "publishedAt",
        "startsAt",
        "endsAt",
        "isArchived",
        "archivedAt",
        "createdAt",
        "updatedAt"
      FROM "NewsArticle"
      WHERE "isPublished" = true
        AND "isArchived" = false
        AND ("startsAt" IS NULL OR "startsAt" <= NOW())
        AND ("endsAt" IS NULL OR "endsAt" >= NOW())
      ORDER BY "publishedAt" DESC NULLS LAST, "createdAt" DESC
      LIMIT $1;
    `,
    [limit],
  );

  const articles = result.rows;
  if (articles.length === 0) {
    return [];
  }

  const ids = articles.map((article) => article.id);
  const attachmentsResult = await readClient.query<NewsAttachmentRow>(
    `
      SELECT
        id,
        "articleId",
        "fileName",
        "blobPath",
        "mimeType"
      FROM "NewsAttachment"
      WHERE "articleId" = ANY($1::text[])
      ORDER BY "uploadedAt" DESC;
    `,
    [ids],
  );

  const attachmentsByArticle = new Map<string, NewsAttachmentRow[]>();
  attachmentsResult.rows.forEach((attachment) => {
    const list = attachmentsByArticle.get(attachment.articleId) ?? [];
    list.push(attachment);
    attachmentsByArticle.set(attachment.articleId, list);
  });

  return articles.map((article) => ({
    article,
    attachments: attachmentsByArticle.get(article.id) ?? [],
  }));
}

export async function insertNewsArticle(payload: {
  type: string;
  title: string;
  bodyMd: string;
  startsAt: Date | null;
  endsAt: Date | null;
  isPublished: boolean;
  publishedAt: Date | null;
}) {
  const result = await writeClient.query<NewsArticleRow>(
    `
      INSERT INTO "NewsArticle" (
        id,
        type,
        title,
        "bodyMd",
        "startsAt",
        "endsAt",
        "isPublished",
        "publishedAt",
        "isArchived",
        "archivedAt",
        "createdAt",
        "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false,null,NOW(),NOW())
      RETURNING
        id,
        type,
        title,
        "bodyMd",
        "isPublished",
        "publishedAt",
        "startsAt",
        "endsAt",
        "isArchived",
        "archivedAt",
        "createdAt",
        "updatedAt";
    `,
    [
      crypto.randomUUID(),
      payload.type,
      payload.title,
      payload.bodyMd,
      payload.startsAt,
      payload.endsAt,
      payload.isPublished,
      payload.publishedAt,
    ],
  );

  return result.rows[0];
}

export async function updateNewsArticle(id: string, updates: Partial<NewsArticleRow>) {
  const setParts: string[] = [];
  const values: Array<string | Date | boolean | null> = [];

  Object.entries(updates).forEach(([key, value]) => {
    setParts.push(`"${key}" = $${values.length + 1}`);
    values.push(value as string | Date | boolean | null);
  });

  if (!setParts.length) {
    return null;
  }

  values.push(id);
  const result = await writeClient.query<NewsArticleRow>(
    `
      UPDATE "NewsArticle"
      SET ${setParts.join(", ")}, "updatedAt" = NOW()
      WHERE id = $${values.length}
      RETURNING
        id,
        type,
        title,
        "bodyMd",
        "isPublished",
        "publishedAt",
        "startsAt",
        "endsAt",
        "isArchived",
        "archivedAt",
        "createdAt",
        "updatedAt";
    `,
    values,
  );

  return result.rows[0] ?? null;
}

export async function fetchNewsAttachment(articleId: string, attachmentId: string) {
  const result = await readClient.query<NewsAttachmentRow>(
    `
      SELECT id, "articleId", "fileName", "blobPath", "mimeType"
      FROM "NewsAttachment"
      WHERE id = $1 AND "articleId" = $2
      LIMIT 1;
    `,
    [attachmentId, articleId],
  );

  return result.rows[0] ?? null;
}
