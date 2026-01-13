import { PrismaClient } from '@prisma/client'
import { createRuleEngine } from 'rules'

export const prisma = new PrismaClient()
export const ruleEngine = createRuleEngine(prisma)
