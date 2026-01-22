import { PrismaClient, OrderStatus, PartType } from "db";
import { PricingRules, OrderRules } from "rules";

export interface CheckoutInput {
  dispatchMethod?: string;
  poRef?: string;
  notes?: string;
}

export interface CreatedOrder {
  id: string;
  orderNo: string;
  dealerAccountId: string;
  dealerUserId: string;
  status: OrderStatus;
  subtotal: number;
  total: number;
  currency: string;
  createdAt: Date;
  lines: Array<{
    productCode: string;
    description: string;
    partType: PartType;
    qty: number;
    unitPrice: number;
    bandCode: string;
    minPriceApplied: boolean;
  }>;
}

export class OrderService {
  constructor(
    private prisma: PrismaClient,
    private pricingRules: PricingRules,
    private orderRules: OrderRules,
  ) {}

  async createOrder(
    dealerUserId: string,
    dealerAccountId: string,
    checkoutData: CheckoutInput,
  ): Promise<CreatedOrder> {
    // 1. Get cart with items
    const cart = await this.prisma.cart.findUnique({
      where: { dealerUserId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    // 2. Get dealer account for validation
    const dealerAccount = await this.prisma.dealerAccount.findUnique({
      where: { id: dealerAccountId },
      select: { status: true, accountNo: true, companyName: true },
    });

    if (!dealerAccount) {
      throw new Error("Dealer account not found");
    }

    // 3. Validate order using OrderRules
    const orderInput = {
      dealerAccountId,
      dealerStatus: dealerAccount.status,
      items: cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.qty,
      })),
      cartItems: cart.items.map((item) => ({
        productId: item.productId,
        productCode: item.product.productCode,
        quantity: item.qty,
      })),
    };

    const validationResult = await this.orderRules.validateOrderCreation(orderInput);

    if (!validationResult.success) {
      const errorMessages =
        validationResult.errors?.map((e) => e.message).join(", ") || "Validation failed";
      throw new Error(errorMessages);
    }

    // 4. Validate supersession before pricing
    for (const item of cart.items) {
      const supersession = await this.prisma.supersessionResolved.findFirst({
        where: { originalPartNo: item.product.productCode.toUpperCase() },
      });
      if (supersession) {
        const replacement = await this.prisma.product.findUnique({
          where: { productCode: supersession.latestPartNo },
        });
        const error: any = new Error("Item is superseded");
        error.code = "ITEM_SUPERSEDED";
        error.productCode = item.product.productCode;
        error.supersededBy = supersession.latestPartNo;
        error.replacementExists = !!replacement;
        throw error;
      }
    }

    // 5. Calculate pricing for all items (snapshot)
    const priceMap = await this.pricingRules.calculatePrices(
      dealerAccountId,
      cart.items.map((item) => item.productId),
    );

    // 6. Check all items are available and priced
    for (const item of cart.items) {
      const pricing = priceMap.get(item.productId);
      if (!pricing?.available) {
        throw new Error(`Product ${item.product.productCode} is not available or has no price`);
      }
    }

    // 7. Calculate totals
    let subtotal = 0;
    const orderLines = cart.items.map((item) => {
      const pricing = priceMap.get(item.productId)!;
      const lineTotal = Number(pricing.price) * item.qty;
      subtotal += lineTotal;

      return {
        productId: item.productId,
        productCodeSnapshot: item.product.productCode,
        descriptionSnapshot: item.product.description,
        partTypeSnapshot: item.product.partType,
        qty: item.qty,
        unitPriceSnapshot: pricing.price,
        bandCodeSnapshot: pricing.bandCode,
        minPriceApplied: pricing.minimumPriceApplied,
      };
    });

    // 8. Create order in transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Generate order number
      const orderCount = await tx.orderHeader.count();
      const orderNo = `ORD-${String(orderCount + 1).padStart(6, "0")}`;

      const totalItems = cart.items.length;

      // Create order
      const newOrder = await tx.orderHeader.create({
        data: {
          orderNo,
          dealerAccountId,
          dealerUserId,
          status: OrderStatus.SUSPENDED,
          dispatchMethod: checkoutData.dispatchMethod,
          poRef: checkoutData.poRef,
          notes: checkoutData.notes,
          subtotal,
          total: subtotal,
          currency: "GBP",
          lines: {
            create: orderLines,
          },
          exportLines: {
            create: cart.items.map((item) => ({
              accountNo: dealerAccount.accountNo,
              companyName: dealerAccount.companyName || null,
              portalOrderNo: orderNo,
              totalItem: totalItems,
              productCode: item.product.productCode,
              description: item.product.description,
              qtyOrdered: item.qty,
            })),
          },
        },
        include: {
          lines: {
            include: {
              product: true,
            },
          },
        },
      });

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    // 7. Format response
    return {
      id: order.id,
      orderNo: order.orderNo,
      dealerAccountId: order.dealerAccountId,
      dealerUserId: order.dealerUserId,
      status: order.status,
      subtotal: Number(order.subtotal),
      total: Number(order.total),
      currency: order.currency,
      createdAt: order.createdAt,
      lines: order.lines.map((line) => ({
        productCode: line.productCodeSnapshot,
        description: line.descriptionSnapshot,
        partType: line.partTypeSnapshot,
        qty: line.qty,
        unitPrice: Number(line.unitPriceSnapshot),
        bandCode: line.bandCodeSnapshot,
        minPriceApplied: line.minPriceApplied,
      })),
    };
  }

  async getOrders(dealerAccountId: string, limit: number = 20): Promise<any[]> {
    const orders = await this.prisma.orderHeader.findMany({
      where: { dealerAccountId },
      include: {
        lines: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return orders;
  }

  async getOrderDetail(orderId: string, dealerAccountId: string): Promise<any> {
    const order = await this.prisma.orderHeader.findFirst({
      where: {
        id: orderId,
        dealerAccountId,
      },
      include: {
        lines: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    return order;
  }
}
