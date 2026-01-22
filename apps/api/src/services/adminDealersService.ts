import {
  AdminDealersResponseSchema,
  type AdminDealersResponseDTO,
  type AdminDealerDTO,
} from "@repo/lib";

import {
  fetchDealerAccounts,
  fetchDealerDiscountTiers,
  fetchDealerUsers,
} from "../repositories/adminDealersRepo";

export async function listAdminDealers(): Promise<AdminDealersResponseDTO> {
  const [accounts, users, tiers] = await Promise.all([
    fetchDealerAccounts(),
    fetchDealerUsers(),
    fetchDealerDiscountTiers(),
  ]);

  const usersMap = new Map<string, AdminDealerDTO["users"]>();
  users.forEach((user) => {
    const entry = usersMap.get(user.dealerAccountId) ?? [];
    entry.push({
      firstName: user.firstName,
      lastName: user.lastName,
      user: {
        email: user.email,
      },
    });
    usersMap.set(user.dealerAccountId, entry);
  });

  const tiersMap = new Map<string, AdminDealerDTO["discountTiers"]>();
  tiers.forEach((tier) => {
    const entry = tiersMap.get(tier.dealerAccountId) ?? [];
    entry.push({
      discountCode: tier.discountCode,
      tierCode: tier.tierCode,
    });
    tiersMap.set(tier.dealerAccountId, entry);
  });

  const dealers: AdminDealerDTO[] = accounts.map((account) => ({
    id: account.id,
    accountNo: account.accountNo,
    companyName: account.companyName,
    status: account.status as AdminDealerDTO["status"],
    entitlement: account.entitlement as AdminDealerDTO["entitlement"],
    phone: account.phone,
    defaultShippingMethod: account.defaultShippingMethod,
    shippingNotes: account.shippingNotes,
    billingLine1: account.billingLine1,
    billingLine2: account.billingLine2,
    billingCity: account.billingCity,
    billingPostcode: account.billingPostcode,
    billingCountry: account.billingCountry,
    users: usersMap.get(account.id) ?? [],
    discountTiers: tiersMap.get(account.id) ?? [],
  }));

  return AdminDealersResponseSchema.parse({ dealers });
}
