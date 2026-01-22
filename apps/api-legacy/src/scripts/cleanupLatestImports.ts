import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const uniqueStrings = (values: (string | null | undefined)[]) =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value?.trim()))));

async function main() {
  const lastProductBatch = await prisma.importBatch.findFirst({
    where: { importType: "PRODUCTS_MIXED" },
    orderBy: { startedAt: "desc" },
  });

  if (!lastProductBatch) {
    throw new Error("No PRODUCTS_MIXED import batch found.");
  }

  const productRows = await prisma.stgProductPriceRow.findMany({
    where: { batchId: lastProductBatch.id, isValid: true },
    select: { productCode: true },
  });

  const keepProductCodes = uniqueStrings(productRows.map((row) => row.productCode));

  if (keepProductCodes.length === 0) {
    throw new Error("No valid product codes found in the latest PRODUCTS_MIXED batch.");
  }

  const lastDealerBatch = await prisma.importBatch.findFirst({
    where: { importType: "DEALERS" },
    orderBy: { startedAt: "desc" },
  });

  if (!lastDealerBatch) {
    throw new Error("No DEALERS import batch found.");
  }

  const dealerRows = await prisma.stgDealerAccountRow.findMany({
    where: { batchId: lastDealerBatch.id, isValid: true },
    select: { accountNo: true },
  });

  const keepAccountNos = uniqueStrings(dealerRows.map((row) => row.accountNo));

  if (keepAccountNos.length === 0) {
    throw new Error("No valid dealer account numbers found in the latest DEALERS batch.");
  }

  const dealersToDelete = await prisma.dealerAccount.findMany({
    where: { accountNo: { notIn: keepAccountNos } },
    select: { id: true, accountNo: true },
  });

  const dealerAccountIdsToDelete = dealersToDelete.map((dealer) => dealer.id);
  const dealerAccountNosToDelete = dealersToDelete.map((dealer) => dealer.accountNo);

  const dealerUsersToDelete = await prisma.dealerUser.findMany({
    where: { dealerAccountId: { in: dealerAccountIdsToDelete } },
    select: { userId: true },
  });
  const dealerUserIdsToDelete = dealerUsersToDelete.map((dealerUser) => dealerUser.userId);

  const productIdsToDelete = await prisma.product.findMany({
    where: { productCode: { notIn: keepProductCodes } },
    select: { id: true },
  });
  const productIdList = productIdsToDelete.map((product) => product.id);

  const orderIdsToDelete = await prisma.orderHeader.findMany({
    where: { dealerAccountId: { in: dealerAccountIdsToDelete } },
    select: { id: true },
  });
  const orderIdList = orderIdsToDelete.map((order) => order.id);

  console.log(
    "Latest product batch:",
    lastProductBatch.id,
    "keep products:",
    keepProductCodes.length,
  );
  console.log("Latest dealer batch:", lastDealerBatch.id, "keep dealers:", keepAccountNos.length);
  console.log("Deleting dealers:", dealerAccountNosToDelete.length);
  console.log("Deleting products:", productIdList.length);

  await prisma.$transaction(async (tx) => {
    if (orderIdList.length > 0) {
      await tx.orderLine.deleteMany({ where: { orderId: { in: orderIdList } } });
      await tx.orderHeader.deleteMany({ where: { id: { in: orderIdList } } });
    }

    if (dealerAccountIdsToDelete.length > 0) {
      await tx.cartItem.deleteMany({
        where: { cart: { dealerAccountId: { in: dealerAccountIdsToDelete } } },
      });
      await tx.cart.deleteMany({ where: { dealerAccountId: { in: dealerAccountIdsToDelete } } });
      await tx.dealerDiscountTier.deleteMany({
        where: { dealerAccountId: { in: dealerAccountIdsToDelete } },
      });
      await tx.dealerBandAssignment.deleteMany({
        where: { dealerAccountId: { in: dealerAccountIdsToDelete } },
      });
      await tx.dealerUser.deleteMany({
        where: { dealerAccountId: { in: dealerAccountIdsToDelete } },
      });
    }

    if (dealerAccountNosToDelete.length > 0) {
      await tx.dealerPriceTierAssignment.deleteMany({
        where: { accountNo: { in: dealerAccountNosToDelete } },
      });
      await tx.cartHeader.deleteMany({ where: { accountNo: { in: dealerAccountNosToDelete } } });
      await tx.backorderLineContract.deleteMany({
        where: { accountNo: { in: dealerAccountNosToDelete } },
      });
      await tx.dealerAccount.deleteMany({ where: { id: { in: dealerAccountIdsToDelete } } });
    }

    if (dealerUserIdsToDelete.length > 0) {
      await tx.appUser.deleteMany({ where: { id: { in: dealerUserIdsToDelete }, role: "DEALER" } });
    }

    if (productIdList.length > 0) {
      await tx.orderLine.deleteMany({ where: { productId: { in: productIdList } } });
      await tx.cartItem.deleteMany({ where: { productId: { in: productIdList } } });
    }

    await tx.productCatalog.deleteMany({ where: { productCode: { notIn: keepProductCodes } } });
    await tx.product.deleteMany({ where: { productCode: { notIn: keepProductCodes } } });
  });

  console.log("Cleanup complete.");
}

main()
  .catch((error) => {
    console.error("Cleanup failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
