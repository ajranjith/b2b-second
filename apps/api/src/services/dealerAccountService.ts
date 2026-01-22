import bcrypt from "bcrypt";
import crypto from "crypto";

import {
  DealerAccountResponseSchema,
  type DealerAccountDTO,
  type DealerAccountUpdateDTO,
  type DealerAccountResetPasswordDTO,
} from "@repo/lib";

import { fetchDealerTierAssignments } from "../repositories/dashboardRepo";
import {
  fetchDealerAccountById,
  resetDealerPassword as resetDealerPasswordRepo,
  updateDealerAccountProfile,
  updateDealerContact,
} from "../repositories/dealerAccountRepo";

const tierKeys: Record<string, keyof DealerAccountDTO["tiers"]> = {
  GN: "genuine",
  ES: "aftermarketEs",
  BR: "aftermarketBr",
};

type DealerAccountPayload = {
  account: DealerAccountDTO["account"];
  contact: DealerAccountDTO["contact"];
};

const emptyAccountDTO = (): DealerAccountDTO =>
  DealerAccountResponseSchema.parse({
    account: {
      accountNo: "",
      companyName: null,
      status: null,
      defaultShippingMethod: null,
      shippingNotes: null,
      phone: null,
      notes: null,
      billingAddress: {},
    },
    contact: {
      firstName: null,
      lastName: null,
      email: "",
    },
    tiers: {
      genuine: null,
      aftermarketEs: null,
      aftermarketBr: null,
    },
  });

const buildPayload = (record: Awaited<ReturnType<typeof fetchDealerAccountById>>) => {
  if (!record) {
    return null;
  }

  return {
    account: {
      accountNo: record.accountNo,
      companyName: record.companyName,
      status: record.status,
      defaultShippingMethod: record.defaultShippingMethod,
      shippingNotes: record.shippingNotes,
      phone: record.phone,
      notes: record.notes,
      billingAddress: {
        line1: record.billingLine1 ?? undefined,
        line2: record.billingLine2 ?? undefined,
        city: record.billingCity ?? undefined,
        postcode: record.billingPostcode ?? undefined,
        country: record.billingCountry ?? undefined,
      },
    },
    contact: {
      firstName: record.contactFirstName ?? undefined,
      lastName: record.contactLastName ?? undefined,
      email: record.contactEmail ?? "",
    },
  };
};

const attachTiers = async (payload: DealerAccountPayload, accountNo: string) => {
  const assignments = await fetchDealerTierAssignments(accountNo);
  const tiers: DealerAccountDTO["tiers"] = {
    genuine: null,
    aftermarketEs: null,
    aftermarketBr: null,
  };

  assignments.forEach((assignment) => {
    const key = tierKeys[assignment.categoryCode.toUpperCase()] as keyof typeof tiers;
    if (key) {
      tiers[key] = assignment.netTier;
    }
  });

  return DealerAccountResponseSchema.parse({
    account: payload.account,
    contact: payload.contact,
    tiers,
  });
};

export async function getDealerAccount(accountId: string | null): Promise<DealerAccountDTO> {
  if (!accountId) {
    return emptyAccountDTO();
  }

  const record = await fetchDealerAccountById(accountId);
  if (!record) {
    return emptyAccountDTO();
  }

  const payload = buildPayload(record);
  if (!payload) {
    return emptyAccountDTO();
  }

  return attachTiers(payload, record.accountNo);
}

export async function updateDealerAccount(accountId: string, payload: DealerAccountUpdateDTO): Promise<DealerAccountDTO | null> {
  const record = await fetchDealerAccountById(accountId);
  if (!record) {
    return null;
  }

  const profileChanges: Record<string, string | null | undefined> = {};
  if ("defaultShippingMethod" in payload) {
    profileChanges.defaultShippingMethod = payload.defaultShippingMethod ?? null;
  }
  if ("shippingNotes" in payload) {
    profileChanges.shippingNotes = payload.shippingNotes ?? null;
  }

  await updateDealerAccountProfile(accountId, profileChanges);

  if (
    (payload.firstName || payload.lastName || payload.email) &&
    record.userId &&
    record.dealerUserId
  ) {
    await updateDealerContact(record.userId, record.dealerUserId, {
      firstName: payload.firstName ?? null,
      lastName: payload.lastName ?? null,
      email: payload.email ?? null,
    });
  }

  const updated = await fetchDealerAccountById(accountId);
  if (!updated) {
    return null;
  }

  const updatedPayload = buildPayload(updated);
  if (!updatedPayload) {
    return null;
  }

  return attachTiers(updatedPayload, updated.accountNo);
}

export async function resetDealerAccountPassword(
  accountId: string,
  payload: DealerAccountResetPasswordDTO,
): Promise<{ email: string | null; resetToken: string } | null> {
  const record = await fetchDealerAccountById(accountId);
  if (!record || !record.userId) {
    return null;
  }

  const secret = crypto.randomBytes(6).toString("hex");
  const hashed = await bcrypt.hash(secret, 12);
  await resetDealerPasswordRepo(record.userId, hashed);

  return {
    email: payload.email ?? record.contactEmail,
    resetToken: secret,
  };
}
