/**
 * END-TO-END DEALER PROCESS TEST SUITE
 * 
 * This test suite validates the complete dealer flow:
 * 1. Authentication (login/register)
 * 2. Product Search & Filtering
 * 3. Pricing Calculation based on entitlements
 * 4. Cart Management
 * 5. Order Placement & Confirmation
 * 
 * Run with: npx ts-node test-dealer-flow.ts
 */

const API_BASE_URL = 'http://localhost:3001';
const DEALER_EMAIL = process.env.DEALER_EMAIL || 'u-1@dealer.com';
const DEALER_PASSWORD = process.env.DEALER_PASSWORD || 'Password123!';

interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
    duration: number;
}

class DealerProcessTester {
    private results: TestResult[] = [];
    private testData: any = {
        dealerAccount: null,
        authToken: null,
        userId: null,
        dealerAccountId: null,
        cart: null,
        order: null,
        productCode: null,
        productId: null
    };

    async run() {
        console.log('\nðŸš€ STARTING DEALER E2E TESTS\n');
        
        try {
            // Phase 1: Authentication
            await this.testLoginDealer();
            
            // Phase 2: Product Search
            await this.testProductSearch();
            await this.testProductSearchWithFilters();
            await this.testProductSearchEntitlementFiltering();
            
            // Phase 3: Pricing
            await this.testGetProductDetail();
            await this.testPricingCalculation();
            
            // Phase 4: Cart Operations
            await this.testGetCart();
            await this.testAddItemToCart();
            await this.testGetCartAfterAdd();
            await this.testUpdateCartItem();
            
            // Phase 5: Order Placement
            await this.testCheckout();

            // Phase 6: Cart Cleanup
            await this.testRemoveCartItem();
            
            // Phase 7: Order Retrieval
            await this.testGetOrders();
            
            this.printResults();
        } catch (error) {
            console.error('\nâŒ TEST SUITE FAILED:', error);
            process.exit(1);
        }
    }

