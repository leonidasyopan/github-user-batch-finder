# GitHub Profile Identifier

A modern web application to search and identify GitHub users with batch processing capabilities. Features clickable user cards that link directly to GitHub profiles.

## ✨ Features

- **Batch Search**: Search multiple GitHub users at once (comma-separated)
- **GitHub Token Support**: Optional Personal Access Token for 5,000 requests/hour (vs 60 without)
- **Clickable User Cards**: Click any user card to visit their GitHub profile
- **Real-time Progress**: See results as they load with progress tracking
- **Dark Theme**: Modern, clean interface with professional styling
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Error Handling**: Clear feedback for invalid usernames or network issues
- **Rate Limit Management**: Intelligent handling of GitHub API limits with helpful error messages

## 🚀 Quick Start

### Option 1: GitHub Pages (Recommended)

1. **Fork this repository** on GitHub
2. **Enable GitHub Pages** in repository settings
3. **Visit your live site** at `https://your-username.github.io/github-profile-identifier`

**That's it!** No build process required.

### Option 2: Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/github-profile-identifier.git
   cd github-profile-identifier
   ```

2. **Open directly in browser**
   ```bash
   # Works directly - no server needed!
   open index.html
   
   # Or double-click index.html in file explorer
   ```

**No server or build process required!**

## 📁 Project Architecture

```
/github-profile-identifier
├── index.html                    # Main HTML file (works directly in browser)
├── styles.css                    # Modern CSS styling
├── app.js                        # Bundled application (ready for GitHub Pages)
├── build.js                      # Build script (optional - for development)
├── package.json                  # NPM configuration (optional)
└── js/                          # Modular source code (Clean Architecture)
    ├── app.js                   # Main application controller
    ├── config.js                # Configuration management
    ├── components/              # UI components (SRP)
    │   ├── user-card.js        # User card component
    │   └── progress-bar.js     # Progress tracking component
    ├── services/               # Business logic (SRP)
    │   ├── github-api.js       # GitHub API service
    │   └── batch-processor.js  # Batch processing service
    └── utils/                  # Utility functions (SRP)
        ├── logger.js           # Logging utility
        └── validator.js        # Input validation & security
```

**Note**: The `js/` folder contains the clean, modular source code following SOLID principles. The root `app.js` is the bundled version that works directly in browsers and GitHub Pages without any server requirements.

## 📖 How to Use

### Basic Usage
1. Enter GitHub username(s) in the search field
2. For multiple users, separate with commas: `octocat, torvalds, gaearon`
3. **Optional**: Click "⚙️ API Configuration" to add a GitHub token for higher rate limits
4. Click "Search" or press Enter
5. Click on any user card to visit their GitHub profile

### GitHub Token Setup (Optional but Recommended)
1. **Click "⚙️ API Configuration"** to expand the token section
2. **Create a Personal Access Token** at [GitHub Settings](https://github.com/settings/tokens)
   - No permissions/scopes needed - just create a basic token
3. **Paste the token** in the password field
4. **Enjoy 5,000 requests/hour** instead of 60 (83x more!)

### Examples
```bash
# Single user
octocat

# Multiple users
octocat, torvalds, gaearon, defunkt

# Large batch (500+ users supported with token)
user1, user2, user3, user4, ...
```

### User Cards
- **Blue cards**: Successfully found users (clickable)
- **Red cards**: Users not found or errors
- **Username format**: Shows full name with @username below
- **Direct links**: Click any card to open GitHub profile

## 🏗️ Architecture & SOLID Principles

### Clean Code Structure
The application follows **SOLID principles** and **Clean Architecture**:

- **Single Responsibility**: Each module has one clear purpose
- **Open/Closed**: Extensible without modifying existing code
- **Liskov Substitution**: Components can be swapped with compatible implementations
- **Interface Segregation**: Focused, specific interfaces
- **Dependency Inversion**: High-level modules don't depend on low-level details

### Development vs Production
- **Development**: Clean modular source code in `js/` folder following SOLID principles
- **Production**: Pre-bundled `app.js` works directly in browsers without any server
- **No Build Required**: Application works immediately after cloning

## 🌐 GitHub Pages Deployment

### Step-by-Step Setup

1. **Fork this repository** to your GitHub account
2. **Go to repository Settings** → **Pages**
3. **Select source**: Deploy from a branch → `main`
4. **Visit your live site** at `https://your-username.github.io/github-profile-identifier`

**That's it!** No build process, no server setup, no dependencies.

## 🛠️ Troubleshooting

**No Results**
- Try with known username like 'octocat'
- Check browser console for errors
- Verify internet connection

**Rate Limiting (HTTP 403 Errors)**
- **Without token**: 60 requests/hour limit
- **With token**: 5,000 requests/hour limit
- **Solution**: Add a GitHub Personal Access Token (see setup above)
- **Temporary fix**: Wait 1 hour for rate limit reset or use smaller batches

**Token Issues**
- Ensure token starts with `ghp_` (classic tokens) or `github_pat_` (fine-grained)
- No permissions/scopes required for public user data
- Token is saved securely in browser localStorage

## 🌐 Browser Support

Works on all modern browsers: Chrome, Firefox, Safari, Edge (2020+)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.
