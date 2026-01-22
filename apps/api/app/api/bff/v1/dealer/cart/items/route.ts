import type { NextRequest } from "next/server";

import { ZodError } from "zod";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { DealerCartAddItemSchema } from "@repo/lib";
import { addToDealerCart } from "@/services/cartService";
import { withEnvelope } from "@/lib/withEnvelope";

async function handlePOST(request: NextRequest) {
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
    const payload = DealerCartAddItemSchema.parse(await request.json());
    const cart = await addToDealerCart(accountId, dealerUserId, payload.productId, payload.qty);
    return ok(cart);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return fail({ message: error.message, details: error.issues }, 400);
    }
    throw error;
  }
}

export const POST = withEnvelope({ namespace: "D" }, handlePOST);
