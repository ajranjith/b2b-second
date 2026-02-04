export const SERVICES = {
    DEALER_BFF: process.env.DEALER_BFF_URL || 'http://localhost:3002',
    ADMIN_BFF: process.env.ADMIN_BFF_URL || 'http://localhost:3003',
    AUTH: process.env.AUTH_URL || 'http://localhost:3004',
};

export const ROUTES = {
    DEALER: {
        PREFIX: '/api/dealer',
        TARGET: SERVICES.DEALER_BFF
    },
    ADMIN: {
        PREFIX: '/api/admin',
        TARGET: SERVICES.ADMIN_BFF
    },
    AUTH: {
        PREFIX: '/api/auth',
        TARGET: SERVICES.AUTH
    }
};
