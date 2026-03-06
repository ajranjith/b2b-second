import type { NextRequest } from "next/server";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { getDealerDashboard } from "@/services/dashboardService";
import { getDealerAccount } from "@/services/dealerAccountService";
import { withEnvelope } from "@/lib/withEnvelope";

const resolveAccountNo = (request: NextRequest) => {
  const headerAccount =
    request.headers.get("x-dev-account") ??
    request.headers.get("x-dev-account-no") ??
    request.headers.get("x-dealer-account");

  if (headerAccount) {
    return headerAccount;
  }

  const url = new URL(request.url);
  return url.searchParams.get("accountNo");
};

async function handleGET(request: NextRequest) {
  const auth = requireRole(request, "DEALER");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  let accountNo = resolveAccountNo(request);
  if (!accountNo && auth.user?.dealerAccountId) {
    const dealerAccount = await getDealerAccount(auth.user.dealerAccountId);
    accountNo = dealerAccount.account.accountNo || null;
  }

  const data = await getDealerDashboard(accountNo);
  return ok(data);
}

export const GET = withEnvelope({ namespace: "D" }, handleGET);
