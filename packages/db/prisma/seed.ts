import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole, AdminRole, DealerStatus, PartType, Entitlement } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

const SALT_ROUNDS = 10;

async function main() {
    console.log('🌱 Starting database seed...\n');

    try {
        // 1. Create Admin User
        console.log('👤 Creating admin user...');
        const adminPasswordHash = await bcrypt.hash('Admin123!', SALT_ROUNDS);

        const admin = await prisma.appUser.upsert({
            where: { email: 'admin@hotbray.com' },
            update: {
                passwordHash: adminPasswordHash,
                role: UserRole.ADMIN,
                adminRole: AdminRole.SUPER_ADMIN,
                isActive: true
            },
            create: {
                email: 'admin@hotbray.com',
                passwordHash: adminPasswordHash,
                role: UserRole.ADMIN,
                adminRole: AdminRole.SUPER_ADMIN,
                isActive: true
            }
        });
        console.log(`✅ Admin user created: ${admin.email}`);

        // 2. Create Dealer Account
        console.log('\n🏢 Creating dealer account...');
        const dealerAccount = await prisma.dealerAccount.upsert({
            where: { accountNo: 'DEAL001' },
            update: {
                companyName: 'Test Dealer Ltd',
                status: DealerStatus.ACTIVE,
                entitlement: Entitlement.SHOW_ALL,
                erpAccountNo: 'ERP001',
                contactFirstName: 'John',
                contactLastName: 'Smith',
                mainEmail: 'dealer@test.com'
            },
            create: {
                accountNo: 'DEAL001',
                companyName: 'Test Dealer Ltd',
                status: DealerStatus.ACTIVE,
                entitlement: Entitlement.SHOW_ALL,
                erpAccountNo: 'ERP001',
                contactFirstName: 'John',
                contactLastName: 'Smith',
                mainEmail: 'dealer@test.com'
            }
        });
        console.log(`✅ Dealer account created: ${dealerAccount.accountNo} - ${dealerAccount.companyName}`);

        // 3. Create Dealer User
        console.log('\n👥 Creating dealer user...');
        const dealerPasswordHash = await bcrypt.hash('Dealer123!', SALT_ROUNDS);

        const dealerAppUser = await prisma.appUser.upsert({
            where: { email: 'dealer@test.com' },
            update: {
                passwordHash: dealerPasswordHash,
                role: UserRole.DEALER,
                isActive: true
            },
            create: {
                email: 'dealer@test.com',
                passwordHash: dealerPasswordHash,
                role: UserRole.DEALER,
                isActive: true
            }
        });
        console.log(`✅ Dealer app user created: ${dealerAppUser.email}`);

        // Link dealer user to account
        const existingDealerUser = await prisma.dealerUser.findUnique({
            where: { userId: dealerAppUser.id }
        });

        if (!existingDealerUser) {
            await prisma.dealerUser.create({
                data: {
                    dealerAccountId: dealerAccount.id,
                    userId: dealerAppUser.id,
                    isPrimary: true,
                    firstName: 'John',
                    lastName: 'Smith'
                }
            });
            console.log(`✅ Dealer user linked to account`);
        } else {
            console.log(`ℹ️  Dealer user already linked to account`);
        }

        // 4. Create Band Assignments
        console.log('\n🏷️  Creating band assignments...');

        const bandAssignments = [
            { partType: PartType.GENUINE, bandCode: '1' },
            { partType: PartType.AFTERMARKET, bandCode: '2' },
            { partType: PartType.BRANDED, bandCode: '3' }
        ];

        for (const assignment of bandAssignments) {
            const existing = await prisma.dealerBandAssignment.findFirst({
                where: {
                    dealerAccountId: dealerAccount.id,
                    partType: assignment.partType
                }
            });

            if (!existing) {
                await prisma.dealerBandAssignment.create({
                    data: {
                        dealerAccountId: dealerAccount.id,
                        partType: assignment.partType,
                        bandCode: assignment.bandCode
                    }
                });
                console.log(`✅ Band assignment created: ${assignment.partType} -> Band ${assignment.bandCode}`);
            } else {
                // Update if different
                if (existing.bandCode !== assignment.bandCode) {
                    await prisma.dealerBandAssignment.update({
                        where: { id: existing.id },
                        data: { bandCode: assignment.bandCode }
                    });
                    console.log(`✅ Band assignment updated: ${assignment.partType} -> Band ${assignment.bandCode}`);
                } else {
                    console.log(`ℹ️  Band assignment already exists: ${assignment.partType} -> Band ${assignment.bandCode}`);
                }
            }
        }

        // 5. Create Upload Templates
        console.log('\n📄 Creating upload templates...');

        const templates = [
            {
                templateName: 'GENUINE_PARTS',
                fileName: 'Genuine_parts_template.xlsx',
                blobPath: 'samples/Genuine_parts_template.xlsx',
                description: 'Template for uploading genuine parts pricing and stock data'
            },
            {
                templateName: 'AFTERMARKET_PARTS',
                fileName: 'Aftermarket_parts_template.xlsx',
                blobPath: 'samples/Aftermarket_parts_template.xlsx',
                description: 'Template for uploading aftermarket parts pricing and stock data'
            },
            {
                templateName: 'BACKORDERS',
                fileName: 'Backorders_template.csv',
                blobPath: 'samples/Backorders_template.csv',
                description: 'Template for uploading backorder information'
            }
        ];

        for (const template of templates) {
            await prisma.uploadTemplate.upsert({
                where: { templateName: template.templateName },
                update: template,
                create: template
            });
            console.log(`✅ Upload template created: ${template.templateName}`);
        }

        console.log('\n✅ Seed completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Admin user: admin@hotbray.com (password: Admin123!)`);
        console.log(`   - Dealer account: DEAL001 - Test Dealer Ltd (John Smith)`);
        console.log(`   - Dealer user: dealer@test.com (password: Dealer123!)`);
        console.log(`   - Band assignments: GENUINE=1, AFTERMARKET=2, BRANDED=3`);
        console.log(`   - Upload templates: 3 templates created`);
        console.log('\n💡 You can run this seed script multiple times safely (idempotent).');

    } catch (error) {
        console.error('\n❌ Seed failed:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