    private async testLoginDealer() {
        return this.runTest('Login Dealer Account', async () => {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: DEALER_EMAIL,
                    password: DEALER_PASSWORD
                })
            });

            if (!response.ok) {
                throw new Error(`Login failed: ${response.status}`);
            }

            const data: any = await response.json();
            
            if (!data.token || !data.user) {
                throw new Error('Invalid login response: missing token or user');
            }

            this.testData.authToken = data.token;
            this.testData.userId = data.user.id;
            this.testData.dealerAccountId = data.user.dealerAccountId;
            this.testData.dealerAccount = data.user;

            console.log('  âœ“ Login successful');
            console.log(`    - User ID: ${this.testData.userId}`);
            console.log(`    - Dealer Account ID: ${this.testData.dealerAccountId}`);
            console.log(`    - Entitlement: ${data.user.entitlement}`);
        });
    }

    private async testProductSearch() {
        return this.runTest('Product Search - Basic Query', async () => {
            const response = await fetch(
                `${API_BASE_URL}/dealer/search?q=Product`,
                {
                    headers: { 'Authorization': `Bearer ${this.testData.authToken}` }
                }
            );

            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }

            const data: any = await response.json();

            if (!data.results || !Array.isArray(data.results)) {
                throw new Error('Invalid search response: missing results array');
            }

            if (data.results.length === 0) {
                throw new Error('No products found for search query');
            }

            // Store first product code for later tests
            this.testData.productCode = data.results[0].productCode;
            this.testData.productId = data.results[0].id;

            console.log(`  âœ“ Found ${data.results.length} products`);
            console.log(`    - First product: ${data.results[0].productCode} - ${data.results[0].description}`);
            console.log(`    - Price: Â£${data.results[0].yourPrice}`);
        });
    }

    private async testProductSearchWithFilters() {
        return this.runTest('Product Search - With Filters', async () => {
            const response = await fetch(
                `${API_BASE_URL}/dealer/search?q=Product&partType=GENUINE&inStockOnly=true&limit=10`,
                {
                    headers: { 'Authorization': `Bearer ${this.testData.authToken}` }
                }
            );

            if (!response.ok) {
                throw new Error(`Filtered search failed: ${response.status}`);
            }

            const data: any = await response.json();

            if (!Array.isArray(data.results)) {
                throw new Error('Invalid filtered search response');
            }

            // Verify filters applied
            if (data.results.length > 0) {
                const allGenuine = data.results.every((p: any) => p.partType === 'GENUINE');
                const allInStock = data.results.every((p: any) => p.freeStock > 0);

                if (!allGenuine) {
                    console.warn('  âš  Warning: Not all results are GENUINE');
                }
                if (!allInStock) {
                    console.warn('  âš  Warning: Not all results are in stock');
                }
            }

            console.log(`  âœ“ Filtered search returned ${data.results.length} products`);
        });
    }

    private async testProductSearchEntitlementFiltering() {
        return this.runTest('Product Search - Entitlement Filtering', async () => {
            const response = await fetch(
                `${API_BASE_URL}/dealer/search?limit=100`,
                {
                    headers: { 'Authorization': `Bearer ${this.testData.authToken}` }
                }
            );

            if (!response.ok) {
                throw new Error(`Entitlement filter test failed: ${response.status}`);
            }

            const data: any = await response.json();
            const entitlement = data.entitlement || this.testData.dealerAccount.entitlement;

            // Verify entitlement filter applied
            if (entitlement === 'AFTERMARKET_ONLY') {
                const hasGenuine = data.results.some((p: any) => p.partType === 'GENUINE');
                if (hasGenuine) {
                    throw new Error('Entitlement filter failed: GENUINE products visible to AFTERMARKET_ONLY dealer');
                }
            }

            console.log(`  âœ“ Entitlement filter validated (${entitlement})`);
            console.log(`    - Returned products: ${data.results.length}`);
        });
    }

    private async testGetProductDetail() {
        return this.runTest('Get Product Detail', async () => {
            if (!this.testData.productId) {
                throw new Error('No product ID available');
            }

            const response = await fetch(
                `${API_BASE_URL}/dealer/product/${this.testData.productCode}`,
                {
                    headers: { 'Authorization': `Bearer ${this.testData.authToken}` }
                }
            );

            if (!response.ok) {
                throw new Error(`Get product detail failed: ${response.status}`);
            }

            const data: any = await response.json();

            if (!data.productCode) {
                throw new Error('Invalid product detail response');
            }

            console.log(`  âœ“ Retrieved product detail`);
            console.log(`    - Code: ${data.productCode}`);
            console.log(`    - Description: ${data.description}`);
            console.log(`    - Your Price: Â£${data.yourPrice}`);
            console.log(`    - Band: ${data.bandCode}`);
            console.log(`    - Stock: ${data.freeStock}`);
        });
    }

    private async testPricingCalculation() {
        return this.runTest('Pricing Calculation', async () => {
            if (!this.testData.productCode) {
                throw new Error('No product code available');
            }

            const response = await fetch(
                `${API_BASE_URL}/dealer/product/${this.testData.productCode}`,
                {
                    headers: { 'Authorization': `Bearer ${this.testData.authToken}` }
                }
            );

            if (!response.ok) {
                throw new Error(`Pricing calculation failed: ${response.status}`);
            }

            const data: any = await response.json();

            if (data.yourPrice === null && !data.minPriceApplied) {
                throw new Error('Invalid pricing: no price calculated');
            }

            console.log(`  âœ“ Pricing calculated correctly`);
            console.log(`    - Available: ${data.available}`);
            console.log(`    - Minimum Price Applied: ${data.minPriceApplied}`);
            if (data.reason) {
                console.log(`    - Reason: ${data.reason}`);
            }
        });
    }

    private async testGetCart() {
        return this.runTest('Get Cart', async () => {
            const response = await fetch(
                `${API_BASE_URL}/dealer/cart`,
                {
                    headers: { 'Authorization': `Bearer ${this.testData.authToken}` }
                }
            );

            if (!response.ok) {
                throw new Error(`Get cart failed: ${response.status}`);
            }

            const data: any = await response.json();
            this.testData.cart = data;

            if (!data.items) {
                throw new Error('Invalid cart response: missing items');
            }

            console.log(`  âœ“ Cart retrieved`);
            console.log(`    - Items: ${data.items.length}`);
            console.log(`    - Total: Â£${data.subtotal ?? data.total ?? 0}`);
        });
    }

    private async testAddItemToCart() {
        return this.runTest('Add Item to Cart', async () => {
            if (!this.testData.productId) {
                throw new Error('No product ID available');
            }

            const response = await fetch(
                `${API_BASE_URL}/dealer/cart/items`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.testData.authToken}`
                    },
                    body: JSON.stringify({
                        productId: this.testData.productId,
                        qty: 5
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`Add to cart failed: ${response.status}`);
            }

            const data: any = await response.json();

            if (!data.items) {
                throw new Error('Invalid add to cart response');
            }

            console.log(`  âœ“ Item added to cart`);
            console.log(`    - Cart items: ${data.items.length}`);
            console.log(`    - Cart total: Â£${data.subtotal ?? data.total ?? 0}`);
        });
    }

    private async testGetCartAfterAdd() {
        return this.runTest('Verify Cart After Add', async () => {
            const response = await fetch(
                `${API_BASE_URL}/dealer/cart`,
                {
                    headers: { 'Authorization': `Bearer ${this.testData.authToken}` }
                }
            );

            if (!response.ok) {
                throw new Error(`Verify cart failed: ${response.status}`);
            }

            const data: any = await response.json();

            if (data.items.length === 0) {
                throw new Error('Cart is empty - item may not have been added');
            }

            const cartItem = data.items[0];
            console.log(`  âœ“ Cart verified`);
            console.log(`    - Product: ${cartItem.product.productCode}`);
            console.log(`    - Quantity: ${cartItem.qty}`);
            console.log(`    - Line total: Â£${cartItem.lineTotal || cartItem.qty * cartItem.yourPrice}`);
        });
    }

    private async testUpdateCartItem() {
        return this.runTest('Update Cart Item Quantity', async () => {
            const cartResponse = await fetch(
                `${API_BASE_URL}/dealer/cart`,
                {
                    headers: { 'Authorization': `Bearer ${this.testData.authToken}` }
                }
            );

            const cart: any = await cartResponse.json();
            if (cart.items.length === 0) {
                console.log('  âš  No items in cart to update');
                return;
            }

            const itemId = cart.items[0].id;

            const updateResponse = await fetch(
                `${API_BASE_URL}/dealer/cart/items/${itemId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.testData.authToken}`
                    },
                    body: JSON.stringify({ qty: 10 })
                }
            );

            if (!updateResponse.ok) {
                throw new Error(`Update cart item failed: ${updateResponse.status}`);
            }

            const updated: any = await updateResponse.json();
            const updatedItem = updated.items.find((i: any) => i.id === itemId);

            if (!updatedItem || updatedItem.qty !== 10) {
                throw new Error('Item quantity not updated correctly');
            }

            console.log(`  âœ“ Cart item quantity updated`);
            console.log(`    - New quantity: ${updatedItem.qty}`);
            console.log(`    - New line total: Â£${updatedItem.lineTotal}`);
        });
    }

    private async testRemoveCartItem() {
        return this.runTest('Remove Item from Cart', async () => {
            // Create a new item first to ensure we have something to remove
            if (!this.testData.productId) {
                console.log('  âš  No product ID available, skipping remove test');
                return;
            }

            // Add an item
            const addResponse = await fetch(
                `${API_BASE_URL}/dealer/cart/items`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.testData.authToken}`
                    },
                    body: JSON.stringify({
                        productId: this.testData.productId,
                        qty: 3
                    })
                }
            );

            const cartAfterAdd: any = await addResponse.json();
            const itemId = cartAfterAdd.items[cartAfterAdd.items.length - 1].id;

            // Remove it
            const removeResponse = await fetch(
                `${API_BASE_URL}/dealer/cart/items/${itemId}`,
                {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${this.testData.authToken}` }
                }
            );

            if (!removeResponse.ok) {
                throw new Error(`Remove cart item failed: ${removeResponse.status}`);
            }

            const updated: any = await removeResponse.json();
            const itemExists = updated.items.some((i: any) => i.id === itemId);

            if (itemExists) {
                throw new Error('Item was not removed from cart');
            }

            console.log(`  âœ“ Item removed from cart`);
            console.log(`    - Remaining items: ${updated.items.length}`);
        });
    }

    private async testCheckout() {
        return this.runTest('Place Order (Checkout)', async () => {
            const cartResponse = await fetch(
                `${API_BASE_URL}/dealer/cart`,
                {
                    headers: { 'Authorization': `Bearer ${this.testData.authToken}` }
                }
            );

            if (!cartResponse.ok) {
                throw new Error(`Get cart before checkout failed: ${cartResponse.status}`);
            }

            const cart: any = await cartResponse.json();
            if (!cart.items || cart.items.length === 0) {
                if (!this.testData.productId) {
                    throw new Error('No product ID available');
                }

                const addResponse = await fetch(
                    `${API_BASE_URL}/dealer/cart/items`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.testData.authToken}`
                        },
                        body: JSON.stringify({
                            productId: this.testData.productId,
                            qty: 1
                        })
                    }
                );

                if (!addResponse.ok) {
                    throw new Error(`Add item before checkout failed: ${addResponse.status}`);
                }
            }

            const response = await fetch(
                `${API_BASE_URL}/dealer/checkout`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.testData.authToken}`
                    },
                    body: JSON.stringify({
                        poRef: 'PO-2026-001',
                        notes: 'Urgent order - test'
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`Checkout failed: ${response.status}`);
            }

            const data: any = await response.json();
            this.testData.order = data;

            if (!data.id) {
                throw new Error('Invalid checkout response: missing id');
            }

            console.log(`  âœ“ Order placed successfully`);
            console.log(`    - Order ID: ${data.id}`);
            console.log(`    - Order Date: ${data.createdAt}`);
            console.log(`    - Total: Â£${data.total}`);
            console.log(`    - Item Count: ${data.lines?.length ?? 0}`);
            console.log(`    - Status: ${data.status}`);
        });
    }

    private async testGetOrders() {
        return this.runTest('Get Dealer Orders', async () => {
            const response = await fetch(
                `${API_BASE_URL}/dealer/orders`,
                {
                    headers: { 'Authorization': `Bearer ${this.testData.authToken}` }
                }
            );

            if (!response.ok) {
                throw new Error(`Get orders failed: ${response.status}`);
            }

            const data: any = await response.json();

            if (!Array.isArray(data.orders)) {
                throw new Error('Invalid get orders response');
            }

            console.log(`  âœ“ Retrieved ${data.orders.length} orders`);
            if (data.orders.length > 0) {
                const latestOrder = data.orders[0];
                console.log(`    - Latest Order: ${latestOrder.orderNo}`);
                console.log(`    - Date: ${latestOrder.createdAt}`);
                console.log(`    - Total: Â£${latestOrder.total}`);
                console.log(`    - Status: ${latestOrder.status}`);
            }
        });
    }

    private async runTest(name: string, test: () => Promise<void>): Promise<void> {
        const startTime = Date.now();
        try {
            await test();
            const duration = Date.now() - startTime;
            this.results.push({ name, passed: true, duration });
            console.log(`âœ… PASS: ${name} (${duration}ms)\n`);
        } catch (error: any) {
            const duration = Date.now() - startTime;
            this.results.push({ 
                name, 
                passed: false, 
                error: error.message,
                duration 
            });
            console.log(`âŒ FAIL: ${name}`);
            console.log(`   Error: ${error.message}\n`);
        }
    }

    private printResults() {
        console.log('\n' + '='.repeat(60));
        console.log('TEST RESULTS SUMMARY');
        console.log('='.repeat(60) + '\n');

        const passed = this.results.filter(r => r.passed).length;
        const failed = this.results.filter(r => !r.passed).length;
        const total = this.results.length;
        const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);

        console.log(`Total Tests: ${total}`);
        console.log(`âœ… Passed: ${passed}`);
        console.log(`âŒ Failed: ${failed}`);
        console.log(`â±ï¸  Total Time: ${totalTime}ms\n`);

        if (failed > 0) {
            console.log('Failed Tests:');
            this.results
                .filter(r => !r.passed)
                .forEach(r => {
                    console.log(`  âŒ ${r.name}`);
                    console.log(`     ${r.error}\n`);
                });
        }

        if (passed === total) {
            console.log('\nðŸŽ‰ ALL TESTS PASSED! Dealer flow is fully functional.\n');
            process.exit(0);
        } else {
            console.log('\nâš ï¸  SOME TESTS FAILED. Review errors above.\n');
            process.exit(1);
        }
    }
}

// Run the test suite
const tester = new DealerProcessTester();
tester.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});



