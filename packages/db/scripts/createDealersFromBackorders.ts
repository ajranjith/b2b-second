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
