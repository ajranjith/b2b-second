import type { NextRequest } from "next/server";

import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import { ZodError } from "zod";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { DealerAccountUpdateSchema, type DealerAccountUpdateDTO } from "@repo/lib";
import { getDealerAccount, updateDealerAccount } from "@/services/dealerAccountService";
import { withEnvelope } from "@/lib/withEnvelope";

async function handleGET(request: NextRequest) {
  cacheTag("dealer-account");
  cacheLife("short");

  const auth = requireRole(request, "DEALER");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  const accountId = auth.user?.dealerAccountId ?? null;
  const data = await getDealerAccount(accountId);
  return ok(data);
}

async function handlePATCH(request: NextRequest) {
  const auth = requireRole(request, "DEALER");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  const accountId = auth.user?.dealerAccountId;
  if (!accountId) {
    return fail({ message: "Dealer account context missing" }, 400);
  }

  try {
    const payload = DealerAccountUpdateSchema.parse(
      (await request.json()) as DealerAccountUpdateDTO,
    );

    const data = await updateDealerAccount(accountId, payload);
    if (!data) {
      return fail({ message: "Dealer account not found" }, 404);
    }

    revalidateTag("dealer-account", "max");
    return ok(data);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return fail({ message: error.message, details: error.issues }, 400);
    }
    throw error;
  }
}

export const GET = withEnvelope({ namespace: "D" }, handleGET);
export const PATCH = withEnvelope({ namespace: "D" }, handlePATCH);
