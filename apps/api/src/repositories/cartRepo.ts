import crypto from "crypto";
import { dbRead, dbWrite } from "../db";
import { QUERIES } from "@repo/identity";

export type CartRow = {
  id: string;
  dealerAccountId: string;
  dealerUserId: string;
};

export type CartItemRow = {
  id: string;
  cartId: string;
  productId: string;
  qty: number;
  productCode: string;
  description: string;
  partType: string;
  freeStock: number | null;
  net1Price: string | null;
  supersededBy: string | null;
  supersessionDepth: number | null;
};

export type CartItemSummary = {
  id: string;
  cartId: string;
  productId: string;
  qty: number;
};

export async function findCart(dealerAccountId: string, dealerUserId: string) {
  const result = await dbRead<CartRow>(
    QUERIES.DEALER_CART_GET,
    `
      SELECT id, "dealerAccountId", "dealerUserId"
      FROM "Cart"
      WHERE "dealerAccountId" = $1
        AND "dealerUserId" = $2
      LIMIT 1;
    `,
    [dealerAccountId, dealerUserId],
  );
  return result.rows[0] ?? null;
}

export async function createCart(dealerAccountId: string, dealerUserId: string) {
  const result = await dbWrite<CartRow>(
    QUERIES.DEALER_CART_CREATE,
    `
      INSERT INTO "Cart" (
        id,
        "dealerAccountId",
        "dealerUserId",
        "createdAt",
        "updatedAt"
      ) VALUES ($1,$2,$3,NOW(),NOW())
      RETURNING id, "dealerAccountId", "dealerUserId";
    `,
    [crypto.randomUUID(), dealerAccountId, dealerUserId],
  );
  return result.rows[0];
}

export async function fetchCartItems(cartId: string) {
  const result = await dbRead<CartItemRow>(
    QUERIES.DEALER_CART_ITEMS_LIST,
    `
      SELECT
        ci.id,
        ci."cartId",
        ci."productId",
        ci.qty,
        p."productCode",
        p.description,
        p."partType",
        pc."freeStock",
        pc."net1Price",
        sr."latestPartNo" AS "supersededBy",
        sr.depth AS "supersessionDepth"
      FROM "CartItem" ci
      JOIN "Product" p ON p.id = ci."productId"
      LEFT JOIN "ProductCatalog" pc ON pc."productCode" = p."productCode"
      LEFT JOIN "SupersessionResolved" sr ON sr."originalPartNo" = p."productCode"
      WHERE ci."cartId" = $1;
    `,
    [cartId],
  );
  return result.rows;
}

export async function findCartItem(cartId: string, productId: string) {
  const result = await dbRead<CartItemSummary>(
    QUERIES.DEALER_CART_ITEM_GET,
    `
      SELECT id, "cartId", "productId", qty
      FROM "CartItem"
      WHERE "cartId" = $1
        AND "productId" = $2
      LIMIT 1;
    `,
    [cartId, productId],
  );
  return result.rows[0] ?? null;
}

export async function insertCartItem(cartId: string, productId: string, qty: number) {
  const result = await dbWrite(
    QUERIES.DEALER_CART_ITEM_INSERT,
    `
      INSERT INTO "CartItem" (
        id,
        "cartId",
        "productId",
        qty
      ) VALUES ($1,$2,$3,$4)
      ON CONFLICT ("cartId", "productId") DO UPDATE
      SET qty = "CartItem".qty + EXCLUDED.qty
      RETURNING id;
    `,
    [crypto.randomUUID(), cartId, productId, qty],
  );
  return result.rows[0];
}

export async function updateCartItemQuantity(itemId: string, qty: number) {
  const result = await dbWrite(
    QUERIES.DEALER_CART_ITEM_UPDATE,
    `
      UPDATE "CartItem"
      SET qty = $1
      WHERE id = $2
      RETURNING id;
    `,
    [qty, itemId],
  );
  return result.rows[0] ?? null;
}

export async function deleteCartItem(itemId: string) {
  await dbWrite(
    QUERIES.DEALER_CART_ITEM_DELETE,
    `
      DELETE FROM "CartItem"
      WHERE id = $1;
    `,
    [itemId],
  );
}

export async function clearCart(cartId: string) {
  await dbWrite(
    QUERIES.DEALER_CART_CLEAR,
    `
      DELETE FROM "CartItem"
      WHERE "cartId" = $1;
    `,
    [cartId],
  );
}
