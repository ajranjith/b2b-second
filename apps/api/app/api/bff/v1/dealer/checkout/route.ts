import type { NextRequest } from "next/server";

import { ZodError } from "zod";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { DealerCheckoutRequestSchema } from "@repo/lib";
import { checkoutDealerCart } from "@/services/checkoutService";

export async function POST(request: NextRequest) {
  const auth = requireRole(request, "DEALER");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  const accountId = auth.user?.dealerAccountId;
  const dealerUserId = auth.user?.dealerUserId;
  if (!accountId || !dealerUserId) {
    return fail({ message: "Dealer context missing" }, 400);
  }

  try {
    const payload = DealerCheckoutRequestSchema.parse(await request.json());
    const result = await checkoutDealerCart(accountId, dealerUserId, payload);
    return ok(result);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return fail({ message: error.message, details: error.issues }, 400);
    }
    if (error instanceof Error) {
      return fail({ message: error.message }, 400);
    }
    throw error;
  }
}
