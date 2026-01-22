import { db } from "../../lib/prisma";
import { QUERIES } from "@repo/identity";

export async function listValidDealerRows(batchId: string) {
  return db(QUERIES.IMPORT_STAGING_ROWS_INSERT, (p) =>
    p.stgDealerAccountRow.findMany({
      where: { batchId, isValid: true },
    }),
  );
}

export async function upsertDealerFromRow(params: {
  row: any;
  normalizedEmail: string;
  passwordHash: string;
}): Promise<{ dealerAccountId: string }> {
  const { row, normalizedEmail, passwordHash } = params;

  return db(QUERIES.IMPORT_DEALER_ACCOUNTS_UPSERT, (p) =>
    p.$transaction(async (tx) => {
      const dealerAccount = await tx.dealerAccount.upsert({
        where: { accountNo: row.accountNo! },
        update: {
          companyName: row.companyName!,
          status: row.status as any,
          notes: row.shippingNotes,
          shippingNotes: row.shippingNotes,
          mainEmail: normalizedEmail || undefined,
          defaultShippingMethod: row.defaultShippingMethod,
          updatedAt: new Date(),
        },
        create: {
          accountNo: row.accountNo!,
          companyName: row.companyName!,
          status: row.status as any,
          notes: row.shippingNotes,
          shippingNotes: row.shippingNotes,
          mainEmail: normalizedEmail || undefined,
          defaultShippingMethod: row.defaultShippingMethod,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      let appUser = await tx.appUser.findUnique({
        where: { email: normalizedEmail },
      });

      if (!appUser) {
        appUser = await tx.appUser.create({
          data: {
            email: normalizedEmail,
            emailNormalized: normalizedEmail,
            passwordHash,
            role: "DEALER",
            mustChangePassword: true,
            isActive: row.status === "ACTIVE",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      } else {
        const existingDealerUser = await tx.dealerUser.findUnique({
          where: { userId: appUser.id },
        });

        if (!existingDealerUser) {
          await tx.appUser.update({
            where: { id: appUser.id },
            data: {
              passwordHash,
              mustChangePassword: true,
              role: "DEALER",
              updatedAt: new Date(),
            },
          });
        }
      }

      await tx.dealerUser.upsert({
        where: { userId: appUser.id },
        update: {
          dealerAccountId: dealerAccount.id,
          firstName: row.firstName!,
          lastName: row.lastName!,
        },
        create: {
          userId: appUser.id,
          dealerAccountId: dealerAccount.id,
          firstName: row.firstName!,
          lastName: row.lastName!,
        },
      });

      const tierAssignments = [
        { categoryCode: "gn", netTier: row.genuineTier! },
        { categoryCode: "es", netTier: row.aftermarketEsTier! },
        { categoryCode: "br", netTier: row.aftermarketBrTier! },
      ];

      for (const assignment of tierAssignments) {
        await tx.dealerPriceTierAssignment.upsert({
          where: {
            accountNo_categoryCode: {
              accountNo: dealerAccount.accountNo,
              categoryCode: assignment.categoryCode,
            },
          },
          update: {
            netTier: assignment.netTier,
            updatedAt: new Date(),
          },
          create: {
            accountNo: dealerAccount.accountNo,
            categoryCode: assignment.categoryCode,
            netTier: assignment.netTier,
            updatedAt: new Date(),
          },
        });
        await tx.dealerDiscountTier.upsert({
          where: {
            dealerAccountId_discountCode: {
              dealerAccountId: dealerAccount.id,
              discountCode: assignment.categoryCode,
            },
          },
          update: {
            tierCode: assignment.netTier,
            updatedAt: new Date(),
          },
          create: {
            dealerAccountId: dealerAccount.id,
            discountCode: assignment.categoryCode,
            tierCode: assignment.netTier,
            updatedAt: new Date(),
          },
        });
      }

      return { dealerAccountId: dealerAccount.id };
    }),
  );
}
