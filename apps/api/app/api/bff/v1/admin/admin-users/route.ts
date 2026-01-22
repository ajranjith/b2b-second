import type { NextRequest } from "next/server";

import { cacheLife, cacheTag } from "next/cache";
import { ZodError } from "zod";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { AdminUserCreateSchema, type AdminUserCreateDTO } from "@repo/lib";
import { createAdminUser, listAdminUsers } from "@/services/adminUsersService";
import { withEnvelope } from "@/lib/withEnvelope";

async function handleGET(request: NextRequest) {
  cacheTag("admin-users");
  cacheLife("short");

  const auth = requireRole(request, "ADMIN");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  const data = await listAdminUsers();
  return ok(data);
}

async function handlePOST(request: NextRequest) {
  const auth = requireRole(request, "ADMIN");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  try {
    const body = (await request.json()) as AdminUserCreateDTO;
    const payload = AdminUserCreateSchema.parse(body);
    const user = await createAdminUser(payload);
    return ok({ user });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return fail({ message: error.message, details: error.issues }, 400);
    }
    throw error;
  }
}

export const GET = withEnvelope({ namespace: "A" }, handleGET);
export const POST = withEnvelope({ namespace: "A" }, handlePOST);
