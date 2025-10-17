#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Starting Test Suite for Tailor Management System\n');

// Check if Jest is installed
try {
  require.resolve('jest');
} catch (e) {
  console.error('❌ Jest is not installed. Please run: npm install');
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const testPattern = args[0] || '';
const watchMode = args.includes('--watch') || args.includes('-w');
const coverageMode = args.includes('--coverage') || args.includes('-c');
const verboseMode = args.includes('--verbose') || args.includes('-v');

// Build Jest command
let jestCommand = 'jest';

if (testPattern) {
  jestCommand += ` --testNamePattern="${testPattern}"`;
}

if (watchMode) {
  jestCommand += ' --watch';
}

if (coverageMode) {
  jestCommand += ' --coverage';
}

if (verboseMode) {
  jestCommand += ' --verbose';
}

// Add test directory
jestCommand += ' __tests__/';

console.log(`📋 Running: ${jestCommand}\n`);

try {
  execSync(jestCommand, { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('\n✅ All tests passed!');
} catch (error) {
  console.log('\n❌ Some tests failed.');
  process.exit(1);
}
