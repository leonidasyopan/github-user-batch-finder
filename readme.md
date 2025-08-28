# GitHub Profile Identifier

A modern web application to search and identify GitHub users with batch processing capabilities. Features clickable user cards that link directly to GitHub profiles.

## ✨ Features

- **Batch Search**: Search multiple GitHub users at once (comma-separated)
- **Clickable User Cards**: Click any user card to visit their GitHub profile
- **Real-time Progress**: See results as they load with progress tracking
- **Dark Theme**: Modern, clean interface with professional styling
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Error Handling**: Clear feedback for invalid usernames or network issues

## 🚀 Quick Start

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/github-profile-identifier.git
   cd github-profile-identifier
   ```

2. **Start a local server** (choose one)
   ```bash
   # Option 1: Python (recommended)
   python3 serve.py
   
   # Option 2: Node.js
   node serve.js
   
   # Option 3: Simple Python server
   python3 -m http.server 8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

**That's it!** No build process or dependencies required.

## 📖 How to Use

### Basic Usage
1. Enter GitHub username(s) in the search field
2. For multiple users, separate with commas: `octocat, torvalds, gaearon`
3. Click "Search" or press Enter
4. Click on any user card to visit their GitHub profile

### Examples
```bash
# Single user
octocat

# Multiple users
octocat, torvalds, gaearon, defunkt

# Large batch (100+ users supported)
user1, user2, user3, user4, ...
```

### User Cards
- **Blue cards**: Successfully found users (clickable)
- **Red cards**: Users not found or errors
- **Username format**: Shows full name with @username below
- **Direct links**: Click any card to open GitHub profile

## 🛠️ Troubleshooting

### Common Issues

**CORS Error (Most Common)**
```
❌ Error: Access blocked by CORS policy
✅ Solution: Use a local HTTP server (don't open index.html directly)
```

**Module Not Found**
```
❌ Error: Failed to resolve module specifier
✅ Solution: Ensure you're using HTTP server, not file://
```

**No Results**
- Check browser console for errors
- Try with known username like 'octocat'
- Verify internet connection

**Rate Limiting**
- GitHub limits: 60 requests/hour for unauthenticated users
- Use smaller batches if hitting limits
- Wait 5-10 minutes for reset

## 🌐 Browser Support

Works on all modern browsers: Chrome, Firefox, Safari, Edge (2020+)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.
