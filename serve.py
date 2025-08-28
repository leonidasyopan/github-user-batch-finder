#!/usr/bin/env python3
"""
Simple HTTP server for GitHub User Finder development
Serves the application with proper CORS headers for ES6 modules
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

    def guess_type(self, path):
        mimetype, encoding = super().guess_type(path)
        # Ensure JavaScript modules are served with correct MIME type
        if path.endswith('.js'):
            return 'application/javascript'
        return mimetype

def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    
    # Change to the directory containing this script
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    with socketserver.TCPServer(("", port), CORSRequestHandler) as httpd:
        print(f"🚀 GitHub User Finder development server")
        print(f"📡 Serving at http://localhost:{port}")
        print(f"📁 Directory: {script_dir}")
        print(f"🔧 ES6 modules enabled with CORS support")
        print(f"⏹️  Press Ctrl+C to stop")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print(f"\n🛑 Server stopped")

if __name__ == "__main__":
    main()
