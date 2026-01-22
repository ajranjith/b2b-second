import {
  DealerCartResponseSchema,
  type DealerCartDTO,
} from "@repo/lib";
import {
  createCart,
  deleteCartItem,
  fetchCartItems,
  findCart,
  findCartItem,
  insertCartItem,
  updateCartItemQuantity,
} from "../repositories/cartRepo";

const toNumber = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

async function ensureCart(dealerAccountId: string, dealerUserId: string) {
  const existing = await findCart(dealerAccountId, dealerUserId);
  if (existing) {
    return existing;
  }
  return createCart(dealerAccountId, dealerUserId);
}

async function buildCartResponse(cartId: string): Promise<DealerCartDTO> {
  const items = await fetchCartItems(cartId);
  const mapped = items.map((item) => ({
    id: item.id,
    productId: item.productId,
    qty: item.qty,
    product: {
      productCode: item.productCode,
      description: item.description,
      partType: item.partType,
      freeStock: item.freeStock,
    },
    yourPrice: toNumber(item.net1Price),
    supersededBy: item.supersededBy,
    replacementExists: Boolean(item.supersededBy),
    supersessionDepth: item.supersessionDepth,
  }));

  const subtotal = mapped.reduce((acc, item) => acc + (item.yourPrice ?? 0) * item.qty, 0);

  return DealerCartResponseSchema.parse({
    items: mapped,
    subtotal,
  });
}

export async function getDealerCart(accountId: string, dealerUserId: string) {
  const cart = await findCart(accountId, dealerUserId);
  if (!cart) {
    return DealerCartResponseSchema.parse({ items: [], subtotal: 0 });
  }

  return buildCartResponse(cart.id);
}

export async function addToDealerCart(accountId: string, dealerUserId: string, productId: string, qty: number) {
  const cart = await ensureCart(accountId, dealerUserId);
  const existing = await findCartItem(cart.id, productId);

  if (existing) {
    await updateCartItemQuantity(existing.id, existing.qty + qty);
  } else {
    await insertCartItem(cart.id, productId, qty);
  }

  return buildCartResponse(cart.id);
}

export async function updateDealerCartItem(accountId: string, dealerUserId: string, itemId: string, qty: number) {
  const cart = await ensureCart(accountId, dealerUserId);

  if (qty <= 0) {
    await deleteCartItem(itemId);
  } else {
    await updateCartItemQuantity(itemId, qty);
  }

  return buildCartResponse(cart.id);
}

export async function removeCartItemForDealer(accountId: string, dealerUserId: string, itemId: string) {
  const cart = await ensureCart(accountId, dealerUserId);
  await deleteCartItem(itemId);
  return buildCartResponse(cart.id);
}
