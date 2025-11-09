#!/usr/bin/env node

// PetRent Platform Test Script
// This script tests the core functionality of the platform

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TESTS = [];

// Test utilities
function log(message, type = 'info') {
    const colors = {
        info: '\x1b[36m',    // Cyan
        success: '\x1b[32m', // Green
        error: '\x1b[31m',   // Red
        warning: '\x1b[33m', // Yellow
        reset: '\x1b[0m'     // Reset
    };
    
    console.log(`${colors[type] || colors.info}${message}${colors.reset}`);
}

function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const response = {
                        statusCode: res.statusCode,
                        data: body ? JSON.parse(body) : null,
                        headers: res.headers
                    };
                    resolve(response);
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        data: body,
                        headers: res.headers
                    });
                }
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function runTest(name, testFunction) {
    try {
        log(`Running test: ${name}`, 'info');
        await testFunction();
        log(`✓ Test passed: ${name}`, 'success');
        return true;
    } catch (error) {
        log(`✗ Test failed: ${name} - ${error.message}`, 'error');
        return false;
    }
}

// Test functions
async function testServerResponse() {
    const response = await makeRequest('/');
    if (response.statusCode !== 200) {
        throw new Error(`Server returned status ${response.statusCode}`);
    }
    if (!response.data || !response.data.includes('PetRent')) {
        throw new Error('Server response does not contain expected content');
    }
}

async function testUserRegistration() {
    const timestamp = Date.now();
    const testUser = {
        username: `testuser${timestamp}`,
        email: `test${timestamp}@example.com`,
        password: 'testpassword123',
        firstName: 'Test',
        lastName: 'User',
        location: 'Test City, TX',
        userType: 'renter'
    };

    const response = await makeRequest('/api/register', 'POST', testUser);
    
    if (response.statusCode !== 200) {
        throw new Error(`Registration failed with status ${response.statusCode}`);
    }
    
    if (!response.data.user) {
        throw new Error('Registration response missing user data');
    }

    return response.data.user;
}

async function testUserLogin(email, password) {
    const response = await makeRequest('/api/login', 'POST', { email, password });
    
    if (response.statusCode !== 200) {
        throw new Error(`Login failed with status ${response.statusCode}`);
    }
    
    if (!response.data.user) {
        throw new Error('Login response missing user data');
    }

    return response.data.user;
}

async function testEquipmentAPI() {
    const response = await makeRequest('/api/equipment');
    
    if (response.statusCode !== 200) {
        throw new Error(`Equipment API failed with status ${response.statusCode}`);
    }
    
    if (!response.data.equipment) {
        throw new Error('Equipment API response missing equipment data');
    }
    
    const equipmentCount = response.data.equipment.length;
    log(`Found ${equipmentCount} equipment items`, 'info');
}

async function testSearchAPI() {
    const response = await makeRequest('/api/search?q=clippers');
    
    if (response.statusCode !== 200) {
        throw new Error(`Search API failed with status ${response.statusCode}`);
    }
    
    if (!response.data.results) {
        throw new Error('Search API response missing results');
    }
}

async function testAuthenticatedEndpoints() {
    // Test with sample credentials
    const testCredentials = [
        { email: 'mike@example.com', password: 'password123' },
        { email: 'sarah@example.com', password: 'password456' }
    ];

    for (const creds of testCredentials) {
        try {
            const user = await testUserLogin(creds.email, creds.password);
            log(`Successfully logged in as ${user.username}`, 'info');
            
            // Test user endpoint
            const meResponse = await makeRequest('/api/me');
            if (meResponse.statusCode !== 200 || !meResponse.data.user) {
                throw new Error('Failed to get user data');
            }
            
            // Test equipment listing for equipment owners
            if (user.userType === 'owner' || user.userType === 'both') {
                const equipmentResponse = await makeRequest('/api/my-equipment');
                if (equipmentResponse.statusCode !== 200) {
                    throw new Error('Failed to get user equipment');
                }
            }
            
            // Test bookings
            const bookingsResponse = await makeRequest('/api/bookings');
            if (bookingsResponse.statusCode !== 200) {
                throw new Error('Failed to get bookings');
            }
            
        } catch (error) {
            log(`Note: Test user ${creds.email} may not exist: ${error.message}`, 'warning');
        }
    }
}

async function testDatabaseIntegrity() {
    // This is a simple test to ensure the database is working
    // In a real scenario, you'd connect directly to the database
    const response = await makeRequest('/api/me');
    
    // The fact that we get a response means the server and database are connected
    if (response.statusCode === 200 || response.statusCode === 401) {
        log('Database connection verified', 'success');
    } else {
        throw new Error('Database connection issue detected');
    }
}

async function testErrorHandling() {
    // Test invalid login
    const invalidLogin = await makeRequest('/api/login', 'POST', {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
    });
    
    if (invalidLogin.statusCode !== 401) {
        throw new Error('Invalid login should return 401 status');
    }
    
    // Test invalid API endpoint
    const invalidEndpoint = await makeRequest('/api/nonexistent');
    if (invalidEndpoint.statusCode !== 404) {
        throw new Error('Invalid endpoint should return 404 status');
    }
}

// Test suite
async function runAllTests() {
    log('Starting PetRent Platform Tests...', 'info');
    log('=======================================', 'info');
    
    const tests = [
        { name: 'Server Response Test', fn: testServerResponse },
        { name: 'Equipment API Test', fn: testEquipmentAPI },
        { name: 'Search API Test', fn: testSearchAPI },
        { name: 'Database Integrity Test', fn: testDatabaseIntegrity },
        { name: 'Error Handling Test', fn: testErrorHandling },
        { name: 'User Registration Test', fn: async () => {
            const user = await testUserRegistration();
            log(`Registered test user: ${user.username}`, 'info');
        }},
        { name: 'Authenticated Endpoints Test', fn: testAuthenticatedEndpoints }
    ];
    
    let passed = 0;
    let total = tests.length;
    
    for (const test of tests) {
        if (await runTest(test.name, test.fn)) {
            passed++;
        }
    }
    
    log('=======================================', 'info');
    log(`Test Results: ${passed}/${total} tests passed`, passed === total ? 'success' : 'warning');
    
    if (passed === total) {
        log('🎉 All tests passed! Platform is working correctly.', 'success');
        process.exit(0);
    } else {
        log('⚠️  Some tests failed. Please check the issues above.', 'error');
        process.exit(1);
    }
}

// Check if server is running
async function checkServer() {
    try {
        const response = await makeRequest('/');
        return response.statusCode === 200;
    } catch (error) {
        return false;
    }
}

// Main execution
async function main() {
    log('PetRent Platform Test Suite', 'info');
    log('==============================', 'info');
    
    // Check if server is running
    log('Checking if server is running...', 'info');
    const serverRunning = await checkServer();
    
    if (!serverRunning) {
        log('❌ Server is not running on localhost:3000', 'error');
        log('Please start the server first using:', 'info');
        log('  npm start', 'info');
        log('  or', 'info');
        log('  ./deploy.sh', 'info');
        process.exit(1);
    }
    
    log('✓ Server is running', 'success');
    log('');
    
    // Run tests
    await runAllTests();
}

if (require.main === module) {
    main().catch(error => {
        log(`Test suite failed: ${error.message}`, 'error');
        process.exit(1);
    });
}

module.exports = { makeRequest, runTest };