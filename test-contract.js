/**
 * Quick test script for stellarService
 */

const { getContractStats } = require('./lib/stellarService');

async function test() {
    console.log('Testing contract call...');
    const stats = await getContractStats();
    console.log('Result:', JSON.stringify(stats, null, 2));
}

test().catch(console.error);
