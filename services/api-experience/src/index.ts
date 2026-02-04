import express from 'express';
import cors from 'cors';
import { prisma } from 'db';
import { AuthService } from '@hotbray/domain-auth';
import { PartnerService } from '@hotbray/domain-partners';
import { OrderService } from '@hotbray/domain-orders';
import { PricingService } from '@hotbray/domain-pricing';
import { AdminService } from '@hotbray/domain-admin';
import { LayoutService } from './LayoutService';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Use shared prisma client

// Initialize Domain Services
const pricingService = new PricingService(prisma);
const authService = new AuthService(prisma);
const partnerService = new PartnerService(prisma, pricingService);
const orderService = new OrderService(prisma, pricingService);
const adminService = new AdminService(prisma);
const layoutService = new LayoutService();

// Experience API Endpoints (BFF)
app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.json(result);
    } catch (e: any) {
        res.status(401).json({ error: e.message });
    }
});

app.get('/layout/dashboard', async (req, res) => {
    try {
        const role = req.headers['x-user-role'] as string;
        const result = layoutService.getDashboardLayout(role);
        res.json(result);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/dealer/search', async (req, res) => {
    try {
        const { dealerAccountId, q, partType } = req.query as any;
        const result = await partnerService.searchProducts(dealerAccountId, { q, partType });
        res.json(result);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/dealer/cart/add', async (req, res) => {
    try {
        const { dealerUserId, dealerAccountId, productId, qty } = req.body;
        const result = await orderService.addToCart(dealerUserId, dealerAccountId, { productId, qty });
        res.json(result);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/admin/import', async (req, res) => {
    try {
        const { type, filePath } = req.body;
        const result = await adminService.processProductImport(type, filePath);
        res.json(result);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(port, () => {
    console.log(`🚀 API Experience (BFF) running at http://localhost:${port}`);
});
