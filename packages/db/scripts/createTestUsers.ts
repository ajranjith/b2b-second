// File: packages/db/scripts/createTestUsers.ts
// Run with: npx tsx packages/db/scripts/createTestUsers.ts

import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

async function createTestUsers() {
    try {
        console.log('🚀 Creating test users...\n')

        // ============================================
        // 1. CREATE ADMIN USER
        // ============================================
        console.log('👤 Creating Admin User...')

        const adminPassword = 'Admin123!'
        const adminPasswordHash = await bcrypt.hash(adminPassword, 10)

        const admin = await prisma.appUser.upsert({
            where: { email: 'admin@hotbray.com' },
            update: {},
            create: {
                email: 'admin@hotbray.com',
                passwordHash: adminPasswordHash,
                role: 'ADMIN',
                adminRole: 'SUPER_ADMIN',
                isActive: true,
            },
        })

        console.log('✅ Admin created:')
        console.log(`   Email: admin@hotbray.com`)
        console.log(`   Password: ${adminPassword}`)
        console.log(`   Role: SUPER_ADMIN\n`)

        // ============================================
        // 2. CREATE DEALER ACCOUNT
        // ============================================
        console.log('🏢 Creating Dealer Account...')

        const dealerAccount = await prisma.dealerAccount.upsert({
            where: { accountNo: 'DEAL001' },
            update: {},
            create: {
                accountNo: 'DEAL001',
                erpAccountNo: 'ERP001',
                companyName: 'Test Dealer Ltd',
                status: 'ACTIVE',
                entitlement: 'SHOW_ALL',
                mainEmail: 'dealer@test.com',
                phone: '+44 20 1234 5678',
                contactFirstName: 'John',
                contactLastName: 'Smith',
                billingLine1: '123 High Street',
                billingCity: 'London',
                billingPostcode: 'SW1A 1AA',
                billingCountry: 'United Kingdom',
            },
        })

        console.log('✅ Dealer Account created:')
        console.log(`   Account No: DEAL001`)
        console.log(`   Company: Test Dealer Ltd`)
        console.log(`   Status: ACTIVE`)
        console.log(`   Entitlement: SHOW_ALL (can see all part types)\n`)

        // ============================================
        // 3. CREATE DEALER USER
        // ============================================
        console.log('👤 Creating Dealer User...')

        const dealerPassword = 'Dealer123!'
        const dealerPasswordHash = await bcrypt.hash(dealerPassword, 10)

        const dealerUser = await prisma.appUser.upsert({
            where: { email: 'dealer@test.com' },
            update: {},
            create: {
                email: 'dealer@test.com',
                passwordHash: dealerPasswordHash,
                role: 'DEALER',
                isActive: true,
            },
        })

        console.log('✅ Dealer User created:')
        console.log(`   Email: dealer@test.com`)
        console.log(`   Password: ${dealerPassword}`)
        console.log(`   Role: DEALER\n`)

        // ============================================
        // 4. LINK DEALER USER TO ACCOUNT
        // ============================================
        console.log('🔗 Linking Dealer User to Account...')

        await prisma.dealerUser.upsert({
            where: { userId: dealerUser.id },
            update: {},
            create: {
                userId: dealerUser.id,
                dealerAccountId: dealerAccount.id,
                isPrimary: true,
                firstName: 'John',
                lastName: 'Smith',
            },
        })

        console.log('✅ Dealer User linked to Account\n')

        // ============================================
        // 5. CREATE PRICING BAND ASSIGNMENTS
        // ============================================
        console.log('💰 Creating Pricing Band Assignments...')

        // Genuine parts - Band 1 (best pricing)
        await prisma.dealerBandAssignment.upsert({
            where: {
                dealerAccountId_partType: {
                    dealerAccountId: dealerAccount.id,
                    partType: 'GENUINE',
                },
            },
            update: {},
            create: {
                dealerAccountId: dealerAccount.id,
                partType: 'GENUINE',
                bandCode: '1',
            },
        })

        // Aftermarket parts - Band 2
        await prisma.dealerBandAssignment.upsert({
            where: {
                dealerAccountId_partType: {
                    dealerAccountId: dealerAccount.id,
                    partType: 'AFTERMARKET',
                },
            },
            update: {},
            create: {
                dealerAccountId: dealerAccount.id,
                partType: 'AFTERMARKET',
                bandCode: '2',
            },
        })

        // Branded parts - Band 3
        await prisma.dealerBandAssignment.upsert({
            where: {
                dealerAccountId_partType: {
                    dealerAccountId: dealerAccount.id,
                    partType: 'BRANDED',
                },
            },
            update: {},
            create: {
                dealerAccountId: dealerAccount.id,
                partType: 'BRANDED',
                bandCode: '3',
            },
        })

        console.log('✅ Band Assignments created:')
        console.log(`   GENUINE: Band 1 (Best Price)`)
        console.log(`   AFTERMARKET: Band 2`)
        console.log(`   BRANDED: Band 3\n`)

        // ============================================
        // 6. SUMMARY
        // ============================================
        console.log('═══════════════════════════════════════════')
        console.log('✨ TEST USERS CREATED SUCCESSFULLY!')
        console.log('═══════════════════════════════════════════\n')

        console.log('🔐 LOGIN CREDENTIALS:\n')

        console.log('📊 ADMIN LOGIN:')
        console.log('   URL: http://localhost:3000/login')
        console.log('   Email: admin@hotbray.com')
        console.log('   Password: Admin123!')
        console.log('   Access: Full admin dashboard\n')

        console.log('🛒 DEALER LOGIN:')
        console.log('   URL: http://localhost:3000/login')
        console.log('   Email: dealer@test.com')
        console.log('   OR')
        console.log('   Account No: DEAL001')
        console.log('   Password: Dealer123!')
        console.log('   Access: Search, cart, orders, backorders\n')

        console.log('💡 NEXT STEPS:')
        console.log('   1. Make sure API is running: cd apps/api && pnpm dev')
        console.log('   2. Make sure Web is running: cd apps/web && pnpm dev')
        console.log('   3. Import products: pnpm imports:all')
        console.log('   4. Login with dealer credentials')
        console.log('   5. Search for products and test cart/checkout\n')

    } catch (error) {
        console.error('❌ Error creating test users:', error)
        throw error
    } finally {
        await prisma.$disconnect()
        await pool.end()
    }
}

// Run the script
createTestUsers()
    .then(() => {
        console.log('✅ Script completed successfully')
        process.exit(0)
    })
    .catch((error) => {
        console.error('❌ Script failed:', error)
        process.exit(1)
    })
