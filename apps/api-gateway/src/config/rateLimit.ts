export const RATE_LIMIT_CONFIG = {
    global: {
        max: 1000,
        timeWindow: '1 minute'
    },
    auth: {
        max: 20, // stricter for auth endpoints
        timeWindow: '1 minute'
    },
    public: {
        max: 100,
        timeWindow: '1 minute'
    }
};
