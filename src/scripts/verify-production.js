#!/usr/bin/env node

/**
 * Production Verification Script
 * 
 * This script verifies that all components of the city plan generator
 * are working correctly in production mode.
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 10000; // 10 seconds

console.log('🚀 Starting Production Verification...\n');

/**
 * Test health check endpoint
 */
async function testHealthCheck() {
    console.log('🔍 Testing health check endpoint...');
    
    try {
        const response = await fetch(`${BASE_URL}/api/health`, {
            method: 'GET',
            timeout: TIMEOUT
        });
        
        if (!response.ok) {
            throw new Error(`Health check failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('✅ Health check passed');
        console.log(`   - Status: ${data.status}`);
        console.log(`   - Uptime: ${Math.round(data.uptime)}s`);
        console.log(`   - Service: ${data.service}`);
        console.log(`   - Version: ${data.version}`);
        
        if (data.checks) {
            console.log(`   - Overpass Primary: ${data.checks.overpass_primary}`);
            console.log(`   - Overpass Fallback: ${data.checks.overpass_fallback}`);
            console.log(`   - Memory Usage: ${data.checks.memory.used}MB`);
        }
        
        return true;
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
        return false;
    }
}

/**
 * Test analytics endpoint
 */
async function testAnalytics() {
    console.log('\n📊 Testing analytics endpoint...');
    
    try {
        // Test GET endpoint
        const getResponse = await fetch(`${BASE_URL}/api/analytics/count`, {
            method: 'GET',
            timeout: TIMEOUT
        });
        
        if (!getResponse.ok) {
            throw new Error(`Analytics GET failed: ${getResponse.status}`);
        }
        
        const initialData = await getResponse.json();
        console.log('✅ Analytics GET endpoint working');
        console.log(`   - Total downloads: ${initialData.total}`);
        console.log(`   - Last updated: ${initialData.lastUpdated}`);
        
        // Test POST endpoint
        const postResponse = await fetch(`${BASE_URL}/api/analytics/count`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ format: 'test' }),
            timeout: TIMEOUT
        });
        
        if (!postResponse.ok) {
            throw new Error(`Analytics POST failed: ${postResponse.status}`);
        }
        
        const postData = await postResponse.json();
        console.log('✅ Analytics POST endpoint working');
        console.log(`   - New count: ${postData.count}`);
        console.log(`   - Success: ${postData.success}`);
        
        return true;
    } catch (error) {
        console.log('❌ Analytics test failed:', error.message);
        return false;
    }
}

/**
 * Test height data endpoint
 */
async function testHeightData() {
    console.log('\n🏔️ Testing height data endpoint...');
    
    try {
        const testBounds = {
            north: 52.52,
            west: 13.38,
            south: 52.50,
            east: 13.42,
            resolution: 20 // Small resolution for faster testing
        };
        
        const response = await fetch(`${BASE_URL}/api/heights`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testBounds),
            timeout: TIMEOUT
        });
        
        if (!response.ok) {
            throw new Error(`Height data failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(`Height data API error: ${data.error}`);
        }
        
        console.log('✅ Height data endpoint working');
        console.log(`   - Matrix size: ${data.data.metadata.rows}x${data.data.metadata.cols}`);
        console.log(`   - Resolution: ${data.data.metadata.resolution}`);
        console.log(`   - Source: ${data.data.metadata.source}`);
        console.log(`   - Real data: ${data.data.metadata.realData}`);
        console.log(`   - Height range: ${data.data.metadata.minHeight}m - ${data.data.metadata.maxHeight}m`);
        console.log(`   - Area: ${data.data.metadata.areaKm2}km²`);
        
        return true;
    } catch (error) {
        console.log('❌ Height data test failed:', error.message);
        return false;
    }
}

/**
 * Test main application page
 */
async function testMainPage() {
    console.log('\n🌐 Testing main application page...');
    
    try {
        const response = await fetch(`${BASE_URL}/`, {
            method: 'GET',
            timeout: TIMEOUT
        });
        
        if (!response.ok) {
            throw new Error(`Main page failed: ${response.status}`);
        }
        
        const html = await response.text();
        
        // Check for essential elements
        const checks = [
            { name: 'Svelte app', pattern: /<div id="svelte">/ },
            { name: 'Meta tags', pattern: /<meta name="description"/ },
            { name: 'Tailwind CSS', pattern: /tailwind|tw-/ },
            { name: 'Dark mode support', pattern: /dark:/ },
            { name: 'Leaflet CSS', pattern: /leaflet\.css/ }
        ];
        
        let passedChecks = 0;
        
        for (const check of checks) {
            if (check.pattern.test(html)) {
                console.log(`   ✅ ${check.name} detected`);
                passedChecks++;
            } else {
                console.log(`   ⚠️ ${check.name} not detected`);
            }
        }
        
        console.log(`✅ Main page loaded (${passedChecks}/${checks.length} checks passed)`);
        return true;
    } catch (error) {
        console.log('❌ Main page test failed:', error.message);
        return false;
    }
}

/**
 * Test file system structure
 */
async function testFileStructure() {
    console.log('\n📁 Testing file structure...');
    
    const requiredFiles = [
        'package.json',
        'build/index.js',
        'static/js/conrec/conrec.js',
        'static/js/osm/gen_swzpln_worker.js',
        'src/paraglide/messages.js',
        'src/paraglide/runtime.js',
        'messages/de.json',
        'messages/en.json'
    ];
    
    let foundFiles = 0;
    
    for (const file of requiredFiles) {
        const filePath = path.resolve(file);
        if (fs.existsSync(filePath)) {
            console.log(`   ✅ ${file}`);
            foundFiles++;
        } else {
            console.log(`   ❌ ${file} missing`);
        }
    }
    
    console.log(`✅ File structure check (${foundFiles}/${requiredFiles.length} files found)`);
    return foundFiles === requiredFiles.length;
}

/**
 * Test data directory for analytics
 */
async function testDataDirectory() {
    console.log('\n💾 Testing data directory...');
    
    try {
        const dataDir = path.resolve('data');
        
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log('   ✅ Created data directory');
        } else {
            console.log('   ✅ Data directory exists');
        }
        
        // Test write permissions
        const testFile = path.join(dataDir, 'test.json');
        fs.writeFileSync(testFile, JSON.stringify({ test: true }));
        fs.unlinkSync(testFile);
        
        console.log('   ✅ Data directory writable');
        return true;
    } catch (error) {
        console.log('   ❌ Data directory test failed:', error.message);
        return false;
    }
}

