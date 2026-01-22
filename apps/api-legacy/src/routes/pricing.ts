import { FastifyPluginAsync } from "fastify";
import { PrismaClient } from "@prisma/client";
import { PricingService } from "@packages/shared/src/services/PricingService";

const prisma = new PrismaClient();
const pricingService = new PricingService(prisma);

/**
 * Pricing routes for price resolution
 */
const pricingRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /pricing/product/:productId
   * Resolve price for a single product
   */
  fastify.get<{
    Params: { productId: string };
    Querystring: { asOfDate?: string };
  }>("/product/:productId", async (request, reply) => {
    const { productId } = request.params;
    const { asOfDate } = request.query;

    // Get dealer from authenticated user
    const user = request.user;
    if (!user?.dealerAccountId) {
      return reply.code(401).send({ error: "Not authenticated as dealer" });
    }

    try {
      const date = asOfDate ? new Date(asOfDate) : new Date();
      const priceResolution = await pricingService.resolvePrice(
        productId,
        user.dealerAccountId,
        date,
      );

      return reply.send(priceResolution);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  /**
   * POST /pricing/products
   * Resolve prices for multiple products (bulk)
   */
  fastify.post<{
    Body: {
      productIds: string[];
      asOfDate?: string;
    };
  }>("/products", async (request, reply) => {
    const { productIds, asOfDate } = request.body;

    // Get dealer from authenticated user
    const user = request.user;
    if (!user?.dealerAccountId) {
      return reply.code(401).send({ error: "Not authenticated as dealer" });
    }

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return reply.code(400).send({ error: "productIds array is required" });
    }

    try {
      const date = asOfDate ? new Date(asOfDate) : new Date();
      const priceMap = await pricingService.resolvePrices(productIds, user.dealerAccountId, date);

      // Convert Map to object for JSON serialization
      const pricesObject: Record<string, any> = {};
      for (const [productId, priceResolution] of priceMap.entries()) {
        pricesObject[productId] = priceResolution;
      }

      return reply.send({ prices: pricesObject });
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  /**
   * POST /pricing/cart/refresh
   * Refresh all cart item prices with current pricing
   */
  fastify.post("/cart/refresh", async (request, reply) => {
    // Get dealer from authenticated user
    const user = request.user;
    if (!user?.dealerAccountId) {
      return reply.code(401).send({ error: "Not authenticated as dealer" });
    }

    try {
      const updatedCount = await pricingService.refreshCartPrices(user.dealerAccountId);

      return reply.send({
        success: true,
        updatedCount,
        message: `Refreshed prices for ${updatedCount} cart items`,
      });
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  /**
   * GET /pricing/context
   * Get dealer's pricing context (tier assignments)
   */
  fastify.get("/context", async (request, reply) => {
    // Get dealer from authenticated user
    const user = request.user;
    if (!user?.dealerAccountId) {
      return reply.code(401).send({ error: "Not authenticated as dealer" });
    }

    try {
      const pricingContext = await pricingService.getDealerPricingContext(user.dealerAccountId);

      if (!pricingContext) {
        return reply
          .code(404)
          .send({ error: "Pricing context not found (missing tier assignments)" });
      }

      return reply.send(pricingContext);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });
};

export default pricingRoutes;
