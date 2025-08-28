#!/usr/bin/env node
/**
 * Simple build script to bundle ES6 modules for GitHub Pages
 * Maintains clean architecture while creating a deployable version
 */

const fs = require('fs');
const path = require('path');

// Read all module files
const config = fs.readFileSync('js/config.js', 'utf8');
const logger = fs.readFileSync('js/utils/logger.js', 'utf8');
const validator = fs.readFileSync('js/utils/validator.js', 'utf8');
const githubApi = fs.readFileSync('js/services/github-api.js', 'utf8');
const batchProcessor = fs.readFileSync('js/services/batch-processor.js', 'utf8');
const progressBar = fs.readFileSync('js/components/progress-bar.js', 'utf8');
const userCard = fs.readFileSync('js/components/user-card.js', 'utf8');
const app = fs.readFileSync('js/app.js', 'utf8');

// Remove import/export statements and combine
const bundled = `
/**
 * GitHub Profile Identifier - Bundled for GitHub Pages
 * Generated from modular ES6 source files
 */

${config.replace(/export\s+/g, '').replace(/import.*from.*;\n/g, '')}

${logger.replace(/export\s+/g, '').replace(/import.*from.*;\n/g, '')}

${validator.replace(/export\s+/g, '').replace(/import.*from.*;\n/g, '')}

${githubApi.replace(/export\s+/g, '').replace(/import.*from.*;\n/g, '')}

${batchProcessor.replace(/export\s+/g, '').replace(/import.*from.*;\n/g, '')}

${progressBar.replace(/export\s+/g, '').replace(/import.*from.*;\n/g, '')}

${userCard.replace(/export\s+/g, '').replace(/import.*from.*;\n/g, '')}

${app.replace(/export\s+/g, '').replace(/import.*from.*;\n/g, '')}
`;

// Write bundled file
fs.writeFileSync('app.js', bundled);

console.log('✅ Build complete!');
console.log('📁 Files created:');
console.log('   - app.js (bundled application)');
console.log('');
console.log('🚀 Ready for GitHub Pages deployment:');
console.log('   1. Commit and push to GitHub');
console.log('   2. Enable GitHub Pages in repository settings');
console.log('   3. No server required - works directly in browser!');
