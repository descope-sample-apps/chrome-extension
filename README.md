# Descope Chrome Extension Sample

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/chrome-extension.svg)](https://badge.fury.io/js/chrome-extension)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/descope-sample-apps/chrome-extension)
[![Descope](https://img.shields.io/badge/auth-Descope-blueviolet)](https://www.descope.com/)

A production-ready Chrome extension demonstrating secure authentication using [Descope](https://www.descope.com/)'s device flow authentication. This sample showcases modern Chrome extension development with Manifest V3 and best practices for integrating authentication in browser extensions.

![Chrome Extension Demo](https://github.com/user-attachments/assets/78763d9b-1533-4e4b-8650-7c3e0f6efc55)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Development Workflow](#development-workflow)
- [Scripts](#scripts)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Overview

This Chrome extension serves as a comprehensive example of implementing secure authentication in browser extensions using Descope's device flow. It demonstrates modern web development practices, secure token handling, and seamless user experience design within the constraints of Chrome's extension security model.

The extension uses the OAuth 2.0 device authorization grant flow, which is ideal for devices with limited input capabilities or when user interaction needs to be minimal.

## Features

- 🔐 **Secure Device Flow Authentication** - OAuth 2.0 device authorization grant
- 🎨 **Modern UI/UX** - Clean, responsive popup interface
- 🔧 **Manifest V3 Compliant** - Uses latest Chrome extension standards
- 🛡️ **Security Best Practices** - Secure token storage and handling
- 🔄 **Real-time Updates** - Live authentication status updates
- 📱 **Cross-platform** - Works on all platforms supporting Chrome
- 🎯 **Production Ready** - Built with rollup for optimized bundles
- 🔌 **Easy Integration** - Simple setup with any Descope project

## Prerequisites

Before you begin, ensure you have the following installed:

- **[Node.js](https://nodejs.org/)** (v16 or later recommended)
- **[npm](https://www.npmjs.com/)** (comes with Node.js)
- **[Google Chrome](https://www.google.com/chrome/)** (latest version)
- **Descope Account** - [Sign up for free](https://app.descope.com/sign-up)

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/descope-sample-apps/chrome-extension.git
   cd chrome-extension
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the extension:**
   ```bash
   npm run build
   ```

## Usage

### Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top right corner)
3. Click **Load unpacked** and select the `dist/` directory from this project
4. The Descope extension icon will appear in your Chrome extensions toolbar

### Authenticating with the Extension

1. **Click the extension icon** to open the popup interface
2. **Enter your Descope configuration:**
   - **Issuer Domain**: Your Descope project domain (e.g., `api.descope.org`)
   - **Client ID**: Your Descope project ID
3. **Click Login** to initiate the device flow authentication
4. **Follow the instructions** to complete authentication:
   - Visit the provided verification URL
   - Enter the displayed user code
   - Complete the authentication process
5. **Return to the extension** - Your user information will be displayed upon successful authentication

## Development Workflow

### Development Mode

For active development with live reloading:

```bash
npm run watch
```

This command:
- Uses Rollup to bundle JavaScript and CSS
- Watches for file changes
- Outputs built files to the `dist/` directory
- Enables hot reloading during development

### Building for Production

For production builds:

```bash
npm run build
```

### Extension Development Tips

- **Reload the extension** in `chrome://extensions/` after making changes
- **Check the Console** in Chrome DevTools for debugging
- **Use Developer Tools** on the popup by right-clicking and selecting "Inspect"

## Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Build the extension for production |
| `npm run watch` | Build and watch for changes during development |
| `npm test` | Run tests (currently not implemented) |

## Configuration

### Descope Setup

1. **Create a Descope Project:**
   - Sign up at [Descope Console](https://app.descope.com/sign-up)
   - Create a new project
   - Note your Project ID (Client ID)

2. **Configure OAuth Settings:**
   - In your Descope console, navigate to Settings → OAuth
   - Ensure device flow is enabled for your project
   - Configure redirect URIs if needed

3. **Update Extension Configuration:**
   - Use your Project ID as the Client ID in the extension
   - Use your project's issuer domain (typically `api.descope.org`)

### Environment Variables

The extension uses runtime configuration through the popup interface. For development, you can modify default values in `src/index.js`:

```javascript
const defaultIssuerDomain = "api.descope.org";
const defaultClientId = "YOUR_PROJECT_ID";
```

## Contributing

We welcome contributions to improve this sample extension! Here's how you can help:

### Getting Started

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Make your changes** and ensure they follow our coding standards
4. **Test your changes** thoroughly
5. **Commit your changes:** `git commit -m 'Add amazing feature'`
6. **Push to your branch:** `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Guidelines

- Follow existing code style and patterns
- Write clear, descriptive commit messages
- Update documentation for any new features
- Ensure backward compatibility
- Test with multiple Descope configurations

### Reporting Issues

If you encounter any issues:

1. Check existing [GitHub Issues](https://github.com/descope-sample-apps/chrome-extension/issues)
2. Create a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser and extension version
   - Console errors (if any)

## Troubleshooting

### Common Issues

**Extension doesn't load:**
- Ensure you've built the extension (`npm run build`)
- Check that Developer mode is enabled in Chrome
- Verify the `dist/` directory exists and contains built files

**Authentication fails:**
- Verify your Client ID and Issuer Domain are correct
- Check network connectivity
- Ensure your Descope project has device flow enabled
- Check browser console for error messages

**Popup doesn't appear:**
- Reload the extension in `chrome://extensions/`
- Check if the extension icon is visible in the toolbar
- Try right-clicking the extension icon and selecting the popup

**Build errors:**
- Delete `node_modules/` and run `npm install` again
- Ensure you're using Node.js v16 or later
- Check for any missing dependencies

### Getting Help

- **Documentation**: [Descope Documentation](https://docs.descope.com/)
- **Community**: [Descope Discord](https://discord.gg/descope)
- **Support**: [Contact Descope Support](https://www.descope.com/contact)
- **Issues**: [GitHub Issues](https://github.com/descope-sample-apps/chrome-extension/issues)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### MIT License Summary

```
Copyright (c) 2024 Descope

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

**Built with ❤️ by the Descope team**

For more sample applications and integration guides, visit our [Sample Apps Repository](https://github.com/descope-sample-apps).