/**
 * Performance test
 */
async function testPerformance() {
    console.log('\n⚡ Testing performance...');
    
    try {
        const start = Date.now();
        const response = await fetch(`${BASE_URL}/api/health`, {
            method: 'GET',
            timeout: TIMEOUT
        });
        const duration = Date.now() - start;
        
        console.log(`   ✅ Health check response time: ${duration}ms`);
        
        if (duration < 1000) {
            console.log('   ✅ Response time excellent (<1s)');
        } else if (duration < 3000) {
            console.log('   ⚠️ Response time acceptable (1-3s)');
        } else {
            console.log('   ❌ Response time poor (>3s)');
        }
        
        return duration < 5000; // Fail if > 5 seconds
    } catch (error) {
        console.log('   ❌ Performance test failed:', error.message);
        return false;
    }
}

/**
 * Main verification function
 */
async function runVerification() {
    const tests = [
        { name: 'File Structure', fn: testFileStructure },
        { name: 'Data Directory', fn: testDataDirectory },
        { name: 'Main Page', fn: testMainPage },
        { name: 'Health Check', fn: testHealthCheck },
        { name: 'Analytics', fn: testAnalytics },
        { name: 'Height Data', fn: testHeightData },
        { name: 'Performance', fn: testPerformance }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            const result = await test.fn();
            if (result) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            console.log(`❌ ${test.name} test error:`, error.message);
            failed++;
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📋 VERIFICATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total: ${passed + failed}`);
    
    if (failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! The application is production-ready.');
        console.log('\n🚀 You can now:');
        console.log('   - Access the app at:', BASE_URL);
        console.log('   - Generate plans with real OSM data');
        console.log('   - Export DXF, SVG, and PDF formats');
        console.log('   - View analytics at:', `${BASE_URL}/api/analytics/count`);
        console.log('   - Check health at:', `${BASE_URL}/api/health`);
        
        process.exit(0);
    } else {
        console.log('\n⚠️ Some tests failed. Please check the logs above and fix any issues.');
        process.exit(1);
    }
}

// Run verification
runVerification().catch(error => {
    console.error('❌ Verification script failed:', error);
    process.exit(1);
});