import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { PrismaClient, PartType } from '@prisma/client';
import { requireAuth, AuthenticatedRequest } from '../lib/auth';
import { PricingService } from '@packages/shared/src/services/PricingService';
import { SupersessionImportService } from '../../../worker/src/services/SupersessionImportService';

const prisma = new PrismaClient();
const pricingService = new PricingService(prisma);
const supersessionService = new SupersessionImportService(prisma);

/**
 * Enhanced dealer search with supersession and equivalents
 */
const dealerSearchRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /dealer/search?q=...
   * Search products with pricing, supersession, and equivalents
   */
  fastify.get('/search', {
    preHandler: requireAuth
  }, async (request: AuthenticatedRequest, reply) => {
    const querySchema = z.object({
      q: z.string().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional().default(20),
      offset: z.coerce.number().int().min(0).optional().default(0),
      partType: z.nativeEnum(PartType).optional(),
      inStockOnly: z.preprocess(
        (val) => val === 'true' || val === true,
        z.boolean()
      ).optional(),
      sortBy: z.enum(['price', 'code', 'stock', 'relevance']).optional().default('relevance')
    });

    const validation = querySchema.safeParse(request.query);

    if (!validation.success) {
      return reply.code(400).send({
        error: 'Validation Error',
        details: validation.error.issues
      });
    }

    const user = request.user;

    if (!user?.dealerAccountId) {
      return reply.code(401).send({ error: 'Not authenticated as dealer' });
    }

    const { q, limit, offset, partType, inStockOnly, sortBy } = validation.data;

    try {
      // Normalize search query
      const normalizedQuery = q?.trim().toUpperCase().replace(/\s+/g, '');

      // Step 1: Check if query is a superseded part
      let resolvedPartNo: string | null = null;
      let supersessionInfo: any = null;

      if (normalizedQuery) {
        const supersessionResolved = await prisma.supersessionResolved.findUnique({
          where: { originalPartNo: normalizedQuery }
        });

        if (supersessionResolved && !supersessionResolved.hasLoop) {
          resolvedPartNo = supersessionResolved.latestPartNo;
          supersessionInfo = {
            originalPartNo: supersessionResolved.originalPartNo,
            latestPartNo: supersessionResolved.latestPartNo,
            chainLength: supersessionResolved.chainLength,
            message: `Part ${supersessionResolved.originalPartNo} has been superseded by ${supersessionResolved.latestPartNo}`
          };
        }
      }

      // Step 2: Build search query
      const searchTerm = resolvedPartNo || normalizedQuery;

      let where: any = { isActive: true };

      if (searchTerm) {
        where.OR = [
          { productCode: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { aliases: { some: { aliasValue: { contains: searchTerm, mode: 'insensitive' } } } }
        ];
      }

      if (partType) {
        where.partType = partType;
      }

      if (inStockOnly) {
        where.stock = { freeStock: { gt: 0 } };
      }

      // Step 3: Determine sort order
      let orderBy: any = { productCode: 'asc' };
      if (sortBy === 'code') orderBy = { productCode: 'asc' };
      if (sortBy === 'stock') orderBy = { stock: { freeStock: 'desc' } };
      if (sortBy === 'relevance' && searchTerm) {
        // Exact match first, then contains
        orderBy = { productCode: 'asc' };
      }

      // Step 4: Fetch products
      const [products, totalCount] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            stock: true,
            aliases: true,
            equivalents: {
              include: {
                equivalentProduct: {
                  select: {
                    productCode: true,
                    description: true,
                    partType: true
                  }
                }
              },
              take: 5 // Limit equivalents shown
            }
          },
          take: limit,
          skip: offset,
          orderBy
        }),
        prisma.product.count({ where })
      ]);

      // Step 5: Resolve prices for all products
      const productIds = products.map(p => p.id);
      const priceMap = await pricingService.resolvePrices(
        productIds,
        user.dealerAccountId
      );

      // Step 6: Format results
      const results = products.map(product => {
        const priceResolution = priceMap.get(product.id);

        return {
          id: product.id,
          productCode: product.productCode,
          description: product.description,
          partType: product.partType,
          supplier: product.supplier,
          discountCode: product.discountCode,
          freeStock: product.stock?.freeStock || 0,
          yourPrice: priceResolution?.price || null,
          priceSource: priceResolution?.priceSource || null,
          tierCode: priceResolution?.tierCode || null,
          available: (priceResolution?.price || 0) > 0,
          currency: 'GBP',
          aliases: product.aliases.map(a => a.aliasValue),
          equivalents: product.equivalents.map(eq => ({
            productCode: eq.equivalentProduct.productCode,
            description: eq.equivalentProduct.description,
            partType: eq.equivalentProduct.partType,
            equivalenceType: eq.equivalenceType
          }))
        };
      });

      // Step 7: Sort by price if requested (after pricing resolution)
      if (sortBy === 'price') {
        results.sort((a, b) => {
          const priceA = a.yourPrice || Infinity;
          const priceB = b.yourPrice || Infinity;
          return priceA - priceB;
        });
      }

      return reply.send({
        results,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        },
        query: q || null,
        supersession: supersessionInfo,
        filters: {
          partType: partType || null,
          inStockOnly: inStockOnly || false
        }
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Search failed' });
    }
  });

  /**
   * GET /dealer/product/:productCode
   * Get single product detail with supersession info
   */
  fastify.get('/product/:productCode', {
    preHandler: requireAuth
  }, async (request: AuthenticatedRequest, reply) => {
    const paramsSchema = z.object({
      productCode: z.string().min(1)
    });

    const validation = paramsSchema.safeParse(request.params);

    if (!validation.success) {
      return reply.code(400).send({
        error: 'Validation Error',
        details: validation.error.issues
      });
    }

    const user = request.user;

    if (!user?.dealerAccountId) {
      return reply.code(401).send({ error: 'Not authenticated as dealer' });
    }

    const { productCode } = validation.data;
    const normalizedCode = productCode.trim().toUpperCase().replace(/\s+/g, '');

    try {
      // Check for supersession
      const supersessionResolved = await prisma.supersessionResolved.findUnique({
        where: { originalPartNo: normalizedCode }
      });

      let searchCode = normalizedCode;
      let supersessionInfo = null;

      if (supersessionResolved && !supersessionResolved.hasLoop) {
        searchCode = supersessionResolved.latestPartNo;
        supersessionInfo = {
          originalPartNo: supersessionResolved.originalPartNo,
          latestPartNo: supersessionResolved.latestPartNo,
          chainLength: supersessionResolved.chainLength,
          message: `Part ${supersessionResolved.originalPartNo} has been superseded by ${supersessionResolved.latestPartNo}`
        };
      }

      // Find product
      const product = await prisma.product.findUnique({
        where: { productCode: searchCode },
        include: {
          stock: true,
          aliases: true,
          equivalents: {
            include: {
              equivalentProduct: {
                select: {
                  productCode: true,
                  description: true,
                  partType: true,
                  stock: {
                    select: {
                      freeStock: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!product) {
        return reply.code(404).send({
          error: 'Product not found',
          productCode: normalizedCode,
          supersession: supersessionInfo
        });
      }

      // Resolve price
      const priceResolution = await pricingService.resolvePrice(
        product.id,
        user.dealerAccountId
      );

      // Resolve prices for equivalents
      const equivalentIds = product.equivalents.map(eq => eq.equivalentProductId);
      const equivalentPriceMap = equivalentIds.length > 0
        ? await pricingService.resolvePrices(equivalentIds, user.dealerAccountId)
        : new Map();

      return reply.send({
        id: product.id,
        productCode: product.productCode,
        description: product.description,
        partType: product.partType,
        supplier: product.supplier,
        discountCode: product.discountCode,
        freeStock: product.stock?.freeStock || 0,
        yourPrice: priceResolution.price,
        priceSource: priceResolution.priceSource,
        tierCode: priceResolution.tierCode,
        available: priceResolution.price > 0,
        currency: 'GBP',
        aliases: product.aliases.map(a => ({
          id: a.id,
          aliasValue: a.aliasValue,
          aliasType: a.aliasType
        })),
        equivalents: product.equivalents.map(eq => {
          const eqPrice = equivalentPriceMap.get(eq.equivalentProductId);
          return {
            productCode: eq.equivalentProduct.productCode,
            description: eq.equivalentProduct.description,
            partType: eq.equivalentProduct.partType,
            equivalenceType: eq.equivalenceType,
            freeStock: eq.equivalentProduct.stock?.freeStock || 0,
            yourPrice: eqPrice?.price || null,
            available: (eqPrice?.price || 0) > 0
          };
        }),
        supersession: supersessionInfo,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch product' });
    }
  });
};

export default dealerSearchRoutes;
