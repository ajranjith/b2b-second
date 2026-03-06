import { PrismaClient } from "db";
import { PricingRules } from "rules";

export interface CartItemInput {
  productId: string;
  qty: number;
}

export interface CartWithItems {
  id: string;
  dealerAccountId: string;
  dealerUserId: string;
  items: Array<{
    id: string;
    productId: string;
    qty: number;
    product: {
      productCode: string;
      description: string;
      partType: string;
    };
    yourPrice: number | null;
    bandCode: string | null;
    available: boolean;
    lineTotal: number | null;
    supersededBy?: string | null;
    supersessionDepth?: number | null;
    replacementExists?: boolean;
  }>;
  subtotal: number;
}

export class CartService {
  constructor(
    private prisma: PrismaClient,
    private pricingRules: PricingRules,
  ) {}

  async getOrCreateCart(dealerUserId: string, dealerAccountId: string): Promise<CartWithItems> {
    // 1. Try to find existing cart
    let cart = await this.prisma.cart.findUnique({
      where: { dealerUserId },
      include: {
        items: {
          include: {
            product: {
              select: {
                productCode: true,
                description: true,
                partType: true,
              },
            },
          },
        },
      },
    });

    // 2. Create if doesn't exist
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          dealerAccountId,
          dealerUserId,
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  productCode: true,
                  description: true,
                  partType: true,
                },
              },
            },
          },
        },
      });
    }

    // 3. Calculate pricing for all items
    return this.enrichCartWithPricing(cart, dealerAccountId);
  }

  async addItem(
    dealerUserId: string,
    dealerAccountId: string,
    input: CartItemInput,
  ): Promise<CartWithItems> {
    // 1. Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: input.productId },
    });

    if (!product) {
      throw new Error("Product not found");
    }
    await this.assertNotSuperseded(product.productCode);

    // 2. Get or create cart
    const cart = await this.getOrCreateCart(dealerUserId, dealerAccountId);

    // 3. Check if item already exists
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: input.productId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { qty: existingItem.qty + input.qty },
      });
    } else {
      // Create new item
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: input.productId,
          qty: input.qty,
        },
      });
    }

    // 4. Return updated cart with pricing
    return this.getOrCreateCart(dealerUserId, dealerAccountId);
  }

  async updateItem(
    cartItemId: string,
    dealerUserId: string,
    dealerAccountId: string,
    qty: number,
  ): Promise<CartWithItems> {
    // 1. Verify item belongs to user's cart
    const item = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!item || item.cart.dealerUserId !== dealerUserId) {
      throw new Error("Cart item not found");
    }
    if (item.productId) {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (product) {
        await this.assertNotSuperseded(product.productCode);
      }
    }

    // 2. Update quantity
    await this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: { qty },
    });

    // 3. Return updated cart
    return this.getOrCreateCart(dealerUserId, dealerAccountId);
  }

  async removeItem(
    cartItemId: string,
    dealerUserId: string,
    dealerAccountId: string,
  ): Promise<CartWithItems> {
    // 1. Verify item belongs to user's cart
    const item = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!item || item.cart.dealerUserId !== dealerUserId) {
      throw new Error("Cart item not found");
    }

    // 2. Delete item
    await this.prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    // 3. Return updated cart
    return this.getOrCreateCart(dealerUserId, dealerAccountId);
  }

  async clearCart(dealerUserId: string, dealerAccountId: string): Promise<CartWithItems> {
    const cart = await this.prisma.cart.findUnique({
      where: { dealerUserId },
    });

    if (cart) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return this.getOrCreateCart(dealerUserId, dealerAccountId);
  }

  private async enrichCartWithPricing(cart: any, dealerAccountId: string): Promise<CartWithItems> {
    if (cart.items.length === 0) {
      return {
        ...cart,
        items: [],
        subtotal: 0,
      };
    }

    const productCodes = cart.items.map((item: any) => item.product.productCode.toUpperCase());
    const supersessions = await this.prisma.supersessionResolved.findMany({
      where: { originalPartNo: { in: productCodes } },
    });
    const supersessionMap = new Map(
      supersessions.map((row) => [row.originalPartNo.toUpperCase(), row]),
    );
    const replacementCodes = Array.from(
      new Set(supersessions.map((row) => row.latestPartNo.toUpperCase())),
    );
    const replacements = replacementCodes.length
      ? await this.prisma.product.findMany({
          where: { productCode: { in: replacementCodes } },
          select: { productCode: true },
        })
      : [];
    const replacementSet = new Set(replacements.map((row) => row.productCode.toUpperCase()));

    // Calculate pricing for all items
    const priceMap = await this.pricingRules.calculatePrices(
      dealerAccountId,
      cart.items.map((item: any) => item.productId),
    );

    let subtotal = 0;
    const enrichedItems = cart.items.map((item: any) => {
      const pricing = priceMap.get(item.productId);
      const lineTotal = pricing?.available ? Number(pricing.price) * item.qty : null;
      const supersession = supersessionMap.get(item.product.productCode.toUpperCase());
      const supersededBy = supersession?.latestPartNo ?? null;
      const replacementExists = supersededBy
        ? replacementSet.has(supersededBy.toUpperCase())
        : false;

      if (lineTotal !== null) {
        subtotal += lineTotal;
      }

      return {
        id: item.id,
        productId: item.productId,
        qty: item.qty,
        product: item.product,
        yourPrice: pricing?.available ? pricing.price : null,
        bandCode: pricing?.bandCode ?? null,
        available: pricing?.available ?? false,
        lineTotal,
        supersededBy,
        supersessionDepth: supersession?.depth ?? null,
        replacementExists,
      };
    });

    return {
      id: cart.id,
      dealerAccountId: cart.dealerAccountId,
      dealerUserId: cart.dealerUserId,
      items: enrichedItems,
      subtotal,
    };
  }

  private async assertNotSuperseded(productCode: string) {
    const supersession = await this.prisma.supersessionResolved.findFirst({
      where: { originalPartNo: productCode.toUpperCase() },
    });
    if (!supersession) return;

    const replacement = await this.prisma.product.findUnique({
      where: { productCode: supersession.latestPartNo },
    });
    const error: any = new Error("Item is superseded");
    error.code = "ITEM_SUPERSEDED";
    error.productCode = productCode;
    error.supersededBy = supersession.latestPartNo;
    error.replacementExists = !!replacement;
    throw error;
  }
}
