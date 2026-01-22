import type { NextRequest } from "next/server";

import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import { ZodError } from "zod";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { AdminNewsCreateSchema } from "@repo/lib";
import { createNews, listAdminNews } from "@/services/newsService";
import { withEnvelope } from "@/lib/withEnvelope";

async function handleGET(request: NextRequest) {
  cacheTag("dealer-news");
  cacheLife("short");

  const auth = requireRole(request, "ADMIN");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  const data = await listAdminNews();
  return ok(data);
}

async function handlePOST(request: NextRequest) {
  const auth = requireRole(request, "ADMIN");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  try {
    const payload = AdminNewsCreateSchema.parse(await request.json());
    const result = await createNews(payload);
    revalidateTag("dealer-news", "max");
    return ok(result);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return fail({ message: error.message, details: error.issues }, 400);
    }
    throw error;
  }
}

export const GET = withEnvelope({ namespace: "A" }, handleGET);
export const POST = withEnvelope({ namespace: "A" }, handlePOST);
