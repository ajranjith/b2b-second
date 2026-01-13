import { FastifyInstance } from 'fastify';
import { prisma, UserRole, DealerStatus, Entitlement, PartType, ActorType, ImportType, ImportStatus } from 'db';
import { z } from 'zod';
import * as bcrypt from 'bcrypt';
import { requireRole, AuthenticatedRequest } from '../lib/auth';
import { EmailService, DealerCreateSchema } from 'shared';
import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream/promises';
import { createHash } from 'crypto';

const SALT_ROUNDS = 10;

/**
 * Helper to generate a secure random password
 */
function generateSecurePassword(): string {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let retVal = "";
    for (let i = 0; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return retVal;
}

// Zod Schemas for validation
const CreateDealerSchema = DealerCreateSchema.extend({
    erpAccountNo: z.string().optional(),
    billingAddress: z.object({
        line1: z.string().optional(),
        line2: z.string().optional(),
        city: z.string().optional(),
        postcode: z.string().optional(),
        country: z.string().optional()
    }).optional(),
    mainEmail: z.string().email().optional(),
    phone: z.string().optional()
});

const UpdateDealerSchema = CreateDealerSchema.partial();

const ListDealersSchema = z.object({
    status: z.nativeEnum(DealerStatus).optional(),
    search: z.string().optional(),
    page: z.coerce.number().optional().default(1),
    limit: z.coerce.number().optional().default(10)
});

const CreateAdminUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    adminRole: z.enum(['SUPER_ADMIN', 'ADMIN', 'OPS'])
});

const UpdateUserSchema = z.object({
    email: z.string().email().optional(),
    role: z.nativeEnum(UserRole).optional(),
    isActive: z.boolean().optional(),
    adminRole: z.enum(['SUPER_ADMIN', 'ADMIN', 'OPS']).optional()
});

const ListUsersSchema = z.object({
    role: z.nativeEnum(UserRole).optional(),
    search: z.string().optional(),
    page: z.coerce.number().optional().default(1),
    limit: z.coerce.number().optional().default(10)
});

