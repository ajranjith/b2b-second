// packages/db/scripts/createDealersFromBackorders.ts
import { prisma } from '../src/index'
import * as bcrypt from 'bcrypt'

async function createDealersFromBackorders() {
    try {
        console.log('🔍 Finding unique customers from backorders...\n')

        // Get unique customers from backorder data
        const uniqueCustomers = await prisma.$queryRaw<
            Array<{ accountNo: string; customerName: string; backorderCount: bigint }>
        >`
      SELECT DISTINCT
        "accountNo",
        "customerName",
        COUNT(*) as "backorderCount"
      FROM "BackorderLine"
      WHERE "accountNo" IS NOT NULL 
        AND "customerName" IS NOT NULL
      GROUP BY "accountNo", "customerName"
      ORDER BY COUNT(*) DESC
    `

        console.log(`Found ${uniqueCustomers.length} unique customers with backorders\n`)

        // Default password for all dealers
        const defaultPassword = 'Dealer123!'
        const passwordHash = await bcrypt.hash(defaultPassword, 10)

        let created = 0
        let skipped = 0

        for (const customer of uniqueCustomers) {
            const accountNo = customer.accountNo
            const companyName = customer.customerName
            const email = `${accountNo.toLowerCase()}@dealer.local`

            console.log(`Processing: ${accountNo} - ${companyName}`)

            try {
                // Check if dealer already exists
                const existingDealer = await prisma.dealerAccount.findUnique({
                    where: { accountNo }
                })

                if (existingDealer) {
                    console.log(`  ⏭️  Already exists, skipping...`)
                    skipped++
                    continue
                }

                // Create dealer account
                const dealerAccount = await prisma.dealerAccount.create({
                    data: {
                        accountNo,
                        erpAccountNo: accountNo,
                        companyName,
                        status: 'ACTIVE',
                        entitlement: 'SHOW_ALL',
                        mainEmail: email,
                        contactFirstName: companyName.split(' ')[0] || 'Contact',
                        contactLastName: companyName.split(' ')[1] || 'Person',
                    },
                })

                // Create user
                const user = await prisma.appUser.create({
                    data: {
                        email,
                        passwordHash,
                        role: 'DEALER',
                        isActive: true,
                    },
                })

                // Link user to dealer account
                await prisma.dealerUser.create({
                    data: {
                        userId: user.id,
                        dealerAccountId: dealerAccount.id,
                        isPrimary: true,
                    },
                })

                // Create band assignments
                await prisma.dealerBandAssignment.createMany({
                    data: [
                        {
                            dealerAccountId: dealerAccount.id,
                            partType: 'GENUINE',
                            bandCode: '1',
                        },
                        {
                            dealerAccountId: dealerAccount.id,
                            partType: 'AFTERMARKET',
                            bandCode: '2',
                        },
                        {
                            dealerAccountId: dealerAccount.id,
                            partType: 'BRANDED',
                            bandCode: '3',
                        },
                    ],
                })

                console.log(`  ✅ Created dealer account and user`)
                console.log(`     Email: ${email}`)
                console.log(`     Password: ${defaultPassword}`)
                console.log(`     Backorders: ${customer.backorderCount}`)
                created++

            } catch (error: any) {
                console.error(`  ❌ Error creating dealer ${accountNo}:`, error.message)
            }

            console.log('')
        }

        console.log('═══════════════════════════════════════')
        console.log('📊 SUMMARY')
        console.log('═══════════════════════════════════════')
        console.log(`✅ Created: ${created} dealer accounts`)
        console.log(`⏭️  Skipped: ${skipped} (already existed)`)
        console.log(`📧 Default password for all: ${defaultPassword}`)
        console.log('')
        console.log('🔐 All dealers can login with:')
        console.log('   Email: [accountno]@dealer.local')
        console.log(`   Password: ${defaultPassword}`)
        console.log('')

    } catch (error) {
        console.error('❌ Error:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Run the script
createDealersFromBackorders()
    .then(() => {
        console.log('✅ Script completed')
        process.exit(0)
    })
    .catch((error) => {
        console.error('❌ Script failed:', error)
        process.exit(1)
    })
