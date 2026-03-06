import { PrismaClient, PartType, Entitlement, DealerStatus } from "db";
import { EntitlementRules, PricingRules } from "rules";

export interface ProductSearchFilters {
  q?: string;
  limit?: number;
  partType?: PartType;
  inStockOnly?: boolean;
  sortBy?: "price" | "code" | "stock";
}

export interface PricedProduct {
  id: string;
  productCode: string;
  description: string;
  partType: PartType;
  freeStock: number;
  yourPrice: number | null;
  bandCode: string | null;
  available: boolean;
  minPriceApplied: boolean;
  reason?: string;
  currency: string;
  supersessionOriginal?: string | null;
  supersededBy?: string | null;
  supersessionDepth?: number | null;
}

export class DealerService {
  constructor(
    private prisma: PrismaClient,
    private pricingRules: PricingRules,
  ) {}

  async searchProducts(
    dealerAccountId: string,
    filters: ProductSearchFilters,
  ): Promise<{
    results: PricedProduct[];
    count: number;
    entitlement: Entitlement;
    status: DealerStatus;
  }> {
    // 1. Load dealer account
    const dealerAccount = await this.prisma.dealerAccount.findUnique({
      where: { id: dealerAccountId },
      select: { status: true, entitlement: true, companyName: true },
    });

    if (!dealerAccount) {
      throw new Error("Dealer account not found");
    }

    if (dealerAccount.status === DealerStatus.INACTIVE) {
      throw new Error("Account inactive");
    }

    // 2. Build query with entitlement filter
    let where: any = { isActive: true };

    if (filters.q) {
      where.OR = [
        { productCode: { contains: filters.q, mode: "insensitive" } },
        { description: { contains: filters.q, mode: "insensitive" } },
        { aliases: { some: { aliasValue: { contains: filters.q, mode: "insensitive" } } } },
      ];
    }

    const entitlementFilter = EntitlementRules.getEntitlementFilter(
      dealerAccount.entitlement as any,
    );
    where = { ...where, ...entitlementFilter };

    if (filters.partType) {
      where.partType = filters.partType;
    }

    if (filters.inStockOnly) {
      where.stock = { freeStock: { gt: 0 } };
    }

    // 3. Determine sort order
    let orderBy: any = { productCode: "asc" };
    if (filters.sortBy === "code") orderBy = { productCode: "asc" };
    if (filters.sortBy === "stock") orderBy = { stock: { freeStock: "desc" } };

    // 4. Fetch products
    const products = await this.prisma.product.findMany({
      where,
      include: {
        stock: true,
        aliases: true,
      },
      take: filters.limit || 20,
      orderBy,
    });

    // 4b. Supersession metadata for results
    const productCodes = products.map((product) => product.productCode.toUpperCase());
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

    // 5. Calculate pricing for all products
    const priceMap = await this.pricingRules.calculatePrices(
      dealerAccountId,
      products.map((p) => p.id),
    );

    // 6. Format results
    let results = products.map((product) => {
      const pricing = priceMap.get(product.id);
      const supersession = supersessionMap.get(product.productCode.toUpperCase());
      const supersededBy = supersession?.latestPartNo ?? null;
      const replacementExists = supersededBy
        ? replacementSet.has(supersededBy.toUpperCase())
        : false;

      return {
        id: product.id,
        productCode: product.productCode,
        description: product.description,
        partType: product.partType,
        freeStock: product.stock?.freeStock ?? 0,
        yourPrice: pricing?.available ? Number(pricing.price) : null,
        bandCode: pricing?.bandCode ?? null,
        available: pricing?.available ?? false,
        minPriceApplied: pricing?.minimumPriceApplied ?? false,
        reason: pricing?.reason,
        currency: "GBP",
        supersessionOriginal: supersession?.originalPartNo ?? null,
        supersededBy,
        supersessionDepth: supersession?.depth ?? null,
        replacementExists,
      };
    });

    // 7. In-memory sort by price if requested
    if (filters.sortBy === "price") {
      results.sort((a, b) => (Number(a.yourPrice) || 0) - (Number(b.yourPrice) || 0));
    }

    return {
      results,
      count: results.length,
      entitlement: dealerAccount.entitlement,
      status: dealerAccount.status,
    };
  }

  async getProductDetail(
    dealerAccountId: string,
    productCode: string,
  ): Promise<PricedProduct & { aliases: any[]; refPrice: any }> {
    // 1. Fetch product
    const product = await this.prisma.product.findUnique({
      where: { productCode },
      include: {
        stock: true,
        refPrice: true,
        aliases: true,
      },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // 2. Calculate pricing
    const priceMap = await this.pricingRules.calculatePrices(dealerAccountId, [product.id]);
    const pricing = priceMap.get(product.id);

    const supersession = await this.prisma.supersessionResolved.findFirst({
      where: { originalPartNo: product.productCode.toUpperCase() },
    });
    const replacementExists = supersession
      ? !!(await this.prisma.product.findUnique({
          where: { productCode: supersession.latestPartNo },
        }))
      : false;

    return {
      id: product.id,
      productCode: product.productCode,
      description: product.description,
      partType: product.partType,
      freeStock: product.stock?.freeStock ?? 0,
      yourPrice: pricing?.available ? Number(pricing.price) : null,
      bandCode: pricing?.bandCode ?? null,
      available: pricing?.available ?? false,
      minPriceApplied: pricing?.minimumPriceApplied ?? false,
      reason: pricing?.reason,
      currency: "GBP",
      supersessionOriginal: supersession?.originalPartNo ?? null,
      supersededBy: supersession?.latestPartNo ?? null,
      supersessionDepth: supersession?.depth ?? null,
      replacementExists,
      aliases: product.aliases,
      refPrice: product.refPrice,
    };
  }

  async getBackorders(dealerAccountId: string): Promise<any[]> {
    // 1. Verify dealer exists
    const dealer = await this.prisma.dealerAccount.findUnique({
      where: { id: dealerAccountId },
      select: { accountNo: true },
    });

    if (!dealer) {
      throw new Error("Dealer account not found");
    }

    // 2. Get active backorder dataset
    const activeDataset = await this.prisma.backorderDataset.findFirst({
      where: { isActive: true },
      include: {
        lines: {
          where: { accountNo: dealer.accountNo },
        },
      },
    });

    if (!activeDataset) {
      return [];
    }

    return activeDataset.lines;
  }
}
