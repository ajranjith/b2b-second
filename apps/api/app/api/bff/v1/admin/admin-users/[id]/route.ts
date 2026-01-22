import type { NextRequest } from "next/server";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { AdminUserUpdateSchema, type AdminUserUpdateDTO } from "@repo/lib";
import { updateAdminUser } from "@/services/adminUsersService";
import { ZodError } from "zod";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireRole(request, "ADMIN");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  try {
    const body = (await request.json()) as AdminUserUpdateDTO;
    const payload = AdminUserUpdateSchema.parse(body);
    const user = await updateAdminUser(params.id, payload);
    if (!user) {
      return fail({ message: "Admin user not found" }, 404);
    }

    return ok({ user });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return fail({ message: error.message, details: error.issues }, 400);
    }
    throw error;
  }
}
