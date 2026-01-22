import crypto from "crypto";

import { DealerCheckoutResponseSchema } from "@repo/lib";
import { writeClient } from "../db";
import { fetchCartItems, findCart } from "../repositories/cartRepo";
import { updateDealerAccountProfile } from "../repositories/dealerAccountRepo";

const toNumber = (value: string | null) => (value ? Number(value) : 0);

export async function checkoutDealerCart(accountId: string, dealerUserId: string, payload: {
  shippingMethod?: string;
  poRef?: string;
  notes?: string;
  setDefaultShipping?: boolean;
}) {
  const cart = await findCart(accountId, dealerUserId);
  if (!cart) {
    throw new Error("Cart not found");
  }

  const items = await fetchCartItems(cart.id);
  if (!items.length) {
    throw new Error("Cart is empty");
  }

  const total = items.reduce((acc, item) => acc + toNumber(item.net1Price) * item.qty, 0);
  const orderId = crypto.randomUUID();
  const orderNo = `B2B-${Date.now()}-${orderId.slice(0, 4)}`;

  const client = await writeClient.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `
        INSERT INTO "OrderHeader" (
          id,
          "orderNo",
          "dealerAccountId",
          "dealerUserId",
          status,
          total,
          "dispatchMethod",
          "shippingMethod",
          "poRef",
          notes,
          "createdAt",
          "updatedAt"
        ) VALUES ($1,$2,$3,$4,'PROCESSING',$5,$6,$7,$8,$9,NOW(),NOW());
      `,
      [
        orderId,
        orderNo,
        accountId,
        dealerUserId,
        total,
        payload.shippingMethod ?? null,
        payload.shippingMethod ?? null,
        payload.poRef ?? null,
        payload.notes ?? null,
      ],
    );

    for (const item of items) {
      await client.query(
        `
          INSERT INTO "OrderLine" (
            id,
            "orderId",
            "productId",
            "productCodeSnapshot",
            "descriptionSnapshot",
            "partTypeSnapshot",
            qty,
            "unitPriceSnapshot",
            "lineTotalSnapshot",
            "bandCodeSnapshot",
            "minPriceApplied",
            "createdAt",
            "updatedAt"
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,'NET1',false,NOW(),NOW()
          );
        `,
        [
          crypto.randomUUID(),
          orderId,
          item.productId,
          item.productCode,
          item.description,
          item.partType,
          item.qty,
          toNumber(item.net1Price),
          toNumber(item.net1Price) * item.qty,
        ],
      );
    }

    await client.query(
      `
        DELETE FROM "CartItem"
        WHERE "cartId" = $1;
      `,
      [cart.id],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  if (payload.setDefaultShipping && payload.shippingMethod) {
    await updateDealerAccountProfile(accountId, {
      defaultShippingMethod: payload.shippingMethod,
    });
  }

  return DealerCheckoutResponseSchema.parse({
    orderId,
    orderNo,
    total,
  });
}
