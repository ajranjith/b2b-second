import axios from 'axios';

async function verifyPricing() {
    try {
        console.log('Authenticating...');
        const loginRes = await axios.post('http://localhost:3001/auth/login', {
            email: 'dealer@test.com',
            password: 'Dealer123!'
        });
        const token = loginRes.data.token;
        console.log('Token acquired.');

        console.log('Searching for parts...');
        const searchRes = await axios.get('http://localhost:3001/dealer/search?q=part', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (searchRes.data.length > 0) {
            const firstItem = searchRes.data[0];
            console.log('API Check PASSED');
            console.log('First item found:', {
                productCode: firstItem.productCode,
                yourPrice: firstItem.yourPrice,
                available: firstItem.available
            });
        } else {
            console.log('API Check: No items found (Possible empty DB or search issue)');
        }
    } catch (err: any) {
        console.error('API Verification Failed:', err.message);
        if (err.response) {
            console.error('Status:', err.response.status);
        }
    }
}

verifyPricing();
