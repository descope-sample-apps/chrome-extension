# Descope Chrome Extension Sample

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js Version](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-yellow.svg)](https://developer.chrome.com/docs/extensions/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-orange.svg)](https://developer.chrome.com/docs/extensions/mv3/)

A production-ready Chrome extension sample demonstrating secure device authentication using [Descope](https://www.descope.com/). This extension showcases how to integrate Descope's authentication platform within a browser extension context using modern Chrome Extension Manifest V3 standards.

https://github.com/user-attachments/assets/1511921b-440b-4f90-954a-bd261f6ac730



## Features

- 🔐 **Device Authentication Flow** - Secure device-based authentication using Descope
- 🚀 **Manifest V3 Compliant** - Built with the latest Chrome Extension standards
- 📱 **Cross-Device Support** - Works seamlessly across different devices

## Table of Contents

- [Getting Started](#getting-started)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Usage](#usage)
- [Scripts](#scripts)
- [License](#license)

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **[Node.js](https://nodejs.org/)** (v16.0.0 or later)
- **[npm](https://www.npmjs.com/)** (comes with Node.js)
- **[Google Chrome](https://www.google.com/chrome/)** (latest version recommended)
- **Descope Account** - [Sign up for free](https://www.descope.com/)

## Installation

### Clone from GitHub

1. **Clone the repository:**
   ```bash
   git clone https://github.com/descope-sample-apps/chrome-extension.git
   cd chrome-extension
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Configuration

### 1. Descope Project Setup

1. **Create a Descope Project:**
   - Go to the [Descope Console](https://app.descope.com/)
   - Create a new project or select an existing one
   - Note your **Project ID** and **Project URL**

2. **Configure Authentication Methods:**
   - Navigate to Authentication Methods in your Descope console
   - Enable desired authentication methods (Email, SMS, Social, etc.)
   - Configure device trust settings if needed

### 2. Extension Configuration

The extension requires your Descope project details:

- **Project ID**: Your Descope project identifier
- **Issuer Domain**: Your Descope project domain (e.g., `https://auth.company.com`)

These can be configured through the extension popup interface after installation.

## Development

### Build and Watch Mode

For active development with hot reload:

```bash
npm run watch
```

This command:
- Uses Rollup to bundle JavaScript and CSS
- Outputs files to the `dist/` directory
- Watches for file changes and rebuilds automatically
- Enables live development workflow

### Loading the Extension in Chrome

1. **Open Chrome Extensions page:**
   - Navigate to `chrome://extensions/`
   - Or use Chrome menu → More tools → Extensions

2. **Enable Developer Mode:**
   - Toggle the "Developer mode" switch in the top right corner

3. **Load the Extension:**
   - Click "Load unpacked"
   - Select the `dist/` directory from this project
   - The extension icon will appear in your Chrome toolbar

4. **Reload After Changes:**
   - Click the reload icon on your extension card in `chrome://extensions/`
   - Or use the keyboard shortcut `Ctrl+R` (Windows/Linux) or `Cmd+R` (Mac)

### Development Tips

- **Debug Console**: Right-click the extension icon → Inspect popup
- **Background Script Debugging**: Go to `chrome://extensions/` → Click "Service worker" under your extension
- **Hot Reload**: Changes to source files automatically trigger rebuilds when using `npm run watch`

## Usage

### First Time Setup

1. **Click the Extension Icon:**
   - Look for the Descope icon in your Chrome toolbar
   - Click to open the authentication popup

2. **Enter Project Details:**
   - **Issuer Domain**: Enter your Descope project URL
   - **Client ID**: Enter your Descope project ID

3. **Initiate Authentication:**
   - Click the "Login" button
   - The device authentication flow will begin

### Authentication Flow

1. **Device Code Generation:**
   - Extension generates a unique device code
   - QR code or verification URL is displayed

2. **Complete Authentication:**
   - Follow the displayed instructions
   - Verify your identity on the Descope verification page
   - Return to the extension popup

3. **Success State:**
   - User information will be displayed
   - Authentication tokens are securely stored
   - Extension is ready for use


## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build the extension for production |
| `npm run watch` | Build and watch for changes during development |
| `npm test` | Run tests (currently not implemented) |

### Production Build

For creating a production-ready build:

```bash
npm run build
```

This creates optimized files in the `dist/` directory ready for Chrome Web Store submission.

### Getting Help

If you encounter issues:

1. Check the [Issues](https://github.com/descope-sample-apps/chrome-extension/issues) page
2. Review [Descope Documentation](https://docs.descope.com/)
3. Contact [Descope Support](https://www.descope.com/support)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [Descope Docs](https://docs.descope.com/)
- **Community**: [Descope Community](https://community.descope.com/)
- **Support**: [Contact Support](https://www.descope.com/support)

---

Made with ❤️ by the Descope team
