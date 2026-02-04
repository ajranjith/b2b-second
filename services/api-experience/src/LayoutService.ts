export class LayoutService {
    getDashboardLayout(role: string) {
        if (role === 'ADMIN') {
            return {
                widgets: [
                    { type: 'stats', title: 'Total Dealers', value: '24', change: '+12%', trend: 'up', color: 'blue' },
                    { type: 'stats', title: 'Total Products', value: '1,234', change: '+5%', trend: 'up', color: 'green' },
                    { type: 'stats', title: 'Orders Today', value: '45', change: '-3%', trend: 'down', color: 'orange' },
                    { type: 'recent-orders', title: 'Recent Orders', limit: 5 }
                ]
            };
        }
        return {
            widgets: [
                { type: 'stats', title: 'Your Backorders', value: '5', color: 'blue' },
                { type: 'product-search', title: 'Quick Search' }
            ]
        };
    }
}
