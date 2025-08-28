#!/usr/bin/env node
/**
 * Simple Node.js HTTP server for GitHub User Finder development
 * Serves the application with proper CORS headers for ES6 modules
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return MIME_TYPES[ext] || 'application/octet-stream';
}

function createServer() {
    return http.createServer((req, res) => {
        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        const parsedUrl = url.parse(req.url);
        let pathname = parsedUrl.pathname;

        // Default to index.html for root
        if (pathname === '/') {
            pathname = '/index.html';
        }

        const filePath = path.join(__dirname, pathname);

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
                return;
            }

            const mimeType = getMimeType(filePath);
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(data);
        });
    });
}

function main() {
    const port = process.argv[2] || 8000;
    const server = createServer();

    server.listen(port, () => {
        console.log('🚀 GitHub User Finder development server');
        console.log(`📡 Serving at http://localhost:${port}`);
        console.log(`📁 Directory: ${__dirname}`);
        console.log('🔧 ES6 modules enabled with CORS support');
        console.log('⏹️  Press Ctrl+C to stop');
    });

    process.on('SIGINT', () => {
        console.log('\n🛑 Server stopped');
        process.exit(0);
    });
}

if (require.main === module) {
    main();
}
