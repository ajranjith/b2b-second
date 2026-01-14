import { prisma } from 'db';
import { ruleEngine } from './ruleEngine';
import { DealerService } from '../services/DealerService';
import { CartService } from '../services/CartService';
import { OrderService } from '../services/OrderService';

// Initialize services with dependencies
export const dealerService = new DealerService(prisma, ruleEngine.pricing);
export const cartService = new CartService(prisma, ruleEngine.pricing);
export const orderService = new OrderService(prisma, ruleEngine.pricing, ruleEngine.orders);
