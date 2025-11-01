// Automated Admin Endpoint Test Script for ProjectX
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const ADMIN_CREDENTIALS = {
    username: 'admin', // Change if your test admin username is different
    password: 'admin123' // Change if your test admin password is different
};

async function loginAsAdmin() {
    try {
        const res = await axios.post(`${BASE_URL}/login`, ADMIN_CREDENTIALS);
        return res.data.token;
    } catch (err) {
        console.error('Admin login failed:', err.response?.data || err.message);
        process.exit(1);
    }
}

async function testEndpoint(method, url, token, data = undefined) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${url}`,
            headers: { Authorization: `Bearer ${token}` },
            data
        };
        const res = await axios(config);
        console.log(`[PASS] ${method.toUpperCase()} ${url}`);
        console.dir(res.data, { depth: 5 }); // Print full response data
        return res.data;
    } catch (err) {
        console.error(`[FAIL] ${method.toUpperCase()} ${url}:`, err.response?.data || err.message);
        return null;
    }
}

(async () => {
    const token = await loginAsAdmin();

    // 1. GET /admin/dashboard
    await testEndpoint('get', '/admin/dashboard', token);

    // 2. POST /admin/dashboard/rooms
    const roomData = {
        roomNumber: 'A101',
        type: 'Deluxe',
        price: 1500,
        status: 'available',
        features: ['AC', 'TV', 'WiFi']
    };
    const createRoomRes = await testEndpoint('post', '/admin/dashboard/rooms', token, roomData);
    const roomId = createRoomRes?.room?._id;

    // 3. PUT /admin/dashboard/rooms/:id
    if (roomId) {
        const updateRoomData = { price: 1800, status: 'occupied' };
        await testEndpoint('put', `/admin/dashboard/rooms/${roomId}`, token, updateRoomData);
    } else {
        console.warn('Skipping PUT /admin/dashboard/rooms/:id (no room created)');
    }

    // 4. GET /admin/stats
    await testEndpoint('get', '/admin/stats', token);

    // 5. GET /admin/chart-data
    await testEndpoint('get', '/admin/chart-data', token);

    // 6. GET /admin/reports/revenue/monthly
    await testEndpoint('get', '/admin/reports/revenue/monthly', token);

    // 7. GET /admin/reports/revenue/yearly
    await testEndpoint('get', '/admin/reports/revenue/yearly', token);

    // 8. GET /admin/reports/occupancy
    await testEndpoint('get', '/admin/reports/occupancy', token);

    // 9. GET /admin/audit-logs
    await testEndpoint('get', '/admin/audit-logs', token);

    console.log('Admin endpoint tests completed.');
})();
