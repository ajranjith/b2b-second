import { prisma } from 'db'
import { createRuleEngine } from 'rules'

export { prisma }
export const ruleEngine = createRuleEngine(prisma)
