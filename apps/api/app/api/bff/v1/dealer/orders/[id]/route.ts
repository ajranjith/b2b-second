import type { NextRequest } from "next/server";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { getDealerOrderById } from "@/services/dealerOrdersService";
import { withEnvelope } from "@/lib/withEnvelope";

type RouteContext = { params: Promise<{ id: string }> };

async function handleGET(request: NextRequest, context: RouteContext) {
  const auth = requireRole(request, "DEALER");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  const accountId = auth.user?.dealerAccountId;
  if (!accountId) {
    return fail({ message: "Dealer account missing" }, 400);
  }

  const { id } = await context.params;
  const order = await getDealerOrderById(id, accountId);

  if (!order) {
    return fail({ message: "Order not found" }, 404);
  }

  return ok(order);
}

export const GET = withEnvelope({ namespace: "D" }, handleGET);
