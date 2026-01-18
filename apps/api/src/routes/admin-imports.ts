import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { PrismaClient, ImportType, ImportStatus } from '@prisma/client';
import { requireAuth, AuthenticatedRequest } from '../lib/auth';
import * as multer from 'fastify-multer';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  dest: path.join(process.cwd(), 'uploads'),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

/**
 * Admin import endpoints
 */
const adminImportsRoutes: FastifyPluginAsync = async (fastify) => {
  // Register multer
  fastify.register(multer.contentParser);

  /**
   * POST /admin/import/products
   * Upload and import products/pricing/stock (DGS format)
   */
  fastify.post('/products', {
    preHandler: [
      requireAuth,
      upload.single('file')
    ]
  }, async (request: AuthenticatedRequest, reply) => {
    const user = request.user;

    if (user?.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Admin access required' });
    }

    const file = (request as any).file;

    if (!file) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    try {
      const filePath = file.path;

      // Run import worker script
      const workerPath = path.join(process.cwd(), '../worker/src/importProductsDGS.ts');
      const command = `ts-node "${workerPath}" --file "${filePath}"`;

      fastify.log.info(`Running product import: ${command}`);

      // Execute in background (async)
      const importPromise = execAsync(command);

      // Return immediately with batch ID
      return reply.send({
        success: true,
        message: 'Product import started',
        file: {
          originalName: file.originalname,
          size: file.size,
          uploadedAt: new Date()
        }
      });
    } catch (error: any) {
      fastify.log.error(error);

      // Clean up uploaded file
      if ((request as any).file) {
        fs.unlinkSync((request as any).file.path);
      }

      return reply.code(500).send({ error: 'Import failed to start' });
    }
  });

  /**
   * POST /admin/import/dealers
   * Upload and import dealer accounts with tier assignments
   */
  fastify.post('/dealers', {
    preHandler: [
      requireAuth,
      upload.single('file')
    ]
  }, async (request: AuthenticatedRequest, reply) => {
    const user = request.user;

    if (user?.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Admin access required' });
    }

    const file = (request as any).file;

    if (!file) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    try {
      const filePath = file.path;

      // Run import worker script
      const workerPath = path.join(process.cwd(), '../worker/src/importDealers.ts');
      const command = `ts-node "${workerPath}" --file "${filePath}"`;

      fastify.log.info(`Running dealer import: ${command}`);

      execAsync(command); // Run in background

      return reply.send({
        success: true,
        message: 'Dealer import started',
        file: {
          originalName: file.originalname,
          size: file.size,
          uploadedAt: new Date()
        }
      });
    } catch (error: any) {
      fastify.log.error(error);

      if ((request as any).file) {
        fs.unlinkSync((request as any).file.path);
      }

      return reply.code(500).send({ error: 'Import failed to start' });
    }
  });

  /**
   * POST /admin/import/supersessions
   * Upload and import supersessions
   */
  fastify.post('/supersessions', {
    preHandler: [
      requireAuth,
      upload.single('file')
    ]
  }, async (request: AuthenticatedRequest, reply) => {
    const user = request.user;

    if (user?.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Admin access required' });
    }

    const file = (request as any).file;

    if (!file) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    try {
      const filePath = file.path;

      const workerPath = path.join(process.cwd(), '../worker/src/importSupersessions.ts');
      const command = `ts-node "${workerPath}" --file "${filePath}"`;

      fastify.log.info(`Running supersession import: ${command}`);

      execAsync(command); // Run in background

      return reply.send({
        success: true,
        message: 'Supersession import started',
        file: {
          originalName: file.originalname,
          size: file.size,
          uploadedAt: new Date()
        }
      });
    } catch (error: any) {
      fastify.log.error(error);

      if ((request as any).file) {
        fs.unlinkSync((request as any).file.path);
      }

      return reply.code(500).send({ error: 'Import failed to start' });
    }
  });

  /**
   * POST /admin/import/special-prices
   * Upload and import special prices with date range
   */
  fastify.post('/special-prices', {
    preHandler: [
      requireAuth,
      upload.single('file')
    ]
  }, async (request: AuthenticatedRequest, reply) => {
    const bodySchema = z.object({
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
    });

    const validation = bodySchema.safeParse(request.body);

    if (!validation.success) {
      return reply.code(400).send({
        error: 'Validation Error',
        message: 'startDate and endDate are required (format: YYYY-MM-DD)',
        details: validation.error.issues
      });
    }

    const user = request.user;

    if (user?.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Admin access required' });
    }

    const file = (request as any).file;

    if (!file) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    const { startDate, endDate } = validation.data;

    try {
      const filePath = file.path;

      const workerPath = path.join(process.cwd(), '../worker/src/importSpecialPrices.ts');
      const command = `ts-node "${workerPath}" --file "${filePath}" --start-date "${startDate}" --end-date "${endDate}"`;

      fastify.log.info(`Running special price import: ${command}`);

      execAsync(command); // Run in background

      return reply.send({
        success: true,
        message: 'Special price import started',
        file: {
          originalName: file.originalname,
          size: file.size,
          uploadedAt: new Date()
        },
        dateRange: {
          startDate,
          endDate
        }
      });
    } catch (error: any) {
      fastify.log.error(error);

      if ((request as any).file) {
        fs.unlinkSync((request as any).file.path);
      }

      return reply.code(500).send({ error: 'Import failed to start' });
    }
  });

  /**
   * POST /admin/import/backorders
   * Upload and import backorders
   */
  fastify.post('/backorders', {
    preHandler: [
      requireAuth,
      upload.single('file')
    ]
  }, async (request: AuthenticatedRequest, reply) => {
    const user = request.user;

    if (user?.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Admin access required' });
    }

    const file = (request as any).file;

    if (!file) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    try {
      const filePath = file.path;

      const workerPath = path.join(process.cwd(), '../worker/src/importBackorders.ts');
      const command = `ts-node "${workerPath}" --file "${filePath}"`;

      fastify.log.info(`Running backorder import: ${command}`);

      execAsync(command); // Run in background

      return reply.send({
        success: true,
        message: 'Backorder import started',
        file: {
          originalName: file.originalname,
          size: file.size,
          uploadedAt: new Date()
        }
      });
    } catch (error: any) {
      fastify.log.error(error);

      if ((request as any).file) {
        fs.unlinkSync((request as any).file.path);
      }

      return reply.code(500).send({ error: 'Import failed to start' });
    }
  });

  /**
   * POST /admin/import/order-status
   * Upload and import order status updates
   */
  fastify.post('/order-status', {
    preHandler: [
      requireAuth,
      upload.single('file')
    ]
  }, async (request: AuthenticatedRequest, reply) => {
    const user = request.user;

    if (user?.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Admin access required' });
    }

    const file = (request as any).file;

    if (!file) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    try {
      // TODO: Implement order status import worker
      // For now, return not implemented

      return reply.code(501).send({
        error: 'Not Implemented',
        message: 'Order status import worker not yet implemented'
      });
    } catch (error: any) {
      fastify.log.error(error);

      if ((request as any).file) {
        fs.unlinkSync((request as any).file.path);
      }

      return reply.code(500).send({ error: 'Import failed to start' });
    }
  });

  /**
   * GET /admin/import/batches
   * List all import batches
   */
  fastify.get('/batches', {
    preHandler: requireAuth
  }, async (request: AuthenticatedRequest, reply) => {
    const querySchema = z.object({
      limit: z.coerce.number().int().min(1).max(100).optional().default(20),
      offset: z.coerce.number().int().min(0).optional().default(0),
      importType: z.nativeEnum(ImportType).optional(),
      status: z.nativeEnum(ImportStatus).optional()
    });

    const validation = querySchema.safeParse(request.query);

    if (!validation.success) {
      return reply.code(400).send({
        error: 'Validation Error',
        details: validation.error.issues
      });
    }

    const user = request.user;

    if (user?.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Admin access required' });
    }

    const { limit, offset, importType, status } = validation.data;

    try {
      const where: any = {};
      if (importType) where.importType = importType;
      if (status) where.status = status;

      const [batches, totalCount] = await Promise.all([
        prisma.importBatch.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        }),
        prisma.importBatch.count({ where })
      ]);

      return reply.send({
        batches: batches.map(batch => ({
          id: batch.id,
          importType: batch.importType,
          fileName: batch.fileName,
          fileHash: batch.fileHash,
          status: batch.status,
          totalRows: batch.totalRows,
          validRows: batch.validRows,
          invalidRows: batch.invalidRows,
          createdAt: batch.createdAt,
          completedAt: batch.completedAt
        })),
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch import batches' });
    }
  });

  /**
   * GET /admin/import/batches/:batchId/errors
   * Get errors for a specific import batch
   */
  fastify.get<{ Params: { batchId: string } }>('/batches/:batchId/errors', {
    preHandler: requireAuth
  }, async (request: AuthenticatedRequest, reply) => {
    const user = request.user;

    if (user?.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Admin access required' });
    }

    const { batchId } = request.params;

    try {
      const errors = await prisma.importError.findMany({
        where: { batchId },
        orderBy: { rowNumber: 'asc' }
      });

      return reply.send({
        batchId,
        errors: errors.map(error => ({
          id: error.id,
          rowNumber: error.rowNumber,
          columnName: error.columnName,
          errorCode: error.errorCode,
          errorMessage: error.errorMessage,
          rawRowJson: error.rawRowJson,
          createdAt: error.createdAt
        })),
        totalErrors: errors.length
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch import errors' });
    }
  });
};

export default adminImportsRoutes;
