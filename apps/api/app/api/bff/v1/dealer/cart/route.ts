import type { NextRequest } from "next/server";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { getDealerCart } from "@/services/cartService";

export async function GET(request: NextRequest) {
  const auth = requireRole(request, "DEALER");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  const accountId = auth.user?.dealerAccountId;
  const dealerUserId = auth.user?.dealerUserId;
  if (!accountId || !dealerUserId) {
    return fail({ message: "Dealer context missing" }, 400);
  }

  const cart = await getDealerCart(accountId, dealerUserId);
  return ok(cart);
}
