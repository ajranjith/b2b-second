import type { NextRequest } from "next/server";

import { ZodError } from "zod";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { DealerCartUpdateItemSchema } from "@repo/lib";
import { updateDealerCartItem, removeCartItemForDealer } from "@/services/cartService";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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
    const payload = DealerCartUpdateItemSchema.parse(await request.json());
    const cart = await updateDealerCartItem(accountId, dealerUserId, params.id, payload.qty);
    return ok(cart);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return fail({ message: error.message, details: error.issues }, 400);
    }
    throw error;
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = requireRole(request, "DEALER");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  const accountId = auth.user?.dealerAccountId;
  const dealerUserId = auth.user?.dealerUserId;
  if (!accountId || !dealerUserId) {
    return fail({ message: "Dealer context missing" }, 400);
  }

  const cart = await removeCartItemForDealer(accountId, dealerUserId, params.id);
  return ok(cart);
}
