import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { verifyToken } from '@hotbray/domain-auth';

const app = express();
const port = process.env.PORT || 3000;

// Auth Middleware
const authMiddleware = (req: any, res: any, next: any) => {
    const publicPaths = ['/auth/login'];
    if (publicPaths.includes(req.path)) return next();

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

app.use(authMiddleware);

// Proxy to Experience API
app.use('/', createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    onProxyReq: (proxyReq: any, req: any) => {
        if (req.user) {
            proxyReq.setHeader('x-user-id', req.user.userId);
            proxyReq.setHeader('x-user-role', req.user.role);
            if (req.user.dealerAccountId) {
                proxyReq.setHeader('x-dealer-account-id', req.user.dealerAccountId);
            }
        }
    }
}));

app.listen(port, () => {
    console.log(`🛡️ API Gateway running at http://localhost:${port}`);
});