export default async function adminRoutes(server: FastifyInstance) {
    const emailService = new EmailService(prisma);

    /**
     * POST /admin/dealers - Create a new dealer
     */
    server.post('/dealers', { preHandler: requireRole('ADMIN') }, async (request: AuthenticatedRequest, reply) => {
        const data = CreateDealerSchema.parse(request.body);

        // 1. Check uniqueness
        const existingUser = await prisma.appUser.findUnique({ where: { email: data.email } });
        if (existingUser) {
            return reply.status(400).send({ error: 'Conflict', message: 'Email already exists' });
        }

        const existingDealer = await prisma.dealerAccount.findUnique({ where: { accountNo: data.accountNo } });
        if (existingDealer) {
            return reply.status(400).send({ error: 'Conflict', message: 'Account number already exists' });
        }

        // 2. Generate and hash password
        const password = generateSecurePassword();
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // 3. Create records in transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create Dealer Account
            const dealerAccount = await tx.dealerAccount.create({
                data: {
                    accountNo: data.accountNo,
                    companyName: data.companyName,
                    erpAccountNo: data.erpAccountNo,
                    status: data.status,
                    entitlement: data.entitlement,
                    mainEmail: data.mainEmail || data.email,
                    phone: data.phone,
                    billingLine1: data.billingAddress?.line1,
                    billingLine2: data.billingAddress?.line2,
                    billingCity: data.billingAddress?.city,
                    billingPostcode: data.billingAddress?.postcode,
                    billingCountry: data.billingAddress?.country,
                    contactFirstName: data.firstName,
                    contactLastName: data.lastName
                }
            });

            // Create App User
            const appUser = await tx.appUser.create({
                data: {
                    email: data.email,
                    passwordHash,
                    role: UserRole.DEALER,
                    isActive: data.status === DealerStatus.ACTIVE
                }
            });

            // Link them via DealerUser
            await tx.dealerUser.create({
                data: {
                    dealerAccountId: dealerAccount.id,
                    userId: appUser.id,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    isPrimary: true
                }
            });

            // Create Band Assignments based on Entitlement
            const assignments = [];
            if (data.entitlement === Entitlement.SHOW_ALL || data.entitlement === Entitlement.GENUINE_ONLY) {
                if (data.bands?.genuine) {
                    assignments.push({
                        dealerAccountId: dealerAccount.id,
                        partType: PartType.GENUINE,
                        bandCode: data.bands.genuine
                    });
                }
            }
            if (data.entitlement === Entitlement.SHOW_ALL || data.entitlement === Entitlement.AFTERMARKET_ONLY) {
                if (data.bands?.aftermarket) {
                    assignments.push({
                        dealerAccountId: dealerAccount.id,
                        partType: PartType.AFTERMARKET,
                        bandCode: data.bands.aftermarket
                    });
                }
                if (data.bands?.branded) {
                    assignments.push({
                        dealerAccountId: dealerAccount.id,
                        partType: PartType.BRANDED,
                        bandCode: data.bands.branded
                    });
                }
            }

            if (assignments.length > 0) {
                await tx.dealerBandAssignment.createMany({ data: assignments });
            }

            // Audit Log
            await tx.auditLog.create({
                data: {
                    actorType: ActorType.ADMIN,
                    actorUserId: request.user!.userId,
                    action: 'CREATE_DEALER',
                    entityType: 'DEALER_ACCOUNT',
                    entityId: dealerAccount.id,
                    afterJson: { accountNo: data.accountNo, email: data.email }
                }
            });

            return { dealerAccount, appUser };
        });

        // 4. Send Welcome Email (out of transaction but async)
        await emailService.sendWelcomeEmail(data.email, data.firstName, password);

        return reply.status(201).send({
            message: 'Dealer created successfully',
            dealer: {
                id: result.dealerAccount.id,
                accountNo: result.dealerAccount.accountNo,
                email: result.appUser.email,
                tempPassword: '****' // Masked
            }
        });
    });

    /**
     * GET /admin/dealers - List all dealers (paginated)
     */
    server.get('/dealers', { preHandler: requireRole('ADMIN') }, async (request, reply) => {
        const query = ListDealersSchema.parse(request.query);
        const skip = (query.page - 1) * query.limit;

        const where: any = {};
        if (query.status) where.status = query.status;
        if (query.search) {
            where.OR = [
                { accountNo: { contains: query.search, mode: 'insensitive' } },
                { companyName: { contains: query.search, mode: 'insensitive' } },
                { mainEmail: { contains: query.search, mode: 'insensitive' } }
            ];
        }

        const [dealers, total] = await Promise.all([
            prisma.dealerAccount.findMany({
                where,
                include: {
                    users: {
                        include: { user: { select: { email: true, lastLoginAt: true, isActive: true } } }
                    }
                },
                skip,
                take: query.limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.dealerAccount.count({ where })
        ]);

        return {
            dealers,
            meta: {
                total,
                page: query.page,
                limit: query.limit,
                totalPages: Math.ceil(total / query.limit)
            }
        };
    });

    /**
     * GET /admin/dealers/:id - Get single dealer
     */
    server.get('/dealers/:id', { preHandler: requireRole('ADMIN') }, async (request: any, reply) => {
        const { id } = request.params;

        const dealer = await prisma.dealerAccount.findUnique({
            where: { id },
            include: {
                users: {
                    include: { user: { select: { email: true, lastLoginAt: true, isActive: true, createdAt: true } } }
                },
                bandAssignments: true,
                orders: {
                    take: 5,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!dealer) {
            return reply.status(404).send({ error: 'Not Found', message: 'Dealer not found' });
        }

        return dealer;
    });

    /**
     * PATCH /admin/dealers/:id - Update dealer
     */
    server.patch('/dealers/:id', { preHandler: requireRole('ADMIN') }, async (request: AuthenticatedRequest, reply) => {
        const { id } = request.params as any;
        const data = UpdateDealerSchema.parse(request.body);

        const currentDealer = await prisma.dealerAccount.findUnique({
            where: { id },
            include: {
                users: { include: { user: true } },
                bandAssignments: true
            }
        });
        if (!currentDealer) {
            return reply.status(404).send({ error: 'Not Found', message: 'Dealer not found' });
        }

        await prisma.$transaction(async (tx) => {
            // Update Dealer Account
            const updatedAccount = await tx.dealerAccount.update({
                where: { id },
                data: {
                    companyName: data.companyName,
                    erpAccountNo: data.erpAccountNo,
                    status: data.status,
                    entitlement: data.entitlement,
                    mainEmail: data.mainEmail,
                    phone: data.phone,
                    billingLine1: data.billingAddress?.line1,
                    billingLine2: data.billingAddress?.line2,
                    billingCity: data.billingAddress?.city,
                    billingPostcode: data.billingAddress?.postcode,
                    billingCountry: data.billingAddress?.country,
                    contactFirstName: data.firstName,
                    contactLastName: data.lastName
                }
            });

            // Update associated User's isActive if status changed
            if (data.status && currentDealer.users[0]?.user) {
                await tx.appUser.update({
                    where: { id: currentDealer.users[0].userId },
                    data: { isActive: data.status === DealerStatus.ACTIVE }
                });
            }

            // Update Band Assignments if bands or entitlement changed
            if (data.bands || data.entitlement) {
                const entitlement = data.entitlement || currentDealer.entitlement;

                // Delete existing ones
                await tx.dealerBandAssignment.deleteMany({ where: { dealerAccountId: id } });

                const assignments = [];
                if (entitlement === Entitlement.SHOW_ALL || entitlement === Entitlement.GENUINE_ONLY) {
                    const genuineBand = data.bands?.genuine || currentDealer.bandAssignments.find(b => b.partType === PartType.GENUINE)?.bandCode;
                    if (genuineBand) {
                        assignments.push({
                            dealerAccountId: id,
                            partType: PartType.GENUINE,
                            bandCode: genuineBand
                        });
                    }
                }
                if (entitlement === Entitlement.SHOW_ALL || entitlement === Entitlement.AFTERMARKET_ONLY) {
                    const aftBand = data.bands?.aftermarket || currentDealer.bandAssignments.find(b => b.partType === PartType.AFTERMARKET)?.bandCode;
                    if (aftBand) {
                        assignments.push({
                            dealerAccountId: id,
                            partType: PartType.AFTERMARKET,
                            bandCode: aftBand
                        });
                    }
                    const brandedBand = data.bands?.branded || currentDealer.bandAssignments.find(b => b.partType === PartType.BRANDED)?.bandCode;
                    if (brandedBand) {
                        assignments.push({
                            dealerAccountId: id,
                            partType: PartType.BRANDED,
                            bandCode: brandedBand
                        });
                    }
                }

                if (assignments.length > 0) {
                    await tx.dealerBandAssignment.createMany({ data: assignments });
                }
            }

            // Notification for Suspension
            if (data.status === DealerStatus.SUSPENDED && currentDealer.status !== DealerStatus.SUSPENDED) {
                const primaryUser = currentDealer.users[0];
                if (primaryUser?.user.email) {
                    await emailService.sendAccountSuspendedNotification(primaryUser.user.email, primaryUser.firstName || 'Dealer');
                }
            }

            // Audit Log
            await tx.auditLog.create({
                data: {
                    actorType: ActorType.ADMIN,
                    actorUserId: request.user!.userId,
                    action: 'UPDATE_DEALER',
                    entityType: 'DEALER_ACCOUNT',
                    entityId: id,
                    afterJson: { data }
                }
            });
        });

        return { message: 'Dealer updated successfully' };
    });

    /**
     * POST /admin/dealers/:id/reset-password - Reset password
     */
    server.post('/dealers/:id/reset-password', { preHandler: requireRole('ADMIN') }, async (request: AuthenticatedRequest, reply) => {
        const { id } = request.params as any;

        const dealer = await prisma.dealerAccount.findUnique({
            where: { id },
            include: { users: { include: { user: true } } }
        });

        if (!dealer || dealer.users.length === 0) {
            return reply.status(404).send({ error: 'Not Found', message: 'Dealer user not found' });
        }

        const primaryUser = dealer.users[0];
        const newPassword = generateSecurePassword();
        const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

        await prisma.$transaction(async (tx) => {
            await tx.appUser.update({
                where: { id: primaryUser.userId },
                data: { passwordHash }
            });

            await tx.auditLog.create({
                data: {
                    actorType: ActorType.ADMIN,
                    actorUserId: request.user!.userId,
                    action: 'RESET_PASSWORD',
                    entityType: 'USER',
                    entityId: primaryUser.userId,
                    afterJson: { dealerAccountId: id }
                }
            });
        });

        await emailService.sendPasswordResetEmail(primaryUser.user.email, primaryUser.firstName || 'Dealer', newPassword);

        return { message: 'Password reset successfully' };
    });

    /**
     * DELETE /admin/dealers/:id - Soft delete
     */
    server.delete('/dealers/:id', { preHandler: requireRole('ADMIN') }, async (request: AuthenticatedRequest, reply) => {
        const { id } = request.params as any;

        const dealer = await prisma.dealerAccount.findUnique({
            where: { id },
            include: { users: true }
        });
        if (!dealer) {
            return reply.status(404).send({ error: 'Not Found', message: 'Dealer not found' });
        }

        await prisma.$transaction(async (tx) => {
            await tx.dealerAccount.update({
                where: { id },
                data: { status: DealerStatus.INACTIVE }
            });

            if (dealer.users[0]) {
                await tx.appUser.update({
                    where: { id: dealer.users[0].userId },
                    data: { isActive: false }
                });
            }

            await tx.auditLog.create({
                data: {
                    actorType: ActorType.ADMIN,
                    actorUserId: request.user!.userId,
                    action: 'DELETE_DEALER',
                    entityType: 'DEALER_ACCOUNT',
                    entityId: id,
                    afterJson: { previousStatus: dealer.status }
                }
            });
        });

        return { message: 'Dealer deactivated successfully' };
    });

    /**
     * TEMPLATE MANAGEMENT
     */

    // GET /admin/templates - List all active templates
    server.get('/templates', { preHandler: requireRole('ADMIN') }, async (request, reply) => {
        const templates = await prisma.uploadTemplate.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });

        return templates.map(t => ({
            ...t,
            downloadUrl: `/admin/templates/${t.id}/download`
        }));
    });

    // GET /admin/templates/:id/download - Download template file
    server.get('/templates/:id/download', { preHandler: requireRole('ADMIN') }, async (request, reply) => {
        const { id } = request.params as any;
        const template = await prisma.uploadTemplate.findUnique({ where: { id } });

        if (!template || !template.isActive) {
            return reply.status(404).send({ error: 'Not Found', message: 'Template not found' });
        }

        const absolutePath = path.resolve(process.cwd(), template.blobPath);
        if (!fs.existsSync(absolutePath)) {
            return reply.status(404).send({ error: 'Not Found', message: 'Template file missing on disk' });
        }

        const stream = fs.createReadStream(absolutePath);
        reply.type('application/octet-stream');
        reply.header('Content-Disposition', `attachment; filename="${template.fileName}"`);
        return reply.send(stream);
    });

    // POST /admin/templates - Create/upload new template
    server.post('/templates', { preHandler: requireRole('ADMIN') }, async (request, reply) => {
        const data = await (request as any).file();
        if (!data) {
            return reply.status(400).send({ error: 'Bad Request', message: 'No file uploaded' });
        }

        const templateName = data.fields.templateName?.value;
        const description = data.fields.description?.value;

        if (!templateName) {
            return reply.status(400).send({ error: 'Bad Request', message: 'templateName is required' });
        }

        const uploadDir = path.join(process.cwd(), 'infra/uploads/templates');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fileName = data.filename;
        const blobPath = path.join('infra/uploads/templates', `${Date.now()}-${fileName}`);
        const absolutePath = path.resolve(process.cwd(), blobPath);

        await pipeline(data.file, fs.createWriteStream(absolutePath));

        const template = await prisma.uploadTemplate.create({
            data: {
                templateName,
                description,
                fileName,
                blobPath,
                isActive: true
            }
        });

        await prisma.auditLog.create({
            data: {
                actorType: ActorType.ADMIN,
                actorUserId: (request as AuthenticatedRequest).user!.userId,
                action: 'CREATE_TEMPLATE',
                entityType: 'UPLOAD_TEMPLATE',
                entityId: template.id,
                afterJson: { templateName, fileName }
            }
        });

        return reply.status(201).send(template);
    });

    // DELETE /admin/templates/:id - Deactivate template
    server.delete('/templates/:id', { preHandler: requireRole('ADMIN') }, async (request, reply) => {
        const { id } = request.params as any;

        const template = await prisma.uploadTemplate.findUnique({ where: { id } });
        if (!template) {
            return reply.status(404).send({ error: 'Not Found', message: 'Template not found' });
        }

        await prisma.uploadTemplate.update({
            where: { id },
            data: { isActive: false }
        });

        await prisma.auditLog.create({
            data: {
                actorType: ActorType.ADMIN,
                actorUserId: (request as AuthenticatedRequest).user!.userId,
                action: 'DEACTIVATE_TEMPLATE',
                entityType: 'UPLOAD_TEMPLATE',
                entityId: id,
                afterJson: { templateName: template.templateName }
            }
        });

        return { message: 'Template deactivated successfully' };
    });

    /**
     * IMPORT HISTORY & MANAGEMENT
     */

    // GET /admin/imports - List all import batches
    server.get('/imports', { preHandler: requireRole('ADMIN') }, async (request, reply) => {
        const querySchema = z.object({
            type: z.nativeEnum(ImportType).optional(),
            status: z.nativeEnum(ImportStatus).optional(),
            page: z.coerce.number().optional().default(1),
            limit: z.coerce.number().optional().default(10)
        });

        const { type, status, page, limit } = querySchema.parse(request.query);
        const skip = (page - 1) * limit;

        const where: any = {};
        if (type) where.importType = type;
        if (status) where.status = status;

        const [batches, total] = await Promise.all([
            prisma.importBatch.findMany({
                where,
                include: { uploadedBy: { select: { email: true } } },
                orderBy: { startedAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.importBatch.count({ where })
        ]);

        return {
            batches,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };
    });

    // GET /admin/imports/:id - Get import details with error summary
    server.get('/imports/:id', { preHandler: requireRole('ADMIN') }, async (request, reply) => {
        const { id } = request.params as any;

        const batch = await prisma.importBatch.findUnique({
            where: { id },
            include: {
                uploadedBy: { select: { email: true } },
                _count: { select: { errors: true } }
            }
        });

        if (!batch) {
            return reply.status(404).send({ error: 'Not Found', message: 'Import batch not found' });
        }

        // Summary of errors by code
        const errorSummary = await prisma.importError.groupBy({
            by: ['errorCode'],
            where: { batchId: id },
            _count: { _all: true }
        });

        // First 100 errors for quick preview
        const sampleErrors = await prisma.importError.findMany({
            where: { batchId: id },
            orderBy: { rowNumber: 'asc' },
            take: 100
        });

        return {
            ...batch,
            errorSummary: errorSummary.map(es => ({
                errorCode: es.errorCode || 'UNKNOWN',
                count: es._count._all
            })),
            sampleErrors
        };
    });

    // GET /admin/imports/:id/errors - Paginated errors for a batch
    server.get('/imports/:id/errors', { preHandler: requireRole('ADMIN') }, async (request, reply) => {
        const { id } = request.params as any;
        const querySchema = z.object({
            page: z.coerce.number().optional().default(1),
            limit: z.coerce.number().optional().default(50)
        });

        const { page, limit } = querySchema.parse(request.query);
        const skip = (page - 1) * limit;

        const [errors, total] = await Promise.all([
            prisma.importError.findMany({
                where: { batchId: id },
                orderBy: { rowNumber: 'asc' },
                skip,
                take: limit
            }),
            prisma.importError.count({ where: { batchId: id } })
        ]);

        return {
            errors,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };
    });

    // POST /admin/imports/upload - Manual file upload trigger
    server.post('/imports/upload', { preHandler: requireRole('ADMIN') }, async (request, reply) => {
        const data = await (request as any).file();
        if (!data) {
            return reply.status(400).send({ error: 'Bad Request', message: 'No file uploaded' });
        }

        const importType = data.fields.importType?.value as ImportType;
        if (!importType || !Object.values(ImportType).includes(importType)) {
            return reply.status(400).send({ error: 'Bad Request', message: 'Valid importType is required' });
        }

        const uploadDir = path.join(process.cwd(), 'infra/uploads/imports');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fileName = data.filename;
        const filePath = path.join('infra/uploads/imports', `${Date.now()}-${fileName}`);
        const absolutePath = path.resolve(process.cwd(), filePath);

        // Buffer file to calculate hash
        const buffer = await data.toBuffer();
        const fileHash = createHash('md5').update(buffer).digest('hex');

        // Check for duplicate hash in last 24h? (Optional)
        // const existing = await prisma.importBatch.findFirst({ where: { fileHash, startedAt: { gte: new Date(Date.now() - 86400000) } } });

        await fs.promises.writeFile(absolutePath, buffer);

        const batch = await prisma.importBatch.create({
            data: {
                importType,
                fileName,
                fileHash,
                filePath,
                status: ImportStatus.PROCESSING,
                uploadedById: (request as AuthenticatedRequest).user!.userId
            }
        });

        await prisma.auditLog.create({
            data: {
                actorType: ActorType.ADMIN,
                actorUserId: (request as AuthenticatedRequest).user!.userId,
                action: 'UPLOAD_IMPORT_FILE',
                entityType: 'IMPORT_BATCH',
                entityId: batch.id,
                afterJson: { importType, fileName }
            }
        });

        // Trigger worker asynchronously in Phase 2
        // For now, we return the processing batch
        return reply.status(201).send(batch);
    });

    /**
     * USER MANAGEMENT
     */

    // GET /admin/users - List all users
    server.get('/users', { preHandler: requireRole('ADMIN') }, async (request, reply) => {
        const { role, search, page, limit } = ListUsersSchema.parse(request.query);
        const skip = (page - 1) * limit;

        const where: any = {};
        if (role) where.role = role;
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                {
                    dealerUser: {
                        OR: [
                            { firstName: { contains: search, mode: 'insensitive' } },
                            { lastName: { contains: search, mode: 'insensitive' } },
                            { dealerAccount: { companyName: { contains: search, mode: 'insensitive' } } }
                        ]
                    }
                }
            ];
        }

        const [users, total] = await Promise.all([
            prisma.appUser.findMany({
                where,
                include: {
                    dealerUser: {
                        include: {
                            dealerAccount: {
                                select: {
                                    id: true,
                                    accountNo: true,
                                    companyName: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.appUser.count({ where })
        ]);

        return {
            users,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };
    });

    // POST /admin/users/admin - Create admin user
    server.post('/users/admin', { preHandler: requireRole('ADMIN') }, async (request, reply) => {
        const { email, password, adminRole } = CreateAdminUserSchema.parse(request.body);

        const existing = await prisma.appUser.findUnique({ where: { email } });
        if (existing) {
            return reply.status(400).send({ error: 'Conflict', message: 'User already exists' });
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        const user = await prisma.appUser.create({
            data: {
                email,
                passwordHash,
                role: UserRole.ADMIN,
                adminRole: adminRole as any,
                isActive: true
            }
        });

        // Send welcome email
        try {
            await emailService.sendWelcomeEmail(email, 'Administrator', password);
        } catch (err) {
            server.log.error(err, `Email failed for new admin ${email}:`);
        }

        await prisma.auditLog.create({
            data: {
                actorType: ActorType.ADMIN,
                actorUserId: (request as AuthenticatedRequest).user!.userId,
                action: 'CREATE_USER',
                entityType: 'USER',
                entityId: user.id,
                afterJson: { email, role: 'ADMIN', adminRole }
            }
        });

        return reply.status(201).send({ id: user.id, email: user.email, role: user.role, adminRole: user.adminRole });
    });

    // PATCH /admin/users/:id - Update user
    server.patch('/users/:id', { preHandler: requireRole('ADMIN') }, async (request, reply) => {
        const { id } = request.params as any;
        const data = UpdateUserSchema.parse(request.body);

        const user = await prisma.appUser.findUnique({ where: { id } });
        if (!user) {
            return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
        }

        const updatedUser = await prisma.appUser.update({
            where: { id },
            data: {
                email: data.email,
                role: data.role,
                isActive: data.isActive,
                adminRole: data.adminRole as any
            }
        });

        await prisma.auditLog.create({
            data: {
                actorType: ActorType.ADMIN,
                actorUserId: (request as AuthenticatedRequest).user!.userId,
                action: 'UPDATE_USER',
                entityType: 'USER',
                entityId: id,
                beforeJson: JSON.parse(JSON.stringify(user)),
                afterJson: JSON.parse(JSON.stringify(updatedUser))
            }
        });

        return updatedUser;
    });

    // POST /admin/users/:id/reset-password - Reset password
    server.post('/users/:id/reset-password', { preHandler: requireRole('ADMIN') }, async (request, reply) => {
        const { id } = request.params as any;

        const user = await prisma.appUser.findUnique({ where: { id } });
        if (!user) {
            return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
        }

        const newPassword = generateSecurePassword();
        const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

        await prisma.appUser.update({
            where: { id },
            data: { passwordHash }
        });

        // Send email
        try {
            await emailService.sendPasswordResetEmail(user.email, 'Administrator', newPassword);
        } catch (err) {
            server.log.error(err, `Password reset email failed for ${user.email}:`);
        }

        await prisma.auditLog.create({
            data: {
                actorType: ActorType.ADMIN,
                actorUserId: (request as AuthenticatedRequest).user!.userId,
                action: 'PASSWORD_RESET',
                entityType: 'USER',
                entityId: id,
                afterJson: { email: user.email }
            }
        });

        return { message: 'Password reset successfully. New password sent via email.' };
    });

    // DELETE /admin/users/:id - Deactivate user
    server.delete('/users/:id', { preHandler: requireRole('ADMIN') }, async (request, reply) => {
        const { id } = request.params as any;

        const user = await prisma.appUser.findUnique({ where: { id } });
        if (!user) {
            return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
        }

        await prisma.appUser.update({
            where: { id },
            data: { isActive: false }
        });

        await prisma.auditLog.create({
            data: {
                actorType: ActorType.ADMIN,
                actorUserId: (request as AuthenticatedRequest).user!.userId,
                action: 'DEACTIVATE_USER',
                entityType: 'USER',
                entityId: id,
                afterJson: { email: user.email }
            }
        });

        return { message: 'User deactivated successfully' };
    });

    /**
     * DASHBOARD ANALYTICS
     */

    // GET /admin/dashboard - Dashboard statistics
    server.get('/dashboard', { preHandler: requireRole('ADMIN') }, async (request, reply) => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as start of week
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // 1. Dealer Stats
        const dealerStats = await prisma.dealerAccount.groupBy({
            by: ['status'],
            _count: { _all: true }
        });

        const dealers = {
            total: 0,
            active: 0,
            inactive: 0,
            suspended: 0
        };

        dealerStats.forEach(stat => {
            const count = stat._count._all;
            dealers.total += count;
            if (stat.status === DealerStatus.ACTIVE) dealers.active = count;
            if (stat.status === DealerStatus.INACTIVE) dealers.inactive = count;
            if (stat.status === DealerStatus.SUSPENDED) dealers.suspended = count;
        });

        // 2. Order Metrics
        const [todayOrders, weekOrders, monthOrders, totalRevenueData] = await Promise.all([
            prisma.orderHeader.count({ where: { createdAt: { gte: startOfToday } } }),
            prisma.orderHeader.count({ where: { createdAt: { gte: startOfWeek } } }),
            prisma.orderHeader.count({ where: { createdAt: { gte: startOfMonth } } }),
            prisma.orderHeader.aggregate({ _sum: { total: true } })
        ]);

        const orders = {
            today: todayOrders,
            thisWeek: weekOrders,
            thisMonth: monthOrders,
            totalRevenue: totalRevenueData._sum.total || 0
        };

        // 3. Product Stats
        const [productStats, lowStockCount] = await Promise.all([
            prisma.product.groupBy({
                by: ['partType'],
                _count: { _all: true }
            }),
            prisma.productStock.count({ where: { freeStock: { lt: 10 } } })
        ]);

        const products = {
            total: 0,
            genuine: 0,
            aftermarket: 0,
            branded: 0,
            lowStock: lowStockCount
        };

        productStats.forEach(stat => {
            const count = stat._count._all;
            products.total += count;
            if (stat.partType === PartType.GENUINE) products.genuine = count;
            if (stat.partType === PartType.AFTERMARKET) products.aftermarket = count;
            if (stat.partType === PartType.BRANDED) products.branded = count;
        });

        // 4. Import Stats
        const [todayImports, lastSuccess, failedToday] = await Promise.all([
            prisma.importBatch.count({ where: { startedAt: { gte: startOfToday } } }),
            prisma.importBatch.findFirst({
                where: { status: { in: [ImportStatus.SUCCEEDED, ImportStatus.SUCCEEDED_WITH_ERRORS] } },
                orderBy: { completedAt: 'desc' },
                select: { completedAt: true }
            }),
            prisma.importBatch.count({
                where: {
                    startedAt: { gte: startOfToday },
                    status: ImportStatus.FAILED
                }
            })
        ]);

        const imports = {
            todayCount: todayImports,
            lastSuccessful: lastSuccess?.completedAt || null,
            failedToday: failedToday
        };

        // 5. Recent Orders
        const recentOrders = await prisma.orderHeader.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                dealerAccount: { select: { companyName: true, accountNo: true } }
            }
        });

        // 6. Top Dealers (this month)
        const topDealersRaw = await prisma.orderHeader.groupBy({
            by: ['dealerAccountId'],
            where: { createdAt: { gte: startOfMonth } },
            _count: { _all: true },
            orderBy: { _count: { dealerAccountId: 'desc' } },
            take: 5
        });

        const topDealers = await Promise.all(topDealersRaw.map(async (td) => {
            const dealer = await prisma.dealerAccount.findUnique({
                where: { id: td.dealerAccountId },
                select: { companyName: true, accountNo: true }
            });
            return {
                ...dealer,
                orderCount: td._count._all
            };
        }));

        return {
            dealers,
            orders,
            products,
            imports,
            recentOrders,
            topDealers
        };
    });
}
