import type { NextRequest } from "next/server";

import { ZodError } from "zod";

import { revalidateTag } from "next/cache";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import {
  DealerAccountResetPasswordSchema,
  type DealerAccountResetPasswordDTO,
} from "@repo/lib";
import { resetDealerAccountPassword } from "@/services/dealerAccountService";

export async function POST(request: NextRequest) {
  const auth = requireRole(request, "DEALER");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  const accountId = auth.user?.dealerAccountId;
  if (!accountId) {
    return fail({ message: "Dealer account context missing" }, 400);
  }

  try {
    const payload = DealerAccountResetPasswordSchema.parse(
      (await request.json()) as DealerAccountResetPasswordDTO,
    );

    const result = await resetDealerAccountPassword(accountId, payload);
    if (!result) {
      return fail({ message: "Dealer account not found" }, 404);
    }

    revalidateTag("dealer-account", "max");
    return ok({
      message: "Reset token generated",
      email: result.email,
      resetToken: result.resetToken,
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return fail({ message: error.message, details: error.issues }, 400);
    }
    throw error;
  }
}
