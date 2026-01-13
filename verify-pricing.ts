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
            console.log('First item found:', {
                productCode: firstItem.productCode,
                yourPrice: firstItem.yourPrice,
                available: firstItem.available
            });
        } else {
            console.log('No items found in search.');
        }
    } catch (err: any) {
        console.error('API Verification Failed:', err.message);
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        }
    }
}

verifyPricing();
